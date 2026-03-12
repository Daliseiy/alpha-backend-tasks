import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  OneToMany,
} from 'typeorm';

import { CandidateDocument } from './candidate-document.entity';
import { CandidateSummary } from './candidate-summary.entity';
import { SampleWorkspace } from './sample-workspace.entity';

@Entity({ name: 'sample_candidates' })
export class SampleCandidate {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'workspace_id', type: 'varchar', length: 64 })
  workspaceId!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 160 })
  fullName!: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  email!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => SampleWorkspace, (workspace) => workspace.candidates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: SampleWorkspace;

  @OneToMany(() => CandidateDocument, (document) => document.candidate)
  documents!: CandidateDocument[];

  @OneToMany(() => CandidateSummary, (summary) => summary.candidate)
  summaries!: CandidateSummary[];
}
