import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { CandidateDocumentsController } from './controllers/candidate-documents.controller';
import { CandidateDocumentsService } from './services/candidate-documents.service';
import { LocalDocumentStorageService } from './services/local-document-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([CandidateDocument, SampleCandidate])],
  controllers: [CandidateDocumentsController],
  providers: [CandidateDocumentsService, LocalDocumentStorageService],
  exports: [CandidateDocumentsService],
})
export class CandidateDocumentsModule {}