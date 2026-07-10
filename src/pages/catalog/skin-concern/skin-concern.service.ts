import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddSkinConcernDto,
  FilterAndPaginationSkinConcernDto,
  GetSkinConcernByIdsDto,
  UpdateSkinConcernDto,
} from './dto/skin-concern.dto';
import { SkinConcern } from './interfaces/skin-concern.interface';
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
export class SkinConcernService {
  private logger = new Logger(SkinConcernService.name);

  constructor(
    @InjectModel('SkinConcern')
    private readonly skinConcernModel: Model<SkinConcern>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    private utilsService: UtilsService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addSkinConcern()
   * getAllSkinConcernByShop()
   * getSkinConcernById()
   * getAllSkinConcerns()
   * getSkinConcernBySlug()
   * getSkinConcernByIds()
   * updateSkinConcernById()
   * updateMultipleSkinConcernById()
   * updateMultipleVendorSkinConcernById()
   * deleteMultipleTrashSkinConcern()
   * deleteMultipleSkinConcernByIdByVendor()
   * deleteMultipleSkinConcernById()
   */
  async addSkinConcern(
    vendor: Vendor,
    shop: string,
    addSkinConcernDto: AddSkinConcernDto,
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

      const totalSkinConcerns = await this.skinConcernModel.countDocuments({
        shop: shop,
      });

      if (totalSkinConcerns && totalSkinConcerns > MAX_CATEGORY_UPLOAD) {
        return {
          success: false,
          message:
            'Sorry! exists your skinConcerns upload limit with this shop.',
        } as ResponsePayload;
      }

      const finalData = {
        ...addSkinConcernDto,
        ...{
          shop: shop,
          slug: this.utilsService.transformToSlug(addSkinConcernDto.name),
        },
      };

      const saveData = await this.skinConcernModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! SkinConcern added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllSkinConcernForUi(shop: string): Promise<ResponsePayload> {
    try {
      const data = await this.skinConcernModel
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

  async getAllSkinConcernByShop(
    shop: string,
    filterSkinConcernDto: FilterAndPaginationSkinConcernDto,
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
      const { filter } = filterSkinConcernDto;
      filterSkinConcernDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllSkinConcerns(filterSkinConcernDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getSkinConcernById(
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

      const data = await this.skinConcernModel
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

  async getAllSkinConcerns(
    filterSkinConcernDto: FilterAndPaginationSkinConcernDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterSkinConcernDto;
    const { pagination } = filterSkinConcernDto;
    const { sort } = filterSkinConcernDto;
    const { select } = filterSkinConcernDto;
    const { filterGroup } = filterSkinConcernDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateSkinConcernGroupStages = [];
    const aggregateSubSkinConcernGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['skinConcern._id']) {
        filter['skinConcern._id'] = new ObjectId(filter['skinConcern._id']);
      }

      if (filter['subSkinConcern._id']) {
        filter['subSkinConcern._id'] = new ObjectId(
          filter['subSkinConcern._id'],
        );
      }

      if (filter['skinConcern._id']) {
        filter['skinConcern._id'] = new ObjectId(filter['skinConcern._id']);
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
    let groupSkinConcern: any;
    let groupSubSkinConcern: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.skinConcern) {
        groupSkinConcern = {
          $group: {
            _id: { skinConcern: '$skinConcern._id' },
            name: { $first: '$skinConcern.name' },
            slug: { $first: '$skinConcern.slug' },
            total: { $sum: 1 },
          },
        };
      }

      if (filterGroup.skinConcern) {
        groupSkinConcern = {
          $group: {
            _id: { skinConcern: '$skinConcern._id' },
            name: { $first: '$skinConcern.name' },
            slug: { $first: '$skinConcern.slug' },
            total: { $sum: 1 },
          },
        };
      }

      if (filterGroup.subSkinConcern) {
        groupSubSkinConcern = {
          $group: {
            _id: { subSkinConcern: '$subSkinConcern._id' },
            name: { $first: '$subSkinConcern.name' },
            slug: { $first: '$subSkinConcern.slug' },
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

      // SkinConcern Groups
      if (groupSkinConcern) {
        // aggregateSkinConcernGroupStages.push({ $match: mFilter });
        aggregateSkinConcernGroupStages.push(groupSkinConcern);
      }

      // Sub SkinConcern Groups
      if (groupSubSkinConcern) {
        // aggregateSubSkinConcernGroupStages.push({ $match: mFilter });
        aggregateSubSkinConcernGroupStages.push(groupSubSkinConcern);
      }

      // SkinConcern Groups
      if (groupSkinConcern) {
        // aggregateSkinConcernGroupStages.push({ $match: mFilter });
        aggregateSkinConcernGroupStages.push(groupSkinConcern);
      }
    } else {
      if (groupSkinConcern) {
        aggregateSkinConcernGroupStages.push(groupSkinConcern);
      }
      if (groupSubSkinConcern) {
        aggregateSubSkinConcernGroupStages.push(groupSubSkinConcern);
      }
      if (groupSkinConcern) {
        aggregateSkinConcernGroupStages.push(groupSkinConcern);
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
      const dataAggregates = await this.skinConcernModel.aggregate(
        aggregateStages,
        {
          allowDiskUse: true,
        },
      );

      // GROUP FILTER PRODUCTS DATA
      let skinConcernAggregates: any;
      let subSkinConcernAggregates: any;
      // SkinConcern
      if (filterGroup && filterGroup.isGroup && filterGroup.skinConcern) {
        skinConcernAggregates = await this.skinConcernModel.aggregate(
          aggregateSkinConcernGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub SkinConcern
      if (filterGroup && filterGroup.isGroup && filterGroup.subSkinConcern) {
        subSkinConcernAggregates = await this.skinConcernModel.aggregate(
          aggregateSubSkinConcernGroupStages,
          { allowDiskUse: true },
        );
      }

      // SkinConcern
      if (filterGroup && filterGroup.isGroup && filterGroup.skinConcern) {
        skinConcernAggregates = await this.skinConcernModel.aggregate(
          aggregateSkinConcernGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            skinConcernAggregates && skinConcernAggregates.length
              ? skinConcernAggregates
              : [],
          subCategories:
            subSkinConcernAggregates && subSkinConcernAggregates.length
              ? subSkinConcernAggregates
              : [],
          skinConcerns:
            skinConcernAggregates && skinConcernAggregates.length
              ? skinConcernAggregates
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

  async getSkinConcernBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.skinConcernModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.skinConcernModel.findByIdAndUpdate(data._id, {
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

  async getSkinConcernByIds(
    shop: string,
    getSkinConcernByIdsDto: GetSkinConcernByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getSkinConcernByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.skinConcernModel
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
   * updateSkinConcernById
   * updateMultipleSkinConcernById
   */
  async updateSkinConcernById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateSkinConcernDto: UpdateSkinConcernDto,
  ): Promise<ResponsePayload> {
    try {
      const { name } = updateSkinConcernDto;

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

      // Check if skinConcern exists
      const fData = await this.skinConcernModel.findOne({
        _id: id,
        shop: shop,
      });

      if (!fData) {
        return {
          success: false,
          message: 'SkinConcern not found!',
        };
      }

      // Check if name changed
      const isNameChanged = fData.name.trim() !== name.trim();

      let finalSlug: string;

      if (isNameChanged) {
        const newSlug = this.utilsService.transformToSlug(name);

        const isExists = await this.skinConcernModel.exists({ slug: newSlug });
        if (isExists) {
          finalSlug = this.utilsService.transformToSlug(name, true);
        } else {
          finalSlug = newSlug;
        }
      } else {
        finalSlug = fData.slug;
      }

      const finalData = {
        ...updateSkinConcernDto,
        slug: finalSlug,
      };

      // Update skinConcern
      await this.skinConcernModel.findByIdAndUpdate(id, {
        $set: finalData,
      });

      // Update products if name has changed
      if (isNameChanged) {
        await this.productModel.updateMany(
          {
            'skinConcern._id': fData._id,
            shop: shop,
          },
          {
            $set: {
              'skinConcern.name': name,
              'skinConcern.slug': finalSlug,
            },
          },
        );
      }

      return {
        success: true,
        message: 'Success! SkinConcern updated successfully.',
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleSkinConcernById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateSkinConcernDto: UpdateSkinConcernDto,
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
        // if (updateSkinConcernDto.slug) {
        //   delete updateSkinConcernDto.slug;
        // }
        await this.skinConcernModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateSkinConcernDto },
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

  async deleteMultipleTrashSkinConcern(
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

      await this.skinConcernModel.deleteMany({ _id: ids, status: 'trash' });
      return {
        success: true,
        message: 'Success! SkinConcern permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleSkinConcernByIdByVendor(
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

      // await this.skinConcernModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );

      await this.skinConcernModel.deleteMany({ _id: ids });

      return {
        success: true,
        message: 'Success! SkinConcern deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleSkinConcernById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.skinConcernModel.deleteMany({ _id: ids });
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

      await this.skinConcernModel.deleteMany({ shop: shop, status: 'trash' });
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
      await this.skinConcernModel.deleteMany({
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
