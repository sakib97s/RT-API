import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddPaymentLinkHistoryDto,
  FilterAndPaginationPaymentLinkHistoryDto,
  GetPaymentLinkHistoryByIdsDto,
  UpdatePaymentLinkHistoryDto,
} from './dto/payment-link-history.dto';
import { PaymentLinkHistory } from './interfaces/payment-link-history.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Response } from 'express';
import {
  SslCommerzApiConfig,
  SslCommerzInit,
} from '../../shared/payment-control/interfaces/payment-control.interface';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BulkSmsService } from '../../shared/bulk-sms/bulk-sms.service';
import { EmailService } from '../../shared/email/email.service';
import { PaymentControlService } from '../../shared/payment-control/payment-control.service';
import { PaymentLink } from '../payment-link/interfaces/payment-link.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class PaymentLinkHistoryService {
  private logger = new Logger(PaymentLinkHistoryService.name);

  constructor(
    @InjectModel('PaymentLinkHistory')
    private readonly paymentLinkHistoryModel: Model<PaymentLinkHistory>,
    @InjectModel('PaymentLink')
    private readonly paymentLinkModel: Model<PaymentLink>,
    private utilsService: UtilsService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly bulkSmsService: BulkSmsService,
    private readonly emailService: EmailService,
    private readonly paymentControlService: PaymentControlService,
  ) { }

  /**
   * Main Ui
   */
  async createPaymentLinkHistory(
    addPaymentLinkHistoryDto: AddPaymentLinkHistoryDto,
  ): Promise<ResponsePayload> {
    try {
      const { name, phoneNo, sslDirect, paymentLinkId } =
        addPaymentLinkHistoryDto;

      const paymentLinkData: any =
        await this.paymentLinkModel.findById(paymentLinkId);

      if (!paymentLinkData) {
        return {
          success: false,
          message: 'Sorry! data not available! Try another',
        };
      }
      const mData = {
        ...addPaymentLinkHistoryDto,
        ...{
          dateString: this.utilsService.getDateString(new Date()),
          paymentStatus: 'unpaid',
          amount: paymentLinkData.price,
        },
      };

      // const saveData:any = { };
      const saveData = await this.paymentLinkHistoryModel.create(mData);

      // SSL Commerz
      const sslCommerzStoreId =
        this.configService.get<string>('sslCommerzStoreId');
      const sslCommerzStorePassword = this.configService.get<string>(
        'sslCommerzStorePassword',
      );
      const sslCommerzProduction = this.configService.get<string>(
        'sslCommerzProduction',
      );

      const apiBaseUrl = this.configService.get<string>('apiBaseUrl');
      const sslBaseURL = `https://${sslCommerzProduction ? 'securepay' : 'sandbox'
        }.sslcommerz.com`;

      const callBackBaseUrlSsl = sslCommerzProduction ? apiBaseUrl : apiBaseUrl; // http://localhost:3015

      const sslCommerzInit: SslCommerzInit = {
        baseUrl: sslBaseURL,
        store_id: sslCommerzStoreId,
        store_passwd: sslCommerzStorePassword,
        tran_id: saveData._id.toString(),
        total_amount: mData.amount,
        currency: 'BDT',
        // ipn_url: `${callBackBaseUrlSsl}/api/shop/callback-ssl-commerz-payment`,
        success_url: `${callBackBaseUrlSsl}/api/payment-link-history/callback-ssl-commerz-payment?status=VALID&tran_id=${saveData._id.toString()}`,
        fail_url: `${callBackBaseUrlSsl}/api/payment-link-history/callback-ssl-commerz-payment?status=FAILED&tran_id=${saveData._id.toString()}`,
        cancel_url: `${callBackBaseUrlSsl}/api/payment-link-history/callback-ssl-commerz-payment?status=CANCELLED&tran_id=${saveData._id.toString()}`,
        shipping_method: 'NO',

        // Product
        product_name: `${name} - Website`,
        product_category: 'E-commerce Service',
        product_profile: 'non-physical-goods',

        // Customer
        cus_name: name ?? 'Unknown',
        cus_email: 'sakibs.ngn@gmail.com',
        cus_add1: '',
        cus_add2: '',
        cus_city: '',
        cus_state: '',
        cus_postcode: '',
        cus_country: 'Bangladesh',
        cus_phone: phoneNo,
        cus_fax: '',

        // Shipping
        ship_name: '',
        ship_add1: '',
        ship_add2: '',
        ship_city: '',
        ship_state: '',
        ship_postcode: '',
        ship_country: '',
      };
      return this.payWithSslCommerz(sslCommerzInit, sslDirect);

      // Bkash Payment
      // return {
      //   success: true,
      //   message: 'Success! Redirecting to the payment page',
      //   // response: null,
      //   data: {
      //     _id: 'tran_id',
      //     providerName: 'Bkash',
      //     link: 'https://shop.bkash.com/softlab-it01966099959/pay/bdt299/G4uRVb',
      //   },
      // };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * addPaymentLinkHistory()
   * getAllPaymentLinkHistoryByShop()
   * getPaymentLinkHistoryById()
   * getAllPaymentLinkHistorys()
   * getPaymentLinkHistoryBySlug()
   * getPaymentLinkHistoryByIds()
   * updatePaymentLinkHistoryById()
   * updateMultiplePaymentLinkHistoryById()
   * updateMultipleAffiliatePaymentLinkHistoryById()
   * deleteMultipleTrashPaymentLinkHistory()
   * deleteMultiplePaymentLinkHistoryByIdByAffiliate()
   * deleteMultiplePaymentLinkHistoryById()
   */
  async addPaymentLinkHistory(
    addPaymentLinkHistoryDto: AddPaymentLinkHistoryDto,
  ): Promise<ResponsePayload> {
    try {
      const { quantity, name, shop } = addPaymentLinkHistoryDto;

      const fSlug = this.utilsService.transformToSlug(name);
      const fData = await this.paymentLinkHistoryModel.exists({ slug: fSlug });

      const finalSlug = fData
        ? this.utilsService.transformToSlug(name, true)
        : fSlug;

      const defaultData = {
        slug: finalSlug,
        quantity: quantity ? quantity : 0,
        dateString: this.utilsService.getDateString(new Date()),
      };

      const finalData = {
        ...addPaymentLinkHistoryDto,
        ...defaultData,
      };

      const saveData = await this.paymentLinkHistoryModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! PaymentLinkHistory added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllPaymentLinkHistoryByShop(
    shop: string,
    filterPaymentLinkHistoryDto: FilterAndPaginationPaymentLinkHistoryDto,
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
      const { filter } = filterPaymentLinkHistoryDto;
      filterPaymentLinkHistoryDto.filter = {
        ...filter,
        ...{ ownerId: shop, ownerType: 'shop' },
      };

      return this.getAllPaymentLinkHistorys(
        filterPaymentLinkHistoryDto,
        searchQuery,
      );
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getPaymentLinkHistoryById(
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.paymentLinkHistoryModel.findOne({ _id: id });

      return {
        success: true,
        message: 'Success! Data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAllPaymentLinkHistorys(
    filterPaymentLinkHistoryDto: FilterAndPaginationPaymentLinkHistoryDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterPaymentLinkHistoryDto;
    const { pagination } = filterPaymentLinkHistoryDto;
    const { sort } = filterPaymentLinkHistoryDto;
    const { select } = filterPaymentLinkHistoryDto;
    const { filterGroup } = filterPaymentLinkHistoryDto;

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
              { phoneNo: this.utilsService.createRegexFromString(searchQuery) },
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
      const dataAggregates = await this.paymentLinkHistoryModel.aggregate(
        aggregateStages,
        { allowDiskUse: true },
      );

      // GROUP FILTER PRODUCTS DATA
      let categoryAggregates: any;
      let subCategoryAggregates: any;
      let brandAggregates: any;
      // Category
      if (filterGroup && filterGroup.isGroup && filterGroup.category) {
        categoryAggregates = await this.paymentLinkHistoryModel.aggregate(
          aggregateCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub Category
      if (filterGroup && filterGroup.isGroup && filterGroup.subCategory) {
        subCategoryAggregates = await this.paymentLinkHistoryModel.aggregate(
          aggregateSubCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.paymentLinkHistoryModel.aggregate(
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

  async getPaymentLinkHistoryBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.paymentLinkHistoryModel
        .findOne({ slug: slug })
        .select(select);

      // Increment view count
      if (data) {
        await this.paymentLinkHistoryModel.findByIdAndUpdate(data._id, {
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

  async getPaymentLinkHistoryByIds(
    shop: string,
    getPaymentLinkHistoryByIdsDto: GetPaymentLinkHistoryByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getPaymentLinkHistoryByIdsDto.ids.map(
        (m) => new ObjectId(m),
      );
      const data = await this.paymentLinkHistoryModel
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
   * updatePaymentLinkHistoryById
   * updateMultiplePaymentLinkHistoryById
   */
  async updatePaymentLinkHistoryById(
    id: string,
    updatePaymentLinkHistoryDto: UpdatePaymentLinkHistoryDto,
  ): Promise<ResponsePayload> {
    try {
      const { name } = updatePaymentLinkHistoryDto;

      let finalSlug: string;
      const fData = await this.paymentLinkHistoryModel.findOne({ _id: id });

      // Check Slug
      if (fData?.name.trim() !== name.trim()) {
        const newSlug = this.utilsService.transformToSlug(name);

        const isExists = await this.paymentLinkHistoryModel.exists({
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
        ...updatePaymentLinkHistoryDto,
        ...{
          slug: finalSlug,
        },
      };

      await this.paymentLinkHistoryModel.findByIdAndUpdate(id, {
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

  async updateMultiplePaymentLinkHistoryById(
    ids: string[],
    updatePaymentLinkHistoryDto: UpdatePaymentLinkHistoryDto,
  ): Promise<ResponsePayload> {
    try {
      if (ids && ids.length) {
        const mIds = ids.map((m) => new ObjectId(m));

        // Delete No Multiple Action Data
        if (updatePaymentLinkHistoryDto.slug) {
          delete updatePaymentLinkHistoryDto.slug;
        }
        await this.paymentLinkHistoryModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updatePaymentLinkHistoryDto },
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

  async deleteMultipleTrashPaymentLinkHistory(
    shop: string,
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      await this.paymentLinkHistoryModel.deleteMany({
        _id: ids,
        status: 'trash',
      });
      return {
        success: true,
        message:
          'Success! PaymentLinkHistory permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultiplePaymentLinkHistoryByIdByAffiliate(
    shop: string,
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      await this.paymentLinkHistoryModel.updateMany(
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
        message: 'Success! PaymentLinkHistory deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultiplePaymentLinkHistoryById(
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      await this.paymentLinkHistoryModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * Manage SSL Commerz Payment Api
   * payWithSslCommerz()
   * callbackSslCommerzPayment()
   */
  private async payWithSslCommerz(
    sslCommerzInit: SslCommerzInit,
    sslDirect?: string,
  ) {
    try {
      const { tran_id } = sslCommerzInit;
      const responsePayload =
        await this.paymentControlService.sslCommerzInit(sslCommerzInit);

      if (responsePayload['status'] === 'SUCCESS') {
        await this.paymentLinkHistoryModel.findByIdAndUpdate(tran_id, {
          $set: {
            paymentRefId: responsePayload['sessionkey'],
            paymentApiType: 'SSl Commerz',
            paymentMethod: 'SSl Commerz',
          },
        });

        const getPaymentRedirectUrl = (): string => {
          switch (sslDirect) {
            case 'bkash':
              return responsePayload.desc.find((f: any) => f.name === 'bKash')
                .redirectGatewayURL;

            case 'nagad':
              return responsePayload.desc.find((f: any) => f.name === 'Nagad')
                .redirectGatewayURL;

            default:
              return responsePayload['GatewayPageURL'];
          }
        };

        return {
          success: true,
          message: 'Success! Redirecting to the payment page',
          response: responsePayload,
          data: {
            _id: tran_id,
            providerName: 'SSl Commerz',
            link: getPaymentRedirectUrl(),
          },
        };
      } else {
        return {
          success: false,
          message: 'Error! Something went wrong. Please try again.',
          data: {
            _id: null,
            providerName: 'SSl Commerz',
            link: null,
          },
        };
      }
    } catch (err) {
      console.log(err);
    }
  }

  async callbackSslCommerzPayment(
    res: Response,
    tran_id: any,
    status: string,
  ): Promise<any> {
    try {
      const redirectUrlBase = this.configService.get<string>('frontendUrl');

      // Fetch PaymentLinkHistory Data
      const fPaymentLinkHistory: any =
        await this.paymentLinkHistoryModel.findOne({
          paymentMethod: 'SSl Commerz',
          _id: tran_id,
        });

      if (fPaymentLinkHistory) {
        // SSL Commerz
        const sslCommerzStoreId =
          this.configService.get<string>('sslCommerzStoreId');
        const sslCommerzStorePassword = this.configService.get<string>(
          'sslCommerzStorePassword',
        );
        const sslCommerzProduction = this.configService.get<string>(
          'sslCommerzProduction',
        );
        const sslBaseURL = `https://${sslCommerzProduction ? 'securepay' : 'sandbox'
          }.sslcommerz.com`;

        const sslCommerzApiConfig: SslCommerzApiConfig = {
          baseUrl: sslBaseURL,
          store_id: sslCommerzStoreId,
          store_passwd: sslCommerzStorePassword,
          sessionKey: fPaymentLinkHistory?.paymentRefId,
          tran_id: tran_id,
        };

        if (status === 'VALID') {
          const result: any =
            await this.paymentControlService.transactionQueryBySessionId(
              sslCommerzApiConfig,
            );

          if (result.status === 'VALID') {
            await this.paymentLinkHistoryModel.findByIdAndUpdate(
              fPaymentLinkHistory?._id,
              {
                $set: {
                  paymentStatus: 'paid',
                },
              },
            );

            //
            const msg = `Thank you for your payment. `;
            this.bulkSmsService.sentSmsByAdmin(
              fPaymentLinkHistory.phoneNo,
              msg,
            );

            // Create Affiliate Sale Report
            // if (fPaymentLinkHistory?.refferId) {
            //   await this.createAffiliateReport(fPaymentLinkHistory);
            // }

            return res.redirect(
              `${redirectUrlBase}/payment/${fPaymentLinkHistory?.paymentLinkId}?paymentStatus=paid`,
            );
          } else {
            // await this.preShopModel.findByIdAndDelete(fPaymentLinkHistory?._id);
            return res.redirect(
              `${redirectUrlBase}/payment/${fPaymentLinkHistory?.paymentLinkId}?paymentStatus=failed`,
            );
          }
        } else {
          // await this.preShopModel.findByIdAndDelete(fPaymentLinkHistory?._id);
          return res.redirect(
            `${redirectUrlBase}/payment/${fPaymentLinkHistory?.paymentLinkId}?paymentStatus=failed`,
          );
        }
      } else {
        return res.redirect(
          `${redirectUrlBase}/payment/${fPaymentLinkHistory?.paymentLinkId}?paymentStatus=failed`,
        );
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
