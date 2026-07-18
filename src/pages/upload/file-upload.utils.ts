import { extname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

export const imageFileFilter = (req: any, file: any, callback: any) => {
  const extMatch = file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const mimeMatch = file.mimetype && file.mimetype.startsWith('image/');
  if (!extMatch && !mimeMatch) {
    return callback(new BadRequestException('Only image files are allowed!'), false);
  }
  callback(null, true);
};

export const allFileFilter = (req: any, file: any, callback: any) => {
  if (!file.originalname.match(/\.(pdf|PDF|)$/)) {
    return callback(new BadRequestException('Only pdf files are allowed!'), false);
  }
  callback(null, true);
};

export const editFileName = (req: any, file: any, callback: any) => {
  let fileExtName = extname(file.originalname);
  if (!fileExtName && file.mimetype) {
    const parts = file.mimetype.split('/');
    if (parts.length === 2 && parts[0] === 'image') {
      fileExtName = '.' + parts[1];
    }
  }
  const name = transformToSlug(file.originalname.split('.')[0] || 'image');
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

export const getUploadImagePath = (req: any, file: any, callback: any) => {
  const { shop } = req.query;

  const folder = shop || '1_global';
  const uploadPath = join('upload', 'images', folder);

  // Ensure folder exists
  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
  }
  callback(null, uploadPath);
};

export const getUploadFilePath = (req: any, file: any, callback: any) => {
  const dir = `./upload/files`;

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  return callback(null, dir);
};

const transformToSlug = (value: string): string => {
  return value
    .trim()
    .replace(/[^A-Z0-9]+/gi, '-')
    .toLowerCase();
};
