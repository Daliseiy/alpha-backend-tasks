import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidateSummaryStatus } from '../../common/enums/candidate-summary-status.enum';
import { CandidateDocument } from '../../entities/candidate-document.entity';
import { CandidateSummary } from '../../entities/candidate-summary.entity';
import { SampleCandidate } from '../../entities/sample-candidate.entity';
import { QueueService } from '../../queue/queue.service';
import { GenerateCandidateSummaryDto } from '../dto/generate-candidate-summary.dto';
import { GenerateCandidateSummaryJobPayload } from '../workers/candidate-summaries.worker';

export const GENERATE_CANDIDATE_SUMMARY_JOB = 'generate-candidate-summary';

@Injectable()
export class CandidateSummariesService {
  constructor(
    @InjectRepository(CandidateSummary)
    private readonly candidateSummaryRepository: Repository<CandidateSummary>,
    @InjectRepository(CandidateDocument)
    private readonly candidateDocumentRepository: Repository<CandidateDocument>,
    @InjectRepository(SampleCandidate)
    private readonly sampleCandidateRepository: Repository<SampleCandidate>,
    private readonly queueService: QueueService,
  ) {}

  async requestGeneration(params: {
    candidateId: string;
    workspaceId: string;
    userId: string;
    dto: GenerateCandidateSummaryDto;
  }): Promise<{ summary: CandidateSummary; jobId: string }> {
    const candidate = await this.sampleCandidateRepository.findOne({
      where: {
        id: params.candidateId,
        workspaceId: params.workspaceId,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const documentCount = await this.candidateDocumentRepository.count({
      where: {
        candidateId: candidate.id,
      },
    });

    if (documentCount === 0) {
      throw new BadRequestException(
        'Cannot generate summary for a candidate without documents',
      );
    }

    const summary = this.candidateSummaryRepository.create({
      id: this.generateSummaryId(),
      candidateId: candidate.id,
      status: CandidateSummaryStatus.PENDING,
      score: null,
      strengths: null,
      concerns: null,
      summary: null,
      recommendedDecision: null,
      provider: 'gemini',
      promptVersion: params.dto.promptVersion ?? 'v1',
      errorMessage: null,
      completedAt: null,
      failedAt: null,
    });

    const savedSummary = await this.candidateSummaryRepository.save(summary);

    const jobPayload: GenerateCandidateSummaryJobPayload = {
        summaryId: savedSummary.id,
        candidateId: candidate.id,
        workspaceId: params.workspaceId,
        requestedByUserId: params.userId,
    };

    const job = this.queueService.enqueue(
        GENERATE_CANDIDATE_SUMMARY_JOB,
        jobPayload,
    );

    return {
      summary: savedSummary,
      jobId: job.id,
    };
  }

  async listForWorkspace(params: {
    candidateId: string;
    workspaceId: string;
  }): Promise<CandidateSummary[]> {
    const candidate = await this.sampleCandidateRepository.findOne({
      where: {
        id: params.candidateId,
        workspaceId: params.workspaceId,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return this.candidateSummaryRepository.find({
      where: {
        candidateId: candidate.id,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getOneForWorkspace(params: {
    candidateId: string;
    summaryId: string;
    workspaceId: string;
  }): Promise<CandidateSummary> {
    const candidate = await this.sampleCandidateRepository.findOne({
      where: {
        id: params.candidateId,
        workspaceId: params.workspaceId,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const summary = await this.candidateSummaryRepository.findOne({
      where: {
        id: params.summaryId,
        candidateId: candidate.id,
      },
    });

    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    return summary;
  }

  private generateSummaryId(): string {
    return `sum_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}