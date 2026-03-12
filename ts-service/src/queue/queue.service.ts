import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

export interface EnqueuedJob<TPayload = unknown> {
  id: string;
  name: string;
  payload: TPayload;
  enqueuedAt: string;
  processedAt: string | null;
}

@Injectable()
export class QueueService {
  private readonly jobs: EnqueuedJob[] = [];

  enqueue<TPayload>(name: string, payload: TPayload): EnqueuedJob<TPayload> {
    const job: EnqueuedJob<TPayload> = {
      id: randomUUID(),
      name,
      payload,
      enqueuedAt: new Date().toISOString(),
      processedAt: null,
    };

    this.jobs.push(job);
    return job;
  }

  getQueuedJobs(): readonly EnqueuedJob[] {
    return this.jobs;
  }

  getPendingJobs(): EnqueuedJob[] {
    return this.jobs.filter((job) => job.processedAt === null);
  }

  markJobProcessed(jobId: string): void {
    const job = this.jobs.find((item) => item.id === jobId);

    if (!job) {
      return;
    }

    job.processedAt = new Date().toISOString();
  }
}