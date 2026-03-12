import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidateSummaryStatus } from '../src/common/enums/candidate-summary-status.enum';
import { CandidateDocument } from '../src/entities/candidate-document.entity';
import { CandidateSummary } from '../src/entities/candidate-summary.entity';
import {
  SUMMARIZATION_PROVIDER,
  SummarizationProvider,
} from '../src/llm/summarization-provider.interface';
import { CandidateSummariesWorker } from '../src/sample/workers/candidate-summaries.worker';

describe('CandidateSummariesWorker', () => {
  let worker: CandidateSummariesWorker;
  let candidateSummaryRepository: jest.Mocked<Repository<CandidateSummary>>;
  let candidateDocumentRepository: jest.Mocked<Repository<CandidateDocument>>;
  let summarizationProvider: jest.Mocked<SummarizationProvider>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CandidateSummariesWorker,
        {
          provide: getRepositoryToken(CandidateSummary),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CandidateDocument),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: SUMMARIZATION_PROVIDER,
          useValue: {
            generateCandidateSummary: jest.fn(),
          },
        },
      ],
    }).compile();

    worker = moduleRef.get(CandidateSummariesWorker);
    candidateSummaryRepository = moduleRef.get(getRepositoryToken(CandidateSummary));
    candidateDocumentRepository = moduleRef.get(getRepositoryToken(CandidateDocument));
    summarizationProvider = moduleRef.get(SUMMARIZATION_PROVIDER);
  });

  it('marks summary as completed when provider succeeds', async () => {
    candidateSummaryRepository.findOne
      .mockResolvedValueOnce({
        id: 'sum_1',
        candidateId: 'cand_demo_1',
        status: CandidateSummaryStatus.PENDING,
        promptVersion: 'v1',
      } as CandidateSummary)
      .mockResolvedValueOnce({
        id: 'sum_1',
        candidateId: 'cand_demo_1',
        status: CandidateSummaryStatus.COMPLETED,
        score: 72,
        strengths: ['Communicates clearly'],
        concerns: ['Needs deeper system design examples'],
        summary: 'Fake summary for candidate cand_demo_1 using 1 document(s).',
        recommendedDecision: 'hold',
      } as CandidateSummary);

    candidateDocumentRepository.find.mockResolvedValue([
      {
        id: 'doc_1',
        candidateId: 'cand_demo_1',
        documentType: 'resume',
        fileName: 'resume.txt',
        rawText: 'Candidate resume text',
        uploadedAt: new Date(),
      } as CandidateDocument,
    ]);

    summarizationProvider.generateCandidateSummary.mockResolvedValue({
      score: 72,
      strengths: ['Communicates clearly'],
      concerns: ['Needs deeper system design examples'],
      summary: 'Fake summary for candidate cand_demo_1 using 1 document(s).',
      recommendedDecision: 'hold',
    });

    const result = await worker.processGenerateSummaryJob({
      summaryId: 'sum_1',
      candidateId: 'cand_demo_1',
      workspaceId: 'ws_demo_1',
      requestedByUserId: 'user_demo_1',
    });

    expect(candidateSummaryRepository.update).toHaveBeenNthCalledWith(1, 'sum_1', {
      status: CandidateSummaryStatus.PROCESSING,
      errorMessage: null,
      failedAt: null,
    });

    expect(candidateSummaryRepository.update).toHaveBeenNthCalledWith(2, 'sum_1', {
      status: CandidateSummaryStatus.COMPLETED,
      score: 72,
      strengths: ['Communicates clearly'],
      concerns: ['Needs deeper system design examples'],
      summary: 'Fake summary for candidate cand_demo_1 using 1 document(s).',
      recommendedDecision: 'hold',
      errorMessage: null,
      completedAt: expect.any(Date),
      failedAt: null,
    });

    expect(result.status).toBe(CandidateSummaryStatus.COMPLETED);
  });

  it('marks summary as failed when provider throws', async () => {
    candidateSummaryRepository.findOne
      .mockResolvedValueOnce({
        id: 'sum_1',
        candidateId: 'cand_demo_1',
        status: CandidateSummaryStatus.PENDING,
        promptVersion: 'v1',
      } as CandidateSummary)
      .mockResolvedValueOnce({
        id: 'sum_1',
        candidateId: 'cand_demo_1',
        status: CandidateSummaryStatus.FAILED,
        errorMessage: 'Provider unavailable',
      } as CandidateSummary);

    candidateDocumentRepository.find.mockResolvedValue([
      {
        id: 'doc_1',
        candidateId: 'cand_demo_1',
        documentType: 'resume',
        fileName: 'resume.txt',
        rawText: 'Candidate resume text',
        uploadedAt: new Date(),
      } as CandidateDocument,
    ]);

    summarizationProvider.generateCandidateSummary.mockRejectedValue(
      new Error('Provider unavailable'),
    );

    const result = await worker.processGenerateSummaryJob({
      summaryId: 'sum_1',
      candidateId: 'cand_demo_1',
      workspaceId: 'ws_demo_1',
      requestedByUserId: 'user_demo_1',
    });

    expect(candidateSummaryRepository.update).toHaveBeenNthCalledWith(2, 'sum_1', {
      status: CandidateSummaryStatus.FAILED,
      errorMessage: 'Provider unavailable',
      failedAt: expect.any(Date),
    });

    expect(result.status).toBe(CandidateSummaryStatus.FAILED);
  });
});