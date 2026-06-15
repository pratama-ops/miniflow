import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { BullModule } from '@nestjs/bullmq';
import { JobProcessor } from './job.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'workflow-execution', //nama queue yg akan dipakai
    }),
  ],
  controllers: [JobController],
  providers: [JobService, JobProcessor],
})
export class JobModule {}
