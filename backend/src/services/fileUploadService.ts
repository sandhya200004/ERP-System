import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'proofs');

  constructor(private prisma: PrismaService) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadTaskProof(
    taskId: string,
    userId: string,
    file: any,
    description?: string,
  ) {
    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${taskId}_${timestamp}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    // Save file
    fs.writeFileSync(filepath, file.buffer);

    // Save to database
    const proof = await this.prisma.task_proofs.create({
      data: {
        id: require('crypto').randomUUID(),
        task_id: taskId,
        uploaded_by: userId,
        file_name: filename,
        file_path: filepath,
        mime_type: file.mimetype,
        file_size: BigInt(file.size),
      },
    });

    // Update task proofs array
    const task = await this.prisma.employee_tasks.findUnique({
      where: { id: taskId },
    });

    if (task) {
      const currentProofs = (task.proofs as any[]) || [];
      await this.prisma.employee_tasks.update({
        where: { id: taskId },
        data: {
          proofs: [
            ...currentProofs,
            {
              id: proof.id,
              fileName: file.originalname,
              filePath: filepath,
              uploadedAt: new Date().toISOString(),
            },
          ],
        },
      });
    }

    return {
      id: proof.id,
      taskId: proof.task_id,
      fileName: proof.file_name,
      fileSize: Number(proof.file_size),
      fileType: proof.mime_type,
      uploadedAt: proof.uploaded_at,
    };
  }

  async getTaskProofs(taskId: string) {
    return this.prisma.task_proofs.findMany({
      where: { task_id: taskId },
      include: {
        uploader: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: { uploaded_at: 'desc' },
    });
  }

  async deleteProof(proofId: string, userId: string) {
    const proof = await this.prisma.task_proofs.findUnique({
      where: { id: proofId },
    });

    if (!proof) {
      throw new Error('Proof not found');
    }

    // Check if user owns the proof or is admin
    if (proof.uploaded_by !== userId) {
      // TODO: Check admin permissions
    }

    // Delete file
    if (fs.existsSync(proof.file_path)) {
      fs.unlinkSync(proof.file_path);
    }

    // Delete from database
    await this.prisma.task_proofs.delete({
      where: { id: proofId },
    });

    return { message: 'Proof deleted successfully' };
  }

  getFilePath(proofId: string): Promise<string> {
    return this.prisma.task_proofs
      .findUnique({
        where: { id: proofId },
        select: { file_path: true },
      })
      .then((proof: any) => {
        if (!proof) throw new Error('Proof not found');
        return proof.file_path;
      });
  }
}
