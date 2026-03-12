import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';

import { AppModule } from '../src/app.module';
import { SampleCandidate } from '../src/entities/sample-candidate.entity';
import { SampleWorkspace } from '../src/entities/sample-workspace.entity';
import { FakeSummarizationProvider } from '../src/llm/fake-summarization.provider';
import { SUMMARIZATION_PROVIDER } from '../src/llm/summarization-provider.interface';
import { CandidateSummaryQueueRunnerService } from '../src/sample/services/candidate-summary-queue-runner.service';

describe('Candidate summary pipeline (e2e)', () => {
  let app: INestApplication;
  let workspaceRepository: Repository<SampleWorkspace>;
  let candidateRepository: Repository<SampleCandidate>;
  let queueRunnerService: CandidateSummaryQueueRunnerService;

  const workspaceId = 'ws_e2e_1';
  const candidateId = 'cand_e2e_1';
  const userId = 'user_e2e_1';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SUMMARIZATION_PROVIDER)
      .useClass(FakeSummarizationProvider)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    workspaceRepository = moduleFixture.get(getRepositoryToken(SampleWorkspace));
    candidateRepository = moduleFixture.get(getRepositoryToken(SampleCandidate));
    queueRunnerService = moduleFixture.get(CandidateSummaryQueueRunnerService);
  });

  beforeEach(async () => {
    await candidateRepository.delete({ id: candidateId });
    await workspaceRepository.delete({ id: workspaceId });

    await workspaceRepository.save({
      id: workspaceId,
      name: 'E2E Workspace',
    });

    await candidateRepository.save({
      id: candidateId,
      workspaceId,
      fullName: 'John Doe',
      email: 'john@example.com',
    });
  });

  afterAll(async () => {
    await candidateRepository.delete({ id: candidateId });
    await workspaceRepository.delete({ id: workspaceId });
    await app.close();
  });

  it('uploads document, generates summary, runs queue, and retrieves completed summary', async () => {
    await request(app.getHttpServer())
      .post(`/candidates/${candidateId}/documents`)
      .set('x-user-id', userId)
      .set('x-workspace-id', workspaceId)
      .send({
        documentType: 'resume',
        fileName: 'john-doe-resume.txt',
        rawText:
          'John Doe is a senior backend engineer with experience in NestJS, PostgreSQL, and background jobs.',
      })
      .expect(201);

    const generateResponse = await request(app.getHttpServer())
      .post(`/candidates/${candidateId}/summaries/generate`)
      .set('x-user-id', userId)
      .set('x-workspace-id', workspaceId)
      .send({ promptVersion: 'v1' })
      .expect(202);

    expect(generateResponse.body.status).toBe('pending');

    await queueRunnerService.runPendingJobs();

    const listResponse = await request(app.getHttpServer())
      .get(`/candidates/${candidateId}/summaries`)
      .set('x-user-id', userId)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body.length).toBeGreaterThan(0);

    const summary = listResponse.body[0];

    expect(summary).toEqual(
      expect.objectContaining({
        candidateId,
        status: 'completed',
        score: expect.any(Number),
        strengths: expect.any(Array),
        concerns: expect.any(Array),
        summary: expect.any(String),
        recommendedDecision: expect.stringMatching(/advance|hold|reject/),
      }),
    );

    await request(app.getHttpServer())
      .get(`/candidates/${candidateId}/summaries/${summary.id}`)
      .set('x-user-id', userId)
      .set('x-workspace-id', workspaceId)
      .expect(200);
  });
});