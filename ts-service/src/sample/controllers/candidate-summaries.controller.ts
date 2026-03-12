import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/auth-user.decorator';
import { AuthUser } from '../../auth/auth.types';
import { FakeAuthGuard } from '../../auth/fake-auth.guard';
import { CandidateSummariesService } from '../services/candidate-summaries.service';
import { GenerateCandidateSummaryDto } from '../dto/generate-candidate-summary.dto';
import { ApiHeader, ApiSecurity, ApiTags } from '@nestjs/swagger';

@ApiTags('candidate-summaries')
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
@Controller('candidates/:candidateId/summaries')
export class CandidateSummariesController {
  constructor(
    private readonly candidateSummariesService: CandidateSummariesService,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  async requestGeneration(
    @Param('candidateId') candidateId: string,
    @Body() dto: GenerateCandidateSummaryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const { summary, jobId } =
      await this.candidateSummariesService.requestGeneration({
        candidateId,
        workspaceId: user.workspaceId,
        userId: user.userId,
        dto,
      });

    return {
      id: summary.id,
      candidateId: summary.candidateId,
      status: summary.status,
      provider: summary.provider,
      promptVersion: summary.promptVersion,
      jobId,
      createdAt: summary.createdAt,
    };
  }

  @Get()
  async listSummaries(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const summaries = await this.candidateSummariesService.listForWorkspace({
      candidateId,
      workspaceId: user.workspaceId,
    });

    return summaries.map((summary) => ({
      id: summary.id,
      candidateId: summary.candidateId,
      status: summary.status,
      score: summary.score,
      strengths: summary.strengths,
      concerns: summary.concerns,
      summary: summary.summary,
      recommendedDecision: summary.recommendedDecision,
      provider: summary.provider,
      promptVersion: summary.promptVersion,
      errorMessage: summary.errorMessage,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
      completedAt: summary.completedAt,
      failedAt: summary.failedAt,
    }));
  }

  @Get(':summaryId')
  async getSummary(
    @Param('candidateId') candidateId: string,
    @Param('summaryId') summaryId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const summary = await this.candidateSummariesService.getOneForWorkspace({
      candidateId,
      summaryId,
      workspaceId: user.workspaceId,
    });

    return {
      id: summary.id,
      candidateId: summary.candidateId,
      status: summary.status,
      score: summary.score,
      strengths: summary.strengths,
      concerns: summary.concerns,
      summary: summary.summary,
      recommendedDecision: summary.recommendedDecision,
      provider: summary.provider,
      promptVersion: summary.promptVersion,
      errorMessage: summary.errorMessage,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
      completedAt: summary.completedAt,
      failedAt: summary.failedAt,
    };
  }
}