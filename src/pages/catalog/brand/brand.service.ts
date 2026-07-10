import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddBrandDto,
  FilterAndPaginationBrandDto,
  GetBrandByIdsDto,
  UpdateBrandDto,
} from './dto/brand.dto';
import { Brand } from './interfaces/brand.interface';
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
export class BrandService {
  private logger = new Logger(BrandService.name);

  constructor(
    @InjectModel('Brand') private readonly brandModel: Model<Brand>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    private utilsService: UtilsService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addBrand()
   * getAllBrandByShop()
   * getBrandById()
   * getAllBrands()
   * getBrandBySlug()
   * getBrandByIds()
   * updateBrandById()
   * updateMultipleBrandById()
   * updateMultipleVendorBrandById()
   * deleteMultipleTrashBrand()
   * deleteMultipleBrandByIdByVendor()
   * deleteMultipleBrandById()
   */
  async addBrand(
    vendor: Vendor,
    shop: string,
    addBrandDto: AddBrandDto,
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

      const totalBrands = await this.brandModel.countDocuments({
        shop: shop,
      });

      if (totalBrands && totalBrands > MAX_CATEGORY_UPLOAD) {
        return {
          success: false,
          message: 'Sorry! exists your brands upload limit with this shop.',
        } as ResponsePayload;
      }

      const finalData = {
        ...addBrandDto,
        ...{
          shop: shop,
          slug: this.utilsService.transformToSlug(addBrandDto.name),
        },
      };

      const saveData = await this.brandModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! Brand added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllBrandForUi(shop: string): Promise<ResponsePayload> {
    try {
      const data = await this.brandModel
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

  async getAllBrandByShop(
    shop: string,
    filterBrandDto: FilterAndPaginationBrandDto,
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
      const { filter } = filterBrandDto;
      filterBrandDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllBrands(filterBrandDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getBrandById(
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

      const data = await this.brandModel
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

  async getAllBrands(
    filterBrandDto: FilterAndPaginationBrandDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterBrandDto;
    const { pagination } = filterBrandDto;
    const { sort } = filterBrandDto;
    const { select } = filterBrandDto;
    const { filterGroup } = filterBrandDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateBrandGroupStages = [];
    const aggregateSubBrandGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['brand._id']) {
        filter['brand._id'] = new ObjectId(filter['brand._id']);
      }

      if (filter['subBrand._id']) {
        filter['subBrand._id'] = new ObjectId(filter['subBrand._id']);
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
    let groupBrand: any;
    let groupSubBrand: any;

    if (filterGroup && filterGroup.isGroup) {
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

      if (filterGroup.subBrand) {
        groupSubBrand = {
          $group: {
            _id: { subBrand: '$subBrand._id' },
            name: { $first: '$subBrand.name' },
            slug: { $first: '$subBrand.slug' },
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

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }

      // Sub Brand Groups
      if (groupSubBrand) {
        // aggregateSubBrandGroupStages.push({ $match: mFilter });
        aggregateSubBrandGroupStages.push(groupSubBrand);
      }

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }
    } else {
      if (groupBrand) {
        aggregateBrandGroupStages.push(groupBrand);
      }
      if (groupSubBrand) {
        aggregateSubBrandGroupStages.push(groupSubBrand);
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
      const dataAggregates = await this.brandModel.aggregate(aggregateStages, {
        allowDiskUse: true,
      });

      // GROUP FILTER PRODUCTS DATA
      let brandAggregates: any;
      let subBrandAggregates: any;
      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.brandModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.subBrand) {
        subBrandAggregates = await this.brandModel.aggregate(
          aggregateSubBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.brandModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            brandAggregates && brandAggregates.length ? brandAggregates : [],
          subCategories:
            subBrandAggregates && subBrandAggregates.length
              ? subBrandAggregates
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

  async getBrandBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.brandModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.brandModel.findByIdAndUpdate(data._id, {
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

  async getBrandByIds(
    shop: string,
    getBrandByIdsDto: GetBrandByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getBrandByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.brandModel
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
   * updateBrandById
   * updateMultipleBrandById
   */
  async updateBrandById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateBrandDto: UpdateBrandDto,
  ): Promise<ResponsePayload> {
    try {
      const { name } = updateBrandDto;

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

      // Check if brand exists
      const fData = await this.brandModel.findOne({ _id: id, shop: shop });

      if (!fData) {
        return {
          success: false,
          message: 'Brand not found!',
        };
      }

      // Check if name changed
      const isNameChanged = fData.name.trim() !== name.trim();

      let finalSlug: string;

      if (isNameChanged) {
        const newSlug = this.utilsService.transformToSlug(name);

        const isExists = await this.brandModel.exists({ slug: newSlug });
        if (isExists) {
          finalSlug = this.utilsService.transformToSlug(name, true);
        } else {
          finalSlug = newSlug;
        }
      } else {
        finalSlug = fData.slug;
      }

      const finalData = {
        ...updateBrandDto,
        slug: finalSlug,
      };

      // Update brand
      await this.brandModel.findByIdAndUpdate(id, {
        $set: finalData,
      });

      // Update products if name has changed
      if (isNameChanged) {
        await this.productModel.updateMany(
          {
            'brand._id': fData._id,
            shop: shop,
          },
          {
            $set: {
              'brand.name': name,
              'brand.slug': finalSlug,
            },
          }
        );
      }

      return {
        success: true,
        message: 'Success! Brand updated successfully.',
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }


  async updateMultipleBrandById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateBrandDto: UpdateBrandDto,
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
        // if (updateBrandDto.slug) {
        //   delete updateBrandDto.slug;
        // }
        await this.brandModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateBrandDto },
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

  async deleteMultipleTrashBrand(
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

      await this.brandModel.deleteMany({ _id: ids, status: 'trash' });
      return {
        success: true,
        message: 'Success! Brand permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleBrandByIdByVendor(
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

      // await this.brandModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );

      await this.brandModel.deleteMany({ _id: ids });

      return {
        success: true,
        message: 'Success! Brand deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleBrandById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.brandModel.deleteMany({ _id: ids });
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

      await this.brandModel.deleteMany({ shop: shop, status: 'trash' });
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
      await this.brandModel.deleteMany({
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
