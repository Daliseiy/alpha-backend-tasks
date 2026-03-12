import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';

import { FakeAuthGuard } from '../../auth/fake-auth.guard';
import { CandidateSummaryQueueRunnerService } from '../services/candidate-summary-queue-runner.service';

@ApiTags('internal')
@ApiHeader({
  name: 'x-user-id',
  required: true,
  example: 'user_demo_1',
})
@ApiHeader({
  name: 'x-workspace-id',
  required: true,
  example: 'ws_demo_1',
})
@UseGuards(FakeAuthGuard)
@Controller('internal/queue')
export class InternalQueueController {
  constructor(
    private readonly candidateSummaryQueueRunnerService: CandidateSummaryQueueRunnerService,
  ) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  async runPendingJobs() {
    return this.candidateSummaryQueueRunnerService.runPendingJobs();
  }
}