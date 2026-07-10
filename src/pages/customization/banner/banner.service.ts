import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddBannerDto,
  FilterAndPaginationBannerDto,
  GetBannerByIdsDto,
  UpdateBannerDto,
} from './dto/banner.dto';
import { Banner } from './interfaces/banner.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from 'src/pages/shop/interfaces/shop.interface';
import * as schedule from 'node-schedule';
import {
  MAX_BANNER_UPLOAD,
} from '../../../config/global-variables';
const ObjectId = Types.ObjectId;

@Injectable()
export class BannerService {
  private logger = new Logger(BannerService.name);

  constructor(
    @InjectModel('Banner') private readonly bannerModel: Model<Banner>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    private utilsService: UtilsService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addBanner()
   * getAllBannerByShop()
   * getBannerById()
   * getAllBanners()
   * getBannerBySlug()
   * getBannerByIds()
   * updateBannerById()
   * updateMultipleBannerById()
   * updateMultipleVendorBannerById()
   * deleteMultipleTrashBanner()
   * deleteMultipleBannerByIdByVendor()
   * deleteMultipleBannerById()
   */
  async addBanner(
    vendor: Vendor,
    shop: string,
    addBannerDto: AddBannerDto,
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

      const totalBanner = await this.bannerModel.countDocuments({
        shop: shop,
      });

      if (totalBanner && totalBanner > MAX_BANNER_UPLOAD) {
        return {
          success: false,
          message: 'Sorry! exists your banner upload limit with this shop.',
        } as ResponsePayload;
      }

      const finalData = {
        ...addBannerDto,
        ...{
          shop: shop,
        },
      };

      const saveData = await this.bannerModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! Banner added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllBannerForUi(shop: string): Promise<ResponsePayload> {
    try {
      const data = await this.bannerModel
        .find({ shop: shop, status: 'publish', type: 'home-page-top-banner' })
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

  async getAllBannerByShop(
    shop: string,
    filterBannerDto: FilterAndPaginationBannerDto,
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
      const { filter } = filterBannerDto;
      filterBannerDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllBanners(filterBannerDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getBannerById(
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

      const data = await this.bannerModel
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

  async getAllBanners(
    filterBannerDto: FilterAndPaginationBannerDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterBannerDto;
    const { pagination } = filterBannerDto;
    const { sort } = filterBannerDto;
    const { select } = filterBannerDto;
    const { filterGroup } = filterBannerDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateBannerGroupStages = [];
    const aggregateBrandGroupStages = [];
    const aggregateSubBannerGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['banner._id']) {
        filter['banner._id'] = new ObjectId(filter['banner._id']);
      }

      if (filter['subBanner._id']) {
        filter['subBanner._id'] = new ObjectId(filter['subBanner._id']);
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
    let groupBanner: any;
    let groupBrand: any;
    let groupSubBanner: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.banner) {
        groupBanner = {
          $group: {
            _id: { banner: '$banner._id' },
            name: { $first: '$banner.name' },
            slug: { $first: '$banner.slug' },
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

      if (filterGroup.subBanner) {
        groupSubBanner = {
          $group: {
            _id: { subBanner: '$subBanner._id' },
            name: { $first: '$subBanner.name' },
            slug: { $first: '$subBanner.slug' },
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

      // Banner Groups
      if (groupBanner) {
        // aggregateBannerGroupStages.push({ $match: mFilter });
        aggregateBannerGroupStages.push(groupBanner);
      }

      // Sub Banner Groups
      if (groupSubBanner) {
        // aggregateSubBannerGroupStages.push({ $match: mFilter });
        aggregateSubBannerGroupStages.push(groupSubBanner);
      }

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }
    } else {
      if (groupBanner) {
        aggregateBannerGroupStages.push(groupBanner);
      }
      if (groupSubBanner) {
        aggregateSubBannerGroupStages.push(groupSubBanner);
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
      const dataAggregates = await this.bannerModel.aggregate(aggregateStages, {
        allowDiskUse: true,
      });

      // GROUP FILTER PRODUCTS DATA
      let bannerAggregates: any;
      let subBannerAggregates: any;
      let brandAggregates: any;
      // Banner
      if (filterGroup && filterGroup.isGroup && filterGroup.banner) {
        bannerAggregates = await this.bannerModel.aggregate(
          aggregateBannerGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub Banner
      if (filterGroup && filterGroup.isGroup && filterGroup.subBanner) {
        subBannerAggregates = await this.bannerModel.aggregate(
          aggregateSubBannerGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.bannerModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            bannerAggregates && bannerAggregates.length ? bannerAggregates : [],
          subCategories:
            subBannerAggregates && subBannerAggregates.length
              ? subBannerAggregates
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

  async getBannerBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.bannerModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.bannerModel.findByIdAndUpdate(data._id, {
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

  async getBannerByIds(
    shop: string,
    getBannerByIdsDto: GetBannerByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getBannerByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.bannerModel
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
   * updateBannerById
   * updateMultipleBannerById
   */
  async updateBannerById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateBannerDto: UpdateBannerDto,
  ): Promise<ResponsePayload> {
    try {
      // const { name } = updateBannerDto;

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
      const fData = await this.bannerModel.findOne({ _id: id, shop: shop });

      // Check Slug
      // if (fData?.name.trim() !== name.trim()) {
      //   const newSlug = this.utilsService.transformToSlug(name);

      //   const isExists = await this.bannerModel.exists({ slug: newSlug });
      //   if (isExists) {
      //     finalSlug = this.utilsService.transformToSlug(name, true);
      //   } else {
      //     finalSlug = newSlug;
      //   }
      // } else {
      //   finalSlug = fData.slug;
      // }

      const finalData = {
        ...updateBannerDto,
      };

      await this.bannerModel.findByIdAndUpdate(id, {
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

  async updateMultipleBannerById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateBannerDto: UpdateBannerDto,
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
        // if (updateBannerDto.slug) {
        //   delete updateBannerDto.slug;
        // }
        await this.bannerModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateBannerDto },
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

  async deleteMultipleTrashBanner(
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

      await this.bannerModel.deleteMany({ _id: ids, status: 'trash' });
      return {
        success: true,
        message: 'Success! Banner permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleBannerByIdByVendor(
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

      // await this.bannerModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );

      await this.bannerModel.deleteMany({ _id: ids });

      return {
        success: true,
        message: 'Success! Banner deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleBannerById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.bannerModel.deleteMany({ _id: ids });
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

      await this.bannerModel.deleteMany({ shop: shop, status: 'trash' });
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
      await this.bannerModel.deleteMany({
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
