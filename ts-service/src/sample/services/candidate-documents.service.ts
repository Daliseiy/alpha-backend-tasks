import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidateDocumentType } from '../../common/enums/candidate-document-type.enum';
import { CandidateDocument } from '../../entities/candidate-document.entity';
import { SampleCandidate } from '../../entities/sample-candidate.entity';
import { CreateCandidateDocumentDto } from '../dto/create-candidate-document.dto';
import { LocalDocumentStorageService } from './local-document-storage.service';

@Injectable()
export class CandidateDocumentsService {
  constructor(
    @InjectRepository(CandidateDocument)
    private readonly candidateDocumentRepository: Repository<CandidateDocument>,
    @InjectRepository(SampleCandidate)
    private readonly sampleCandidateRepository: Repository<SampleCandidate>,
    private readonly localDocumentStorageService: LocalDocumentStorageService,
  ) {}

  async createForWorkspace(params: {
    candidateId: string;
    workspaceId: string;
    dto: CreateCandidateDocumentDto;
  }): Promise<CandidateDocument> {
    const candidate = await this.sampleCandidateRepository.findOne({
      where: {
        id: params.candidateId,
        workspaceId: params.workspaceId,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const documentId = this.generateDocumentId();

    const { storageKey } = await this.localDocumentStorageService.saveText({
      candidateId: candidate.id,
      documentId,
      fileName: params.dto.fileName,
      rawText: params.dto.rawText,
    });

    const document = this.candidateDocumentRepository.create({
      id: documentId,
      candidateId: candidate.id,
      documentType: params.dto.documentType as CandidateDocumentType,
      fileName: params.dto.fileName,
      storageKey,
      rawText: params.dto.rawText,
    });

    return this.candidateDocumentRepository.save(document);
  }

  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}