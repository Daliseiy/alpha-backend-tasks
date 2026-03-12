export type RecommendedDecision = 'advance' | 'hold' | 'reject';

export interface CandidateSummaryInputDocument {
  id: string;
  documentType: string;
  fileName: string;
  rawText: string;
}

export interface CandidateSummaryResult {
  score: number;
  strengths: string[];
  concerns: string[];
  summary: string;
  recommendedDecision: RecommendedDecision;
}

export interface CandidateSummaryInput {
  candidateId: string;
  promptVersion: string;
  documents: CandidateSummaryInputDocument[];
}

export interface SummarizationProvider {
  generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult>;
}

export const SUMMARIZATION_PROVIDER = Symbol('SUMMARIZATION_PROVIDER');
