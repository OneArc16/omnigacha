import { BadRequestException, Injectable } from '@nestjs/common';
import { MediaKind, StorageDriver } from '@prisma/client';
import { existsSync } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join, normalize } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const SPLASH_ART_ROOT = 'splash-art';
const ALLOWED_EXTENSIONS = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/avif', '.avif'],
  ['image/svg+xml', '.svg'],
]);

function resolveExtension(file: Express.Multer.File) {
  const fromName = extname(file.originalname).toLowerCase();
  if (fromName) {
    return fromName;
  }

  return ALLOWED_EXTENSIONS.get(file.mimetype) ?? '.png';
}

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async saveSplashArt(
    file: Express.Multer.File,
    createdByUserId: number,
    namespace: 'characters' | 'light-cones' | 'relic-sets',
    slug: string,
  ) {
    this.assertImage(file);

    const extension = resolveExtension(file);
    const storageKey = normalize(
      `${SPLASH_ART_ROOT}/${namespace}/${slug}-${randomUUID()}${extension}`,
    ).replace(/\\/g, '/');
    const uploadRoot = this.getUploadRoot();
    const absolutePath = join(uploadRoot, storageKey);

    await mkdir(join(uploadRoot, SPLASH_ART_ROOT, namespace), {
      recursive: true,
    });
    await writeFile(absolutePath, file.buffer);

    return this.prisma.mediaAsset.create({
      data: {
        kind: MediaKind.SPLASH_ART,
        storageDriver: StorageDriver.LOCAL,
        storageKey,
        publicUrl: this.buildPublicUrl(storageKey),
        mimeType: file.mimetype,
        sizeBytes: file.size,
        createdByUserId,
      },
    });
  }

  async deleteAsset(assetId: number) {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return;
    }

    const absolutePath = join(this.getUploadRoot(), asset.storageKey);
    if (existsSync(absolutePath)) {
      await unlink(absolutePath).catch(() => undefined);
    }

    await this.prisma.mediaAsset.delete({ where: { id: assetId } });
  }

  private assertImage(file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Image file is required');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }
  }

  private buildPublicUrl(storageKey: string) {
    return `/media/${storageKey.replace(/\\/g, '/')}`;
  }

  private getUploadRoot() {
    return join(process.cwd(), 'uploads');
  }
}
