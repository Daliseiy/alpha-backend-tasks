import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidateSummaryStatus } from '../../common/enums/candidate-summary-status.enum';
import { CandidateDocument } from '../../entities/candidate-document.entity';
import { CandidateSummary } from '../../entities/candidate-summary.entity';

import { SUMMARIZATION_PROVIDER, SummarizationProvider } from '../../llm/summarization-provider.interface';
import { GENERATE_CANDIDATE_SUMMARY_JOB } from '../services/candidate-summaries.service';
import { CandidateRecommendedDecision } from 'src/common/enums/candidate-recommended-decision.enum';

export interface GenerateCandidateSummaryJobPayload {
  summaryId: string;
  candidateId: string;
  workspaceId: string;
  requestedByUserId: string;
}

@Injectable()
export class CandidateSummariesWorker {
  private readonly logger = new Logger(CandidateSummariesWorker.name);

  constructor(
    @InjectRepository(CandidateSummary)
    private readonly candidateSummaryRepository: Repository<CandidateSummary>,
    @InjectRepository(CandidateDocument)
    private readonly candidateDocumentRepository: Repository<CandidateDocument>,
    @Inject(SUMMARIZATION_PROVIDER)
    private readonly summarizationProvider: SummarizationProvider,
  ) {}

  async processGenerateSummaryJob(
    payload: GenerateCandidateSummaryJobPayload,
  ): Promise<CandidateSummary> {
    const summary = await this.candidateSummaryRepository.findOne({
      where: { id: payload.summaryId, candidateId: payload.candidateId },
    });

    if (!summary) {
      throw new NotFoundException('Candidate summary not found');
    }

    if (summary.status === CandidateSummaryStatus.COMPLETED) {
      this.logger.log(
        `Summary ${summary.id} already completed. Skipping duplicate processing.`,
      );
      return summary;
    }

    if (summary.status === CandidateSummaryStatus.PROCESSING) {
      this.logger.log(
        `Summary ${summary.id} is already processing. Skipping duplicate processing.`,
      );
      return summary;
    }

    await this.candidateSummaryRepository.update(summary.id, {
      status: CandidateSummaryStatus.PROCESSING,
      errorMessage: null,
      failedAt: null,
    });

    try {
      const documents = await this.candidateDocumentRepository.find({
        where: { candidateId: payload.candidateId },
        order: { uploadedAt: 'ASC' },
      });

      if (documents.length === 0) {
        throw new Error('No candidate documents found for summary generation');
      }

      const result = await this.summarizationProvider.generateCandidateSummary({
        candidateId: payload.candidateId,
        promptVersion: summary.promptVersion ?? 'v1',
        documents: documents.map((document) => ({
          id: document.id,
          documentType: document.documentType,
          fileName: document.fileName,
          rawText: document.rawText,
        })),
      });

      await this.candidateSummaryRepository.update(summary.id, {
        status: CandidateSummaryStatus.COMPLETED,
        score: result.score,
        strengths: result.strengths,
        concerns: result.concerns,
        summary: result.summary,
        recommendedDecision: result.recommendedDecision as CandidateRecommendedDecision,
        errorMessage: null,
        completedAt: new Date(),
        failedAt: null,
      });

      const completedSummary = await this.candidateSummaryRepository.findOne({
        where: { id: summary.id },
      });

      if (!completedSummary) {
        throw new NotFoundException('Completed candidate summary not found');
      }

      return completedSummary;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown worker error';

      this.logger.error(
        `Failed to process candidate summary ${summary.id}: ${message}`,
      );

      await this.candidateSummaryRepository.update(summary.id, {
        status: CandidateSummaryStatus.FAILED,
        errorMessage: message,
        failedAt: new Date(),
      });

      const failedSummary = await this.candidateSummaryRepository.findOne({
        where: { id: summary.id },
      });

      if (!failedSummary) {
        throw new NotFoundException('Failed candidate summary not found');
      }

      return failedSummary;
    }
  }

  async processQueuedJob(jobName: string, payload: unknown): Promise<void> {
    if (jobName !== GENERATE_CANDIDATE_SUMMARY_JOB) {
      this.logger.warn(`Ignoring unsupported job name: ${jobName}`);
      return;
    }

    await this.processGenerateSummaryJob(
      payload as GenerateCandidateSummaryJobPayload,
    );
  }
}