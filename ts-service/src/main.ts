import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

    const config = new DocumentBuilder()
    .setTitle('TalentFlow API')
    .setDescription('Candidate document intake and summary workflow')
    .setVersion('1.0')
    .addApiKey(
      { type: 'apiKey', name: 'x-user-id', in: 'header' },
      'x-user-id',
    )
    .addApiKey(
      { type: 'apiKey', name: 'x-workspace-id', in: 'header' },
      'x-workspace-id',
    )
    .addSecurityRequirements('x-user-id')
    .addSecurityRequirements('x-workspace-id')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

bootstrap();
