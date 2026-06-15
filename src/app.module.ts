import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkflowModule } from './workflow/workflow.module';
import { BullModule } from '@nestjs/bullmq';
import { JobModule } from './job/job.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WorkflowModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379'),
      },
    }),
    JobModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
