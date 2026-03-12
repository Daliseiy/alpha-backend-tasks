import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateCandidateSummaryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  promptVersion?: string;
}