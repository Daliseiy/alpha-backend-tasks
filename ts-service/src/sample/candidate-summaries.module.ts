import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { LlmModule } from '../llm/llm.module';
import { QueueModule } from '../queue/queue.module';
import { CandidateSummariesController } from './controllers/candidate-summaries.controller';
import { CandidateSummaryQueueRunnerService } from './services/candidate-summary-queue-runner.service';
import { CandidateSummariesService } from './services/candidate-summaries.service';
import { CandidateSummariesWorker } from './workers/candidate-summaries.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CandidateSummary,
      CandidateDocument,
      SampleCandidate,
    ]),
    QueueModule,
    LlmModule,
  ],
  controllers: [CandidateSummariesController],
  providers: [
    CandidateSummariesService,
    CandidateSummariesWorker,
    CandidateSummaryQueueRunnerService,
  ],
  exports: [
    CandidateSummariesService,
    CandidateSummariesWorker,
    CandidateSummaryQueueRunnerService,
  ],
})
export class CandidateSummariesModule {}