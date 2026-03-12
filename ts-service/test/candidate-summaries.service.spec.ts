import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidateSummaryStatus } from '../src/common/enums/candidate-summary-status.enum';
import { CandidateDocument } from '../src/entities/candidate-document.entity';
import { CandidateSummary } from '../src/entities/candidate-summary.entity';
import { SampleCandidate } from '../src/entities/sample-candidate.entity';
import { QueueService } from '../src/queue/queue.service';
import { CandidateSummariesService, GENERATE_CANDIDATE_SUMMARY_JOB } from '../src/sample/services/candidate-summaries.service';

describe('CandidateSummariesService', () => {
  let service: CandidateSummariesService;
  let candidateSummaryRepository: jest.Mocked<Repository<CandidateSummary>>;
  let candidateDocumentRepository: jest.Mocked<Repository<CandidateDocument>>;
  let sampleCandidateRepository: jest.Mocked<Repository<SampleCandidate>>;
  let queueService: jest.Mocked<QueueService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CandidateSummariesService,
        {
          provide: getRepositoryToken(CandidateSummary),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CandidateDocument),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SampleCandidate),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: QueueService,
          useValue: {
            enqueue: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(CandidateSummariesService);
    candidateSummaryRepository = moduleRef.get(getRepositoryToken(CandidateSummary));
    candidateDocumentRepository = moduleRef.get(getRepositoryToken(CandidateDocument));
    sampleCandidateRepository = moduleRef.get(getRepositoryToken(SampleCandidate));
    queueService = moduleRef.get(QueueService);
  });

  it('creates a pending summary and enqueues a job', async () => {
    sampleCandidateRepository.findOne.mockResolvedValue({
      id: 'cand_demo_1',
      workspaceId: 'ws_demo_1',
    } as SampleCandidate);

    candidateDocumentRepository.count.mockResolvedValue(1);

    candidateSummaryRepository.create.mockImplementation(
      (input) => input as CandidateSummary,
    );

    candidateSummaryRepository.save.mockImplementation(async (input) => ({
      ...input,
      createdAt: new Date('2026-03-12T12:00:00.000Z'),
      updatedAt: new Date('2026-03-12T12:00:00.000Z'),
    }) as CandidateSummary);

    queueService.enqueue.mockReturnValue({
      id: 'job_1',
      name: GENERATE_CANDIDATE_SUMMARY_JOB,
      payload: {
        summaryId: 'sum_1',
        candidateId: 'cand_demo_1',
        workspaceId: 'ws_demo_1',
        requestedByUserId: 'user_demo_1',
      },
      enqueuedAt: new Date().toISOString(),
      processedAt: null,
    });

    const result = await service.requestGeneration({
      candidateId: 'cand_demo_1',
      workspaceId: 'ws_demo_1',
      userId: 'user_demo_1',
      dto: { promptVersion: 'v1' },
    });

    expect(candidateSummaryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: 'cand_demo_1',
        status: CandidateSummaryStatus.PENDING,
        provider: 'gemini',
        promptVersion: 'v1',
      }),
    );

    expect(queueService.enqueue).toHaveBeenCalledWith(
      GENERATE_CANDIDATE_SUMMARY_JOB,
      expect.objectContaining({
        candidateId: 'cand_demo_1',
        workspaceId: 'ws_demo_1',
        requestedByUserId: 'user_demo_1',
      }),
    );

    expect(result.summary.status).toBe(CandidateSummaryStatus.PENDING);
    expect(result.jobId).toBe('job_1');
  });

  it('throws when candidate is not in workspace', async () => {
    sampleCandidateRepository.findOne.mockResolvedValue(null);

    await expect(
      service.requestGeneration({
        candidateId: 'cand_demo_1',
        workspaceId: 'ws_demo_1',
        userId: 'user_demo_1',
        dto: {},
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when candidate has no documents', async () => {
    sampleCandidateRepository.findOne.mockResolvedValue({
      id: 'cand_demo_1',
      workspaceId: 'ws_demo_1',
    } as SampleCandidate);

    candidateDocumentRepository.count.mockResolvedValue(0);

    await expect(
      service.requestGeneration({
        candidateId: 'cand_demo_1',
        workspaceId: 'ws_demo_1',
        userId: 'user_demo_1',
        dto: {},
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});