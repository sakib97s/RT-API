import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddAdditionalPageDto,
  FilterAndPaginationAdditionalPageDto,
  GetAdditionalPageByIdsDto,
  UpdateAdditionalPageDto,
} from './dto/additional-page.dto';
import { AdditionalPage } from './interfaces/additional-page.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from '../shop/interfaces/shop.interface';
import { ErrorCodes } from '../../enum/error-code.enum';

const ObjectId = Types.ObjectId;

@Injectable()
export class AdditionalPageService {
  private logger = new Logger(AdditionalPageService.name);

  constructor(
    @InjectModel('AdditionalPage')
    private readonly additionalPageModel: Model<AdditionalPage>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    private utilsService: UtilsService,
  ) {}

  /**
   * addAdditionalPage()
   * getAllAdditionalPageByShop()
   * getAdditionalPageById()
   * getAllAdditionalPages()
   * getAdditionalPageBySlug()
   * getAdditionalPageByIds()
   * updateAdditionalPageById()
   * updateMultipleAdditionalPageById()
   * updateMultipleVendorAdditionalPageById()
   * deleteMultipleTrashAdditionalPage()
   * deleteMultipleAdditionalPageByIdByVendor()
   * deleteMultipleAdditionalPageById()
   */
  // async addAdditionalPage(
  //   vendor: Vendor,
  //   shop: string,
  //   addAdditionalPageDto: AddAdditionalPageDto,
  // ): Promise<ResponsePayload> {
  //   try {
  //     const { quantity, name } = addAdditionalPageDto;
  //
  //     const fShop = await this.shopModel.exists({
  //       _id: shop,
  //       'users._id': vendor._id,
  //     });
  //
  //     if (!fShop) {
  //       return {
  //         success: false,
  //         message: 'Sorry! you have no access in this shop',
  //       } as ResponsePayload;
  //     }
  //
  //     const fSlug = this.utilsService.transformToSlug(name);
  //     const fData = await this.additionalPageModel.exists({ slug: fSlug });
  //
  //     const finalSlug = fData
  //       ? this.utilsService.transformToSlug(name, true)
  //       : fSlug;
  //
  //     const defaultData = {
  //       slug: finalSlug,
  //       quantity: quantity ? quantity : 0,
  //       dateString: this.utilsService.getDateString(new Date()),
  //     };
  //
  //     const finalData = {
  //       ...addAdditionalPageDto,
  //       ...defaultData,
  //       ...{
  //         shop: shop,
  //       },
  //     };
  //
  //     const saveData = await this.additionalPageModel.create(finalData);
  //     const data = {
  //       _id: saveData._id,
  //     };
  //
  //     return {
  //       success: true,
  //       message: 'Success! AdditionalPage added successfully.',
  //       data,
  //     } as ResponsePayload;
  //   } catch (error) {
  //     console.log(error);
  //     throw new InternalServerErrorException(error.message);
  //   }
  // }

  /**
   * addShopInformation
   */
  async addAdditionalPage(
    vendor: Vendor,
    shop: string,
    addAdditionalPageDto: AddAdditionalPageDto,
  ): Promise<ResponsePayload> {
    try {
      // const { shop } = addShopInformationDto;
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
      const finalData = {
        ...addAdditionalPageDto,
        ...{
          shop: shop,
        },
      };
      const additionalPageData = await this.additionalPageModel.findOne({
        shop: shop,
        slug: addAdditionalPageDto.slug,
      });
      if (additionalPageData) {
        await this.additionalPageModel.findByIdAndUpdate(
          additionalPageData._id,
          {
            $set: finalData,
          },
        );
        const data = {
          _id: additionalPageData._id,
        };

        return {
          success: true,
          message: 'Data Updated Success',
          data,
        } as ResponsePayload;
      } else {
        const saveData = await this.additionalPageModel.create(finalData);

        const data = {
          _id: saveData._id,
        };

        return {
          success: true,
          message: 'Data Added Success',
          data,
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Slug Must be Unique');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async getAllAdditionalPageByShop(
    shop: string,
    filterAdditionalPageDto: FilterAndPaginationAdditionalPageDto,
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
      const { filter } = filterAdditionalPageDto;
      filterAdditionalPageDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllAdditionalPages(filterAdditionalPageDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAdditionalPageById(
    vendor: Vendor,
    shop: string,
    slug: string,
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

      const data = await this.additionalPageModel
        .findOne({ slug: slug, shop: shop })
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

  async getAllAdditionalPages(
    filterAdditionalPageDto: FilterAndPaginationAdditionalPageDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterAdditionalPageDto;
    const { pagination } = filterAdditionalPageDto;
    const { sort } = filterAdditionalPageDto;
    const { select } = filterAdditionalPageDto;
    const { filterGroup } = filterAdditionalPageDto;

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
      const dataAggregates = await this.additionalPageModel.aggregate(
        aggregateStages,
        { allowDiskUse: true },
      );

      // GROUP FILTER PRODUCTS DATA
      let categoryAggregates: any;
      let subCategoryAggregates: any;
      let brandAggregates: any;
      // Category
      if (filterGroup && filterGroup.isGroup && filterGroup.category) {
        categoryAggregates = await this.additionalPageModel.aggregate(
          aggregateCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub Category
      if (filterGroup && filterGroup.isGroup && filterGroup.subCategory) {
        subCategoryAggregates = await this.additionalPageModel.aggregate(
          aggregateSubCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.additionalPageModel.aggregate(
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

  async getAdditionalPageBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.additionalPageModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      return {
        success: true,
        message: 'Success! data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAdditionalPageByIds(
    shop: string,
    getAdditionalPageByIdsDto: GetAdditionalPageByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getAdditionalPageByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.additionalPageModel
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
   * updateAdditionalPageById
   * updateMultipleAdditionalPageById
   */
  async updateAdditionalPageById(
    vendor: Vendor,
    shop: string,
    slug: string,
    updateAdditionalPageDto: UpdateAdditionalPageDto,
  ): Promise<ResponsePayload> {
    try {
      const { name } = updateAdditionalPageDto;

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

      // let finalSlug: string;
      const fData = await this.additionalPageModel.findOne({
        slug: slug,
        shop: shop,
      });

      // Check Slug
      // if (fData?.name.trim() !== name.trim()) {
      //   const newSlug = this.utilsService.transformToSlug(name);

      //   const isExists = await this.additionalPageModel.exists({ slug: newSlug });
      //   if (isExists) {
      //     finalSlug = this.utilsService.transformToSlug(name, true);
      //   } else {
      //     finalSlug = newSlug;
      //   }
      // } else {
      //   finalSlug = fData.slug;
      // }

      const finalData = {
        ...updateAdditionalPageDto,
      };

      await this.additionalPageModel.findOneAndUpdate(
        { slug: slug },
        {
          $set: finalData,
        },
      );

      return {
        success: true,
        message: 'Success! data updated successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleAdditionalPageById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateAdditionalPageDto: UpdateAdditionalPageDto,
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
        if (updateAdditionalPageDto.slug) {
          delete updateAdditionalPageDto.slug;
        }
        await this.additionalPageModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateAdditionalPageDto },
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

  async deleteMultipleTrashAdditionalPage(
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

      await this.additionalPageModel.deleteMany({ _id: ids, status: 'trash' });
      return {
        success: true,
        message: 'Success! AdditionalPage permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleAdditionalPageByIdByVendor(
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

      await this.additionalPageModel.updateMany(
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
        message: 'Success! AdditionalPage deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleAdditionalPageById(
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      await this.additionalPageModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
