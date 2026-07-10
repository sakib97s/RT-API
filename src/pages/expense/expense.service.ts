import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddExpenseDto,
  FilterAndPaginationExpenseDto,
  GetExpenseByIdsDto,
  UpdateExpenseDto,
} from './dto/expense.dto';
import { Expense } from './interfaces/expense.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from 'src/pages/shop/interfaces/shop.interface';
import * as schedule from 'node-schedule';
import { MAX_BANNER_UPLOAD } from '../../config/global-variables';

interface ExtendedResponsePayload extends ResponsePayload {
  categorySummary?: {
    byCategory: Array<{
      _id: string;
      categoryName: string;
      totalAmount: number;
      totalCount: number;
    }>;
    grandTotal: number;
    grandCount: number;
    categoryCount: number;
  };
}

const ObjectId = Types.ObjectId;

@Injectable()
export class ExpenseService {
  private logger = new Logger(ExpenseService.name);

  constructor(
    @InjectModel('Expense') private readonly expenseModel: Model<Expense>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    private utilsService: UtilsService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addExpense()
   * getAllExpenseByShop()
   * getExpenseById()
   * getAllExpenses()
   * getExpenseBySlug()
   * getExpenseByIds()
   * updateExpenseById()
   * updateMultipleExpenseById()
   * updateMultipleVendorExpenseById()
   * deleteMultipleTrashExpense()
   * deleteMultipleExpenseByIdByVendor()
   * deleteMultipleExpenseById()
   */
  async addExpense(
    vendor: Vendor,
    shop: string,
    addExpenseDto: AddExpenseDto,
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

      const totalExpense = await this.expenseModel.countDocuments({
        shop: shop,
      });

      if (totalExpense && totalExpense > MAX_BANNER_UPLOAD) {
        return {
          success: false,
          message: 'Sorry! exists your expense upload limit with this shop.',
        } as ResponsePayload;
      }

      const finalData = {
        ...addExpenseDto,
        ...{
          shop: shop,
        },
      };

      const saveData = await this.expenseModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! Expense added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllExpenseByShop(
    shop: string,
    filterExpenseDto: FilterAndPaginationExpenseDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! no data found.',
        } as ResponsePayload;
      }

      // Debug: Log the input parameters
      console.log('Shop ID:', shop);
      console.log('Filter DTO:', JSON.stringify(filterExpenseDto, null, 2));
      console.log('Search Query:', searchQuery);

      // Modify Filter
      const { filter } = filterExpenseDto;
      filterExpenseDto.filter = { ...filter, ...{ shop: shop } };

      // Get the main expense data
      const expenseData = await this.getAllExpenses(filterExpenseDto, searchQuery);

      // Debug: Log the expense data
      console.log('Expense Data:', JSON.stringify(expenseData, null, 2));

      // Always generate category summary for better user experience
      const needsCategorySummary = expenseData.success;
      
      if (needsCategorySummary) {
        // Build match criteria for category summary
        const match: any = {
          shop: new ObjectId(shop),
          status: { $ne: 'trash' },
        };

        // Add date range filter
        if (filter.date) {
          match.date = {};
          if (filter.date.$gte) {
            match.date.$gte = new Date(filter.date.$gte);
          }
          if (filter.date.$lte) {
            match.date.$lte = new Date(filter.date.$lte);
          }
        }

        // Add category filter
        if (filter.category) {
          match['category._id'] = new ObjectId(filter.category);
        }

        // Debug: Log match criteria
        console.log('Category summary match criteria:', JSON.stringify(match, null, 2));
        
        // Get category-wise summary
        const categorySummary = await this.expenseModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$category._id',
              categoryName: { $first: '$category.name' },
              totalAmount: { $sum: '$amount' },
              totalCount: { $sum: 1 },
            },
          },
          {
            $sort: { totalAmount: -1 },
          },
        ]);
        
        console.log('Category summary result:', JSON.stringify(categorySummary, null, 2));

        // If no category summary from aggregation, create from existing data
        let finalCategorySummary = categorySummary;
        if (categorySummary.length === 0 && expenseData.data && expenseData.data.length > 0) {
          console.log('Creating category summary from existing data...');
          
          // Create category summary from the returned data
          const categoryMap = new Map();
          
          expenseData.data.forEach((expense: any) => {
            if (expense.category && expense.category._id) {
              const categoryId = expense.category._id.toString();
              const categoryName = expense.category.name;
              
              if (categoryMap.has(categoryId)) {
                const existing = categoryMap.get(categoryId);
                existing.totalAmount += expense.amount;
                existing.totalCount += 1;
              } else {
                categoryMap.set(categoryId, {
                  _id: expense.category._id,
                  categoryName: categoryName,
                  totalAmount: expense.amount,
                  totalCount: 1
                });
              }
            }
          });
          
          finalCategorySummary = Array.from(categoryMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
          console.log('Created category summary from data:', JSON.stringify(finalCategorySummary, null, 2));
        }

        // Calculate grand totals
        const grandTotal = finalCategorySummary.reduce(
          (sum, category) => sum + category.totalAmount,
          0,
        );
        const grandCount = finalCategorySummary.reduce(
          (sum, category) => sum + category.totalCount,
          0,
        );

        // Add category summary to response
        (expenseData as ExtendedResponsePayload).categorySummary = {
          byCategory: finalCategorySummary,
          grandTotal,
          grandCount,
          categoryCount: finalCategorySummary.length,
        };
      }

      return expenseData;
    } catch (error) {
      console.log('Error in getAllExpenseByShop:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getExpenseById(
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

      const data = await this.expenseModel
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

  async getAllExpenses(
    filterExpenseDto: FilterAndPaginationExpenseDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterExpenseDto;
    const { pagination } = filterExpenseDto;
    const { sort } = filterExpenseDto;
    const { select } = filterExpenseDto;
    const { filterGroup } = filterExpenseDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateExpenseGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['expense._id']) {
        filter['expense._id'] = new ObjectId(filter['expense._id']);
      }

      if (filter['shop']) {
        filter['shop'] = new ObjectId(filter['shop']);
      }

      // Handle date range filtering
      if (filter['date']) {
        console.log('Original date filter:', filter['date']);
        const dateFilter: any = {};
        
        if (filter['date']['$gte']) {
          const fromDate = new Date(filter['date']['$gte']);
          // Set time to start of day
          fromDate.setHours(0, 0, 0, 0);
          dateFilter['$gte'] = fromDate;
          console.log('From date:', fromDate);
        }
        
        if (filter['date']['$lte']) {
          const toDate = new Date(filter['date']['$lte']);
          // Set time to end of day
          toDate.setHours(23, 59, 59, 999);
          dateFilter['$lte'] = toDate;
          console.log('To date:', toDate);
        }
        
        if (Object.keys(dateFilter).length > 0) {
          filter['date'] = dateFilter;
          console.log('Final date filter:', filter['date']);
        }
      }

      // Handle category filtering
      if (filter['category']) {
        filter['category._id'] = new ObjectId(filter['category']);
        delete filter['category'];
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
              { description: this.utilsService.createRegexFromString(searchQuery) },
              { 'category.name': this.utilsService.createRegexFromString(searchQuery) },
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
      mSelect = { 
        _id: 1,
        shop: 1,
        category: 1,
        date: 1,
        amount: 1,
        invoices: 1,
        description: 1,
        images: 1,
        priority: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1
      };
    }

    // GROUPING FOR FILTER PRODUCTS
    let groupExpense: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.expense) {
        groupExpense = {
          $group: {
            _id: { expense: '$expense._id' },
            name: { $first: '$expense.name' },
            slug: { $first: '$expense.slug' },
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

      // Expense Groups
      if (groupExpense) {
        // aggregateExpenseGroupStages.push({ $match: mFilter });
        aggregateExpenseGroupStages.push(groupExpense);
      }
    } else {
      if (groupExpense) {
        aggregateExpenseGroupStages.push(groupExpense);
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
      const dataAggregates = await this.expenseModel.aggregate(
        aggregateStages,
        {
          allowDiskUse: true,
        },
      );

      // GROUP FILTER PRODUCTS DATA
      let expenseAggregates: any;
      // Expense
      if (filterGroup && filterGroup.isGroup && filterGroup.expense) {
        expenseAggregates = await this.expenseModel.aggregate(
          aggregateExpenseGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            expenseAggregates && expenseAggregates.length
              ? expenseAggregates
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

  async getExpenseBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.expenseModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.expenseModel.findByIdAndUpdate(data._id, {
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

  async getExpenseByIds(
    shop: string,
    getExpenseByIdsDto: GetExpenseByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getExpenseByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.expenseModel
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
   * updateExpenseById
   * updateMultipleExpenseById
   */
  async updateExpenseById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<ResponsePayload> {
    try {
      // const { name } = updateExpenseDto;

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
      const fData = await this.expenseModel.findOne({ _id: id, shop: shop });

      // Check Slug
      // if (fData?.name.trim() !== name.trim()) {
      //   const newSlug = this.utilsService.transformToSlug(name);

      //   const isExists = await this.expenseModel.exists({ slug: newSlug });
      //   if (isExists) {
      //     finalSlug = this.utilsService.transformToSlug(name, true);
      //   } else {
      //     finalSlug = newSlug;
      //   }
      // } else {
      //   finalSlug = fData.slug;
      // }

      const finalData = {
        ...updateExpenseDto,
      };

      await this.expenseModel.findByIdAndUpdate(id, {
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

  async updateMultipleExpenseById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateExpenseDto: UpdateExpenseDto,
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
        // if (updateExpenseDto.slug) {
        //   delete updateExpenseDto.slug;
        // }
        await this.expenseModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateExpenseDto },
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

  async deleteMultipleTrashExpense(
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

      await this.expenseModel.deleteMany({ _id: ids, status: 'trash' });
      return {
        success: true,
        message: 'Success! Expense permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleExpenseByIdByVendor(
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

      // await this.expenseModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );

      await this.expenseModel.deleteMany({ _id: ids });

      return {
        success: true,
        message: 'Success! Expense deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleExpenseById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.expenseModel.deleteMany({ _id: ids });
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

      await this.expenseModel.deleteMany({ shop: shop, status: 'trash' });
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
      await this.expenseModel.deleteMany({
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

  // NestJS ExpenseService (server-side)

  async summaryByCategory(filter: {
    from?: string;
    to?: string;
    category?: string;
  }) {
    const match: any = { status: { $ne: 'trash' } };

    if (filter?.category && filter.category !== 'all') {
      match.category = filter.category;
    }
    if (filter?.from || filter?.to) {
      match.date = {};
      if (filter.from) match.date.$gte = new Date(filter.from);
      if (filter.to) match.date.$lte = new Date(filter.to);
    }

    const rows = await this.expenseModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const grand = rows.reduce(
      (a, c) => ({ total: a.total + c.total, count: a.count + c.count }),
      { total: 0, count: 0 },
    );

    return { byCategory: rows, grand };
  }
  // NestJS ExpenseService (server-side)

  async report(filter: {
    from?: string;
    to?: string;
    period?: 'weekly' | 'monthly' | 'yearly';
  }) {
    const unit =
      filter?.period === 'weekly'
        ? 'week'
        : filter?.period === 'yearly'
          ? 'year'
          : 'month';

    const match: any = { status: { $ne: 'trash' } };
    if (filter?.from || filter?.to) {
      match.date = {};
      if (filter.from) match.date.$gte = new Date(filter.from);
      if (filter.to) match.date.$lte = new Date(filter.to);
    }

    return this.expenseModel.aggregate([
      { $match: match },
      { $addFields: { periodStart: { $dateTrunc: { date: '$date', unit } } } },
      {
        $group: {
          _id: { periodStart: '$periodStart', category: '$category' },
          total: { $sum: '$amount' },
          items: {
            $push: {
              _id: '$_id',
              date: '$date',
              category: '$category',
              description: '$title', // যদি description আলাদা ফিল্ড থাকে, এখানে সেটি দিন
              amount: '$amount',
              invoices: '$invoices',
            },
          },
        },
      },
      {
        $group: {
          _id: '$_id.periodStart',
          categories: {
            $push: {
              category: '$_id.category',
              total: '$total',
              items: '$items',
            },
          },
          periodTotal: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  /**
   * Alternative method for date range filtering using direct MongoDB query
   */
  async getExpensesByDateRange(
    shop: string,
    fromDate: string,
    toDate: string,
  ): Promise<ResponsePayload> {
    try {
      console.log('Direct date range query:', { shop, fromDate, toDate });
      
      // Convert string dates to Date objects
      const startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      
      console.log('Converted dates:', { startDate, endDate });
      
      // Direct MongoDB query
      const expenses = await this.expenseModel.find({
        shop: new ObjectId(shop),
        status: { $ne: 'trash' },
        date: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .sort({ createdAt: -1 })
      .limit(50);
      
      console.log('Found expenses:', expenses.length);
      
      // Get category summary
      const categorySummary = await this.expenseModel.aggregate([
        {
          $match: {
            shop: new ObjectId(shop),
            status: { $ne: 'trash' },
            date: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: '$category._id',
            categoryName: { $first: '$category.name' },
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 },
          },
        },
        {
          $sort: { totalAmount: -1 },
        },
      ]);
      
      // Calculate grand totals
      const grandTotal = categorySummary.reduce(
        (sum, category) => sum + category.totalAmount,
        0,
      );
      const grandCount = categorySummary.reduce(
        (sum, category) => sum + category.totalCount,
        0,
      );
      
      return {
        success: true,
        message: 'Date range data fetched successfully.',
        data: expenses,
        count: expenses.length,
        categorySummary: {
          byCategory: categorySummary,
          grandTotal,
          grandCount,
          categoryCount: categorySummary.length,
        },
      } as ResponsePayload;
    } catch (error) {
      console.log('Error in getExpensesByDateRange:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * Get expense dashboard with category-wise calculations
   * @param shop Shop ID
   * @param filter Filter object with date range and other filters
   * @returns Dashboard data with category-wise spending
   */
  async getExpenseDashboard(
    shop: string,
    filter: {
      from?: string;
      to?: string;
      category?: string;
    } = {},
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! Shop ID is required.',
        } as ResponsePayload;
      }

      // Build match criteria
      const match: any = {
        shop: new ObjectId(shop),
        status: { $ne: 'trash' },
      };

      // Add date range filter
      if (filter.from || filter.to) {
        match.date = {};
        if (filter.from) {
          match.date.$gte = new Date(filter.from);
        }
        if (filter.to) {
          match.date.$lte = new Date(filter.to);
        }
      }

      // Add category filter
      if (filter.category && filter.category !== 'all') {
        match['category._id'] = new ObjectId(filter.category);
      }

      // Aggregate pipeline for category-wise calculations
      const categoryWiseData = await this.expenseModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$category._id',
            categoryName: { $first: '$category.name' },
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 },
            expenses: {
              $push: {
                _id: '$_id',
                date: '$date',
                amount: '$amount',
                description: '$description',
                invoices: '$invoices',
                images: '$images',
                priority: '$priority',
                status: '$status',
                createdAt: '$createdAt',
                updatedAt: '$updatedAt',
              },
            },
          },
        },
        {
          $sort: { totalAmount: -1 },
        },
      ]);

      // Calculate grand totals
      const grandTotal = categoryWiseData.reduce(
        (sum, category) => sum + category.totalAmount,
        0,
      );
      const grandCount = categoryWiseData.reduce(
        (sum, category) => sum + category.totalCount,
        0,
      );

      // Get recent expenses for the dashboard
      const recentExpenses = await this.expenseModel
        .find(match)
        .sort({ createdAt: -1 })
        .limit(10)
        .select('_id date amount description category status createdAt');

      // Get monthly trend data
      const monthlyTrend = await this.expenseModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 },
          },
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 },
        },
        {
          $limit: 12, // Last 12 months
        },
      ]);

      const dashboardData = {
        summary: {
          totalAmount: grandTotal,
          totalCount: grandCount,
          categoryCount: categoryWiseData.length,
        },
        categoryWiseData,
        recentExpenses,
        monthlyTrend,
        filter: {
          from: filter.from,
          to: filter.to,
          category: filter.category,
        },
      };

      return {
        success: true,
        message: 'Expense dashboard data fetched successfully.',
        data: dashboardData,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
