import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';

@Injectable()
export class WorkflowService {
    constructor(private prisma: PrismaService) { } // masukkan prisma service ke dalam class

    async create(userId: string, dto: CreateWorkflowDto) { // buat workflow baru
        return this.prisma.workflow.create({
            data: {
                name: dto.name,
                description: dto.description,
                triggerType: dto.triggerType, // MANUAL atau SCHEDULED
                cronExpr: dto.cronExpr, // diisi kalau triggerType SCHEDULED, contoh: "0 9 * * *"
                steps: dto.steps as any, // array of steps disimpan sebagai JSON
                userId, // simpan userId supaya workflow hanya bisa diakses oleh pemiliknya
            },
        });
    }

    async findAll(userId: string) { // ambil semua workflow milik user
        return this.prisma.workflow.findMany({
            where: { userId }, // hanya ambil workflow yang userIdnya cocok
            orderBy: { createdAt: 'desc' }, // urutkan dari yang terbaru
        });
    }

    async findOne(userId: string, id: string) { // ambil workflow by id
        const workflow = await this.prisma.workflow.findFirst({
            where: { id, userId }, // cek id dan userId sekaligus supaya user lain tidak bisa akses
        });

        if (!workflow) throw new NotFoundException('Workflow tidak ditemukan');

        return workflow;
    }

    async update(userId: string, id: string, dto: Partial<CreateWorkflowDto>) { // edit workflow
        await this.findOne(userId, id); // cek dulu apakah workflow ada dan milik user ini

        return this.prisma.workflow.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.description && { description: dto.description }),
                ...(dto.triggerType && { triggerType: dto.triggerType }),
                ...(dto.cronExpr && { cronExpr: dto.cronExpr }),
                ...(dto.steps && { steps: dto.steps as any }), // cast ke any karena Prisma Json type tidak otomatis terima array
            },
        });
    }

    async remove(userId: string, id: string) { // hapus workflow
        await this.findOne(userId, id); // cek dulu apakah workflow ada dan milik user ini

        return this.prisma.workflow.delete({
            where: { id },
        });
    }
}