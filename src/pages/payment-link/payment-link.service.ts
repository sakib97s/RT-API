import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddPaymentLinkDto,
  FilterAndPaginationPaymentLinkDto,
  GetPaymentLinkByIdsDto,
  UpdatePaymentLinkDto,
} from './dto/payment-link.dto';
import { PaymentLink } from './interfaces/payment-link.interface';
import { Affiliate } from 'src/pages/affiliate/interfaces/affiliate.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class PaymentLinkService {
  private logger = new Logger(PaymentLinkService.name);

  constructor(
    @InjectModel('PaymentLink')
    private readonly paymentLinkModel: Model<PaymentLink>,
    private utilsService: UtilsService,
  ) {}

  /**
   * addPaymentLink()
   * getAllPaymentLinkByShop()
   * getPaymentLinkById()
   * getAllPaymentLinks()
   * getPaymentLinkBySlug()
   * getPaymentLinkByIds()
   * updatePaymentLinkById()
   * updateMultiplePaymentLinkById()
   * updateMultipleAffiliatePaymentLinkById()
   * deleteMultipleTrashPaymentLink()
   * deleteMultiplePaymentLinkByIdByAffiliate()
   * deleteMultiplePaymentLinkById()
   */
  async addPaymentLink(
    affiliate: Affiliate,
    addPaymentLinkDto: AddPaymentLinkDto,
  ): Promise<ResponsePayload> {
    try {
      const { quantity, name, shop } = addPaymentLinkDto;

      const fSlug = this.utilsService.transformToSlug(name);
      const fData = await this.paymentLinkModel.exists({ slug: fSlug });

      const finalSlug = fData
        ? this.utilsService.transformToSlug(name, true)
        : fSlug;

      const defaultData = {
        slug: finalSlug,
        quantity: quantity ? quantity : 0,
        dateString: this.utilsService.getDateString(new Date()),
      };

      const finalData = {
        ...addPaymentLinkDto,
        ...defaultData,
      };

      const saveData = await this.paymentLinkModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! PaymentLink added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllPaymentLinkByShop(
    shop: string,
    filterPaymentLinkDto: FilterAndPaginationPaymentLinkDto,
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
      const { filter } = filterPaymentLinkDto;
      filterPaymentLinkDto.filter = {
        ...filter,
        ...{ ownerId: shop, ownerType: 'shop' },
      };

      return this.getAllPaymentLinks(filterPaymentLinkDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getPaymentLinkById(
    affiliate: Affiliate,
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {

      const data = await this.paymentLinkModel.findOne({ _id: id });

      return {
        success: true,
        message: 'Success! Data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAllPaymentLinks(
    filterPaymentLinkDto: FilterAndPaginationPaymentLinkDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterPaymentLinkDto;
    const { pagination } = filterPaymentLinkDto;
    const { sort } = filterPaymentLinkDto;
    const { select } = filterPaymentLinkDto;
    const { filterGroup } = filterPaymentLinkDto;

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
      if (filter['ownerId']) {
        filter['ownerId'] = new ObjectId(filter['ownerId']);
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
      const dataAggregates = await this.paymentLinkModel.aggregate(
        aggregateStages,
        { allowDiskUse: true },
      );

      // GROUP FILTER PRODUCTS DATA
      let categoryAggregates: any;
      let subCategoryAggregates: any;
      let brandAggregates: any;
      // Category
      if (filterGroup && filterGroup.isGroup && filterGroup.category) {
        categoryAggregates = await this.paymentLinkModel.aggregate(
          aggregateCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub Category
      if (filterGroup && filterGroup.isGroup && filterGroup.subCategory) {
        subCategoryAggregates = await this.paymentLinkModel.aggregate(
          aggregateSubCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.paymentLinkModel.aggregate(
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

  async getPaymentLinkBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.paymentLinkModel
        .findOne({ slug: slug })
        .select(select);

      // Increment view count
      if (data) {
        await this.paymentLinkModel.findByIdAndUpdate(data._id, {
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

  async getPaymentLinkByIds(
    shop: string,
    getPaymentLinkByIdsDto: GetPaymentLinkByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getPaymentLinkByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.paymentLinkModel
        .find({ _id: mIds })
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
   * updatePaymentLinkById
   * updateMultiplePaymentLinkById
   */
  async updatePaymentLinkById(
    affiliate: Affiliate,
    id: string,
    updatePaymentLinkDto: UpdatePaymentLinkDto,
  ): Promise<ResponsePayload> {
    try {
      const { name } = updatePaymentLinkDto;

      let finalSlug: string;
      const fData = await this.paymentLinkModel.findOne({ _id: id });

      // Check Slug
      if (fData?.name.trim() !== name.trim()) {
        const newSlug = this.utilsService.transformToSlug(name);

        const isExists = await this.paymentLinkModel.exists({
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
        ...updatePaymentLinkDto,
        ...{
          slug: finalSlug,
        },
      };

      await this.paymentLinkModel.findByIdAndUpdate(id, {
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

  async updateMultiplePaymentLinkById(
    affiliate: Affiliate,
    ids: string[],
    updatePaymentLinkDto: UpdatePaymentLinkDto,
  ): Promise<ResponsePayload> {
    try {
      if (ids && ids.length) {
        const mIds = ids.map((m) => new ObjectId(m));

        // Delete No Multiple Action Data
        if (updatePaymentLinkDto.slug) {
          delete updatePaymentLinkDto.slug;
        }
        await this.paymentLinkModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updatePaymentLinkDto },
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

  async deleteMultipleTrashPaymentLink(
    affiliate: Affiliate,
    shop: string,
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      await this.paymentLinkModel.deleteMany({
        _id: ids,
        status: 'trash',
      });
      return {
        success: true,
        message: 'Success! PaymentLink permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultiplePaymentLinkByIdByAffiliate(
    affiliate: Affiliate,
    shop: string,
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      await this.paymentLinkModel.updateMany(
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
        message: 'Success! PaymentLink deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultiplePaymentLinkById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.paymentLinkModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
