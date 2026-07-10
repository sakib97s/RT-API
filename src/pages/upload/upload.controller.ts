import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import {
  allFileFilter,
  editFileName,
  getUploadFilePath,
  getUploadImagePath,
  imageFileFilter,
} from './file-upload.utils';
import { UploadService } from './upload.service';
import { join, parse, resolve } from 'path';
import { unlinkSync } from 'fs';
import * as sharp from 'sharp';
import { imageSize } from 'image-size';

import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import {
  FileUploadResponse,
  ImageUploadResponse,
  ResponsePayload,
} from '../../interfaces/response-payload.interface';

@Controller('upload')
export class UploadController {
  private logger = new Logger(UploadController.name);

  constructor(
    private configService: ConfigService,
    private uploadService: UploadService,
  ) {}

  /**
   * IMAGE CONTROL METHODS
   * uploadSingleImage()
   * uploadMultipleImages()
   * seeUploadedImage()
   * seeUploadedImageWithFolder()
   * deleteSingleImage()
   * deleteMultipleImage()
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('single-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: getUploadImagePath,
        filename: editFileName,
      }),
      limits: {
        fileSize: 5 * 1000 * 1000,
      },
      fileFilter: imageFileFilter,
    }),
  )
  async uploadSingleImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Query('shop') shop: string,
    @Body() body: any,
  ) {
    const isProduction = this.configService.get<boolean>('productionBuild');
    const prefix = this.configService.get<string>('prefix');
    if (
      body &&
      body['convert'] &&
      body['convert'].toString().toLowerCase() === 'yes'
    ) {
      const quality: number = body['quality'] ? Number(body['quality']) : 85;
      const width: number = body['width'] ? Number(body['width']) : null;
      const height: number = body['height'] ? Number(body['height']) : null;

      const dir = shop ? `upload/images/${shop}` : `upload/images/1_global`;
      const filename = parse(file.filename).name;
      const newFilename = filename + '.webp';
      const newPath = `${dir}/${newFilename}`;

      const { readFileSync } = require('fs');
      const fileBuffer = readFileSync(file.path);
      let sharpInstance = sharp(fileBuffer);
      if (width || height) {
        sharpInstance = sharpInstance.resize(width, height);
      }
      const metaData = await sharpInstance
        .webp({ effort: 4, quality: quality })
        .withMetadata()
        .toFile(join(dir, newFilename));

      const baseurl =
        req.protocol +
        `${isProduction ? 's' : ''}://` +
        req.get('host') +
        (prefix ? `/${prefix}` : '');

      const url = `${baseurl}/${newPath}?resolution=${metaData.width}_${metaData.height}`;

      // Delete Images
      unlinkSync('./' + file.path);

      return {
        originalname: file.originalname,
        filename: file.filename,
        format: metaData.format,
        width: metaData.width,
        height: metaData.height,
        size: this.uploadService.bytesToKb(metaData.size),
        url,
      };
    } else {
      const metaData = imageSize(file.path);
      const baseurl =
        req.protocol +
        `${isProduction ? 's' : ''}://` +
        req.get('host') +
        (prefix ? `/${prefix}` : '');
      const path = file.path;
      const url = `${baseurl}/${path}?resolution=${metaData.width}_${metaData.height}`;
      return {
        originalname: file.originalname,
        filename: file.filename,
        format: metaData.type,
        width: metaData.width,
        height: metaData.height,
        size: this.uploadService.bytesToKb(file.size),
        url,
      };
    }
  }

  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @Post('multiple-image')
  @UseInterceptors(
    FilesInterceptor('imageMulti', 50, {
      storage: diskStorage({
        destination: getUploadImagePath,
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('shop') shop: string,
    @Req() req: any,
    @Body() body: any,
  ): Promise<ImageUploadResponse[]> {
    const isProduction = this.configService.get<boolean>('productionBuild');
    const prefix = this.configService.get<string>('prefix');
    const baseurl =
      req.protocol +
      `${isProduction ? 's' : ''}://` +
      req.get('host') +
      (prefix ? `/${prefix}` : '');

    if (
      body &&
      body['convert'] &&
      body['convert'].toString().toLowerCase() === 'yes'
    ) {
      const quality: number = body['quality'] ? Number(body['quality']) : 85;
      const width: number = body['width'] ? Number(body['width']) : null;
      const height: number = body['height'] ? Number(body['height']) : null;
      const dir = shop ? `upload/images/${shop}` : `upload/images/1_global`;
      const response: ImageUploadResponse[] = [];

      for (const file of files) {
        const filename = parse(file.filename).name;
        const extension = parse(file.filename).ext;
        const newFilename = filename + '.webp';
        const newPath = `${dir}/${newFilename}`;

        if (extension?.toLowerCase() !== '.webp') {
          const { readFileSync } = require('fs');
          const fileBuffer = readFileSync(file.path);
          let sharpInstance = sharp(fileBuffer);
          if (width || height) {
            sharpInstance = sharpInstance.resize(width, height);
          }
          const metaData = await sharpInstance
            .webp({ effort: 4, quality: quality })
            .withMetadata()
            .toFile(join(dir, newFilename));

          // Delete Images
          unlinkSync('./' + file.path);

          const fileResponse = {
            size: this.uploadService.bytesToKb(metaData.size),
            name: file.filename.split('.')[0],
            url: `${baseurl}/${newPath}?resolution=${metaData.width}_${metaData.height}`,
            format: metaData.format,
            width: metaData.width,
            height: metaData.height,
          } as ImageUploadResponse;
          response.push(fileResponse);
        } else {
          const metaData = imageSize(file.path);
          const fileResponse = {
            size: this.uploadService.bytesToKb(file.size),
            name: file.filename.split('.')[0],
            url: `${baseurl}/${file.path}?resolution=${metaData.width}_${metaData.height}`,
            format: metaData.type,
            width: metaData.width,
            height: metaData.height,
          } as ImageUploadResponse;
          response.push(fileResponse);
        }
      }

      return response;
    } else {
      const response: ImageUploadResponse[] = [];
      files.forEach((file) => {
        const metaData = imageSize(file.path);
        const fileResponse = {
          size: this.uploadService.bytesToKb(file.size),
          name: file.filename.split('.')[0],
          url: `${baseurl}/${file.path}?resolution=${metaData.width}_${metaData.height}`,
          format: metaData.type,
          width: metaData.width,
          height: metaData.height,
        } as ImageUploadResponse;
        response.push(fileResponse);
      });
      return response;
    }
  }

  @Get('images/:imageName')
  async seeUploadedImage(
    @Param('imageName') image: string,
    @Query('w') width: string,
    @Query('auto') auto: string,
    @Res() res: any,
  ) {
    const file = await this.uploadService.imageGenerator(
      image,
      width,
      null,
      auto,
    );
    return res.sendFile(file, { root: './upload/images' });
  }

  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @Get('images/:folder/:imageName')
  async seeUploadedImageWithFolder(
    @Param('folder') folder: string,
    @Param('imageName') image: string,
    @Query('w') width: string,
    @Query('auto') auto: string,
    @Res() res: any,
  ) {
    const file = await this.uploadService.imageGenerator(
      image,
      width,
      folder,
      auto,
    );
    // Serve the file
    return res.sendFile(file, { root: `./upload/images/${folder}` });
  }

  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @Post('delete-single-image')
  deleteSingleImage(
    @Body('url') url: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    const isProduction = this.configService.get<boolean>('productionBuild');
    const prefix = this.configService.get<string>('prefix');
    const baseurl =
      req.protocol +
      `${isProduction ? 's' : ''}://` +
      req.get('host') +
      (prefix ? `/${prefix}` : '');

    const onlyUrl = url.replace(/\?.*/, '');
    const path = `.${onlyUrl.replace(baseurl, '')}`;
    return this.uploadService.deleteSingleFile(path);
  }

  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Post('delete-multiple-image')
  deleteMultipleImage(
    @Body('url') url: string[],
    @Req() req: any,
  ): Promise<ResponsePayload> {
    const isProduction = this.configService.get<boolean>('productionBuild');
    const prefix = this.configService.get<string>('prefix');
    const baseurl =
      req.protocol +
      `${isProduction ? 's' : ''}://` +
      req.get('host') +
      (prefix ? `/${prefix}` : '');
    return this.uploadService.deleteMultipleImage(baseurl, url);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Delete('delete-folder')
  deleteShopFolder(
    @Query('shop') shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.uploadService.deleteFolder(shop);
  }

  /**
   * File CONTROL METHODS
   * uploadMultipleFiles()
   * seeUploadedFile()
   * deleteMultipleFile()
   */

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('multiple-file')
  @UseInterceptors(
    FilesInterceptor('fileMulti', 50, {
      storage: diskStorage({
        destination: getUploadFilePath,
        filename: editFileName,
      }),
      fileFilter: allFileFilter,
    }),
  )
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ): Promise<FileUploadResponse[]> {
    const isProduction = this.configService.get<boolean>('productionBuild');
    const prefix = this.configService.get<string>('prefix');
    const baseurl =
      req.protocol +
      `${isProduction ? 's' : ''}://` +
      req.get('host') +
      (prefix ? `/${prefix}` : '');
    const response: FileUploadResponse[] = [];
    files.forEach((file) => {
      const fileResponse = {
        extension: file.filename.split('.')[1]?.toLowerCase(),
        size: this.uploadService.bytesToKb(file.size),
        name: file.filename.split('.')[0],
        url: `${baseurl}/${file.path}`,
      } as FileUploadResponse;
      response.push(fileResponse);
    });
    return response;
  }

  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @Get('files/:name')
  async seeUploadedFile(@Param('name') file: string, @Res() res: any) {
    return res.sendFile(file, { root: './upload/files' });
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('delete-multiple-file')
  deleteMultipleFile(
    @Body('url') url: string[],
    @Req() req: any,
  ): Promise<ResponsePayload> {

    const isProduction = this.configService.get<boolean>('productionBuild');
    const prefix = this.configService.get<string>('prefix');
    const baseurl =
      req.protocol +
      `${isProduction ? 's' : ''}://` +
      req.get('host') +
      (prefix ? `/${prefix}` : '');
    return this.uploadService.deleteMultipleFile(baseurl, url);
  }

  /**
   * CSV
   */

  @Post('csv-upload')
  async updateCsv(@Query('shop') shop: string, @Body() products: any[]) {
    try {
      await this.uploadService.updateCsv(shop, products);
      return {
        message: 'CSV updated successfully',
        fileUrl: `/csv/${shop}/feed.csv`,
      };
    } catch (error) {
      console.log(error);
    }
  }

  @Get('csv/:shop/datafeed.csv')
  async getCsvFile(@Param('shop') shop: string, @Res() res: Response) {
    const filePath = await this.uploadService.getCsvFile(shop);
    return res.sendFile(resolve(filePath));
  }
}
