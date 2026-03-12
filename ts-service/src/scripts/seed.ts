import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { defaultDatabaseUrl, getTypeOrmOptions } from '../config/typeorm.options';

async function run(): Promise<void> {
  const dataSource = new DataSource(
    getTypeOrmOptions(process.env.DATABASE_URL ?? defaultDatabaseUrl),
  );

  await dataSource.initialize();

  const workspaceRepository = dataSource.getRepository(SampleWorkspace);
  const candidateRepository = dataSource.getRepository(SampleCandidate);
  const documentRepository = dataSource.getRepository(CandidateDocument);
  const summaryRepository = dataSource.getRepository(CandidateSummary);

  const workspaceId = 'ws_demo_1';
  const candidateId = 'cand_demo_1';

  await documentRepository.delete({ candidateId });
  await summaryRepository.delete({ candidateId });
  await candidateRepository.delete({ id: candidateId });
  await workspaceRepository.delete({ id: workspaceId });

  await workspaceRepository.save({
    id: workspaceId,
    name: 'Demo Workspace',
  });

  await candidateRepository.save({
    id: candidateId,
    workspaceId,
    fullName: 'John Doe',
    email: 'john@example.com',
  });

  console.log('Seed complete');
  console.log({
    workspaceId,
    candidateId,
    headers: {
      'x-user-id': 'user_demo_1',
      'x-workspace-id': workspaceId,
    },
  });

  await dataSource.destroy();
}

run().catch((error) => {
  console.error('Seed failed', error);
  process.exit(1);
});