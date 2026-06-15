import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JobService } from './job.service';
import { TriggerJobDto } from './dto/trigger-job.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('job') // grouping endpoint di Swagger UI
@ApiBearerAuth() // endpoint ini butuh JWT token
@UseGuards(JwtAuthGuard) // proteksi semua endpoint
@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post('trigger') // handle POST /job/trigger — trigger eksekusi workflow (trigger berasal dari file service)
  trigger(@Body() dto: TriggerJobDto, @Req() req: any) {
    return this.jobService.trigger(req.user.id, dto);
  }

  @Get() // handle GET /job — ambil semua job milik user (findAll dari file service)
  findAll(@Req() req: any) {
    return this.jobService.findAll(req.user.id);
  }

  @Get(':id') // handle GET /job/:id — ambil detail job beserta steps (findOne dari file service)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.jobService.findOne(req.user.id, id);
  }
}