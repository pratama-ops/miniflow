import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('workflow') // grouping endpoint di Swagger UI
@ApiBearerAuth() // endpoint ini butuh JWT token di Swagger
@UseGuards(JwtAuthGuard) // proteksi semua endpoint di controller ini, kalau tidak ada token langsung 401
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post() // handle POST /workflow
  create(@Body() dto: CreateWorkflowDto, @Req() req: any) {
    // @Body() = ambil data dari request body
    // @Req() = ambil request object, termasuk req.user yang diisi oleh JwtStrategy setelah token divalidasi
    return this.workflowService.create(req.user.id, dto);
  }

  @Get() // handle GET /workflow
  findAll(@Req() req: any) {
    // hanya return workflow milik user yang sedang login
    return this.workflowService.findAll(req.user.id);
  }

  @Get(':id') // handle GET /workflow/:id
  findOne(@Param('id') id: string, @Req() req: any) {
    // @Param('id') = ambil nilai :id dari URL
    // kirim userId sekalian supaya service bisa cek kepemilikan workflow
    return this.workflowService.findOne(req.user.id, id);
  }

  @Patch(':id') // handle PATCH /workflow/:id — update sebagian field
  update(@Param('id') id: string, @Body() dto: Partial<CreateWorkflowDto>, @Req() req: any) {
    // Partial<CreateWorkflowDto> = semua field opsional, tidak harus kirim semua field
    return this.workflowService.update(req.user.id, id, dto);
  }

  @Delete(':id') // handle DELETE /workflow/:id
  remove(@Param('id') id: string, @Req() req: any) {
    return this.workflowService.remove(req.user.id, id);
  }
}