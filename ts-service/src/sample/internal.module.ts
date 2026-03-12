import { Module } from '@nestjs/common';

import { InternalQueueController } from './controllers/internal-queue.controller';
import { CandidateSummariesModule } from './candidate-summaries.module';

@Module({
  imports: [CandidateSummariesModule],
  controllers: [InternalQueueController],
})
export class InternalModule {}