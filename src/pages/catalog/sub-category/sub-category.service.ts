import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from 'src/pages/shop/interfaces/shop.interface';
import { SubCategory } from './interfaces/sub-category.interface';
import {
  AddSubCategoryDto,
  FilterAndPaginationSubCategoryDto,
  GetSubCategoryByIdsDto,
  UpdateSubCategoryDto,
} from './dto/sub-category.dto';
import * as schedule from 'node-schedule';
import { MAX_CATEGORY_UPLOAD } from '../../../config/global-variables';
import { Product } from '../../product/interfaces/product.interface';
import { ErrorCodes } from '../../../enum/error-code.enum';
import { Category } from '../category/interfaces/category.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class SubCategoryService {
  private logger = new Logger(SubCategoryService.name);

  constructor(
    @InjectModel('SubCategory')
    private readonly subCategoryModel: Model<SubCategory>,
    @InjectModel('Category')
    private readonly categoryModel: Model<Category>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    private utilsService: UtilsService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addSubCategory()
   * getAllSubCategoryByShop()
   * getSubCategoryById()
   * getAllSubCategorys()
   * getSubCategoryBySlug()
   * getSubCategoryByIds()
   * updateSubCategoryById()
   * updateMultipleSubCategoryById()
   * updateMultipleVendorSubCategoryById()
   * deleteMultipleTrashSubCategory()
   * deleteMultipleSubCategoryByIdByVendor()
   * deleteMultipleSubCategoryById()
   */
  async addSubCategory(
    vendor: Vendor,
    shop: string,
    addSubCategoryDto: AddSubCategoryDto,
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
      const totalSubCategory = await this.subCategoryModel.countDocuments({
        shop: shop,
      });

      if (totalSubCategory && totalSubCategory > MAX_CATEGORY_UPLOAD) {
        return {
          success: false,
          message:
            'Sorry! exists your sub category upload limit with this shop.',
        } as ResponsePayload;
      }

      const finalData = {
        ...addSubCategoryDto,
        ...{
          shop: shop,
          slug: this.utilsService.transformToSlug(addSubCategoryDto.name),
        },
      };

      const saveData = await this.subCategoryModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! SubCategory added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllSubCategoryByShop(
    shop: string,
    filterSubCategoryDto: FilterAndPaginationSubCategoryDto,
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
      const { filter } = filterSubCategoryDto;
      filterSubCategoryDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllSubCategorys(filterSubCategoryDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getSubCategoryById(
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

      const data = await this.subCategoryModel
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

  async getAllSubCategorys(
    filterSubCategoryDto: FilterAndPaginationSubCategoryDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterSubCategoryDto;
    const { pagination } = filterSubCategoryDto;
    const { sort } = filterSubCategoryDto;
    const { select } = filterSubCategoryDto;
    const { filterGroup } = filterSubCategoryDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateBrandGroupStages = [];
    const aggregateSubCategoryGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['category._id']) {
        filter['category._id'] = new ObjectId(filter['category._id']);
      }

      if (filter['subCategory._id']) {
        filter['subCategory._id'] = new ObjectId(filter['subSubCategory._id']);
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
    let groupSubCategory: any;
    let groupBrand: any;
    let groupSubSubCategory: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.subCategory) {
        groupSubCategory = {
          $group: {
            _id: { subCategory: '$subCategory._id' },
            name: { $first: '$subCategory.name' },
            slug: { $first: '$subCategory.slug' },
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

      if (filterGroup.subSubCategory) {
        groupSubSubCategory = {
          $group: {
            _id: { subSubCategory: '$subSubCategory._id' },
            name: { $first: '$subSubCategory.name' },
            slug: { $first: '$subSubCategory.slug' },
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

      // SubCategory Groups
      if (groupSubCategory) {
        // aggregateSubCategoryGroupStages.push({ $match: mFilter });
        aggregateSubCategoryGroupStages.push(groupSubCategory);
      }

      // Sub SubCategory Groups
      if (groupSubCategory) {
        // aggregateSubSubCategoryGroupStages.push({ $match: mFilter });
        aggregateSubCategoryGroupStages.push(groupSubCategory);
      }

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }
    } else {
      if (groupSubCategory) {
        aggregateSubCategoryGroupStages.push(groupSubCategory);
      }
      if (groupSubCategory) {
        aggregateSubCategoryGroupStages.push(groupSubCategory);
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
      const dataAggregates = await this.subCategoryModel.aggregate(
        aggregateStages,
        { allowDiskUse: true },
      );

      // GROUP FILTER PRODUCTS DATA
      let subCategoryAggregates: any;
      let subSubCategoryAggregates: any;
      let brandAggregates: any;
      // SubCategory
      if (filterGroup && filterGroup.isGroup && filterGroup.subCategory) {
        subCategoryAggregates = await this.subCategoryModel.aggregate(
          aggregateSubCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub SubCategory
      if (filterGroup && filterGroup.isGroup && filterGroup.subCategory) {
        subCategoryAggregates = await this.subCategoryModel.aggregate(
          aggregateSubCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.subCategoryModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            subCategoryAggregates && subCategoryAggregates.length
              ? subCategoryAggregates
              : [],
          subCategories:
            subSubCategoryAggregates && subSubCategoryAggregates.length
              ? subSubCategoryAggregates
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

  async getSubCategoryBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.subCategoryModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.subCategoryModel.findByIdAndUpdate(data._id, {
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

  async getSubCategoryByIds(
    shop: string,
    getSubCategoryByIdsDto: GetSubCategoryByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getSubCategoryByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.subCategoryModel
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

  async getSubCategoriesGroupByCategory(
    shop: string,
  ): Promise<ResponsePayload> {
    const pipeline = [];

    // Step 1: Match published categories
    pipeline.push({
      $match: {
        status: 'publish',
        readOnly: { $ne: true },
        ...(shop && { shop: new Types.ObjectId(shop) }),
      },
    });

    // Step 2: Lookup subcategories
    pipeline.push({
      $lookup: {
        from: 'subcategories',
        let: { catId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$category._id', '$$catId'] },
                  { $eq: ['$status', 'publish'] },
                  ...(shop
                    ? [{ $eq: ['$shop', new Types.ObjectId(shop)] }]
                    : []),
                ],
              },
            },
          },
        ],
        as: 'subCategories',
      },
    });

    // Step 3: Sort categories by serial
    pipeline.push({
      $sort: {
        serial: -1,
      },
    });

    // Step 4: Remove subCategories if empty
    pipeline.push({
      $addFields: {
        subCategories: {
          $cond: {
            if: { $gt: [{ $size: '$subCategories' }, 0] },
            then: '$subCategories',
            else: '$$REMOVE',
          },
        },
      },
    });

    try {
      const result = await this.categoryModel.aggregate(pipeline);

      return {
        data: result,
        success: true,
        message: 'Success',
        count: result.length,
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async getSubCategoriesByCategoryId(
    shop: string,
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.subCategoryModel
        .find({ shop: shop, 'category._id': id })
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
   * updateSubCategoryById
   * updateMultipleSubCategoryById
   */
  async updateSubCategoryById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateSubCategoryDto: UpdateSubCategoryDto,
  ): Promise<ResponsePayload> {
    try {
      const { name } = updateSubCategoryDto;

      // Check vendor has access to the shop
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

      // Check if sub-category exists
      const fData = await this.subCategoryModel.findOne({
        _id: id,
        shop: shop,
      });

      if (!fData) {
        return {
          success: false,
          message: 'Sub-category not found!',
        };
      }

      // Check if name is changed
      const isNameChanged = fData.name.trim() !== name.trim();

      let finalSlug: string;

      if (isNameChanged) {
        const newSlug = this.utilsService.transformToSlug(name);

        const isExists = await this.subCategoryModel.exists({ slug: newSlug });
        if (isExists) {
          finalSlug = this.utilsService.transformToSlug(name, true);
        } else {
          finalSlug = newSlug;
        }
      } else {
        finalSlug = fData.slug;
      }

      const finalData = {
        ...updateSubCategoryDto,
        slug: finalSlug,
      };

      // Update sub-category data
      await this.subCategoryModel.findByIdAndUpdate(id, {
        $set: finalData,
      });

      // যদি নাম পরিবর্তন হয়, তাহলে product collection এ আপডেট করতে হবে
      if (isNameChanged) {
        await this.productModel.updateMany(
          {
            'subCategory._id': fData._id,
            shop: shop,
          },
          {
            $set: {
              'subCategory.name': name,
              'subCategory.slug': finalSlug,
            },
          },
        );
      }

      return {
        success: true,
        message: 'Success! Sub-category updated successfully.',
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleSubCategoryById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateSubCategoryDto: UpdateSubCategoryDto,
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
        if (updateSubCategoryDto.slug) {
          delete updateSubCategoryDto.slug;
        }
        await this.subCategoryModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateSubCategoryDto },
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

  async deleteMultipleTrashSubCategory(
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

      await this.subCategoryModel.deleteMany({ _id: ids, status: 'trash' });
      return {
        success: true,
        message: 'Success! SubCategory permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleSubCategoryByIdByVendor(
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

      // await this.subCategoryModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );

      await this.subCategoryModel.deleteMany({ _id: ids });

      return {
        success: true,
        message: 'Success! SubCategory deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleSubCategoryById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.subCategoryModel.deleteMany({ _id: ids });
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

      await this.subCategoryModel.deleteMany({ shop: shop, status: 'trash' });
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
      await this.subCategoryModel.deleteMany({
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
