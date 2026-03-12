import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { CandidateDocumentType } from '../../common/enums/candidate-document-type.enum';

export class CreateCandidateDocumentDto {
  @IsEnum(CandidateDocumentType)
  documentType!: CandidateDocumentType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  rawText!: string;
}