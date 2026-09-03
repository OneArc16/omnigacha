import { BadRequestException, Injectable } from '@nestjs/common';
import { MediaKind, StorageDriver } from '@prisma/client';
import { existsSync } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join, normalize } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const MEDIA_ROOT_BY_KIND: Record<MediaKind, string> = {
  [MediaKind.SPLASH_ART]: 'splash-art',
  [MediaKind.CHARACTER_PORTRAIT]: 'portrait',
};
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
    return this.saveImageAsset(
      file,
      createdByUserId,
      MediaKind.SPLASH_ART,
      namespace,
      slug,
    );
  }

  async saveCharacterPortrait(
    file: Express.Multer.File,
    createdByUserId: number,
    slug: string,
  ) {
    return this.saveImageAsset(
      file,
      createdByUserId,
      MediaKind.CHARACTER_PORTRAIT,
      'characters',
      slug,
    );
  }

  private async saveImageAsset(
    file: Express.Multer.File,
    createdByUserId: number,
    kind: MediaKind,
    namespace: 'characters' | 'light-cones' | 'relic-sets',
    slug: string,
  ) {
    this.assertImage(file);

    const root = MEDIA_ROOT_BY_KIND[kind];
    const extension = resolveExtension(file);
    const storageKey = normalize(
      `${root}/${namespace}/${slug}-${randomUUID()}${extension}`,
    ).replace(/\\/g, '/');
    const uploadRoot = this.getUploadRoot();
    const absolutePath = join(uploadRoot, storageKey);

    await mkdir(join(uploadRoot, root, namespace), {
      recursive: true,
    });
    await writeFile(absolutePath, file.buffer);

    return this.prisma.mediaAsset.create({
      data: {
        kind,
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
