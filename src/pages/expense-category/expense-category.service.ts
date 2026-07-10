import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddExpenseCategoryDto,
  FilterAndPaginationExpenseCategoryDto,
  GetExpenseCategoryByIdsDto,
  UpdateExpenseCategoryDto,
} from './dto/expense-category.dto';
import { ExpenseCategory } from './interfaces/expense-category.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from 'src/pages/shop/interfaces/shop.interface';
import * as schedule from 'node-schedule';
import { MAX_BANNER_UPLOAD } from '../../config/global-variables';

const ObjectId = Types.ObjectId;

@Injectable()
export class ExpenseCategoryService {
  private logger = new Logger(ExpenseCategoryService.name);

  constructor(
    @InjectModel('ExpenseCategory')
    private readonly expenseCategoryModel: Model<ExpenseCategory>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    private utilsService: UtilsService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addExpenseCategory()
   * getAllExpenseCategoryByShop()
   * getExpenseCategoryById()
   * getAllExpenseCategorys()
   * getExpenseCategoryBySlug()
   * getExpenseCategoryByIds()
   * updateExpenseCategoryById()
   * updateMultipleExpenseCategoryById()
   * updateMultipleVendorExpenseCategoryById()
   * deleteMultipleTrashExpenseCategory()
   * deleteMultipleExpenseCategoryByIdByVendor()
   * deleteMultipleExpenseCategoryById()
   */
  async addExpenseCategory(
    vendor: Vendor,
    shop: string,
    addExpenseCategoryDto: AddExpenseCategoryDto,
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

      const totalExpenseCategory =
        await this.expenseCategoryModel.countDocuments({
          shop: shop,
        });

      if (totalExpenseCategory && totalExpenseCategory > MAX_BANNER_UPLOAD) {
        return {
          success: false,
          message:
            'Sorry! exists your expenseCategory upload limit with this shop.',
        } as ResponsePayload;
      }

      const finalData = {
        ...addExpenseCategoryDto,
        ...{
          shop: shop,
        },
      };

      const saveData = await this.expenseCategoryModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! ExpenseCategory added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllExpenseCategoryByShop(
    shop: string,
    filterExpenseCategoryDto: FilterAndPaginationExpenseCategoryDto,
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
      const { filter } = filterExpenseCategoryDto;
      filterExpenseCategoryDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllExpenseCategorys(filterExpenseCategoryDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getExpenseCategoryById(
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

      const data = await this.expenseCategoryModel
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

  async getAllExpenseCategorys(
    filterExpenseCategoryDto: FilterAndPaginationExpenseCategoryDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterExpenseCategoryDto;
    const { pagination } = filterExpenseCategoryDto;
    const { sort } = filterExpenseCategoryDto;
    const { select } = filterExpenseCategoryDto;
    const { filterGroup } = filterExpenseCategoryDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateExpenseCategoryGroupStages = [];
    const aggregateBrandGroupStages = [];
    const aggregateSubExpenseCategoryGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['expenseCategory._id']) {
        filter['expenseCategory._id'] = new ObjectId(
          filter['expenseCategory._id'],
        );
      }

      if (filter['subExpenseCategory._id']) {
        filter['subExpenseCategory._id'] = new ObjectId(
          filter['subExpenseCategory._id'],
        );
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
    let groupExpenseCategory: any;
    let groupBrand: any;
    let groupSubExpenseCategory: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.expenseCategory) {
        groupExpenseCategory = {
          $group: {
            _id: { expenseCategory: '$expenseCategory._id' },
            name: { $first: '$expenseCategory.name' },
            slug: { $first: '$expenseCategory.slug' },
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

      if (filterGroup.subExpenseCategory) {
        groupSubExpenseCategory = {
          $group: {
            _id: { subExpenseCategory: '$subExpenseCategory._id' },
            name: { $first: '$subExpenseCategory.name' },
            slug: { $first: '$subExpenseCategory.slug' },
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

      // ExpenseCategory Groups
      if (groupExpenseCategory) {
        // aggregateExpenseCategoryGroupStages.push({ $match: mFilter });
        aggregateExpenseCategoryGroupStages.push(groupExpenseCategory);
      }

      // Sub ExpenseCategory Groups
      if (groupSubExpenseCategory) {
        // aggregateSubExpenseCategoryGroupStages.push({ $match: mFilter });
        aggregateSubExpenseCategoryGroupStages.push(groupSubExpenseCategory);
      }

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }
    } else {
      if (groupExpenseCategory) {
        aggregateExpenseCategoryGroupStages.push(groupExpenseCategory);
      }
      if (groupSubExpenseCategory) {
        aggregateSubExpenseCategoryGroupStages.push(groupSubExpenseCategory);
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
      const dataAggregates = await this.expenseCategoryModel.aggregate(
        aggregateStages,
        {
          allowDiskUse: true,
        },
      );

      // GROUP FILTER PRODUCTS DATA
      let expenseCategoryAggregates: any;
      let subExpenseCategoryAggregates: any;
      let brandAggregates: any;
      // ExpenseCategory
      if (filterGroup && filterGroup.isGroup && filterGroup.expenseCategory) {
        expenseCategoryAggregates = await this.expenseCategoryModel.aggregate(
          aggregateExpenseCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub ExpenseCategory
      if (
        filterGroup &&
        filterGroup.isGroup &&
        filterGroup.subExpenseCategory
      ) {
        subExpenseCategoryAggregates =
          await this.expenseCategoryModel.aggregate(
            aggregateSubExpenseCategoryGroupStages,
            { allowDiskUse: true },
          );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.expenseCategoryModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            expenseCategoryAggregates && expenseCategoryAggregates.length
              ? expenseCategoryAggregates
              : [],
          subCategories:
            subExpenseCategoryAggregates && subExpenseCategoryAggregates.length
              ? subExpenseCategoryAggregates
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

  async getExpenseCategoryBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.expenseCategoryModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.expenseCategoryModel.findByIdAndUpdate(data._id, {
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

  async getExpenseCategoryByIds(
    shop: string,
    getExpenseCategoryByIdsDto: GetExpenseCategoryByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getExpenseCategoryByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.expenseCategoryModel
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
   * updateExpenseCategoryById
   * updateMultipleExpenseCategoryById
   */
  async updateExpenseCategoryById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateExpenseCategoryDto: UpdateExpenseCategoryDto,
  ): Promise<ResponsePayload> {
    try {
      // const { name } = updateExpenseCategoryDto;

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
      const fData = await this.expenseCategoryModel.findOne({
        _id: id,
        shop: shop,
      });

      // Check Slug
      // if (fData?.name.trim() !== name.trim()) {
      //   const newSlug = this.utilsService.transformToSlug(name);

      //   const isExists = await this.expenseCategoryModel.exists({ slug: newSlug });
      //   if (isExists) {
      //     finalSlug = this.utilsService.transformToSlug(name, true);
      //   } else {
      //     finalSlug = newSlug;
      //   }
      // } else {
      //   finalSlug = fData.slug;
      // }

      const finalData = {
        ...updateExpenseCategoryDto,
      };

      await this.expenseCategoryModel.findByIdAndUpdate(id, {
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

  async updateMultipleExpenseCategoryById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateExpenseCategoryDto: UpdateExpenseCategoryDto,
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
        // if (updateExpenseCategoryDto.slug) {
        //   delete updateExpenseCategoryDto.slug;
        // }
        await this.expenseCategoryModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateExpenseCategoryDto },
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

  async deleteMultipleTrashExpenseCategory(
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

      await this.expenseCategoryModel.deleteMany({ _id: ids, status: 'trash' });
      return {
        success: true,
        message: 'Success! ExpenseCategory permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleExpenseCategoryByIdByVendor(
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

      // await this.expenseCategoryModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );

      await this.expenseCategoryModel.deleteMany({ _id: ids });

      return {
        success: true,
        message: 'Success! ExpenseCategory deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleExpenseCategoryById(
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      await this.expenseCategoryModel.deleteMany({ _id: ids });
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

      await this.expenseCategoryModel.deleteMany({
        shop: shop,
        status: 'trash',
      });
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
      await this.expenseCategoryModel.deleteMany({
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
