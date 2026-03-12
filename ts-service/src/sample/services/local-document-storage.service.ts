import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class LocalDocumentStorageService {
  constructor(private readonly configService: ConfigService) {}

  async saveText(params: {
    candidateId: string;
    documentId: string;
    fileName: string;
    rawText: string;
  }): Promise<{ storageKey: string }> {
    const rootDir =
      this.configService.get<string>('DOCUMENT_STORAGE_ROOT') ?? './data';

    const safeFileName = this.sanitizeFileName(params.fileName);
    const relativeDir = path.join('candidate-documents', params.candidateId);
    const relativePath = path.join(
      relativeDir,
      `${params.documentId}-${safeFileName}.txt`,
    );
    const absoluteDir = path.join(rootDir, relativeDir);
    const absolutePath = path.join(rootDir, relativePath);

    await fs.mkdir(absoluteDir, { recursive: true });
    await fs.writeFile(absolutePath, params.rawText, 'utf8');

    return {
      storageKey: relativePath.replace(/\\/g, '/'),
    };
  }

  private sanitizeFileName(fileName: string): string {
    const baseName = fileName.trim().replace(/\.[^.]+$/, '');

    return (
      baseName
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'document'
    );
  }
}