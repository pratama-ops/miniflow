import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TriggerType } from '@prisma/client';

export class WorkflowStepDto {
  @ApiProperty({ example: 1 })
  index: number;

  @ApiProperty({ example: 'fetch_data' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'http', enum: ['http', 'email', 'transform'] })
  @IsString()
  type: string;

  @ApiPropertyOptional({ example: { url: 'https://api.example.com' } })
  @IsOptional()
  config?: Record<string, any>;
}

export class CreateWorkflowDto {
  @ApiProperty({ example: 'Daily Report Workflow' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Fetch and send daily report' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TriggerType, example: TriggerType.MANUAL })
  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @ApiPropertyOptional({ example: '0 9 * * *' })
  @IsOptional()
  @IsString()
  cronExpr?: string;

  @ApiProperty({ type: [WorkflowStepDto] })
  @IsArray()
  steps: WorkflowStepDto[];
}