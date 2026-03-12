import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

import { candidateSummaryOutputSchema } from './candidate-summary-output.schema';
import {
  CandidateSummaryInput,
  CandidateSummaryResult,
  SummarizationProvider,
} from './summarization-provider.interface';

const candidateSummaryResponseJsonSchema = {
  type: 'object',
  properties: {
    score: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
    },
    strengths: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 10,
    },
    concerns: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 10,
    },
    summary: {
      type: 'string',
    },
    recommendedDecision: {
      type: 'string',
      enum: ['advance', 'hold', 'reject'],
    },
  },
  required: [
    'score',
    'strengths',
    'concerns',
    'summary',
    'recommendedDecision',
  ],
};

@Injectable()
export class GeminiSummarizationProvider implements SummarizationProvider {
  private readonly logger = new Logger(GeminiSummarizationProvider.name);
  private readonly ai: GoogleGenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    this.ai = new GoogleGenAI({ apiKey });
    this.model =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-3-flash-preview';
  }

  async generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult> {
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: this.buildPrompt(input),
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: candidateSummaryResponseJsonSchema,
        temperature: 0.2,
      },
    });

    const rawText = response.text;

    if (!rawText) {
      throw new InternalServerErrorException(
        'Gemini returned an empty response',
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(rawText);
    } catch (error) {
      this.logger.error('Failed to parse Gemini JSON response', error);
      throw new InternalServerErrorException(
        'Gemini returned malformed JSON',
      );
    }

    const validated = candidateSummaryOutputSchema.safeParse(parsed);

    if (!validated.success) {
      this.logger.error('Gemini returned invalid structured output', {
        issues: validated.error.issues,
      });

      throw new InternalServerErrorException(
        'Gemini returned invalid summary payload',
      );
    }

    return validated.data;
  }

  private buildPrompt(input: CandidateSummaryInput): string {
    const documentsText = input.documents
      .map((document, index) =>
        [
          `Document ${index + 1}`,
          `Type: ${document.documentType}`,
          `File name: ${document.fileName}`,
          'Content:',
          document.rawText,
        ].join('\n'),
      )
      .join('\n\n---\n\n');

    return [
      'You are assisting a recruiter with candidate screening.',
      'Read all candidate documents and produce a structured summary.',
      '',
      'Rules:',
      '- Use only the provided document content.',
      '- Be concise and evidence-based.',
      '- score must be an integer between 0 and 100.',
      '- strengths must be short evidence-based strings.',
      '- concerns must be short evidence-based strings.',
      '- summary must be a concise paragraph.',
      '- recommendedDecision must be one of: advance, hold, reject.',      
      '',
      `Prompt version: ${input.promptVersion}`,
      `Candidate ID: ${input.candidateId}`,
      '',
      'Candidate documents:',
      documentsText,
    ].join('\n');
  }
}