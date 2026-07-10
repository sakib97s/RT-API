import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddIpBlockDto,
  FilterAndPaginationIpBlockDto,
  GetIpBlockByIdsDto,
  UpdateIpBlockDto,
} from './dto/ip-block.dto';
import { IpBlock } from './interfaces/ip-block.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from 'src/pages/shop/interfaces/shop.interface';
import * as schedule from 'node-schedule';
import { MAX_BANNER_UPLOAD } from '../../config/global-variables';
const ObjectId = Types.ObjectId;

@Injectable()
export class IpBlockService {
  private logger = new Logger(IpBlockService.name);

  constructor(
    @InjectModel('IpBlock') private readonly ipBlockModel: Model<IpBlock>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    private utilsService: UtilsService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addIpBlock()
   * getAllIpBlockByShop()
   * getIpBlockById()
   * getAllIpBlocks()
   * getIpBlockBySlug()
   * getIpBlockByIds()
   * updateIpBlockById()
   * updateMultipleIpBlockById()
   * updateMultipleVendorIpBlockById()
   * deleteMultipleTrashIpBlock()
   * deleteMultipleIpBlockByIdByVendor()
   * deleteMultipleIpBlockById()
   */
  async addIpBlock(
    vendor: Vendor,
    shop: string,
    addIpBlockDto: AddIpBlockDto,
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

      const totalIpBlock = await this.ipBlockModel.countDocuments({
        shop: shop,
      });

      if (totalIpBlock && totalIpBlock > MAX_BANNER_UPLOAD) {
        return {
          success: false,
          message: 'Sorry! exists your IpBlock upload limit with this shop.',
        } as ResponsePayload;
      }

      const finalData = {
        ...addIpBlockDto,
        ...{
          shop: shop,
        },
      };

      const saveData = await this.ipBlockModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! IpBlock added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllIpBlockForUi(shop: string): Promise<ResponsePayload> {
    try {
      const data = await this.ipBlockModel.find({
        shop: shop,
        status: 'publish',
        type: 'home-page-top-IpBlock',
      })
        .select('name type images')
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

  async getAllIpBlockByShop(
    shop: string,
    filterIpBlockDto: FilterAndPaginationIpBlockDto,
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
      const { filter } = filterIpBlockDto;
      filterIpBlockDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllIpBlocks(filterIpBlockDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getIpBlockById(
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

      const data = await this.ipBlockModel.findOne({
        _id: id,
        shop: shop,
      }).select(select);

      return {
        success: true,
        message: 'Success! Data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAllIpBlocks(
    filterIpBlockDto: FilterAndPaginationIpBlockDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterIpBlockDto;
    const { pagination } = filterIpBlockDto;
    const { sort } = filterIpBlockDto;
    const { select } = filterIpBlockDto;
    const { filterGroup } = filterIpBlockDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateIpBlockGroupStages = [];
    const aggregateBrandGroupStages = [];
    const aggregateSubIpBlockGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['IpBlock._id']) {
        filter['IpBlock._id'] = new ObjectId(filter['IpBlock._id']);
      }

      if (filter['subIpBlock._id']) {
        filter['subIpBlock._id'] = new ObjectId(filter['subIpBlock._id']);
      }

      if (filter['brand._id']) {
        filter['brand._id'] = new ObjectId(filter['brand._id']);
      }

      if (filter['tags']) {
        filter['tags'] = new ObjectId(filter['tags']);
      }

      if (filter['shop']) {
        filter['shop'] = new ObjectId(filter['shop']);
      }
    }
    if (filter) {
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      // const mSearchQuery = searchQuery.replace(/[^a-zA-Z0-9 ]/g, '');

      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { title: this.utilsService.createRegexFromString(searchQuery) },
              { url: this.utilsService.createRegexFromString(searchQuery) },
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
    let groupIpBlock: any;
    let groupBrand: any;
    let groupSubIpBlock: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.IpBlock) {
        groupIpBlock = {
          $group: {
            _id: { IpBlock: '$IpBlock._id' },
            name: { $first: '$IpBlock.name' },
            slug: { $first: '$IpBlock.slug' },
            total: { $sum: 1 },
          },
        };
      }

      if (filterGroup.brand) {
        groupBrand = {
          $group: {
            _id: { brand: '$brand._id' },
            name: { $first: '$brand.name' },
            slug: { $first: '$brand.slug' },
            total: { $sum: 1 },
          },
        };
      }

      if (filterGroup.subIpBlock) {
        groupSubIpBlock = {
          $group: {
            _id: { subIpBlock: '$subIpBlock._id' },
            name: { $first: '$subIpBlock.name' },
            slug: { $first: '$subIpBlock.slug' },
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

      // IpBlock Groups
      if (groupIpBlock) {
        // aggregateIpBlockGroupStages.push({ $match: mFilter });
        aggregateIpBlockGroupStages.push(groupIpBlock);
      }

      // Sub IpBlock Groups
      if (groupSubIpBlock) {
        // aggregateSubIpBlockGroupStages.push({ $match: mFilter });
        aggregateSubIpBlockGroupStages.push(groupSubIpBlock);
      }

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }
    } else {
      if (groupIpBlock) {
        aggregateIpBlockGroupStages.push(groupIpBlock);
      }
      if (groupSubIpBlock) {
        aggregateSubIpBlockGroupStages.push(groupSubIpBlock);
      }
      if (groupBrand) {
        aggregateBrandGroupStages.push(groupBrand);
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
      const dataAggregates = await this.ipBlockModel.aggregate(
        aggregateStages,
        {
          allowDiskUse: true,
        },
      );

      // GROUP FILTER PRODUCTS DATA
      let IpBlockAggregates: any;
      let subIpBlockAggregates: any;
      let brandAggregates: any;
      // IpBlock
      if (filterGroup && filterGroup.isGroup && filterGroup.IpBlock) {
        IpBlockAggregates = await this.ipBlockModel.aggregate(
          aggregateIpBlockGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub IpBlock
      if (filterGroup && filterGroup.isGroup && filterGroup.subIpBlock) {
        subIpBlockAggregates = await this.ipBlockModel.aggregate(
          aggregateSubIpBlockGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.ipBlockModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            IpBlockAggregates && IpBlockAggregates.length
              ? IpBlockAggregates
              : [],
          subCategories:
            subIpBlockAggregates && subIpBlockAggregates.length
              ? subIpBlockAggregates
              : [],
          brands:
            brandAggregates && brandAggregates.length ? brandAggregates : [],
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

  async getIpBlockBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.ipBlockModel.findOne({
        slug: slug,
        shop: shop,
      }).select(select);

      // Increment view count
      if (data) {
        await this.ipBlockModel.findByIdAndUpdate(data._id, {
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

  async getIpBlockByIds(
    shop: string,
    getIpBlockByIdsDto: GetIpBlockByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getIpBlockByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.ipBlockModel.find({
        _id: mIds,
        shop: shop,
      }).select(select);

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
   * updateIpBlockById
   * updateMultipleIpBlockById
   */
  async updateIpBlockById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateIpBlockDto: UpdateIpBlockDto,
  ): Promise<ResponsePayload> {
    try {
      // const { name } = updateIpBlockDto;

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

      let finalSlug: string;
      const fData = await this.ipBlockModel.findOne({ _id: id, shop: shop });

      // Check Slug
      // if (fData?.name.trim() !== name.trim()) {
      //   const newSlug = this.utilsService.transformToSlug(name);

      //   const isExists = await this.ipBlockModel.exists({ slug: newSlug });
      //   if (isExists) {
      //     finalSlug = this.utilsService.transformToSlug(name, true);
      //   } else {
      //     finalSlug = newSlug;
      //   }
      // } else {
      //   finalSlug = fData.slug;
      // }

      const finalData = {
        ...updateIpBlockDto,
      };

      await this.ipBlockModel.findByIdAndUpdate(id, {
        $set: finalData,
      });

      return {
        success: true,
        message: 'Success! data updated successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleIpBlockById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateIpBlockDto: UpdateIpBlockDto,
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
        // if (updateIpBlockDto.slug) {
        //   delete updateIpBlockDto.slug;
        // }
        await this.ipBlockModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateIpBlockDto },
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

  async deleteMultipleTrashIpBlock(
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

      await this.ipBlockModel.deleteMany({ _id: ids, status: 'trash' });
      return {
        success: true,
        message: 'Success! IpBlock permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleIpBlockByIdByVendor(
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

      // await this.ipBlockModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );

      await this.ipBlockModel.deleteMany({ _id: ids });

      return {
        success: true,
        message: 'Success! IpBlock deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleIpBlockById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.ipBlockModel.deleteMany({ _id: ids });
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

      await this.ipBlockModel.deleteMany({ shop: shop, status: 'trash' });
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
      console.log(tenDaysAgo.toISOString().split('T')[0]);
      // Perform deletion of orders with status 'trash' and deleteDateString <= 10 days ago
      await this.ipBlockModel.deleteMany({
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

  async isIpBlocked(
    ip: string,
    shopId: string,
    phoneNo?: string,
  ): Promise<boolean> {
    const blockInfo = await this.ipBlockModel.findOne({
      userIpAddress: ip,
      shop: shopId,
      // phoneNo: phoneNo,
      blockUntil: { $gt: new Date() }, // এখনো সময় শেষ হয়নি
    });

    return !!blockInfo;
  }
  
}
