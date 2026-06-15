import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TriggerJobDto {
  @ApiProperty({ example: 'uuid-workflow-id-disini' })
  @IsString()
  workflowId: string;

  @ApiPropertyOptional({ 
    example: { userId: '123', reportDate: '2026-06-15' },
    description: 'Data tambahan yang diteruskan ke tiap step workflow'
  })
  @IsOptional()
  input?: Record<string, any>; // data opsional yang bisa dikirim saat trigger job
}