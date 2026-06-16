import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { TriggerJobDto } from './dto/trigger-job.dto';
import { threadCpuUsage } from 'process';

@Injectable()
export class JobService {
  constructor(
    private prisma: PrismaService, // untuk operasi database
    @InjectQueue('workflow-execution') private queue: Queue, // inject queue yang sudah didaftarkan di module
  ) { }

  // Terima request trigger job, validasi workflow, buat record di DB, push ke queue
  async trigger(userId: string, dto: TriggerJobDto) {
    // cek apakah workflow ada dan milik user ini
    const workflow = await this.prisma.workflow.findFirst({
      where: { id: dto.workflowId, userId },
    });

    if (!workflow) throw new NotFoundException('Workflow tidak ditemukan');

    // cek kuota job aktif user
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    //ambil semua workflowId milik user
    const useWorkflow = await this.prisma.workflow.findMany({
      where: { userId },
      select: { id: true },
    });

    const workflowId = useWorkflow.map((w) => w.id)

    // hitung job aktif berdasarkan workflowId
    const activeJobs = await this.prisma.job.count({
      where: {
        workflowId: { in: workflowId },
        status: { in: ['PENDING', 'RUNNING'] },
      },
    });

    if (activeJobs >= user!.jobQuota) {
        throw new BadRequestException(
          `Quota job aktif sudah penuh (${user!.jobQuota} job). Tunggu job selesai sebelum trigger baru`
        )
    }

    // buat record Job di database dengan status PENDING
    const job = await this.prisma.job.create({
      data: {
        workflowId: workflow.id,
        status: 'PENDING',
      },
    });

    // buat record JobStep untuk tiap step di workflow
    const steps = workflow.steps as any[];
    await this.prisma.jobStep.createMany({
      data: steps.map((step) => ({
        jobId: job.id,
        stepIndex: step.index,
        stepName: step.name,
        status: 'PENDING',
        input: dto.input ?? {},
      })),
    });

    // push job ke queue BullMQ untuk diproses worker
    await this.queue.add('execute-workflow', {
      jobId: job.id,
      workflowId: workflow.id,
      steps: workflow.steps,
      input: dto.input ?? {},
    });

    return { message: 'Job berhasil ditrigger', jobId: job.id };
  }

  // Ambil semua job milik user beserta nama workflow dan steps-nya
  async findAll(userId: string) {
    // ambil semua job milik user berdasarkan workflownya
    return this.prisma.job.findMany({
      where: {
        workflow: { userId }, // join ke workflow untuk filter by userId
      },
      include: {
        workflow: { select: { name: true } }, // sertakan nama workflow
        steps: true, // sertakan semua steps
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Ambil detail satu job spesifik beserta steps-nya diurutkan by index
  async findOne(userId: string, id: string) {
    // ambil detail job beserta steps nya
    const job = await this.prisma.job.findFirst({
      where: {
        id,
        workflow: { userId },
      },
      include: {
        workflow: { select: { name: true } },
        steps: {
          orderBy: { stepIndex: 'asc' }, // urutkan step dari index terkecil
        },
      },
    });

    if (!job) throw new NotFoundException('Job tidak ditemukan');

    return job;
  }
}