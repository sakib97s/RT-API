import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddChildCategoryDto,
  FilterAndPaginationChildCategoryDto,
  GetChildCategoryByIdsDto,
  UpdateChildCategoryDto,
} from './dto/child-category.dto';
import { ChildCategory } from './interfaces/child-category.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from 'src/pages/shop/interfaces/shop.interface';
import * as schedule from 'node-schedule';
import { MAX_CATEGORY_UPLOAD } from '../../../config/global-variables';
import { ErrorCodes } from '../../../enum/error-code.enum';
import { SubCategory } from '../sub-category/interfaces/sub-category.interface';
import { Product } from '../../product/interfaces/product.interface';
import { Category } from '../category/interfaces/category.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class ChildCategoryService {
  private logger = new Logger(ChildCategoryService.name);

  constructor(
    @InjectModel('ChildCategory')
    private readonly childCategoryModel: Model<ChildCategory>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('SubCategory')
    private readonly subCategoryModel: Model<SubCategory>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    @InjectModel('Category')
    private readonly categoryModel: Model<Category>,
    private utilsService: UtilsService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addChildCategory()
   * getAllChildCategoryByShop()
   * getChildCategoryById()
   * getAllChildCategorys()
   * getChildCategoryBySlug()
   * getChildCategoryByIds()
   * updateChildCategoryById()
   * updateMultipleChildCategoryById()
   * updateMultipleVendorChildCategoryById()
   * deleteMultipleTrashChildCategory()
   * deleteMultipleChildCategoryByIdByVendor()
   * deleteMultipleChildCategoryById()
   */
  async addChildCategory(
    vendor: Vendor,
    shop: string,
    addChildCategoryDto: AddChildCategoryDto,
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

      const totalChildCategory = await this.childCategoryModel.countDocuments({
        shop: shop,
      });

      if (
        totalChildCategory &&
        totalChildCategory > MAX_CATEGORY_UPLOAD
      ) {
        return {
          success: false,
          message:
            'Sorry! exists your child category upload limit with this shop.',
        } as ResponsePayload;
      }

      const finalData = {
        ...addChildCategoryDto,
        ...{
          shop: shop,
          slug: this.utilsService.transformToSlug(
            addChildCategoryDto.name,
            true,
          ),
        },
      };

      const saveData = await this.childCategoryModel.create(finalData);
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
  async getAllChildCategoryByShop(
    shop: string,
    filterChildCategoryDto: FilterAndPaginationChildCategoryDto,
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
      const { filter } = filterChildCategoryDto;
      filterChildCategoryDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllChildCategorys(filterChildCategoryDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getChildCategoryById(
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

      const data = await this.childCategoryModel
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

  async getAllChildCategorys(
    filterChildCategoryDto: FilterAndPaginationChildCategoryDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterChildCategoryDto;
    const { pagination } = filterChildCategoryDto;
    const { sort } = filterChildCategoryDto;
    const { select } = filterChildCategoryDto;
    const { filterGroup } = filterChildCategoryDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateChildCategoryGroupStages = [];
    const aggregateBrandGroupStages = [];
    const aggregateChildChildCategoryGroupStages = [];

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
    let groupChildCategory: any;
    let groupBrand: any;
    let groupChildChildCategory: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.childCategory) {
        groupChildCategory = {
          $group: {
            _id: { childCategory: '$childCategory._id' },
            name: { $first: '$childCategory.name' },
            slug: { $first: '$childCategory.slug' },
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

      if (filterGroup.childChildCategory) {
        groupChildChildCategory = {
          $group: {
            _id: { childChildCategory: '$childChildCategory._id' },
            name: { $first: '$childChildCategory.name' },
            slug: { $first: '$childChildCategory.slug' },
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

      // ChildCategory Groups
      if (groupChildCategory) {
        // aggregateChildCategoryGroupStages.push({ $match: mFilter });
        aggregateChildCategoryGroupStages.push(groupChildCategory);
      }

      // Child ChildCategory Groups
      if (groupChildChildCategory) {
        // aggregateChildChildCategoryGroupStages.push({ $match: mFilter });
        aggregateChildChildCategoryGroupStages.push(groupChildChildCategory);
      }

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }
    } else {
      if (groupChildCategory) {
        aggregateChildCategoryGroupStages.push(groupChildCategory);
      }
      if (groupChildChildCategory) {
        aggregateChildChildCategoryGroupStages.push(groupChildChildCategory);
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
      const dataAggregates = await this.childCategoryModel.aggregate(
        aggregateStages,
        { allowDiskUse: true },
      );

      // GROUP FILTER PRODUCTS DATA
      let childCategoryAggregates: any;
      let childChildCategoryAggregates: any;
      let brandAggregates: any;
      // ChildCategory
      if (filterGroup && filterGroup.isGroup && filterGroup.childCategory) {
        childCategoryAggregates = await this.childCategoryModel.aggregate(
          aggregateChildCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Child ChildCategory
      if (
        filterGroup &&
        filterGroup.isGroup &&
        filterGroup.childChildCategory
      ) {
        childChildCategoryAggregates = await this.childCategoryModel.aggregate(
          aggregateChildChildCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.childCategoryModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            childCategoryAggregates && childCategoryAggregates.length
              ? childCategoryAggregates
              : [],
          childCategories:
            childChildCategoryAggregates && childChildCategoryAggregates.length
              ? childChildCategoryAggregates
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

  async getChildCategoryBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.childCategoryModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.childCategoryModel.findByIdAndUpdate(data._id, {
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

  async getChildCategoriesGroupByCategory(
    shop: string,
  ): Promise<ResponsePayload> {
    // Essential Variables
    const aggregateStages = [];

    // Step 1: Filter published subcategories
    aggregateStages.push({
      $match: { status: 'publish', shop: shop },
    });

    // Step 2: Lookup category details
    aggregateStages.push({
      $lookup: {
        from: 'categories',
        localField: 'category._id',
        foreignField: '_id',
        as: 'category',
      },
    });

    // Step 3: Unwind category array (if empty, remove it)
    aggregateStages.push({
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: false,
      },
    });

    // Step 4: Lookup child categories for each subcategory
    aggregateStages.push({
      $lookup: {
        from: 'childcategories',
        localField: '_id', // subCategory ID
        foreignField: 'subCategory._id',
        as: 'childCategories',
      },
    });

    // Step 5: Group subcategories under their category
    aggregateStages.push({
      $group: {
        _id: '$category._id',
        name: { $first: '$category.name' },
        image: { $first: '$category.image' },
        slug: { $first: '$category.slug' },
        serial: { $first: '$category.serial' },
        status: { $first: '$category.status' },
        subCategories: {
          $push: {
            _id: '$_id',
            name: '$name',
            slug: '$slug',
            image: '$image',
            priority: '$priority',
            status: '$status',
            childCategories: '$childCategories',
          },
        },
      },
    });

    // Step 6: Sort Subcategories by priority
    aggregateStages.push({
      $sort: { 'subCategories.priority': 1 },
    });

    // console.log('aggregateStages', JSON.stringify(aggregateStages, null, 2));

    try {
      const dataAggregates =
        await this.subCategoryModel.aggregate(aggregateStages);
      console.log('dataAggregates', JSON.stringify(dataAggregates, null, 2));

      return {
        data: dataAggregates,
        success: true,
        message: 'Success',
        count: dataAggregates.length,
      } as ResponsePayload;
    } catch (err) {
      this.logger.error(err);
      if (err.code && err.code.toString() === ErrorCodes.PROJECTION_MISMATCH) {
        throw new BadRequestException('Error! Projection mismatch');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  // async getSubCategoriesGroupByCategory(
  //   shop: string,
  // ): Promise<ResponsePayload> {
  //   try {
  //     const result = await this.categoryModel.aggregate([
  //       {
  //         $match: { status: 'publish', shop: new Types.ObjectId(shop) },
  //       },
  //       {
  //         $lookup: {
  //           from: 'subcategories',
  //           localField: '_id',
  //           foreignField: 'category._id',
  //           as: 'subCategories',
  //         },
  //       },
  //       {
  //         $unwind: {
  //           path: '$subCategories',
  //           preserveNullAndEmptyArrays: true,
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: 'childcategories',
  //           localField: 'subCategories._id',
  //           foreignField: 'subCategory._id',
  //           as: 'subCategories.childCategories',
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: '$_id',
  //           name: { $first: '$name' },
  //           slug: { $first: '$slug' },
  //           priority: { $first: '$priority' },
  //           createdAt: { $first: '$createdAt' },
  //           status: { $first: '$status' },
  //           subCategories: {
  //             $push: {
  //               _id: '$subCategories._id',
  //               name: '$subCategories.name',
  //               slug: '$subCategories.slug',
  //               priority: '$subCategories.priority',
  //               createdAt: '$subCategories.createdAt',
  //               description: '$subCategories.description',
  //               status: '$subCategories.status',
  //               childCategories: '$subCategories.childCategories',
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $project: {
  //           _id: 1,
  //           name: 1,
  //           slug: 1,
  //           priority: 1,
  //           createdAt: 1,
  //           status: 1,
  //           subCategories: 1,
  //         },
  //       },
  //     ]);
  //
  //     // ✅ Filter and sort by priority → createdAt
  //     const cleanedResult = result
  //       .map((category) => {
  //         const filteredSubCategories = (category.subCategories || [])
  //           .filter((subCat) => subCat && subCat._id)
  //           .sort((a, b) => {
  //             const aPriority = a.priority ?? null;
  //             const bPriority = b.priority ?? null;
  //
  //             if (aPriority !== null && bPriority !== null) {
  //               return aPriority - bPriority;
  //             } else if (aPriority !== null) {
  //               return -1;
  //             } else if (bPriority !== null) {
  //               return 1;
  //             } else {
  //               // fallback to createdAt
  //               return (
  //                 new Date(a.createdAt).getTime() -
  //                 new Date(b.createdAt).getTime()
  //               );
  //             }
  //           })
  //           .map((subCat) => ({
  //             ...subCat,
  //             childCategories:
  //               (subCat.childCategories || []).length > 0
  //                 ? subCat.childCategories
  //                 : undefined,
  //           }));
  //
  //         return {
  //           ...category,
  //           subCategories: filteredSubCategories,
  //         };
  //       })
  //       .sort((a, b) => {
  //         const aPriority = a.priority ?? null;
  //         const bPriority = b.priority ?? null;
  //
  //         if (aPriority !== null && bPriority !== null) {
  //           return aPriority - bPriority;
  //         } else if (aPriority !== null) {
  //           return -1;
  //         } else if (bPriority !== null) {
  //           return 1;
  //         } else {
  //           // fallback to createdAt
  //           return (
  //             new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  //           );
  //         }
  //       });
  //
  //     return {
  //       success: true,
  //       message: 'Success',
  //       count: cleanedResult.length,
  //       data: cleanedResult,
  //     } as ResponsePayload;
  //   } catch (err) {
  //     this.logger.error(err);
  //     throw new InternalServerErrorException('Aggregation Failed');
  //   }
  // }

  async getCategoriesInRequiredFormat(shop: string): Promise<ResponsePayload> {
    try {
      const shopId = new Types.ObjectId(shop);

      const result = await this.categoryModel.aggregate([
        // 1) Filter categories
        {
          $match: {
            status: 'publish',
            shop: shopId,
          },
        },

        // 2) Lookup subcategories via pipeline
        {
          $lookup: {
            from: 'subcategories',
            let: { categoryId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$category._id', '$$categoryId'] },
                      { $eq: ['$status', 'publish'] },
                    ],
                  },
                },
              },
              // Sort subcategories (example ordering looks chronological)
              { $sort: { createdAt: 1 } },

              // For each subcategory, lookup childcategories
              {
                $lookup: {
                  from: 'childcategories',
                  let: { subId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$subCategory._id', '$$subId'] },
                            { $eq: ['$status', 'publish'] },
                          ],
                        },
                      },
                    },
                    { $sort: { createdAt: 1 } },
                    {
                      $project: {
                        _id: 1,
                        shop: 1,
                        name: 1,
                        slug: 1,
                        images: 1,
                        status: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        // shape nested category & subCategory (only _id,name,slug)
                        category: {
                          _id: '$category._id',
                          name: '$category.name',
                          slug: '$category.slug',
                        },
                        subCategory: {
                          _id: '$subCategory._id',
                          name: '$subCategory.name',
                          slug: '$subCategory.slug',
                        },
                      },
                    },
                  ],
                  as: 'childCategories',
                },
              },

              // Shape subcategory to required fields; conditionally include childCategories
              {
                $project: {
                  _id: 1,
                  name: 1,
                  slug: 1,
                  createdAt: 1,
                  status: 1,
                  childCategories: {
                    $cond: [
                      { $gt: [{ $size: '$childCategories' }, 0] },
                      '$childCategories',
                      '$$REMOVE', // omit field when empty
                    ],
                  },
                },
              },
            ],
            as: 'subCategories',
          },
        },

        // 3) Deterministic category order
        {
          $addFields: {
            _catSortPriority: { $ifNull: ['$priority', -1] }, // nulls last for DESC
          },
        },
        { $sort: { _catSortPriority: -1, createdAt: -1 } },

        // 4) Final projection (inclusion-only)
        {
          $project: {
            _id: 1,
            name: 1,
            slug: 1,
            priority: 1,
            createdAt: 1,
            status: 1,
            subCategories: 1,
          },
        },
      ]);

      return {
        success: true,
        message: 'Success',
        count: result.length,
        data: result,
      };
    } catch (err) {
      this.logger?.error?.(err);
      throw new InternalServerErrorException('Aggregation Failed');
    }
  }

  async getChildCategoriesBySubCategoryId(
    id: string,
    select: string,
    shop?: string,
  ): Promise<ResponsePayload> {
    try {
      const query: any = { 'subCategory._id': id };
      if (shop) {
        query.shop = shop;
      }

      const data = await this.childCategoryModel.find(query).select(select);

      return {
        success: true,
        message: 'Child categories retrieved successfully',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getChildCategoryByIds(
    shop: string,
    getChildCategoryByIdsDto: GetChildCategoryByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getChildCategoryByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.childCategoryModel
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
   * updateChildCategoryById
   * updateMultipleChildCategoryById
   */
  async updateChildCategoryById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateChildCategoryDto: UpdateChildCategoryDto,
  ): Promise<ResponsePayload> {
    try {
      const { name } = updateChildCategoryDto;

      // Check vendor's access to the shop
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

      // Check if child category exists
      const fData = await this.childCategoryModel.findOne({
        _id: id,
        shop: shop,
      });

      if (!fData) {
        return {
          success: false,
          message: 'Child category not found!',
        };
      }

      // Check if name is changed
      const isNameChanged = fData.name.trim() !== name.trim();

      let finalSlug: string;

      if (isNameChanged) {
        const newSlug = this.utilsService.transformToSlug(name);

        const isExists = await this.childCategoryModel.exists({
          slug: newSlug,
        });

        if (isExists) {
          finalSlug = this.utilsService.transformToSlug(name, true);
        } else {
          finalSlug = newSlug;
        }
      } else {
        finalSlug = fData.slug;
      }

      const finalData = {
        ...updateChildCategoryDto,
        slug: finalSlug,
      };

      // Update the child category
      await this.childCategoryModel.findByIdAndUpdate(id, {
        $set: finalData,
      });

      // যদি নাম পরিবর্তন হয়, তাহলে প্রোডাক্ট কালেকশনে আপডেট করব
      if (isNameChanged) {
        await this.productModel.updateMany(
          {
            'childCategory._id': fData._id,
            shop: shop,
          },
          {
            $set: {
              'childCategory.name': name,
              'childCategory.slug': finalSlug,
            },
          },
        );
      }

      return {
        success: true,
        message: 'Success! Child category updated successfully.',
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleChildCategoryById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateChildCategoryDto: UpdateChildCategoryDto,
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
        if (updateChildCategoryDto.slug) {
          delete updateChildCategoryDto.slug;
        }
        await this.childCategoryModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateChildCategoryDto },
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

  async deleteMultipleTrashChildCategory(
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

      await this.childCategoryModel.deleteMany({ _id: ids, status: 'trash' });
      return {
        success: true,
        message: 'Success! ChildCategory permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleChildCategoryByIdByVendor(
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

      // await this.childCategoryModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );
      await this.childCategoryModel.deleteMany({ _id: ids });

      return {
        success: true,
        message: 'Success! ChildCategory deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleChildCategoryById(
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      await this.childCategoryModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getSubCategoriesByCategoryId(
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.childCategoryModel
        .find({ 'subCategory._id': id })
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

      await this.childCategoryModel.deleteMany({ shop: shop, status: 'trash' });
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
      await this.childCategoryModel.deleteMany({
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
