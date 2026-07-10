import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { join, normalize, relative, sep } from 'path';
import { existsSync, lstatSync, readdirSync, rmdirSync, unlinkSync } from 'fs';
import * as fs from 'fs-extra';
import * as fastCsv from 'fast-csv';
import * as sharp from 'sharp';
import { ResponsePayload } from '../../interfaces/response-payload.interface';

@Injectable()
export class UploadService {
  private logger = new Logger(UploadService.name);

  constructor() {}

  async deleteSingleFile(filePath: string): Promise<ResponsePayload> {
    try {
      const baseDir = './upload/images';

      if (filePath) {
        const splitPath = filePath.split('/');
        const file = splitPath[splitPath.length - 1];
        const [fileName, fileType] = file.split('.');

        // Check Folder
        const normalizedFilePath = normalize(filePath);
        const normalizedBaseDir = normalize(baseDir);
        const relativePath = relative(normalizedBaseDir, normalizedFilePath); // Get the part after baseDir
        const pathSegments = relativePath.split(sep);
        let folder = '';
        if (pathSegments.length > 1) {
          folder = pathSegments[0]; // Folder exists
        } else {
          folder = ''; // No folder, file is directly in baseDir
        }

        const dir = folder ? `./upload/images/${folder}` : `./upload/images`;

        const wFiles: string[] = [
          `${dir}/${fileName}_16.${fileType}`,
          `${dir}/${fileName}_48.${fileType}`,
          `${dir}/${fileName}_96.${fileType}`,
          `${dir}/${fileName}_128.${fileType}`,
          `${dir}/${fileName}_384.${fileType}`,
          `${dir}/${fileName}_640.${fileType}`,
          `${dir}/${fileName}_750.${fileType}`,
          `${dir}/${fileName}_828.${fileType}`,
          `${dir}/${fileName}_1080.${fileType}`,
          `${dir}/${fileName}_1200.${fileType}`,
          `${dir}/${fileName}_1342.${fileType}`,
          `${dir}/${fileName}_1920.${fileType}`,
          `${dir}/${fileName}_2048.${fileType}`,
        ];
        for (const file of wFiles) {
          if (existsSync(file)) {
            unlinkSync(file);
          }
        }

        unlinkSync(filePath);
        return {
          success: true,
          message: 'Success! Image Successfully Removed.',
        } as ResponsePayload;
      } else {
        return {
          success: false,
          message: 'Error! No Path found',
        } as ResponsePayload;
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleImage(
    baseurl: string,
    url: string[],
  ): Promise<ResponsePayload> {
    try {
      const baseDir = './upload/images';
      if (url && url.length) {
        url.forEach((u) => {
          const onlyUrl = u.replace(/\?.*/, '');
          const filePath = `.${onlyUrl.replace(baseurl, '')}`;

          const splitPath = filePath.split('/');
          const file = splitPath[splitPath.length - 1];
          const [fileName, fileType] = file.split('.');

          // Check Folder
          const normalizedFilePath = normalize(filePath);
          const normalizedBaseDir = normalize(baseDir);
          const relativePath = relative(normalizedBaseDir, normalizedFilePath); // Get the part after baseDir
          const pathSegments = relativePath.split(sep);
          let folder = '';
          if (pathSegments.length > 1) {
            folder = pathSegments[0]; // Folder exists
          } else {
            folder = ''; // No folder, file is directly in baseDir
          }

          const dir = folder ? `./upload/images/${folder}` : `./upload/images`;

          const wFiles: string[] = [
            `${dir}/${fileName}_16.${fileType}`,
            `${dir}/${fileName}_48.${fileType}`,
            `${dir}/${fileName}_96.${fileType}`,
            `${dir}/${fileName}_128.${fileType}`,
            `${dir}/${fileName}_384.${fileType}`,
            `${dir}/${fileName}_640.${fileType}`,
            `${dir}/${fileName}_750.${fileType}`,
            `${dir}/${fileName}_828.${fileType}`,
            `${dir}/${fileName}_1080.${fileType}`,
            `${dir}/${fileName}_1200.${fileType}`,
            `${dir}/${fileName}_1342.${fileType}`,
            `${dir}/${fileName}_1920.${fileType}`,
            `${dir}/${fileName}_2048.${fileType}`,
          ];
          for (const file of wFiles) {
            if (existsSync(file)) {
              unlinkSync(file);
            }
          }

          unlinkSync(filePath);
        });

        return {
          success: true,
          message: 'Success! Image Successfully Removed.',
        } as ResponsePayload;
      } else {
        return {
          success: false,
          message: 'Error! No Path found',
        } as ResponsePayload;
      }
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleFile(
    baseurl: string,
    url: string[],
  ): Promise<ResponsePayload> {
    try {
      if (url && url.length) {
        url.forEach((u) => {
          const path = `.${u.replace(baseurl, '')}`;
          unlinkSync(path);
        });

        return {
          success: true,
          message: 'Success! Files Successfully Removed.',
        } as ResponsePayload;
      } else {
        return {
          success: false,
          message: 'Error! No Path found',
        } as ResponsePayload;
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async imageGenerator(
    image: string,
    width: string,
    folder: string,
    auto?: string,
  ): Promise<string> {
    try {
      const dir = folder ? `upload/images/${folder}` : `upload/images`;
      const originalFilePath = folder
        ? `./upload/images/${folder}/${image}`
        : `./upload/images/${image}`;
      const placeholderFilePath = `placeholder.png`;

      // Check Request File Exists
      if (!existsSync(originalFilePath)) {
        return placeholderFilePath;
      }

      // Check Request Width
      if (!width) {
        return image;
      }
      // Main Convert Width
      const [fileName, fileType] = image.split('.');
      const requestFilePath = `./upload/images/${fileName}_${width}.${fileType}`;
      let newFilename = `${fileName}_${width}.${fileType}`;

      if (!existsSync(requestFilePath)) {
        const nWidth = +width;
        if (
          nWidth === 16 ||
          nWidth === 48 ||
          nWidth === 96 ||
          nWidth === 128 ||
          nWidth === 384 ||
          nWidth === 640 ||
          nWidth === 750 ||
          nWidth === 828 ||
          nWidth === 1080 ||
          nWidth === 1200 ||
          nWidth === 1342 ||
          nWidth === 1920 ||
          nWidth === 2048
        ) {
          await sharp(originalFilePath)
            .resize(+width)
            .toFile(`${dir}/${newFilename}`);
        } else {
          newFilename = image;
        }
      }
      return newFilename;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  bytesToKb(bytes: number): number {
    const res = bytes * 0.001;
    return Number(res.toFixed(2));
  }

  async deleteFolder(shop: string): Promise<ResponsePayload> {
    const baseDir = './upload/images';
    const dirPath = join(baseDir, shop);

    // Check if folder exists
    if (existsSync(dirPath)) {
      readdirSync(dirPath).forEach((file) => {
        const filePath = join(dirPath, file);
        if (lstatSync(filePath).isDirectory()) {
          this.deleteFolder(filePath); // Recursively delete subdirectories
        } else {
          unlinkSync(filePath); // Delete file
        }
      });
      rmdirSync(dirPath); // Remove empty directory
    }

    return {
      success: true,
      message: 'Success',
    } as ResponsePayload;
  }

  /**
   * CSV
   */
  async updateCsv(shop: string, products: any[]) {
    // const csvPath = this.getCsvPath(clientId);
    const uploadPath = join('upload', 'csv', shop);

    return new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(uploadPath + '.csv');
      fastCsv
        .write(products, { headers: true })
        .pipe(ws)
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  async getCsvFile(shop: string): Promise<string> {
    const filePath = join('upload', 'csv', shop);
    return filePath + '.csv';
  }
}
