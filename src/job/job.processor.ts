import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor('workflow-execution') // subscribe ke queue 'workflow-execution'
export class JobProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) {
    super();
  }

  // Main handler yang dipanggil BullMQ otomatis saat ada job masuk dari queue.
  // Update status job PENDING → RUNNING, eksekusi tiap step berurutan, update COMPLETED atau FAILED
  async process(job: Job) {
    const { jobId, steps, input } = job.data;

    // update status Job menjadi RUNNING
    await this.prisma.job.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    try {
      // eksekusi tiap step secara berurutan
      // pakai loop karena ada banyak step yg gak nentu tiap workflow
      for (const step of steps) {
        // update status step menjadi RUNNING
        await this.prisma.jobStep.updateMany({
          where: { jobId, stepIndex: step.index },
          data: { status: 'RUNNING', startedAt: new Date() },
        });

        // simulasi eksekusi step — nanti bisa diganti logic nyata
        const output = await this.executeStep(step, input);

        // update status step menjadi COMPLETED beserta outputnya
        await this.prisma.jobStep.updateMany({
          where: { jobId, stepIndex: step.index },
          data: { status: 'COMPLETED', output, completedAt: new Date() },
        });
      }

      // semua step selesai — update status Job menjadi COMPLETED
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

    } catch (error) {
      // kalau ada step yang gagal — update status Job menjadi FAILED
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: 'FAILED' },
      });

      throw error; // lempar error supaya BullMQ tau job ini gagal dan bisa retry
    }
  }

  // Simulasi eksekusi tiap step berdasarkan tipenya (http, email, transform). Sekarang masih dummy dengan delay random
  // nanti bisa diganti logic nyata seperti benar-benar hit HTTP endpoint atau kirim email
  private async executeStep(step: any, input: any) {
    // simulasi delay eksekusi step (0.5 - 2 detik)
    const delay = Math.floor(Math.random() * 1500) + 500;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // return output simulasi per tipe step
    // contoh: agar worker tau kalau ada step tertentu outputnya apa
    switch (step.type) {
      case 'http':
        return { status: 200, data: { fetched: true, url: step.config?.url } };
      case 'email':
        return { sent: true, to: step.config?.to };
      case 'transform':
        return { transformed: true, input };
      default:
        return { executed: true, step: step.name };
    }
  }
}