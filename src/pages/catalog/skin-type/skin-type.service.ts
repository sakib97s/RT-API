import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddSkinTypeDto,
  FilterAndPaginationSkinTypeDto,
  GetSkinTypeByIdsDto,
  UpdateSkinTypeDto,
} from './dto/skin-type.dto';
import { SkinType } from './interfaces/skin-type.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from 'src/pages/shop/interfaces/shop.interface';

import * as schedule from 'node-schedule';
import {
  MAX_CATEGORY_UPLOAD,
  MAX_PRODUCT_UPLOAD,
} from '../../../config/global-variables';
import { Product } from '../../product/interfaces/product.interface';
const ObjectId = Types.ObjectId;

@Injectable()
export class SkinTypeService {
  private logger = new Logger(SkinTypeService.name);

  constructor(
    @InjectModel('SkinType') private readonly skinTypeModel: Model<SkinType>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    private utilsService: UtilsService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addSkinType()
   * getAllSkinTypeByShop()
   * getSkinTypeById()
   * getAllSkinTypes()
   * getSkinTypeBySlug()
   * getSkinTypeByIds()
   * updateSkinTypeById()
   * updateMultipleSkinTypeById()
   * updateMultipleVendorSkinTypeById()
   * deleteMultipleTrashSkinType()
   * deleteMultipleSkinTypeByIdByVendor()
   * deleteMultipleSkinTypeById()
   */
  async addSkinType(
    vendor: Vendor,
    shop: string,
    addSkinTypeDto: AddSkinTypeDto,
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

      const totalSkinTypes = await this.skinTypeModel.countDocuments({
        shop: shop,
      });

      if (totalSkinTypes && totalSkinTypes > MAX_CATEGORY_UPLOAD) {
        return {
          success: false,
          message: 'Sorry! exists your skinTypes upload limit with this shop.',
        } as ResponsePayload;
      }

      const finalData = {
        ...addSkinTypeDto,
        ...{
          shop: shop,
          slug: this.utilsService.transformToSlug(addSkinTypeDto.name),
        },
      };

      const saveData = await this.skinTypeModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! SkinType added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllSkinTypeForUi(shop: string): Promise<ResponsePayload> {
    try {
      const data = await this.skinTypeModel
        .find({ shop: shop, status: 'publish' })
        .select('name slug images')
        .sort({ priority: -1 });

      return {
        success: true,
        message: 'Success! Data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAllSkinTypeByShop(
    shop: string,
    filterSkinTypeDto: FilterAndPaginationSkinTypeDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! no data found.',
        } as ResponsePayload;
      }

      // Modify Filter
      const { filter } = filterSkinTypeDto;
      filterSkinTypeDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllSkinTypes(filterSkinTypeDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getSkinTypeById(
    vendor: Vendor,
    shop: string,
    id: string,
    select: string,
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

      const data = await this.skinTypeModel
        .findOne({ _id: id, shop: shop })
        .select(select);

      return {
        success: true,
        message: 'Success! Data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAllSkinTypes(
    filterSkinTypeDto: FilterAndPaginationSkinTypeDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterSkinTypeDto;
    const { pagination } = filterSkinTypeDto;
    const { sort } = filterSkinTypeDto;
    const { select } = filterSkinTypeDto;
    const { filterGroup } = filterSkinTypeDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateSkinTypeGroupStages = [];
    const aggregateSubSkinTypeGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['skinType._id']) {
        filter['skinType._id'] = new ObjectId(filter['skinType._id']);
      }

      if (filter['subSkinType._id']) {
        filter['subSkinType._id'] = new ObjectId(filter['subSkinType._id']);
      }

      if (filter['skinType._id']) {
        filter['skinType._id'] = new ObjectId(filter['skinType._id']);
      }

      if (filter['tags']) {
        filter['tags'] = new ObjectId(filter['tags']);
      }

      if (filter['shop']) {
        filter['shop'] = new ObjectId(filter['shop']);
      }
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      // const mSearchQuery = searchQuery.replace(/[^a-zA-Z0-9 ]/g, '');

      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { name: this.utilsService.createRegexFromString(searchQuery) },
              // { name: { $regex: mSearchQuery, $options: 'i' } },
            ],
          },
        ],
      };
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

    // GROUPING FOR FILTER PRODUCTS
    let groupSkinType: any;
    let groupSubSkinType: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.skinType) {
        groupSkinType = {
          $group: {
            _id: { skinType: '$skinType._id' },
            name: { $first: '$skinType.name' },
            slug: { $first: '$skinType.slug' },
            total: { $sum: 1 },
          },
        };
      }

      if (filterGroup.skinType) {
        groupSkinType = {
          $group: {
            _id: { skinType: '$skinType._id' },
            name: { $first: '$skinType.name' },
            slug: { $first: '$skinType.slug' },
            total: { $sum: 1 },
          },
        };
      }

      if (filterGroup.subSkinType) {
        groupSubSkinType = {
          $group: {
            _id: { subSkinType: '$subSkinType._id' },
            name: { $first: '$subSkinType.name' },
            slug: { $first: '$subSkinType.slug' },
            total: { $sum: 1 },
          },
        };
      }
    }

    // Search A-Z
    if (searchQuery) {
      aggregateStages.push({
        $addFields: {
          sortBySearch: {
            $indexOfCP: ['$name', searchQuery.toLowerCase()],
          },
        },
      });
    }

    // Finalize
    if (Object.keys(mFilter).length) {
      // Main
      aggregateStages.push({ $match: mFilter });

      // SkinType Groups
      if (groupSkinType) {
        // aggregateSkinTypeGroupStages.push({ $match: mFilter });
        aggregateSkinTypeGroupStages.push(groupSkinType);
      }

      // Sub SkinType Groups
      if (groupSubSkinType) {
        // aggregateSubSkinTypeGroupStages.push({ $match: mFilter });
        aggregateSubSkinTypeGroupStages.push(groupSubSkinType);
      }

      // SkinType Groups
      if (groupSkinType) {
        // aggregateSkinTypeGroupStages.push({ $match: mFilter });
        aggregateSkinTypeGroupStages.push(groupSkinType);
      }
    } else {
      if (groupSkinType) {
        aggregateSkinTypeGroupStages.push(groupSkinType);
      }
      if (groupSubSkinType) {
        aggregateSubSkinTypeGroupStages.push(groupSubSkinType);
      }
      if (groupSkinType) {
        aggregateSkinTypeGroupStages.push(groupSkinType);
      }
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
      // Main
      const dataAggregates = await this.skinTypeModel.aggregate(
        aggregateStages,
        {
          allowDiskUse: true,
        },
      );

      // GROUP FILTER PRODUCTS DATA
      let skinTypeAggregates: any;
      let subSkinTypeAggregates: any;
      // SkinType
      if (filterGroup && filterGroup.isGroup && filterGroup.skinType) {
        skinTypeAggregates = await this.skinTypeModel.aggregate(
          aggregateSkinTypeGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub SkinType
      if (filterGroup && filterGroup.isGroup && filterGroup.subSkinType) {
        subSkinTypeAggregates = await this.skinTypeModel.aggregate(
          aggregateSubSkinTypeGroupStages,
          { allowDiskUse: true },
        );
      }

      // SkinType
      if (filterGroup && filterGroup.isGroup && filterGroup.skinType) {
        skinTypeAggregates = await this.skinTypeModel.aggregate(
          aggregateSkinTypeGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            skinTypeAggregates && skinTypeAggregates.length
              ? skinTypeAggregates
              : [],
          subCategories:
            subSkinTypeAggregates && subSkinTypeAggregates.length
              ? subSkinTypeAggregates
              : [],
          skinTypes:
            skinTypeAggregates && skinTypeAggregates.length
              ? skinTypeAggregates
              : [],
        };
      } else {
        allFilterGroups = null;
      }

      if (pagination) {
        if (
          pagination.currentPage < 1 &&
          filter == null &&
          JSON.stringify(sort) == JSON.stringify({ createdAt: -1 })
        ) {
        }

        return {
          ...{ ...dataAggregates[0] },
          ...{
            success: true,
            message: 'Success',
            filterGroup: allFilterGroups,
          },
        } as ResponsePayload;
      } else {
        return {
          data: dataAggregates,
          success: true,
          message: 'Success',
          count: dataAggregates.length,
          filterGroup: allFilterGroups,
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async getSkinTypeBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.skinTypeModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.skinTypeModel.findByIdAndUpdate(data._id, {
          $inc: {
            totalView: 1,
          },
        });
      }

      return {
        success: true,
        message: 'Success! data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getSkinTypeByIds(
    shop: string,
    getSkinTypeByIdsDto: GetSkinTypeByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getSkinTypeByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.skinTypeModel
        .find({ _id: mIds, shop: shop })
        .select(select);

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
   * updateSkinTypeById
   * updateMultipleSkinTypeById
   */
  async updateSkinTypeById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateSkinTypeDto: UpdateSkinTypeDto,
  ): Promise<ResponsePayload> {
    try {
      const { name } = updateSkinTypeDto;

      // Check vendor access to the shop
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! You do not have access to this shop.',
        };
      }

      // Check if skinType exists
      const fData = await this.skinTypeModel.findOne({ _id: id, shop: shop });

      if (!fData) {
        return {
          success: false,
          message: 'SkinType not found!',
        };
      }

      // Check if name changed
      const isNameChanged = fData.name.trim() !== name.trim();

      let finalSlug: string;

      if (isNameChanged) {
        const newSlug = this.utilsService.transformToSlug(name);

        const isExists = await this.skinTypeModel.exists({ slug: newSlug });
        if (isExists) {
          finalSlug = this.utilsService.transformToSlug(name, true);
        } else {
          finalSlug = newSlug;
        }
      } else {
        finalSlug = fData.slug;
      }

      const finalData = {
        ...updateSkinTypeDto,
        slug: finalSlug,
      };

      // Update skinType
      await this.skinTypeModel.findByIdAndUpdate(id, {
        $set: finalData,
      });

      // Update products if name has changed
      if (isNameChanged) {
        await this.productModel.updateMany(
          {
            'skinType._id': fData._id,
            shop: shop,
          },
          {
            $set: {
              'skinType.name': name,
              'skinType.slug': finalSlug,
            },
          },
        );
      }

      return {
        success: true,
        message: 'Success! SkinType updated successfully.',
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleSkinTypeById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateSkinTypeDto: UpdateSkinTypeDto,
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

      if (ids && ids.length) {
        const mIds = ids.map((m) => new ObjectId(m));

        // Delete No Multiple Action Data
        // if (updateSkinTypeDto.slug) {
        //   delete updateSkinTypeDto.slug;
        // }
        await this.skinTypeModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateSkinTypeDto },
        );

        return {
          success: true,
          message: 'Success! multiple data updated successfully',
        } as ResponsePayload;
      } else {
        return {
          success: true,
          message: 'Sorry! no id found',
        } as ResponsePayload;
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleTrashSkinType(
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

      await this.skinTypeModel.deleteMany({ _id: ids, status: 'trash' });
      return {
        success: true,
        message: 'Success! SkinType permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleSkinTypeByIdByVendor(
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

      // await this.skinTypeModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );

      await this.skinTypeModel.deleteMany({ _id: ids });

      return {
        success: true,
        message: 'Success! SkinType deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleSkinTypeById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.skinTypeModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteAllTrashByShop(shop: string): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      await this.skinTypeModel.deleteMany({ shop: shop, status: 'trash' });
      return {
        success: true,
        message: 'Success! order permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  private async checkExpireEveryday() {
    schedule.scheduleJob('30 3 * * *', async () => {
      await this.checkExpireFromDb();
    });
  }

  private async checkExpireFromDb() {
    try {
      // Calculate the date 10 days ago
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      // console.log(tenDaysAgo.toISOString().split('T')[0]);
      // Perform deletion of orders with status 'trash' and deleteDateString <= 10 days ago
      await this.skinTypeModel.deleteMany({
        status: 'trash',
        deleteDateString: {
          $lte: tenDaysAgo.toISOString().split('T')[0], // Compare as ISO string for date format matching
        },
      });

      // console.log('Auto-deletion task executed successfully.');
    } catch (err) {
      console.error('Error during auto-deletion:', err);
    }
  }
}
