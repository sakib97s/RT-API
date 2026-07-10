import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { UtilsService } from '../../../shared/utils/utils.service';
import { Gallery } from './interfaces/gallery.interface';
import {
  AddGalleryDto,
  FilterAndPaginationGalleryDto,
  UpdateGalleryDto,
} from './dto/gallery.dto';
import { ResponsePayload } from '../../../interfaces/response-payload.interface';
import { ErrorCodes } from '../../../enum/error-code.enum';
import { Vendor } from '../../vendor/interfaces/vendor.interface';
import { Shop } from '../../shop/interfaces/shop.interface';
import { User } from '../../user/interfaces/user.interface';
import {
  MAX_IMAGES_UPLOAD,
  MAX_ORDER_CREATE,
} from '../../../config/global-variables';

const ObjectId = Types.ObjectId;

@Injectable()
export class GalleryService {
  private logger = new Logger(GalleryService.name);

  constructor(
    @InjectModel('Gallery')
    private readonly galleryModel: Model<Gallery>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    private configService: ConfigService,
    private utilsService: UtilsService,
  ) {}

  /**
   * addGallery
   * insertManyGallery
   */
  async addGallery(addGalleryDto: AddGalleryDto): Promise<ResponsePayload> {
    const { name } = addGalleryDto;

    const defaultData = {
      slug: this.utilsService.transformToSlug(name),
    };
    const mData = { ...addGalleryDto, ...defaultData };
    const newData = new this.galleryModel(mData);
    try {
      const saveData = await newData.save();
      const data = {
        _id: saveData._id,
      };
      return {
        success: true,
        message: 'Data Added Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      // console.log(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Slug Must be Unique');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async addGalleryByShop(
    shop: string,
    vendor: Vendor,
    addGalleryDto: AddGalleryDto,
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });
      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! no data found.',
        } as ResponsePayload;
      }

      return this.addGallery(addGalleryDto);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async insertManyGallery(
    addGallerysDto: AddGalleryDto[],
    optionGalleryDto: any,
  ): Promise<ResponsePayload> {
    const mData = addGallerysDto.map((m) => {
      return {
        ...m,
        ...{
          slug: this.utilsService.transformToSlug(m.name),
        },
      };
    });
    try {
      const saveData = await this.galleryModel.insertMany(mData);
      return {
        success: true,
        data: saveData,
        message: `${
          saveData && saveData.length ? saveData.length : 0
        }  Data Added Success`,
      } as ResponsePayload;
    } catch (error) {
      // console.log(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Slug Must be Unique');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async insertManyAdminGallery(
    user: any,
    addGallerysDto: AddGalleryDto[],
    optionGalleryDto: any,
  ): Promise<ResponsePayload> {
    const mData = addGallerysDto.map((m) => {
      return {
        ...m,
        ...{
          admin: user,
        },
      };
    });
    try {
      const saveData = await this.galleryModel.insertMany(mData);
      return {
        success: true,
        data: saveData,
        message: `${
          saveData && saveData.length ? saveData.length : 0
        }  Data Added Success`,
      } as ResponsePayload;
    } catch (error) {
      // console.log(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Slug Must be Unique');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }
  async insertManyGalleryByShop(
    shop: string,
    addGalleryDto: AddGalleryDto[],
  ): Promise<ResponsePayload> {
    try {
      const mData = addGalleryDto.map((m) => {
        return {
          ...m,
          ...{
            shop: shop,
          },
        };
      });
      const saveData = await this.galleryModel.insertMany(mData);
      return {
        success: true,
        data: saveData,
        message: `${
          saveData && saveData.length ? saveData.length : 0
        }  Data Added Success`,
      } as ResponsePayload;
    } catch (error) {
      // console.log(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Slug Must be Unique');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  /**
   * getAllGallerys
   * getGalleryById
   */

  async getAllFolderByShop(
    shop: string,
    vendor: Vendor,
    filterGalleryDto: FilterAndPaginationGalleryDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });
      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      // Modify Filter
      const { filter } = filterGalleryDto;
      filterGalleryDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllGallerys(filterGalleryDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllGallerys(
    filterGalleryDto: FilterAndPaginationGalleryDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterGalleryDto;
    const { pagination } = filterGalleryDto;
    const { sort } = filterGalleryDto;
    const { select } = filterGalleryDto;

    // Essential Variables
    const aggregateStages = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['shop']) {
        filter['shop'] = new ObjectId(filter['shop']);
      }

      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      mFilter = { ...mFilter, ...{ name: new RegExp(searchQuery, 'i') } };
    }
    // Sort
    if (sort) {
      mSort = sort;
    } else {
      mSort = { createdAt: -1 };
    }

    // Select
    if (select) {
      mSelect = { ...select };
    } else {
      mSelect = { name: 1 };
    }

    // Finalize
    if (Object.keys(mFilter).length) {
      aggregateStages.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateStages.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateStages.push({ $project: mSelect });
    }

    // Pagination
    if (pagination) {
      if (Object.keys(mSelect).length) {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
              { $project: mSelect },
            ],
          },
        };
      } else {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
            ],
          },
        };
      }

      aggregateStages.push(mPagination);

      aggregateStages.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.galleryModel.aggregate(aggregateStages);
      if (pagination) {
        return {
          ...{ ...dataAggregates[0] },
          ...{ success: true, message: 'Success', maxLimit: MAX_IMAGES_UPLOAD },
        } as ResponsePayload;
      } else {
        return {
          data: dataAggregates,
          success: true,
          message: 'Success',
          count: dataAggregates.length,
          maxLimit: MAX_IMAGES_UPLOAD,
        } as ResponsePayload;
      }
    } catch (err) {
      this.logger.error(err);
      if (err.code && err.code.toString() === ErrorCodes.PROJECTION_MISMATCH) {
        throw new BadRequestException('Error! Projection mismatch');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async getAllAdminGallerys(
    filterGalleryDto: FilterAndPaginationGalleryDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterGalleryDto;
    const { pagination } = filterGalleryDto;
    const { sort } = filterGalleryDto;
    const { select } = filterGalleryDto;

    // Essential Variables
    const aggregateStages = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['admin']) {
        filter['admin'] = new ObjectId(filter['admin']);
      }

      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      mFilter = { ...mFilter, ...{ name: new RegExp(searchQuery, 'i') } };
    }
    // Sort
    if (sort) {
      mSort = sort;
    } else {
      mSort = { createdAt: -1 };
    }

    // Select
    if (select) {
      mSelect = { ...select };
    } else {
      mSelect = { name: 1 };
    }

    // Finalize
    if (Object.keys(mFilter).length) {
      aggregateStages.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateStages.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateStages.push({ $project: mSelect });
    }

    // Pagination
    if (pagination) {
      if (Object.keys(mSelect).length) {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
              { $project: mSelect },
            ],
          },
        };
      } else {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
            ],
          },
        };
      }

      aggregateStages.push(mPagination);

      aggregateStages.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.galleryModel.aggregate(aggregateStages);
      if (pagination) {
        return {
          ...{ ...dataAggregates[0] },
          ...{ success: true, message: 'Success' },
        } as ResponsePayload;
      } else {
        return {
          data: dataAggregates,
          success: true,
          message: 'Success',
          count: dataAggregates.length,
        } as ResponsePayload;
      }
    } catch (err) {
      this.logger.error(err);
      if (err.code && err.code.toString() === ErrorCodes.PROJECTION_MISMATCH) {
        throw new BadRequestException('Error! Projection mismatch');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async getGalleryById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.galleryModel.findById(id).select(select);
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * updateGalleryById
   * updateMultipleGalleryById
   */

  async updateGalleryByIdByShop(
    vendor: Vendor,
    shop: string,
    id: string,
    updateGalleryDto: UpdateGalleryDto,
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      return await this.updateGalleryById(id, updateGalleryDto);
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateGalleryById(
    id: string,
    updateGalleryDto: UpdateGalleryDto,
  ): Promise<ResponsePayload> {
    try {
      const { name } = updateGalleryDto;
      const data = JSON.parse(
        JSON.stringify(await this.galleryModel.findById(id)),
      );
      const finalData = { ...updateGalleryDto };
      // Check Slug
      if (name)
        // if (name && data.name !== name) {
        //   finalData.slug = this.utilsService.transformToSlug(name, true);
        // }

        await this.galleryModel.findByIdAndUpdate(id, {
          $set: finalData,
        });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleGalleryById(
    ids: string[],
    updateGalleryDto: UpdateGalleryDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    // Delete No Multiple Action Data
    // if (updateGalleryDto.slug) {
    //   delete updateGalleryDto.slug;
    // }

    try {
      await this.galleryModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateGalleryDto },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * deleteGalleryById
   * deleteMultipleGalleryById
   */
  async deleteGalleryById(id: string): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.galleryModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.galleryModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleGalleryById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.galleryModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleGalleryByIdByShop(
    vendor: Vendor,
    shop: string,
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      await this.galleryModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
