import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddSeoDto,
  FilterAndPaginationSeoDto,
  GetSeoByIdsDto,
  UpdateSeoDto,
} from './dto/seo.dto';
import { Seo } from './interfaces/seo.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from '../shop/interfaces/shop.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class SeoService {
  private logger = new Logger(SeoService.name);

  constructor(
    @InjectModel('Seo') private readonly seoModel: Model<Seo>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    private utilsService: UtilsService,
  ) {}

  /**
   * addSeo()
   * getAllSeoByShop()
   * getSeoById()
   * getAllSeos()
   * getSeoBySlug()
   * getSeoByIds()
   * updateSeoById()
   * updateMultipleSeoById()
   * updateMultipleVendorSeoById()
   * deleteMultipleTrashSeo()
   * deleteMultipleSeoByIdByVendor()
   * deleteMultipleSeoById()
   */
  async addSeo(
    vendor: Vendor,
    addSeoDto: AddSeoDto,
  ): Promise<ResponsePayload> {
    try {
      const { quantity, name, shop } = addSeoDto;

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

      const fSlug = this.utilsService.transformToSlug(name);
      const fData = await this.seoModel.exists({ slug: fSlug });

      const finalSlug = fData
        ? this.utilsService.transformToSlug(name, true)
        : fSlug;

      const defaultData = {
        slug: finalSlug,
        quantity: quantity ? quantity : 0,
        dateString: this.utilsService.getDateString(new Date()),
      };

      const finalData = {
        ...addSeoDto,
        ...defaultData,
      };

      const saveData = await this.seoModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! Seo added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllSeoByShop(
    shop: string,
    filterSeoDto: FilterAndPaginationSeoDto,
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
      const { filter } = filterSeoDto;
      filterSeoDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllSeos(filterSeoDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getSeoById(
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

      const data = await this.seoModel
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

  async getAllSeos(
    filterSeoDto: FilterAndPaginationSeoDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterSeoDto;
    const { pagination } = filterSeoDto;
    const { sort } = filterSeoDto;
    const { select } = filterSeoDto;
    const { filterGroup } = filterSeoDto;

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
      const dataAggregates = await this.seoModel.aggregate(
        aggregateStages,
        { allowDiskUse: true },
      );

      // GROUP FILTER PRODUCTS DATA
      let categoryAggregates: any;
      let subCategoryAggregates: any;
      let brandAggregates: any;
      // Category
      if (filterGroup && filterGroup.isGroup && filterGroup.category) {
        categoryAggregates = await this.seoModel.aggregate(
          aggregateCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub Category
      if (filterGroup && filterGroup.isGroup && filterGroup.subCategory) {
        subCategoryAggregates = await this.seoModel.aggregate(
          aggregateSubCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.seoModel.aggregate(
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

  async getSeoBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.seoModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.seoModel.findByIdAndUpdate(data._id, {
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

  async getSeoByIds(
    shop: string,
    getSeoByIdsDto: GetSeoByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getSeoByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.seoModel
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
   * updateSeoById
   * updateMultipleSeoById
   */
  async updateSeoById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateSeoDto: UpdateSeoDto,
  ): Promise<ResponsePayload> {
    try {
      const { name } = updateSeoDto;

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
      const fData = await this.seoModel.findOne({ _id: id, shop: shop });

      // Check Slug
      if (fData?.name.trim() !== name.trim()) {
        const newSlug = this.utilsService.transformToSlug(name);

        const isExists = await this.seoModel.exists({ slug: newSlug });
        if (isExists) {
          finalSlug = this.utilsService.transformToSlug(name, true);
        } else {
          finalSlug = newSlug;
        }
      } else {
        finalSlug = fData.slug;
      }

      const finalData = {
        ...updateSeoDto,
        ...{
          slug: finalSlug,
        },
      };

      await this.seoModel.findByIdAndUpdate(id, {
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

  async updateMultipleSeoById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateSeoDto: UpdateSeoDto,
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
        if (updateSeoDto.slug) {
          delete updateSeoDto.slug;
        }
        await this.seoModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateSeoDto },
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

  async deleteMultipleTrashSeo(
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

      await this.seoModel.deleteMany({ _id: ids, status: 'trash' });
      return {
        success: true,
        message: 'Success! Seo permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleSeoByIdByVendor(
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

      await this.seoModel.updateMany(
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
        message: 'Success! Seo deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleSeoById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.seoModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
