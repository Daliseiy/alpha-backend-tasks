import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidateDocument } from '../src/entities/candidate-document.entity';
import { SampleCandidate } from '../src/entities/sample-candidate.entity';
import { CandidateDocumentsService } from '../src/sample/services/candidate-documents.service';
import { LocalDocumentStorageService } from '../src/sample/services/local-document-storage.service';
import { CandidateDocumentType } from '../src/common/enums/candidate-document-type.enum';

describe('CandidateDocumentsService', () => {
  let service: CandidateDocumentsService;
  let candidateDocumentRepository: jest.Mocked<Repository<CandidateDocument>>;
  let sampleCandidateRepository: jest.Mocked<Repository<SampleCandidate>>;
  let localDocumentStorageService: jest.Mocked<LocalDocumentStorageService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CandidateDocumentsService,
        {
          provide: getRepositoryToken(CandidateDocument),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SampleCandidate),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: LocalDocumentStorageService,
          useValue: {
            saveText: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(CandidateDocumentsService);
    candidateDocumentRepository = moduleRef.get(getRepositoryToken(CandidateDocument));
    sampleCandidateRepository = moduleRef.get(getRepositoryToken(SampleCandidate));
    localDocumentStorageService = moduleRef.get(LocalDocumentStorageService);
  });

  it('creates a candidate document for a candidate in the same workspace', async () => {
    sampleCandidateRepository.findOne.mockResolvedValue({
      id: 'cand_demo_1',
      workspaceId: 'ws_demo_1',
    } as SampleCandidate);

    localDocumentStorageService.saveText.mockResolvedValue({
      storageKey: 'candidate-documents/cand_demo_1/doc_1-john-doe-resume.txt',
    });

    candidateDocumentRepository.create.mockImplementation(
      (input) => input as CandidateDocument,
    );

    candidateDocumentRepository.save.mockImplementation(async (input) => ({
      ...input,
      uploadedAt: new Date('2026-03-12T12:00:00.000Z'),
    }) as CandidateDocument);

    const result = await service.createForWorkspace({
      candidateId: 'cand_demo_1',
      workspaceId: 'ws_demo_1',
      dto: {
        documentType: CandidateDocumentType.RESUME,
        fileName: 'john-doe-resume.txt',
        rawText:
          'John Doe is a senior backend engineer with experience in NestJS and PostgreSQL.',
      },
    });

    expect(sampleCandidateRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 'cand_demo_1',
        workspaceId: 'ws_demo_1',
      },
    });

    expect(localDocumentStorageService.saveText).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: 'cand_demo_1',
        fileName: 'john-doe-resume.txt',
        rawText:
          'John Doe is a senior backend engineer with experience in NestJS and PostgreSQL.',
      }),
    );

    expect(candidateDocumentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: 'cand_demo_1',
        documentType: 'resume',
        fileName: 'john-doe-resume.txt',
        storageKey: 'candidate-documents/cand_demo_1/doc_1-john-doe-resume.txt',
      }),
    );

    expect(result.candidateId).toBe('cand_demo_1');
    expect(result.fileName).toBe('john-doe-resume.txt');
  });

  it('throws when candidate is outside recruiter workspace', async () => {
    sampleCandidateRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createForWorkspace({
        candidateId: 'cand_demo_1',
        workspaceId: 'ws_demo_2',
        dto: {
          documentType: CandidateDocumentType.RESUME,
          fileName: 'john-doe-resume.txt',
          rawText: 'resume text',
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});