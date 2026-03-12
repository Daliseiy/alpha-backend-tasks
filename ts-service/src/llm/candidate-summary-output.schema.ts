import { z } from 'zod';

export const candidateSummaryOutputSchema = z.object({
  score: z.number().int().min(0).max(100),
  strengths: z.array(z.string().min(1)).max(10),
  concerns: z.array(z.string().min(1)).max(10),
  summary: z.string().min(1).max(4000),
  recommendedDecision: z.enum(['advance', 'hold', 'reject']),
});

export type CandidateSummaryOutput = z.infer<
  typeof candidateSummaryOutputSchema
>;