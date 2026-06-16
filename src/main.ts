import 'dotenv/config'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { Queue } from 'bullmq';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // setup bull board - dashboard untuk monitor queue
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/queue');

  createBullBoard ({
    queues: [
      new BullMQAdapter(
        new Queue('workflow-execution', {
          connection: {
            host: process.env.REDIS_HOST ?? 'localhost',
            port: parseInt(process.env.REDIS_PORT ?? '6379'),
          },
        }),
      ),
    ],
    serverAdapter,
  });

  app.use('/queue', serverAdapter.getRouter());

  //setup swagger (dokumentasi API yang interaktif - bisa dicoba tanpa perlu postman)
  const config = new DocumentBuilder()
    .setTitle('MiniFlow')
    .setDescription('Distributed Workflow Execution Engine')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  //validationpipe = melakukan pengecekan data
  //useglobalpipes = pasang validationpipe ke seluruh aplikasi sekaligus
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, //(strip field yg ada di dto secara otomatis)
    forbidNonWhitelisted: true, //(kalau ada field asing langsung error 400) || eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NzJlMjM1Yi0yM2VmLTRlZDctYTllMy1jNDEyMWQ3ZTBmNjgiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3ODE0OTE5MjUsImV4cCI6MTc4MjA5NjcyNX0.csAUWB4ekn6meXp2gc65G2YJHK0n8NnKtI2S0RXs74A
    transform: true //(otomatis convert data sesuai dto)
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();