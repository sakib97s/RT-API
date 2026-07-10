import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddSubscriptionDto,
  FilterAndPaginationSubscriptionDto,
  GetSubscriptionByIdsDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto';
import { Subscription } from './interfaces/subscription.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from '../shop/interfaces/shop.interface';
import { Package } from 'src/interfaces/package.interface';
import { SubscriptionReport } from './interfaces/subscription-report.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class SubscriptionService {
  private logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectModel('Subscription')
    private readonly subscriptionModel: Model<Subscription>,
    @InjectModel('SubscriptionReport')
    private readonly subscriptionReportModel: Model<SubscriptionReport>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('Package') private readonly packageModel: Model<Package>,
    private utilsService: UtilsService,
  ) {}

  /**
   * addSubscription()
   * getAllSubscriptionByShop()
   * getSubscriptionById()
   * getAllSubscriptions()
   * getSubscriptionBySlug()
   * getSubscriptionByIds()
   * updateSubscriptionById()
   * updateMultipleSubscriptionById()
   * updateMultipleVendorSubscriptionById()
   * deleteMultipleTrashSubscription()
   * deleteMultipleSubscriptionByIdByVendor()
   * deleteMultipleSubscriptionById()
   */
  async addSubscription(
    vendor: Vendor,
    addSubscriptionDto: AddSubscriptionDto,
  ): Promise<ResponsePayload> {
    try {
      const { shop, packageId } = addSubscriptionDto;

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

      const fPackage = await this.packageModel.findById(packageId);

      const defaultData = {
        package: fPackage,
        starDate: this.utilsService.getDateString(new Date()),
        endDate: this.utilsService.getDateString(new Date()),
      };

      const finalData = {
        ...addSubscriptionDto,
        ...defaultData,
      };

      const saveData = await this.subscriptionModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! Subscription added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllSubscriptionByShop(
    shop: string,
    filterSubscriptionDto: FilterAndPaginationSubscriptionDto,
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
      const { filter } = filterSubscriptionDto;
      filterSubscriptionDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllSubscriptions(filterSubscriptionDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getSubscriptionById(
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

      const data = await this.subscriptionModel
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

  async getAllSubscriptions(
    filterSubscriptionDto: FilterAndPaginationSubscriptionDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterSubscriptionDto;
    const { pagination } = filterSubscriptionDto;
    const { sort } = filterSubscriptionDto;
    const { select } = filterSubscriptionDto;
    const { filterGroup } = filterSubscriptionDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateCategoryGroupStages = [];
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
        filter['subCategory._id'] = new ObjectId(filter['subCategory._id']);
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
    let groupCategory: any;
    let groupBrand: any;
    let groupSubCategory: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.category) {
        groupCategory = {
          $group: {
            _id: { category: '$category._id' },
            name: { $first: '$category.name' },
            slug: { $first: '$category.slug' },
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

      // Category Groups
      if (groupCategory) {
        // aggregateCategoryGroupStages.push({ $match: mFilter });
        aggregateCategoryGroupStages.push(groupCategory);
      }

      // Sub Category Groups
      if (groupSubCategory) {
        // aggregateSubCategoryGroupStages.push({ $match: mFilter });
        aggregateSubCategoryGroupStages.push(groupSubCategory);
      }

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }
    } else {
      if (groupCategory) {
        aggregateCategoryGroupStages.push(groupCategory);
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
      const dataAggregates = await this.subscriptionModel.aggregate(
        aggregateStages,
        { allowDiskUse: true },
      );

      // GROUP FILTER PRODUCTS DATA
      let categoryAggregates: any;
      let subCategoryAggregates: any;
      let brandAggregates: any;
      // Category
      if (filterGroup && filterGroup.isGroup && filterGroup.category) {
        categoryAggregates = await this.subscriptionModel.aggregate(
          aggregateCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub Category
      if (filterGroup && filterGroup.isGroup && filterGroup.subCategory) {
        subCategoryAggregates = await this.subscriptionModel.aggregate(
          aggregateSubCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.subscriptionModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            categoryAggregates && categoryAggregates.length
              ? categoryAggregates
              : [],
          subCategories:
            subCategoryAggregates && subCategoryAggregates.length
              ? subCategoryAggregates
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

  async getAllSubscriptionsReport(
    filterSubscriptionDto: FilterAndPaginationSubscriptionDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter, pagination, sort, select, filterGroup } =
      filterSubscriptionDto;

    const aggregateStages = [];
    const aggregateCategoryGroupStages = [];
    const aggregateBrandGroupStages = [];
    const aggregateSubCategoryGroupStages = [];

    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    if (filter) {
      if (filter['category._id'])
        filter['category._id'] = new ObjectId(filter['category._id']);
      if (filter['subCategory._id'])
        filter['subCategory._id'] = new ObjectId(filter['subCategory._id']);
      if (filter['brand._id'])
        filter['brand._id'] = new ObjectId(filter['brand._id']);
      if (filter['tags']) filter['tags'] = new ObjectId(filter['tags']);
      if (filter['shop']) filter['shop'] = new ObjectId(filter['shop']);

      mFilter = { ...mFilter, ...filter };
    }

    if (searchQuery) {
      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { name: this.utilsService.createRegexFromString(searchQuery) },
              { phoneNo: this.utilsService.createRegexFromString(searchQuery) },
            ],
          },
        ],
      };
    }

    mSort = sort || { createdAt: -1 };
    mSelect = select || { name: 1 };

    let groupCategory: any, groupBrand: any, groupSubCategory: any;
    if (filterGroup?.isGroup) {
      if (filterGroup.category) {
        groupCategory = {
          $group: {
            _id: { category: '$category._id' },
            name: { $first: '$category.name' },
            slug: { $first: '$category.slug' },
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
    }

    aggregateStages.push(
      {
        $lookup: {
          from: 'shops',
          localField: 'shop',
          foreignField: '_id',
          as: 'shop',
          pipeline: [
            {
              $project: {
                _id: 1,
                owner: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$shop',
          preserveNullAndEmptyArrays: true,
        },
      },
      // {
      //   $lookup: {
      //     from: 'vendors',
      //     localField: 'shop.owner',
      //     foreignField: '_id',
      //     as: 'shop.owner',
      //     pipeline: [
      //       {
      //         $project: {
      //           _id: 1,
      //           name: 1,
      //           username: 1,
      //           phoneNo: 1,
      //           email: 1,
      //         },
      //       },
      //     ],
      //   },
      // },
      // {
      //   $unwind: {
      //     path: '$shop.owner',
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
    );

    if (searchQuery) {
      aggregateStages.push({
        $addFields: {
          sortBySearch: {
            $indexOfCP: ['$name', searchQuery.toLowerCase()],
          },
        },
      });
    }

    if (Object.keys(mFilter).length) {
      aggregateStages.push({ $match: mFilter });

      if (groupCategory) aggregateCategoryGroupStages.push(groupCategory);
      if (groupSubCategory)
        aggregateSubCategoryGroupStages.push(groupSubCategory);
      if (groupBrand) aggregateBrandGroupStages.push(groupBrand);
    } else {
      if (groupCategory) aggregateCategoryGroupStages.push(groupCategory);
      if (groupSubCategory)
        aggregateSubCategoryGroupStages.push(groupSubCategory);
      if (groupBrand) aggregateBrandGroupStages.push(groupBrand);
    }

    aggregateStages.push({ $sort: mSort });

    if (!pagination) {
      aggregateStages.push({ $project: mSelect });
    } else {
      mPagination = {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: pagination.pageSize * pagination.currentPage },
            { $limit: pagination.pageSize },
            { $project: mSelect },
          ],
        },
      };
      aggregateStages.push(mPagination);
      aggregateStages.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.subscriptionReportModel.aggregate(
        aggregateStages,
        {
          allowDiskUse: true,
        },
      );

      let categoryAggregates, subCategoryAggregates, brandAggregates;
      if (filterGroup?.isGroup) {
        if (filterGroup.category) {
          categoryAggregates = await this.subscriptionReportModel.aggregate(
            aggregateCategoryGroupStages,
            { allowDiskUse: true },
          );
        }
        if (filterGroup.subCategory) {
          subCategoryAggregates = await this.subscriptionReportModel.aggregate(
            aggregateSubCategoryGroupStages,
            { allowDiskUse: true },
          );
        }
        if (filterGroup.brand) {
          brandAggregates = await this.subscriptionReportModel.aggregate(
            aggregateBrandGroupStages,
            { allowDiskUse: true },
          );
        }
      }

      const allFilterGroups = filterGroup?.isGroup
        ? {
            categories: categoryAggregates || [],
            subCategories: subCategoryAggregates || [],
            brands: brandAggregates || [],
          }
        : null;

      if (pagination) {
        return {
          ...dataAggregates[0],
          success: true,
          message: 'Success',
          filterGroup: allFilterGroups,
        };
      } else {
        return {
          data: dataAggregates,
          success: true,
          message: 'Success',
          count: dataAggregates.length,
          filterGroup: allFilterGroups,
        };
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async getSubscriptionBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.subscriptionModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.subscriptionModel.findByIdAndUpdate(data._id, {
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

  async getSubscriptionByIds(
    shop: string,
    getSubscriptionByIdsDto: GetSubscriptionByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getSubscriptionByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.subscriptionModel
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
   * updateSubscriptionById
   * updateMultipleSubscriptionById
   */
  async updateSubscriptionById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
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

      await this.subscriptionModel.findByIdAndUpdate(id, {
        $set: updateSubscriptionDto,
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

  async updateMultipleSubscriptionById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateSubscriptionDto: UpdateSubscriptionDto,
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

        await this.subscriptionModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateSubscriptionDto },
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

  async deleteMultipleTrashSubscription(
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

      await this.subscriptionModel.deleteMany({ _id: ids, status: 'trash' });
      return {
        success: true,
        message: 'Success! Subscription permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleSubscriptionByIdByVendor(
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

      await this.subscriptionModel.updateMany(
        { _id: ids },
        {
          $set: {
            status: 'trash',
            deleteDateString: this.utilsService.getDateString(new Date()),
          },
        },
      );
      return {
        success: true,
        message: 'Success! Subscription deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleSubscriptionById(
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      await this.subscriptionModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleSubscriptionReportById(
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      await this.subscriptionReportModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
