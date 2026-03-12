import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/auth-user.decorator';
import { AuthUser } from '../../auth/auth.types';
import { FakeAuthGuard } from '../../auth/fake-auth.guard';
import { CandidateDocumentsService } from '../services/candidate-documents.service';
import { CreateCandidateDocumentDto } from '../dto/create-candidate-document.dto';
import { ApiBody, ApiHeader,ApiTags } from '@nestjs/swagger';

@ApiTags('candidate-documents')
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
@Controller('candidates/:candidateId/documents')
export class CandidateDocumentsController {
  constructor(
    private readonly candidateDocumentsService: CandidateDocumentsService,
  ) {}

  @Post()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        documentType: {
          type: 'string',
          enum: ['resume', 'cover_letter', 'portfolio', 'other'],
          example: 'resume',
        },
        fileName: {
          type: 'string',
          example: 'john-doe-resume.txt',
        },
        rawText: {
          type: 'string',
          example:
            'Senior backend engineer with experience in NestJS, PostgreSQL, background jobs, and modular architecture.',
        },
      },
      required: ['documentType', 'fileName', 'rawText'],
    },
  })
  async createDocument(
    @Param('candidateId') candidateId: string,
    @Body() dto: CreateCandidateDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    const document = await this.candidateDocumentsService.createForWorkspace({
      candidateId,
      workspaceId: user.workspaceId,
      dto,
    });

    return {
      id: document.id,
      candidateId: document.candidateId,
      documentType: document.documentType,
      fileName: document.fileName,
      storageKey: document.storageKey,
      uploadedAt: document.uploadedAt,
    };
  }
}