import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkflowModule } from './workflow/workflow.module';

@Module({
  imports: [PrismaModule, AuthModule, WorkflowModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
