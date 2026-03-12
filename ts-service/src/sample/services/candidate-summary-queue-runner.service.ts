import { Injectable, Logger } from '@nestjs/common';

import { QueueService } from '../../queue/queue.service';
import { CandidateSummariesWorker } from '../workers/candidate-summaries.worker';

@Injectable()
export class CandidateSummaryQueueRunnerService {
  private readonly logger = new Logger(CandidateSummaryQueueRunnerService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly candidateSummariesWorker: CandidateSummariesWorker,
  ) {}

  async runPendingJobs(): Promise<{
    processedCount: number;
    processedJobIds: string[];
  }> {
    const pendingJobs = this.queueService.getPendingJobs();
    const processedJobIds: string[] = [];

    for (const job of pendingJobs) {
      try {
        await this.candidateSummariesWorker.processQueuedJob(
          job.name,
          job.payload,
        );
        this.queueService.markJobProcessed(job.id);
        processedJobIds.push(job.id);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown queue runner error';

        this.logger.error(
          `Failed processing job ${job.id} (${job.name}): ${message}`,
        );
      }
    }

    return {
      processedCount: processedJobIds.length,
      processedJobIds,
    };
  }
}