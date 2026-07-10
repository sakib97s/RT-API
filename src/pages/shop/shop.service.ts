import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { ErrorCodes } from 'src/enum/error-code.enum';
import { OptionPayloadDto } from 'src/dto/api-response.dto';
import { PreShop, Shop } from './interfaces/shop.interface';
import { Response } from 'express';
import {
  AddShopDto,
  AddVendorAndShopDto,
  ChangeDomainDto,
  ChangeThemeDto,
  CheckShopAvailabilityAndOtpDto,
  CheckShopAvailabilityDto,
  CloneDataFromShopDto,
  CreatePreShopDto,
  CreateShopRenewDto,
  DeleteShopDto,
  FilterAndPaginationShopDto,
  SendPreShopDto,
  SignupAndCreateShopDto,
  UpdateShopDto,
} from './dto/shop.dto';
import { Vendor } from '../vendor/interfaces/vendor.interface';
import { UtilsService } from '../../shared/utils/utils.service';
import * as fs from 'fs';
import * as path from 'path';
import { MongoClient } from 'mongodb';
import * as os from 'os';

import { BSON } from 'bson';
import * as archiver from 'archiver';
// Admin import removed - no longer needed
import { Port } from 'src/interfaces/port.interface';
import { Package } from 'src/interfaces/package.interface';
import { Theme } from 'src/interfaces/theme.interface';
import { ShopInformation } from '../customization/shop-information/interfaces/shop-information.interface';
import { Setting } from '../customization/setting/interface/setting.interface';
import { Product } from '../product/interfaces/product.interface';
import { Category } from '../catalog/category/interfaces/category.interface';
import { SubCategory } from '../catalog/sub-category/interfaces/sub-category.interface';
import { Brand } from '../catalog/brand/interfaces/brand.interface';
import { Tag } from '../catalog/tag/interfaces/tag.interface';
import { Carousel } from '../customization/carousel/interfaces/carousel.interface';
import { ThemeSubCategory } from 'src/interfaces/theme-sub-category.interface';
import { BuildScriptService } from '../../shared/build-script/build-script.service';
import {
  BuildScript,
  DeleteBuildScript,
  UpdateBuildScript,
} from '../../shared/build-script/interfaces/build-script.interface';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  SslCommerzApiConfig,
  SslCommerzInit,
} from '../../shared/payment-control/interfaces/payment-control.interface';
import { OtpService } from '../otp/otp.service';
import { BulkSmsService } from '../../shared/bulk-sms/bulk-sms.service';
import { PaymentControlService } from '../../shared/payment-control/payment-control.service';
import { AffiliateProduct } from '../affiliate-product/interfaces/affiliate-product.interface';
import { COUNTRIES, TRIAL_PERIOD } from '../../config/global-variables';
import { EmailService } from '../../shared/email/email.service';
import { SubscriptionReport } from '../subscription/interfaces/subscription-report.interface';
import { AffiliateReport } from '../affiliate-report/interfaces/affiliate-report.interface';
import { Affiliate } from '../affiliate/interfaces/affiliate.interface';
import process from 'node:process';
import axios from 'axios';

const ObjectId = Types.ObjectId;

@Injectable()
export class ShopService {
  private logger = new Logger(ShopService.name);

  constructor(
    @InjectModel('Shop')
    private readonly shopModel: Model<Shop>,
    @InjectModel('PreShop')
    private readonly preShopModel: Model<PreShop>,
    @InjectModel('Theme') private readonly themeModel: Model<Theme>,
    @InjectModel('Port') private readonly portModel: Model<Port>,
    @InjectModel('Package') private readonly packageModel: Model<Package>,
    @InjectModel('Vendor') private readonly vendorModel: Model<Vendor>,
    @InjectModel('Setting') private readonly settingModel: Model<Setting>,
    @InjectModel('ShopInformation')
    private readonly shopInformationModel: Model<ShopInformation>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
    @InjectModel('SubCategory')
    private readonly subCategoryModel: Model<SubCategory>,
    @InjectModel('ThemeSubCategory')
    private readonly themeSubCategoryModel: Model<ThemeSubCategory>,
    @InjectModel('Brand') private readonly brandModel: Model<Brand>,
    @InjectModel('Tag') private readonly tagModel: Model<Tag>,
    @InjectModel('Carousel') private readonly carouselModel: Model<Carousel>,
    @InjectModel('AffiliateReport')
    private readonly affiliateReportModel: Model<AffiliateReport>,

    @InjectModel('Affiliate')
    private readonly affiliateModel: Model<Affiliate>,
    @InjectModel('AffiliateProduct')
    private readonly affiliateProductModel: Model<AffiliateProduct>,
    @InjectModel('SubscriptionReport')
    private readonly subscriptionReportModel: Model<SubscriptionReport>,
    @InjectConnection() private readonly connection: Connection,
    private readonly buildScriptService: BuildScriptService,
    private readonly paymentControlService: PaymentControlService,
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService,
    private readonly httpService: HttpService,
    private readonly otpService: OtpService,
    private readonly bulkSmsService: BulkSmsService,
    private readonly emailService: EmailService,
  ) { }

  /**
   * Main Ui
   */
  async createPreShop(
    createPreShopDto: CreatePreShopDto,
  ): Promise<ResponsePayload> {
    try {
      const {
        websiteName,
        phoneNo,
        email,
        sslDirect,
        purchaseType,
        packageId,
      } = createPreShopDto;
      const redirectBase = this.configService.get<string>('frontendUrl');

      const conditions = [];
      if (phoneNo) conditions.push({ phoneNo });
      if (email) conditions.push({ email });

      if (conditions.length) {
        const existingVendor = await this.vendorModel.findOne({
          $or: conditions,
        });

        if (existingVendor) {
          const conflictField =
            phoneNo && existingVendor.phoneNo === phoneNo
              ? 'Phone number'
              : email && existingVendor.email === email
                ? 'Email'
                : 'Phone number or Email';

          return {
            success: false,
            message: `Sorry! ${conflictField} is already registered! Try another.`,
          };
        }
      }

      // const fPackage = await this.packageModel.findOne({ type: 'Free' });
      const fPackage = await this.packageModel.findOne({ _id: packageId });

      if (!fPackage) {
        throw new BadRequestException('Package not found');
      }

      const fTheme = await this.themeModel.findOne({}).select('name');

      let fAffiliate: any;
      let fAffiliateProduct: any;

      if (createPreShopDto.userId) {
        fAffiliate = await this.affiliateModel.findOne({
          userId: this.utilsService.createRegexFromString(
            createPreShopDto.userId,
          ),
        });

        if (createPreShopDto.userId && !fAffiliate) {
          return {
            success: false,
            message: 'Affiliate not found.',
          };
          // throw new BadRequestException('Affiliate not found');
        }
      }

      if (createPreShopDto.affiliateProductId) {
        fAffiliateProduct = await this.affiliateProductModel.findOne({
          _id: createPreShopDto.affiliateProductId,
        });

        if (createPreShopDto.affiliateProductId && !fAffiliateProduct) {
          return {
            success: false,
            message: 'Affiliate Product not found.',
          };
          // throw new BadRequestException('Affiliate Product not found');
        }
      }

      // Common metadata
      const commonData = {
        ...createPreShopDto,
        dateString: this.utilsService.getDateString(new Date()),
        paymentStatus: 'unpaid',
        // amount: OFFER_SERVICE_PRICE,
        // amount: fPackage.purchasePrice,
        amount:
          createPreShopDto.packageType === 'monthly'
            ? 799
            : createPreShopDto.packageType === 'lifetime'
              ? 14999
              : 7999,
        // amount:
        //   fAffiliate && fAffiliateProduct
        //     ? fAffiliateProduct.regularPrice - fAffiliateProduct.discountAmount
        //     : fPackage.purchasePrice,

        websiteBuildStatus: 'pending',
        themeId: createPreShopDto.themeId ?? fTheme._id,

        affiliateId: fAffiliate?._id ?? null,
        affiliateProductId: fAffiliateProduct?._id ?? null,
      };

      // console.log('commonData', commonData);
      // console.log('createPreShopDto', createPreShopDto);

      if (purchaseType === 'purchase') {
        const mData = {
          ...commonData,
          shopType: fPackage?.type === 'Starter' ? 'starter' : 'professional',
        };

        // console.log('mData', mData);
        const saveData = await this.preShopModel.create(mData);
        // const saveData: any = {};

        if (sslDirect === 'stripe') {


          const stripeConfig = {
            secretKey: this.configService.get<string>('STRIPE_SECRET_KEY'),
            production: process?.env?.PRODUCTION_BUILD === 'true',
            amount: mData.amount,
            currency: 'usd',
            preShopId: saveData._id.toString(),
            baseUrl:
              process?.env?.PRODUCTION_BUILD === 'true'
                ? 'https://api.tradition.com'
                : 'http://localhost:3013',
          };

          // console.log('stripeConfig', stripeConfig);

          return await this.payWithStripe(stripeConfig);
        } else {
          // SSLCommerz Config
          const sslCommerzStoreId =
            this.configService.get<string>('sslCommerzStoreId');
          const sslCommerzStorePassword = this.configService.get<string>(
            'sslCommerzStorePassword',
          );
          const sslCommerzProduction = this.configService.get<string>(
            'sslCommerzProduction',
          );
          const apiBaseUrl = this.configService.get<string>('apiBaseUrl');

          const sslBaseURL = `https://${sslCommerzProduction ? 'securepay' : 'sandbox'}.sslcommerz.com`;

          const sslCommerzInit: SslCommerzInit = {
            baseUrl: sslBaseURL,
            store_id: sslCommerzStoreId,
            store_passwd: sslCommerzStorePassword,
            tran_id: saveData._id.toString(),
            total_amount: mData.amount,
            currency: 'BDT',
            success_url: `${apiBaseUrl}/api/shop/callback-ssl-commerz-payment?status=VALID&tran_id=${saveData._id}&type=Pre%20Shop`,
            fail_url: `${apiBaseUrl}/api/shop/callback-ssl-commerz-payment?status=FAILED&tran_id=${saveData._id}&type=Pre%20Shop`,
            cancel_url: `${apiBaseUrl}/api/shop/callback-ssl-commerz-payment?status=CANCELLED&tran_id=${saveData._id}&type=Pre%20Shop`,
            shipping_method: 'NO',
            product_name: `${websiteName} - Website`,
            product_category: 'E-commerce Service',
            product_profile: 'non-physical-goods',
            cus_name: websiteName ?? 'Unknown',
            cus_email: 'sakibs.ngn@gmail.com',
            cus_add1: '',
            cus_add2: '',
            cus_city: '',
            cus_state: '',
            cus_postcode: '',
            cus_country: 'Bangladesh',
            cus_phone: phoneNo,
            cus_fax: '',
            ship_name: '',
            ship_add1: '',
            ship_add2: '',
            ship_city: '',
            ship_state: '',
            ship_postcode: '',
            ship_country: '',
          };

          // Redirect to SSLCommerz
          return this.payWithSslCommerz(sslCommerzInit, sslDirect, 'Pre Shop');
        }
      }

      // Trial Logic
      else if (purchaseType === 'trial') {
        const mData = {
          ...commonData,
          shopType: 'free',
          trialPeriod: TRIAL_PERIOD,
          paymentStatus: 'paid',
        };

        const saveData = await this.preShopModel.create(mData);

        return {
          success: true,
          message: 'Trial shop created successfully',
          data: {
            redirectUrl: `${redirectBase}/website-builder/${saveData._id}?paymentStatus=paid`,
          },
        };
      }

      // Invalid type fallback
      return {
        success: false,
        message: 'Invalid purchase type',
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async createShopPayment(
    createShopRenewDto: CreateShopRenewDto,
  ): Promise<ResponsePayload> {
    try {
      const { name, phoneNo, sslDirect, shop } = createShopRenewDto;

      // Check Phone No
      const isExists = await this.shopModel.exists({ _id: shop });

      if (!isExists) {
        return {
          success: false,
          message: 'Sorry! This shop is not registered! Try another',
        };
      }

      const fShop: any = await this.shopModel
        .findById({ _id: shop })
        .select('startDate package shopType affiliateProductId affiliateId');

      const fPackage = await this.packageModel.findOne({
        _id: fShop.package._id,
      });

      if (!fPackage) {
        throw new BadRequestException('Package not found');
      }

      const fAffiliate: any = await this.affiliateModel.findOne({
        _id: fShop.affiliateId,
      });

      if (fShop.affiliateId && !fAffiliate) {
        return {
          success: false,
          message: 'Affiliate not found.',
        };
        // throw new BadRequestException('Affiliate not found');
      }

      const fAffiliateProduct: any = await this.affiliateProductModel.findOne({
        _id: fShop.affiliateProductId,
      });

      if (fShop.affiliateProductId && !fAffiliateProduct) {
        return {
          success: false,
          message: 'Affiliate Product not found.',
        };
        // throw new BadRequestException('Affiliate Product not found');
      }
      // Step 1: Determine raw start date from fShop.startDate
      const rawStartDate = new Date(fShop.startDate);
      const startDate = new Date(rawStartDate);
      startDate.setDate(startDate.getDate() + 30);
      const baseDate =
        fShop.shopType === 'free' ? new Date() : new Date(startDate);
      const endDate = new Date(baseDate);
      endDate.setDate(endDate.getDate() + 30);
      const extendedDate = this.utilsService.getDateString(endDate);
      const formattedStartDate = this.utilsService.getDateString(startDate);

      const report: any = {
        ...createShopRenewDto,
        shop: shop,
        package: fShop.package,
        starDate:
          fShop.shopType === 'free'
            ? this.utilsService.getDateString(new Date())
            : formattedStartDate,
        endDate: extendedDate,
        month:
          fShop.shopType === 'free'
            ? this.utilsService.getDateMonth(new Date())
            : this.utilsService.getDateMonth(startDate),
        year:
          fShop.shopType === 'free'
            ? this.utilsService.getDateYear(new Date())
            : this.utilsService.getDateYear(startDate),
        amount:
          fShop.shopType === 'free'
            ? fAffiliate && fAffiliateProduct
              ? fPackage.purchasePrice - fAffiliateProduct.discountAmount
              : fPackage.purchasePrice
            : fPackage.renewPrice,
        paymentStatus: 'unpaid',
        renewDate: this.utilsService.getDateString(new Date()),
      };

      const saveData = await this.subscriptionReportModel.create(report);

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

      const callBackBaseUrlSsl = sslCommerzProduction ? apiBaseUrl : apiBaseUrl; // http://localhost:3013

      const sslCommerzInit: SslCommerzInit = {
        baseUrl: sslBaseURL,
        store_id: sslCommerzStoreId,
        store_passwd: sslCommerzStorePassword,
        tran_id: saveData._id.toString(),
        total_amount: report.amount,
        currency: 'BDT',
        // ipn_url: `${callBackBaseUrlSsl}/api/shop/callback-ssl-commerz-payment`,
        success_url: `${callBackBaseUrlSsl}/api/shop/callback-ssl-commerz-payment?status=VALID&tran_id=${saveData._id.toString()}&type='Shop Renew'`,
        fail_url: `${callBackBaseUrlSsl}/api/shop/callback-ssl-commerz-payment?status=FAILED&tran_id=${saveData._id.toString()}&type='Shop Renew'`,
        cancel_url: `${callBackBaseUrlSsl}/api/shop/callback-ssl-commerz-payment?status=CANCELLED&tran_id=${saveData._id.toString()}&type='Shop Renew'`,
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
      return this.payWithSslCommerz(sslCommerzInit, sslDirect, 'Shop Renew');

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
   * Main Ui
   */
  async sendSmsShop(sendPreShopDto: SendPreShopDto): Promise<ResponsePayload> {
    try {
      const redirectUrlBase = this.configService.get<string>('frontendUrl');
      const msg = `Thank you for your payment! Your website is now ready to be built. Get started here: ${redirectUrlBase}/website-builder/${sendPreShopDto?._id}. You can access this link anytime to create and customize your website. Happy building!`;
      this.bulkSmsService.sentSmsByAdmin(sendPreShopDto.phoneNo, msg);
      return {
        success: true,
        message: 'Success!',
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async checkShopAvailability(
    checkShopAvailabilityDto: CheckShopAvailabilityDto,
  ): Promise<ResponsePayload> {
    try {
      const { subDomain } = checkShopAvailabilityDto;

      const fShop = await this.shopModel.exists({ subDomain });
      return {
        success: true,
        message: fShop
          ? 'Shop domain is not available'
          : 'Shop domain is available',
        data: !fShop,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async checkShopAvailabilityAndSentOtp(
    checkShopAvailabilityAndOtpDto: CheckShopAvailabilityAndOtpDto,
  ): Promise<ResponsePayload> {
    try {
      const { domain, phoneNo, email } = checkShopAvailabilityAndOtpDto;

      const fShop = await this.shopModel.exists({ domain });
      if (!fShop) {
        if (email) {
          return this.otpService.generateAdminOtpWithEmail({ email });
        } else {
          return this.otpService.generateAdminOtpWithPhoneNo({ phoneNo });
        }
      } else {
        return {
          success: false,
          message: 'Website domain is not available. Try another!',
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async signupAndCreateShop(
    signupAndCreateShopDto: SignupAndCreateShopDto,
  ): Promise<ResponsePayload> {
    try {
      const {
        preShopId,
        name,
        password,
        email,
        phoneNo,
        domain,
        domainType,
        websiteName,
        themeColor,
        needData,
        isSsr = false,
      } = signupAndCreateShopDto;

      let { cloneWebUrl } = signupAndCreateShopDto;

      const serverIp = this.configService.get<string>('builderServerIp');
      const needWebsiteBuild = true;

      // Find Pre Shop Data
      const preShopData: any = JSON.parse(
        JSON.stringify(await this.preShopModel.findById(preShopId)),
      );

      // Country Data make

      const countryData: any = COUNTRIES.find(
        (c) => c.code === preShopData.countryCode?.toUpperCase(),
      );

      const country = {
        name: countryData?.viewValue ?? 'Bangladesh',
        code: countryData?.code ?? 'BD',
      };

      // Check Payment
      const fPreShopPaid = await this.preShopModel.exists({
        _id: preShopId,
        phoneNo: phoneNo,
        paymentStatus: 'paid',
      });
      if (!fPreShopPaid) {
        return {
          success: false,
          message: `Sorry! payment not completed yet!`,
        } as ResponsePayload;
      }

      // Check Shop Availability
      const fShop = await this.shopModel.exists({ domain: domain });
      if (fShop) {
        return {
          success: false,
          message: `Sorry! website domain name not available for domain`,
        } as ResponsePayload;
      }

      let fPort: any[] = [];
      if (isSsr) {
        fPort = await this.portModel.aggregate([
          {
            $match: { status: 'publish' },
          },
          {
            $sample: { size: 1 },
          },
        ]);

        if (!fPort || (fPort && !fPort.length)) {
          return {
            success: false,
            message: `Sorry! no available port found.`,
          } as ResponsePayload;
        }
      }

      // Find Theme
      const fTheme = preShopData?.themeId
        ? JSON.parse(
          JSON.stringify(
            await this.themeModel.findOne({ _id: preShopData?.themeId }),
          ),
        )
        : JSON.parse(JSON.stringify(await this.themeModel.findOne({})));

      if (!cloneWebUrl) {
        cloneWebUrl = fTheme.reference ? fTheme.reference.split(',')[0] : null;
      }

      // Find Package
      const fPackage = await this.packageModel.findOne({
        _id: preShopData?.packageId,
      });

      if (!fPackage) {
        return {
          success: false,
          message: `Sorry! no package selected.`,
        } as ResponsePayload;
      }

      // Register new Vendor

      if (email) {
        const existingEmail = await this.vendorModel.findOne({ email });
        if (existingEmail) {
          return {
            success: false,
            message: `Sorry! Email already exists`,
            data: null,
          } as ResponsePayload;
        }
      }

      if (phoneNo) {
        const existingPhoneNo = await this.vendorModel.findOne({ phoneNo });
        if (existingPhoneNo) {
          return {
            success: false,
            message: `Sorry! Phone number already exists`,
            data: null,
          } as ResponsePayload;
        }
      }
      const salt = await bcrypt.genSalt();
      const hashedPass = await bcrypt.hash(password, salt);

      const vendorRegData: any = {
        name: name,
        username: null,
        phoneNo: phoneNo,
        email: email,
        registrationType: 'default',
        isPasswordLess: false,
        password: hashedPass,
        registrationAt: this.utilsService.getDateString(new Date()),
        lastLoggedIn: null,
        role: 'owner',
        status: 'active',
      };

      const saveVendorData = await this.vendorModel.create(vendorRegData);

      // Create shop
      const shopData: any = {
        ...signupAndCreateShopDto,
        ...{
          dateString: this.utilsService.getDateString(new Date()),
          owner: saveVendorData._id,
          theme: fTheme,
          package: fPackage,
          port: null,
          users: [
            {
              _id: saveVendorData._id,
              username: vendorRegData.username,
              email: vendorRegData.email,
              phoneNo: vendorRegData.phoneNo,
              role: 'admin',
            },
          ],
          buildStatus: 'complete',
          status: 'publish',
          startDate: this.utilsService.getDateString(new Date()),
          paymentStatus: 'custom',
          affiliateId: preShopData.affiliateId ?? null,
          affiliateProductId: preShopData.affiliateProductId ?? null,
          shopType: preShopData.shopType ?? null,
          trialPeriod: preShopData.trialPeriod ?? 0,
          country: country,
        },
      };
      // const saveShop:any = { };
      const saveShop = await this.shopModel.create(shopData);

      // Create Affiliate Sale Report
      if (preShopData?.affiliateId && preShopData.shopType === 'professional') {
        await this.createAffiliateReport(saveShop);
        // console.log( 'professional');
      }

      // Update Shop Information
      await this.shopInformationModel.create({
        shop: saveShop._id,
        websiteName: websiteName,
        fabIcon: 'https://cdn.tradition.com/upload/static/favicon.ico',
        shortDescription:
          'A Best Online shop in Bangladesh, All the product are available online.',
        socialLinks: [
          {
            type: 0,
            value: 'https://facebook.com',
          },
          {
            type: 5,
            value: 'https://tiktok.com',
          },
          {
            type: 1,
            value: 'https://youtube.com',
          },
          {
            type: 3,
            value: 'https://instagram.com',
          },
        ],
        addresses: [
          {
            type: null,
            value: 'Mirpur 10, Dhaka, Bangladesh',
          },
        ],
        emails: [
          {
            type: null,
            value: 'mail@gmail.com',
          },
        ],
        phones: [
          {
            type: null,
            value: '+8801000000000',
          },
        ],
        whatsappNumber: '+8801000000000',
      });

      // Update Port
      if (isSsr) {
        await this.portModel.findByIdAndUpdate(fPort[0]._id, {
          $set: {
            status: 'running',
          },
        });
      }

      // Update Settings
      const themeViewSettings = fTheme.themeCustomOptions.map(
        (option: any) => ({
          type: option.type,
          value: option.value
            .filter((val: any) => val.isDefault)
            .map((val: any) => val.name),
        }),
      );

      const pageViewSettings = fTheme.pageCustomOptions.flatMap((option: any) =>
        option.value
          .filter((val: any) => val.isDefault) // Filter items where isDefault is false
          .map((val: any) => ({
            name: val.name,
            type: option.type,
            isLoginRequire: val.isLoginRequire,
          })),
      );

      const fThemeSubcategory = await this.themeSubCategoryModel
        .findById(fTheme?.subCategory?._id)
        .select('searchHints');

      await this.settingModel.create({
        shop: saveShop._id,
        websiteName: websiteName,
        pageViewSettings: pageViewSettings,
        themeViewSettings: themeViewSettings,
        themeColors: themeColor,
        searchHints: fThemeSubcategory?.searchHints,
        currency: {
          name: 'Bangladesh',
          code: 'BDT',
          symbol: '৳',
        },
        country: country,
      });

      if (needWebsiteBuild) {
        const buildScript: BuildScript = {
          sourcePath: fTheme.sourcePath,
          targetPath: fTheme.targetPath,
          port: shopData.port,
          domainType: domainType,
          domain: shopData.domain,
          pm2path: fTheme.pm2path,
          email: email,
          shop: saveShop._id.toString(),
          serverIp: serverIp,
          needWww: false,
          isSsr: isSsr,
        };

        const productionBuild =
          this.configService.get<string>('productionBuild');

        if (productionBuild) {
          await this.buildScriptService.buildWebsiteFromScript(buildScript);
          const msg = `Your website has been created successfully with tradition. Website Url: https://${shopData.domain} , Admin Url: https://admin.tradition.com , Username: ${phoneNo} Password: ${password}`;
          this.bulkSmsService.sentSmsByAdmin(phoneNo, msg);
          if (email) {
            // Sent Email
            const html = `<div style="width: 400px; font-family: Helvetica;">
        <div style="margin-bottom: 5px; padding: 0 10px;">
          <img src="https://cdn.tradition.com/upload/static/tradition-logo.png" width="50" style="height: auto;" loading="lazy"/>
 
      </div>
        <div style="background: #f1f1f1; font-size: 20px; padding: 5px 10px; line-height: 0;">
            <h4>Hello,</h4>
        </div>

              <div style="font-family: Helvetica, Arial, sans-serif; line-height: 1.6;">
              <p>Your website has been created successfully with <strong>tradition</strong>!</p>

            <p><strong>Website URL:</strong> 
            <a href="https://${shopData.domain}" target="_blank" style="color: #2a7ae2;">
              https://${shopData.domain}
            </a>
            </p>

            <p><strong>Admin Panel:</strong> 
            <a href="https://admin.tradition.com" target="_blank" style="color: #2a7ae2;">
              https://admin.tradition.com
            </a>
            </p>

            <p><strong>Login Credentials:</strong><br/>
            Username: <strong>${phoneNo}</strong><br/>
            Password: <strong>${password}</strong>
            </p>

            <p>We recommend changing your password after first login.</p>
            </div>
             

        </div>`;
            await this.emailService.sendEmail(
              email,
              'Your website info has been created.',
              html,
            );
          }
        }
      }

      if (needData) {
        const fromShop = await this.shopModel.findOne({
          domain: cloneWebUrl ?? 'gadgetshob.tradition.shop',
        });
        if (fromShop) {
          const data: any = {
            fromShop: fromShop._id,
            toShop: saveShop._id,
          };
          await this.cloneDataFromShop(data);
        }
      }

      // Update Pre Build Status
      await this.preShopModel.findByIdAndUpdate(preShopId, {
        $set: {
          websiteBuildStatus: 'completed',
        },
      });

      return {
        success: true,
        data: {
          shop: saveShop._id,
        },
        message: `Success! Shop created successfully`,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * checkShopAvailability()
   * buildShop()
   * insertManyShop()
   * getAllShop()
   * getAllShopBasic()
   * getShopById()
   * updateShopById()
   * updateMultipleShopById()
   * deleteShopById()
   * deleteMultipleShopById()
   * getShopCategory()
   * getShopSubCategory()
   */

  async createVendorAndShop(
    addVendorAndShopDto: AddVendorAndShopDto,
  ): Promise<ResponsePayload> {
    try {
      const {
        name,
        username,
        password,
        email,
        phoneNo,
        theme,
        domain,
        packageId,
        registrationType,
        websiteName,
        themeColor,
        needWebsiteBuild,
        serverIp,
        domainType,
        needData,
        isSsr,
        cloneWebUrl,
      } = addVendorAndShopDto;

      // Check Shop Availability
      const fShop = await this.shopModel.exists({ domain: domain });
      if (fShop) {
        return {
          success: false,
          message: `Sorry! website domain name not available for domain`,
        } as ResponsePayload;
      }

      let fPort: any;
      if (isSsr) {
        fPort = await this.portModel.aggregate([
          {
            $match: { status: 'publish' },
          },
          {
            $sample: { size: 1 },
          },
        ]);

        if (!fPort || (fPort && !fPort.length)) {
          return {
            success: false,
            message: `Sorry! no available port found.`,
          } as ResponsePayload;
        }
      }

      // Find Theme
      const fTheme = JSON.parse(
        JSON.stringify(await this.themeModel.findById(theme)),
      );

      // Find Package
      const fPackage = await this.packageModel.findById(packageId);

      if (!fPackage) {
        return {
          success: false,
          message: `Sorry! no package selected.`,
        } as ResponsePayload;
      }

      // Register new Vendor
      if (registrationType !== 'default') {
        return {
          success: false,
          message: 'Sorry! Only default registration is available',
          data: null,
        } as ResponsePayload;
      }

      if (username) {
        const existingUsername = await this.vendorModel.findOne({ username });
        if (existingUsername) {
          return {
            success: false,
            message: `Sorry! Username already exists`,
            data: null,
          } as ResponsePayload;
        }
      }

      if (email) {
        const existingEmail = await this.vendorModel.findOne({ email });
        if (existingEmail) {
          return {
            success: false,
            message: `Sorry! Email already exists`,
            data: null,
          } as ResponsePayload;
        }
      }

      if (phoneNo) {
        const existingPhoneNo = await this.vendorModel.findOne({ phoneNo });
        if (existingPhoneNo) {
          return {
            success: false,
            message: `Sorry! Phone number already exists`,
            data: null,
          } as ResponsePayload;
        }
      }
      const salt = await bcrypt.genSalt();
      const hashedPass = await bcrypt.hash(password, salt);

      const vendorRegData: any = {
        name: name,
        username: username,
        phoneNo: phoneNo,
        email: email,
        registrationType: registrationType,
        isPasswordLess: false,
        password: hashedPass,
        registrationAt: this.utilsService.getDateString(new Date()),
        lastLoggedIn: null,
        role: 'owner',
        status: 'active',
      };

      const saveVendorData = await this.vendorModel.create(vendorRegData);

      // Create shop
      const shopData: any = {
        ...addVendorAndShopDto,
        ...{
          dateString: this.utilsService.getDateString(new Date()),
          owner: saveVendorData._id,
          theme: fTheme,
          package: fPackage,
          port: isSsr ? fPort[0].port : null,
          users: [
            {
              _id: saveVendorData._id,
              username: vendorRegData.username,
              email: vendorRegData.email,
              phoneNo: vendorRegData.phoneNo,
              role: 'admin',
            },
          ],
          buildStatus: 'complete',
          status: 'publish',
          startDate: this.utilsService.getDateString(new Date()),
          paymentStatus: 'custom',
          country: {
            name: 'Bangladesh',
            code: 'BD',
          },
        },
      };
      const saveShop = await this.shopModel.create(shopData);

      // Update Shop Information
      await this.shopInformationModel.create({
        shop: saveShop._id,
        websiteName: websiteName,
        fabIcon: 'https://cdn.tradition.com/upload/static/favicon.ico',
        shortDescription:
          'A Best Online shop in Bangladesh, All the product are available online.',
        socialLinks: [
          {
            type: 0,
            value: 'https://facebook.com',
          },
          {
            type: 5,
            value: 'https://tiktok.com',
          },
          {
            type: 1,
            value: 'https://youtube.com',
          },
          {
            type: 3,
            value: 'https://instagram.com',
          },
        ],
        addresses: [
          {
            type: null,
            value: 'Mirpur 10, Dhaka, Bangladesh',
          },
        ],
        emails: [
          {
            type: null,
            value: 'mail@gmail.com',
          },
        ],
        phones: [
          {
            type: null,
            value: '+8801000000000',
          },
        ],
        whatsappNumber: '+8801000000000',
      });

      // Update Port
      if (isSsr) {
        await this.portModel.findByIdAndUpdate(fPort[0]._id, {
          $set: {
            status: 'running',
          },
        });
      }

      // Update Settings
      const themeViewSettings = fTheme.themeCustomOptions.map(
        (option: any) => ({
          type: option.type,
          value: option.value
            .filter((val: any) => val.isDefault)
            .map((val: any) => val.name),
        }),
      );

      const pageViewSettings = fTheme.pageCustomOptions.flatMap((option: any) =>
        option.value
          .filter((val: any) => val.isDefault) // Filter items where isDefault is false
          .map((val: any) => ({
            name: val.name,
            type: option.type,
            isLoginRequire: val.isLoginRequire,
          })),
      );

      const fThemeSubcategory = await this.themeSubCategoryModel
        .findById(fTheme?.subCategory?._id)
        .select('searchHints');

      await this.settingModel.create({
        shop: saveShop._id,
        websiteName: websiteName,
        pageViewSettings: pageViewSettings,
        themeViewSettings: themeViewSettings,
        themeColors: themeColor,
        searchHints: fThemeSubcategory?.searchHints,
        currency: {
          name: 'Bangladesh',
          code: 'BDT',
          symbol: '৳',
        },
        country: {
          name: 'Bangladesh',
          code: 'BD',
        },
      });

      if (needWebsiteBuild) {
        const buildScript: BuildScript = {
          sourcePath: fTheme.sourcePath,
          targetPath: fTheme.targetPath,
          port: shopData.port ?? null,
          domain: shopData.domain,
          pm2path: fTheme.pm2path,
          shop: saveShop._id.toString(),
          serverIp: serverIp,
          isSsr: isSsr,
          domainType: domainType,
          buildType: null,
          oldDomainType: null,
        };

        // console.log('buildScript', buildScript);

        const productionBuild =
          this.configService.get<string>('productionBuild');

        if (productionBuild) {
          await this.buildScriptService.buildWebsiteFromScript(buildScript);
        }
      }

      if (needData) {
        const fromShop = await this.shopModel.findOne({
          domain: cloneWebUrl ?? 'gadgetshob.tradition.shop',
        });
        if (fromShop) {
          const data: any = {
            fromShop: fromShop._id,
            toShop: saveShop._id,
          };
          await this.cloneDataFromShop(data);
        }
      }

      return {
        success: true,
        data: {
          shop: saveShop._id,
        },
        message: `Success! Shop created successfully`,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteShop(
    deleteShopDto: DeleteShopDto,
  ): Promise<ResponsePayload> {
    try {
      const { shop, needUserDelete, needWebsiteDelete, needDataDelete } =
        deleteShopDto;
      const fShop = await this.shopModel.findById(shop);
      if (!fShop) {
        return {
          success: false,
          message: `Sorry! no shop found.`,
        } as ResponsePayload;
      }

      const productionBuild = this.configService.get<string>('productionBuild');

      if (needUserDelete) {
        const users = fShop.users.map((m: any) => new ObjectId(m._id));
        await this.vendorModel.deleteMany({ _id: users });
      }

      if (needDataDelete) {
        const collections = await this.connection.db.collections(); // Get all collections

        const objectId = new ObjectId(shop); // Convert to ObjectId if needed

        for (const collection of collections) {
          if (collection.collectionName === 'system.profile') {
            // Skipping system collection
            continue;
          }
          const result = await collection.deleteMany({ shop: objectId }); // Delete documents
          console.log(
            `Deleted ${result.deletedCount} documents from collection: ${collection.collectionName}`,
          );
        }
      }

      if (needWebsiteDelete) {
        const fTheme = await this.themeModel.findById(fShop.theme._id);

        const buildScript: DeleteBuildScript = {
          targetPath: fTheme.targetPath,
          domainType: fShop.domainType,
          domain: fShop.domain,
          needRemoveDomain: fShop.domainType === 'sub-domain',
          isSsr: fShop.isSsr,
        };

        // Update Port
        await this.portModel.findOneAndUpdate(
          { port: fShop.port },
          {
            $set: {
              status: 'publish',
            },
          },
        );

        if (productionBuild) {
          await this.buildScriptService.deleteWebsiteFromScript(buildScript);
        }
      }

      await this.shopModel.findByIdAndDelete(fShop._id);

      if (productionBuild) {
        // Delete CDN Folder
        this.httpService
          .delete(
            `https://cdn.tradition.com/upload/delete-folder?shop=${fShop._id}`,
          )
          .subscribe();
      }

      return {
        success: true,
        message: 'Success! Website update.',
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteMultiShop(
    key: string,
    deleteShopDto2: DeleteShopDto[],
  ): Promise<ResponsePayload> {
    try {
      console.log('key', key);
      console.log('deleteShopDto2', deleteShopDto2);

      if (!key || key !== '0UbmDzSzvFtb/bksSWciZLlHKb6gp96gwRlj2rTrVKo=') {
        return {
          success: false,
          message: 'Ops! Something went wrong',
        } as ResponsePayload;
      }

      for (const deleteShopDto of deleteShopDto2) {
        const { domain, needUserDelete, needWebsiteDelete, needDataDelete } =
          deleteShopDto;
        const fShop = await this.shopModel.findOne({ domain: domain });
        if (!fShop) {
          return {
            success: false,
            message: `Sorry! no shop found.`,
          } as ResponsePayload;
        }

        const productionBuild =
          this.configService.get<string>('productionBuild');

        if (needUserDelete) {
          const users = fShop.users.map((m: any) => new ObjectId(m._id));
          await this.vendorModel.deleteMany({ _id: users });
        }

        if (needDataDelete) {
          const collections = await this.connection.db.collections(); // Get all collections

          const objectId = new ObjectId(fShop._id); // Convert to ObjectId if needed

          for (const collection of collections) {
            if (collection.collectionName === 'system.profile') {
              // Skipping system collection
              continue;
            }
            const result = await collection.deleteMany({ shop: objectId }); // Delete documents
            console.log(
              `Deleted ${result.deletedCount} documents from collection: ${collection.collectionName}`,
            );
          }
        }

        if (needWebsiteDelete) {
          const fTheme = await this.themeModel.findById(fShop.theme._id);

          const buildScript: DeleteBuildScript = {
            targetPath: fTheme.targetPath,
            domainType: fShop.domainType,
            domain: fShop.domain,
            needRemoveDomain: fShop.domainType === 'sub-domain',
            isSsr: fShop.isSsr,
          };

          // Update Port
          await this.portModel.findOneAndUpdate(
            { port: fShop.port },
            {
              $set: {
                status: 'publish',
              },
            },
          );

          if (productionBuild) {
            await this.buildScriptService.deleteWebsiteFromScript(buildScript);
          }
        }

        await this.shopModel.findByIdAndDelete(fShop._id);

        if (productionBuild) {
          // Delete CDN Folder
          this.httpService
            .delete(
              `https://cdn.tradition.com/upload/delete-folder?shop=${fShop._id}`,
            )
            .subscribe();
        }
      }

      return {
        success: true,
        message: 'Success! Website update.',
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async exportShopData(shopId: string): Promise<string> {
    const collections = await this.connection.db.collections();
    const exportDir = path.join(os.tmpdir(), `shop-export-${Date.now()}`);
    fs.mkdirSync(exportDir, { recursive: true });

    const objectId = new ObjectId(shopId);
    let domain = `shop-${shopId}`;
    let hasData = false;
    const vendorIdsSet = new Set<string>();
    let vendorData: any[] = [];

    // Fetch shop
    const shop = await this.connection.db
      .collection('shops')
      .findOne({ _id: objectId });
    if (shop) {
      domain = shop?.domain?.trim() || domain;
      if (Array.isArray(shop.users)) {
        for (const user of shop.users) {
          if (user?._id) {
            vendorIdsSet.add(user._id.toString());
          }
        }
      }
    }

    const shopDir = path.join(exportDir, domain);
    fs.mkdirSync(shopDir, { recursive: true });

    for (const collection of collections) {
      let data: any[] = [];

      if (collection.collectionName === 'shops') {
        data = shop ? [shop] : [];
      } else {
        data = await collection.find({ shop: objectId }).toArray();
      }

      if (data.length > 0) {
        hasData = true;

        // Write raw BSON documents one by one
        const bsonFilePath = path.join(
          shopDir,
          `${collection.collectionName}.bson`,
        );
        const bsonFd = fs.openSync(bsonFilePath, 'w');
        for (const doc of data) {
          const buffer = BSON.serialize(doc);
          fs.writeSync(bsonFd, buffer);
        }
        fs.closeSync(bsonFd);

        // Metadata
        const collectionInfo: any = await this.connection.db
          .listCollections({ name: collection.collectionName })
          .next();
        const metadata = {
          indexes: await collection.indexes(),
          uuid: collectionInfo?.uuid || undefined,
          collectionName: collection.collectionName,
          type: 'collection',
        };
        const metaFileName = `${collection.collectionName}.metadata.json`;
        fs.writeFileSync(
          path.join(shopDir, metaFileName),
          JSON.stringify(metadata, null, 2),
        );
        console.log(`✔ ${collection.collectionName}: ${data.length} items`);
      }
    }

    // Vendors export
    if (vendorIdsSet.size > 0) {
      const vendorCollection = this.connection.db.collection('vendors');
      const vendorObjectIds = Array.from(vendorIdsSet)
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));

      if (vendorObjectIds.length > 0) {
        vendorData = await vendorCollection
          .find({ _id: { $in: vendorObjectIds } })
          .toArray();

        if (vendorData.length > 0) {
          hasData = true;

          const vendorBsonFd = fs.openSync(
            path.join(shopDir, 'vendors.bson'),
            'w',
          );
          for (const doc of vendorData) {
            const buffer = BSON.serialize(doc);
            fs.writeSync(vendorBsonFd, buffer);
          }
          fs.closeSync(vendorBsonFd);

          const collectionInfo: any = await this.connection.db
            .listCollections({ name: 'vendors' })
            .next();
          const metadata = {
            indexes: await vendorCollection.indexes(),
            uuid: collectionInfo?.uuid || undefined,
            collectionName: 'vendors',
            type: 'collection',
          };
          fs.writeFileSync(
            path.join(shopDir, 'vendors.metadata.json'),
            JSON.stringify(metadata, null, 2),
          );
          console.log(`✔ Vendors: ${vendorData.length} items`);
        }
      }
    }

    if (!hasData) {
      fs.writeFileSync(
        path.join(shopDir, 'README.txt'),
        'No data found for this shop.',
      );
    }

    // Zip the export directory
    const zipPath = `${exportDir}.zip`;
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(shopDir, domain);
    await archive.finalize();

    // Remove temp folder
    fs.rmSync(exportDir, { recursive: true, force: true });

    return zipPath;
  }

  // cluster
  // async exportShopData(shopId: string): Promise<string> {
  //   const mongoClient = await MongoClient.connect(
  //     'mongodb+srv://softlabit:M5LiBL43wpMtrEy9@test-softlab.ptacstn.mongodb.net/?retryWrites=true&w=majority',
  //   );
  //
  //   const db = mongoClient.db('tradition');
  //   const collectionInfos = await db.listCollections().toArray();
  //   const collections = collectionInfos.map((c) => c.name);
  //
  //   const tempRootDir = path.join(os.tmpdir(), `shop-export-${Date.now()}`);
  //   fs.mkdirSync(tempRootDir, { recursive: true });
  //
  //   const objectId = new ObjectId(shopId);
  //   let domain = `shop-${shopId}`; // default fallback
  //   const vendorIdsSet = new Set<string>();
  //   let vendorData: any[] = [];
  //   let hasData = false;
  //
  //   // Fetch domain name from shops collection
  //   const shopData = await db.collection('shops').findOne({ _id: objectId });
  //   if (shopData?.domain?.trim()) {
  //     domain = shopData.domain.trim();
  //   }
  //
  //   const shopFolderPath = path.join(tempRootDir, domain);
  //   fs.mkdirSync(shopFolderPath, { recursive: true }); // ✅ make domain folder
  //
  //   for (const collectionName of collections) {
  //     const collection = db.collection(collectionName);
  //     let data: any[] = [];
  //
  //     if (collectionName === 'shops') {
  //       data = shopData ? [shopData] : [];
  //
  //       // Collect vendor IDs
  //       if (Array.isArray(shopData?.users)) {
  //         for (const user of shopData.users) {
  //           if (user?._id) {
  //             vendorIdsSet.add(user._id.toString());
  //           }
  //         }
  //       }
  //     } else {
  //       data = await collection.find({ shop: objectId }).toArray();
  //     }
  //
  //     console.log(`Collection: ${collectionName}, Data Count: ${data.length}`);
  //
  //     if (data.length > 0) {
  //       hasData = true;
  //       const buffer = BSON.serialize({ data });
  //       const filePath = path.join(shopFolderPath, `${collectionName}.bson`);
  //       fs.writeFileSync(filePath, buffer);
  //     }
  //   }
  //
  //   // Vendors
  //   if (vendorIdsSet.size > 0) {
  //     const vendorObjectIds = Array.from(vendorIdsSet)
  //       .filter((id) => ObjectId.isValid(id))
  //       .map((id) => new ObjectId(id));
  //
  //     if (vendorObjectIds.length > 0) {
  //       vendorData = await db
  //         .collection('vendors')
  //         .find({ _id: { $in: vendorObjectIds } })
  //         .toArray();
  //
  //       if (vendorData.length > 0) {
  //         hasData = true;
  //         const buffer = BSON.serialize({ data: vendorData });
  //         const filePath = path.join(shopFolderPath, 'vendors.bson');
  //         fs.writeFileSync(filePath, buffer);
  //         console.log(`Vendors found: ${vendorData.length}`);
  //       }
  //     }
  //   }
  //
  //   if (!hasData) {
  //     fs.writeFileSync(
  //       path.join(shopFolderPath, 'README.txt'),
  //       'No data found for this shop.',
  //     );
  //   }
  //
  //   // Create zip
  //   const zipPath = `${tempRootDir}.zip`;
  //   const output = fs.createWriteStream(zipPath);
  //   const archive = archiver('zip', { zlib: { level: 9 } });
  //
  //   archive.pipe(output);
  //   archive.directory(tempRootDir, false); // include domain folder
  //   await archive.finalize();
  //
  //   await mongoClient.close();
  //
  //   // Cleanup
  //   fs.rmSync(tempRootDir, { recursive: true, force: true });
  //
  //   return zipPath;
  // }

  async createShop(
    addShopDto: AddShopDto,
  ): Promise<ResponsePayload> {
    try {
      const {
        theme,
        domain,
        subDomain,
        packageId,
        owner,
        websiteName,
        needWebsiteBuild,
      } = addShopDto;

      let filter: any;
      if (domain) {
        filter = { domain: domain };
      } else {
        filter = { subDomain: subDomain };
      }

      // Check Shop Availability
      const fShop = await this.shopModel.exists(filter);
      if (fShop) {
        return {
          success: false,
          message: `Sorry! website domain name not available for domain`,
        } as ResponsePayload;
      }

      const fPort = await this.portModel.aggregate([
        {
          $match: { status: 'publish' },
        },
        {
          $sample: { size: 1 },
        },
      ]);

      if (!fPort || (fPort && !fPort.length)) {
        return {
          success: false,
          message: `Sorry! no available port found.`,
        } as ResponsePayload;
      }

      // Find Theme
      const fTheme = JSON.parse(
        JSON.stringify(await this.themeModel.findById(theme)),
      );

      // Find Package
      const fPackage = await this.packageModel.findById(packageId);

      if (!fPackage) {
        return {
          success: false,
          message: `Sorry! no package selected.`,
        } as ResponsePayload;
      }

      const fVendor = await this.vendorModel.findById(owner);
      if (fVendor?.role !== 'owner') {
        return {
          success: false,
          message: `Sorry! this role can not open a shop`,
        } as ResponsePayload;
      }

      // Create shop
      const shopData: any = {
        ...addShopDto,
        ...{
          dateString: this.utilsService.getDateString(new Date()),
          owner: owner,
          theme: fTheme,
          package: fPackage,
          port: fPort[0].port,
          users: [
            {
              _id: fVendor._id,
              username: fVendor.username,
              email: fVendor.email,
              phoneNo: fVendor.phoneNo,
              role: 'admin',
            },
          ],
          buildStatus: 'complete',
          status: 'publish',
          startDate: this.utilsService.getDateString(new Date()),
          paymentStatus: 'custom',
        },
      };
      const saveShop = await this.shopModel.create(shopData);

      // Update Shop Information
      await this.shopInformationModel.create({
        shop: saveShop._id,
        websiteName: websiteName,
      });

      // Update Port
      await this.portModel.findByIdAndUpdate(fPort[0]._id, {
        $set: {
          status: 'running',
        },
      });

      // Update Settings
      const filteredThemeCustomOptions = fTheme.themeCustomOptions
        .map((option: any) => ({
          ...option,
          value: option.value.filter((item: any) => item.isDefault),
        }))
        .filter((option: any) => option.value.length > 0);
      await this.settingModel.create({
        shop: saveShop._id,
        websiteName: websiteName,
        themeCustomOptions: filteredThemeCustomOptions,
      });
      return {
        success: true,
        data: {
          shop: saveShop._id,
        },
        message: `Success! Shop created successfully`,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getSettingByShop(shop: string): Promise<ResponsePayload> {
    try {
      const fSetting = JSON.parse(
        JSON.stringify(
          await this.settingModel.findOne({ shop: shop }).select(
            [
              'shop',
              'themeColors',
              'themeViewSettings',
              'pageViewSettings',
              'searchHints',
              'orderLanguage',
              'productSetting',
              'currency',
              'analytics.IsManageFbPixelByTagManager',
              'analytics.tagManagerId',
              'analytics.facebookPixelId',
              // _id বাদ
              '-_id',
            ].join(' '),
          ),
        ),
      );
      return {
        success: true,
        message: 'Success',
        data: fSetting,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async versionUpdateByShop(shopId: string): Promise<ResponsePayload> {
    try {
      // Check Shop Availability
      const fShop = await this.shopModel.findById(shopId);
      if (!fShop) {
        return {
          success: false,
          message: `Sorry! no shop found.`,
        } as ResponsePayload;
      }

      // Find Theme
      const fTheme = await this.themeModel.findById(fShop.theme?._id);

      if (!fTheme) {
        return {
          success: false,
          message: `Sorry! this theme is not available for update.`,
        } as ResponsePayload;
      }

      if (fShop.theme?.version === fTheme?.version) {
        return {
          success: false,
          message: `Sorry! this website already in the latest version`,
        } as ResponsePayload;
      }

      let domain: any;
      if (fShop.domain) {
        domain = fShop.domain;
      } else {
        domain = fShop.subDomain;
      }

      const buildScript: UpdateBuildScript = {
        sourcePath: fTheme.sourcePath,
        targetPath: fTheme.targetPath,
        domain: domain,
        shop: fShop._id.toString(),
      };

      // Update Shop Theme
      await this.shopModel.findByIdAndUpdate(fShop._id, {
        $set: {
          updateStatus: 'pending',
          theme: fTheme,
        },
      });

      const productionBuild = this.configService.get<string>('productionBuild');

      if (productionBuild) {
        await this.buildScriptService.updateWebsiteFromScript(buildScript);
      }

      return {
        success: true,
        message: 'Success! updated successfully',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err);
    }
  }

  async shopsVersionUpdateByTheme(themeId: string): Promise<ResponsePayload> {
    try {
      // 1. Find Theme
      const fTheme = await this.themeModel.findById(themeId).lean();
      if (!fTheme) {
        return {
          success: false,
          message: `Sorry! This theme is not available for update.`,
        };
      }

      // 2. Find Shops needing update

      const allShops = await this.shopModel
        .find({
          'theme._id': new ObjectId(themeId),
          'theme.version': { $ne: fTheme.version },
          $nor: [{ 'customServer.ui': true }, { 'customServer.admin': true }],
        })
        .select('_id domain')
        .lean();

      const totalShops = allShops.length;

      if (totalShops === 0) {
        return {
          success: true,
          message: 'All shops are already up to date.',
        };
      }

      // 3. Mark as pending
      await this.shopModel.updateMany(
        {
          'theme._id': new ObjectId(themeId),
          'theme.version': { $ne: fTheme.version },
        },
        { $set: { updateStatus: 'pending', theme: fTheme } },
      );

      // 4. Respond early — estimated time
      const delayPerShopMs = 1500;
      const estimatedTimeInSeconds = Math.ceil(
        (totalShops * delayPerShopMs) / 1000,
      );

      // 5. Run background task (non-blocking, no await)
      this.updateShopsInBackground(allShops, fTheme);

      return {
        success: true,
        message: `Update started for ${totalShops} shops. Estimated time: ~${estimatedTimeInSeconds} seconds.`,
        data: {
          timeInSec: estimatedTimeInSeconds,
          totalShop: totalShops,
        },
      };
    } catch (err) {
      console.error('Error updating shops version:', err);
      throw new InternalServerErrorException(err.message);
    }
  }

  private async updateShopsInBackground(
    allShops: any[],
    fTheme: any,
  ): Promise<void> {
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    for (const [index, shop] of allShops.entries()) {
      try {
        const buildScript: UpdateBuildScript = {
          sourcePath: fTheme.sourcePath,
          targetPath: fTheme.targetPath,
          domain: shop.domain,
          shop: shop._id.toString(),
        };
        const productionBuild =
          this.configService.get<string>('productionBuild');
        if (productionBuild) {
          await this.buildScriptService.updateWebsiteFromScript(buildScript);
        }

        // Optional: Update status in DB
        await this.shopModel.updateOne(
          { _id: shop._id },
          { $set: { updateStatus: 'success' } },
        );

        console.log(
          `✅ [${index + 1}/${allShops.length}] Shop updated-${shop._id}: ${shop.domain}`,
        );
      } catch (error) {
        console.error(`❌ Failed to update shop ${shop._id}:`, error);

        await this.shopModel.updateOne(
          { _id: shop._id },
          { $set: { updateStatus: 'failed', updateError: error.message } },
        );
      }

      await delay(1500); // Wait 1.5 second before next
    }
  }

  async changeThemeByShop(
    shopId: string,
    changeThemeDto: ChangeThemeDto,
  ): Promise<ResponsePayload> {
    try {
      const { theme, cloneWebUrl, needReset } = changeThemeDto;
      // Check Shop Availability
      const fShop = await this.shopModel.findById(shopId);
      if (!fShop) {
        return {
          success: false,
          message: `Sorry! no shop found.`,
        } as ResponsePayload;
      }

      if (fShop.theme?._id.toString() === theme) {
        return {
          success: false,
          message: `Sorry! this theme is already you have`,
        } as ResponsePayload;
      }

      // Find Theme
      const fTheme = await this.themeModel.findById(theme);

      if (!fTheme) {
        return {
          success: false,
          message: `Sorry! this theme is not available for update.`,
        } as ResponsePayload;
      }

      const buildScript: UpdateBuildScript = {
        sourcePath: fTheme.sourcePath,
        targetPath: fTheme.targetPath,
        domain: fShop.domain,
        shop: fShop._id.toString(),
      };

      // Update Shop Theme
      await this.shopModel.findByIdAndUpdate(fShop._id, {
        $set: {
          updateStatus: 'pending',
          theme: fTheme,
        },
      });

      if (needReset) {
        await this.carouselModel.deleteMany({ shop: new Object(shopId) });
        await this.categoryModel.deleteMany({ shop: new Object(shopId) });
        await this.subCategoryModel.deleteMany({ shop: new Object(shopId) });
        await this.brandModel.deleteMany({ shop: new Object(shopId) });
        await this.tagModel.deleteMany({ shop: new Object(shopId) });
        await this.productModel.deleteMany({ shop: new Object(shopId) });

        const fromShop = await this.shopModel.findOne({
          domain: cloneWebUrl,
        });
        if (fromShop) {
          const data: any = {
            fromShop: fromShop._id,
            toShop: fShop._id,
          };
          await this.cloneDataFromShop(data);
        }
      }

      const productionBuild = this.configService.get<string>('productionBuild');

      if (productionBuild) {
        await this.buildScriptService.updateWebsiteFromScript(buildScript);
      }

      return {
        success: true,
        message: 'Success! updated successfully',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err);
    }
  }

  async changeDomainByVendor(
    vendor: Vendor,
    shop: string,
    changeDomainDto: ChangeDomainDto,
  ): Promise<ResponsePayload> {
    try {
      const { domain } = changeDomainDto;

      const fShop = await this.shopModel.findOne({
        owner: vendor._id,
        _id: shop,
      });
      if (!fShop) {
        return {
          success: false,
          message: `Sorry! only owner can change domain!`,
        } as ResponsePayload;
      }

      const mDomain = domain.trim().toLowerCase();

      if (!this.utilsService.isValidDomain(mDomain)) {
        return {
          success: false,
          message: `Sorry! your domain is invalid!`,
        } as ResponsePayload;
      }

      if (mDomain === fShop.domain) {
        return {
          success: false,
          message: `Sorry! current domain and new domain is same!`,
        } as ResponsePayload;
      }

      // Find Theme
      const fTheme = await this.themeModel.findById(fShop.theme?._id);

      if (!fTheme) {
        return {
          success: false,
          message: `Sorry! this theme is not available.`,
        } as ResponsePayload;
      }

      const resCheckDomain: any =
        await this.buildScriptService.checkDomain(mDomain);

      if (
        !resCheckDomain?.aRecord.valid ||
        !resCheckDomain?.cnameRecord.valid
      ) {
        return {
          success: false,
          message: `Sorry! domain record is not valid.`,
          data: resCheckDomain,
        } as ResponsePayload;
      }

      const serverIp = this.configService.get<string>('builderServerIp');
      const needWebsiteBuild = true;

      // Update Shop Domain
      await this.shopModel.findByIdAndUpdate(fShop._id, {
        $set: {
          domain: mDomain,
          domainType: 'domain-http-www',
          buildStatus: 'pending',
        },
      });

      if (needWebsiteBuild) {
        const buildScript: BuildScript = {
          sourcePath: fTheme.sourcePath,
          targetPath: fTheme.targetPath,
          port: fShop.port,
          domainType: 'domain-http-www',
          domain: mDomain,
          pm2path: fTheme.pm2path,
          email: 'sakibs.ngn@gmail.com',
          shop: fShop._id.toString(),
          serverIp: serverIp,
          isSsr: fShop.isSsr ?? false,
          buildType: 'domain-change',
          oldDomain: fShop.domain,
          oldDomainType: fShop.domainType,
        };

        console.log('buildScript', buildScript);

        const productionBuild =
          this.configService.get<string>('productionBuild');

        if (productionBuild) {
          await this.buildScriptService.buildWebsiteFromScript(buildScript);
        }
      }

      return {
        success: true,
        data: {
          shop: fShop._id,
        },
        message: `Success! Shop created successfully`,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateShopBuildStatusById(
    id: string,
    updateShopDto: UpdateShopDto,
  ): Promise<ResponsePayload> {
    try {
      let updateData: any;
      const { buildStatus, updateStatus } = updateShopDto;
      if (buildStatus) {
        updateData = { ...updateData, ...{ buildStatus: buildStatus } };
      } else if (updateStatus) {
        updateData = { ...updateData, ...{ updateStatus: updateStatus } };
      }

      await this.shopModel.findByIdAndUpdate(id, {
        $set: updateData,
      });
      return {
        success: true,
        message: 'Success! data updated',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err);
    }
  }

  async checkShopBuildStatusById(id: string): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel
        .findById(id)
        .select('buildStatus updateStatus domain');
      return {
        success: true,
        message: 'Success! data fetch',
        data: fShop,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err);
    }
  }

  async insertManyShop(
    addShopDto: AddShopDto[],
    optionShopDto: OptionPayloadDto,
  ): Promise<ResponsePayload> {
    try {
      const { deleteMany } = optionShopDto;
      if (deleteMany) {
        await this.shopModel.deleteMany({});
      }
      const saveData = await this.shopModel.insertMany(addShopDto);
      return {
        success: true,
        message: `${saveData && saveData.length ? saveData.length : 0
          }  Data Added Success`,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Slug Must be Unique');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async getAllShop(
    filterShopDto: FilterAndPaginationShopDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterShopDto;
    const { pagination } = filterShopDto;
    const { sort } = filterShopDto;
    const { select } = filterShopDto;

    if (filter && filter['users._id']) {
      filter['users._id'] = new ObjectId(filter['users._id']);
    }

    // Essential Variables
    const aggregateSbanneres = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      const regex = this.utilsService.createRegexFromString(searchQuery);

      const orConditions: any[] = [
        { name: regex },
        { subDomain: regex },
        { domain: regex },
        { websiteName: regex },
        { 'users.phoneNo': regex },
        { 'users.email': regex },
      ];

      // Attempt to add _id match if valid
      try {
        if (ObjectId.isValid(searchQuery)) {
          orConditions.unshift({ _id: new ObjectId(searchQuery) });
        }
      } catch (e) {
        // skip invalid _id
      }

      mFilter = {
        $and: [mFilter, { $or: orConditions }],
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
        name: 1,
      };
    }

    // Finalize
    if (Object.keys(mFilter).length) {
      aggregateSbanneres.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSbanneres.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSbanneres.push({ $project: mSelect });
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

      aggregateSbanneres.push(mPagination);

      aggregateSbanneres.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.shopModel.aggregate(aggregateSbanneres);
      if (pagination) {
        return {
          ...{ ...dataAggregates[0] },
          ...{ success: true, message: 'Success' },
        } as ResponsePayload;
      } else {
        return {
          data: dataAggregates,
          success: true,
          message: 'Success',
          count: dataAggregates.length,
        } as ResponsePayload;
      }
    } catch (err) {
      this.logger.error(err);
      if (err.code && err.code.toString() === ErrorCodes.PROJECTION_MISMATCH) {
        throw new BadRequestException('Error! Bannerion mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getAllPreShop(
    filterShopDto: FilterAndPaginationShopDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterShopDto;
    const { pagination } = filterShopDto;
    const { sort } = filterShopDto;
    const { select } = filterShopDto;

    if (filter && filter['users._id']) {
      filter['users._id'] = new ObjectId(filter['users._id']);
    }

    // Essential Variables
    const aggregateSbanneres = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
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
              { name: this.utilsService.createRegexFromString(searchQuery) },
              {
                websiteName:
                  this.utilsService.createRegexFromString(searchQuery),
              },
              { phoneNo: this.utilsService.createRegexFromString(searchQuery) },
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
        name: 1,
      };
    }

    // Finalize
    if (Object.keys(mFilter).length) {
      aggregateSbanneres.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSbanneres.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSbanneres.push({ $project: mSelect });
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

      aggregateSbanneres.push(mPagination);

      aggregateSbanneres.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates =
        await this.preShopModel.aggregate(aggregateSbanneres);
      if (pagination) {
        return {
          ...{ ...dataAggregates[0] },
          ...{ success: true, message: 'Success' },
        } as ResponsePayload;
      } else {
        return {
          data: dataAggregates,
          success: true,
          message: 'Success',
          count: dataAggregates.length,
        } as ResponsePayload;
      }
    } catch (err) {
      this.logger.error(err);
      if (err.code && err.code.toString() === ErrorCodes.PROJECTION_MISMATCH) {
        throw new BadRequestException('Error! Bannerion mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getAllShopBasic() {
    try {
      const pageSize = 10;
      const currentPage = 1;

      const data = await this.shopModel
        .find()
        .skip(pageSize * (currentPage - 1))
        .limit(Number(pageSize));
      return {
        success: true,
        message: 'Success',

        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getShopById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.shopModel.findById(id).select(select);
      return {
        success: true,
        message: 'Single profile get Successfully',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getShopInfoById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.shopModel
        .findById(id)
        .select('websiteName owner')
        .populate('owner', 'name phoneNo'); // select fields from User model

      return {
        success: true,
        message: 'Single profile get Successfully',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getPreShopById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.preShopModel.findById(id).select(select);
      return {
        success: true,
        message: 'Single profile get Successfully',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getShopPageByPage(
    pageName: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.shopModel
        .findOne({ pageName: pageName })
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

  async updateShopById(
    id: string,
    updateShopDto: UpdateShopDto,
  ): Promise<ResponsePayload> {
    try {
      const finalData = { ...updateShopDto };

      await this.shopModel.findByIdAndUpdate(id, {
        $set: finalData,
      });
      return {
        success: true,
        message: 'Update Successfully',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err);
    }
  }

  async updateMultipleShopById(
    ids: string[],
    updateShopDto: UpdateShopDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.shopModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateShopDto },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateMultiplePreShopById(
    ids: string[],
    updateShopDto: UpdateShopDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.preShopModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateShopDto },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteShopById(
    id: string,
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    try {
      await this.shopModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Delete Successfully',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleShopById(
    ids: string[],
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.shopModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultiplePreShopById(
    ids: string[],
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.preShopModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async renewMultipleShop(
    ids: string[],
    updateShopDto: any,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));
    const renewDay = updateShopDto.renewDay || 30;

    try {
      for (const id of mIds) {
        const fShop: any = await this.shopModel
          .findById(id)
          .select('startDate package');

        const date = new Date(fShop.startDate);
        date.setDate(date.getDate() + renewDay);

        const extendedDate = date.toISOString().split('T')[0];
        await this.shopModel.findByIdAndUpdate(id, {
          $set: {
            startDate: extendedDate,
          },
        });

        const report: any = {
          shop: id,
          package: fShop.package,
          starDate:
            fShop.startDate ?? this.utilsService.getDateString(new Date()),
          endDate: extendedDate,
          month: this.utilsService.getDateMonth(
            fShop.startDate ? new Date(fShop.startDate) : new Date(),
          ),
          year: this.utilsService.getDateYear(
            fShop.startDate ? new Date(fShop.startDate) : new Date(),
          ),
          amount: 499,
          renewDate: this.utilsService.getDateString(new Date()),
        };

        await this.subscriptionReportModel.create(report);
      }
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getShopCategory(): Promise<ResponsePayload> {
    try {
      const filePath = path.join('./upload', 'json', 'shop-category.json');

      const jsonData = fs.readFileSync(filePath, 'utf8');

      return {
        success: true,
        message: 'Success',
        data: JSON.parse(jsonData),
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getShopSubCategory(): Promise<ResponsePayload> {
    try {
      const filePath = path.join('./upload', 'json', 'shop-sub-category.json');

      const jsonData = fs.readFileSync(filePath, 'utf8');

      return {
        success: true,
        message: 'Success',
        data: JSON.parse(jsonData),
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async cloneDataFromShop(
    cloneDataFromShopDto: CloneDataFromShopDto,
  ): Promise<ResponsePayload> {
    try {
      const { fromShop, toShop } = cloneDataFromShopDto;

      const fCarousels = JSON.parse(
        JSON.stringify(
          await this.carouselModel
            .find({
              shop: fromShop,
              status: 'publish',
            })
            .select('-_id -shop'),
        ),
      );

      const fCategories = JSON.parse(
        JSON.stringify(
          await this.categoryModel
            .find({
              shop: fromShop,
              status: 'publish',
            })
            .select('-_id -shop'),
        ),
      );

      const fSubCategories = JSON.parse(
        JSON.stringify(
          await this.subCategoryModel
            .find({
              shop: fromShop,
              status: 'publish',
            })
            .select('-_id -shop'),
        ),
      );

      const fBrands = JSON.parse(
        JSON.stringify(
          await this.brandModel
            .find({
              shop: fromShop,
              status: 'publish',
            })
            .select('-_id -shop'),
        ),
      );

      const fTags = JSON.parse(
        JSON.stringify(
          await this.tagModel
            .find({
              shop: fromShop,
              status: 'publish',
            })
            .select('-_id -shop'),
        ),
      );

      const fProducts = JSON.parse(
        JSON.stringify(
          await this.productModel
            .find({
              shop: fromShop,
              status: 'publish',
            })
            .select('-_id -shop'),
        ),
      );

      const nCarousels = fCarousels.map((m) => {
        return {
          ...m,
          ...{
            shop: toShop,
          },
        };
      });
      await this.carouselModel.insertMany(nCarousels);

      const nCategories = fCategories.map((m) => {
        return {
          ...m,
          ...{
            shop: toShop,
          },
        };
      });
      await this.categoryModel.insertMany(nCategories);

      const nSubCategories = fSubCategories.map((m) => {
        return {
          ...m,
          ...{
            shop: toShop,
          },
        };
      });
      await this.subCategoryModel.insertMany(nSubCategories);

      const nBrands = fBrands.map((m) => {
        return {
          ...m,
          ...{
            shop: toShop,
          },
        };
      });
      await this.brandModel.insertMany(nBrands);

      const nTags = fTags.map((m) => {
        return {
          ...m,
          ...{
            shop: toShop,
          },
        };
      });
      await this.tagModel.insertMany(nTags);

      const nProducts = fProducts.map((m) => {
        return {
          ...m,
          ...{
            shop: toShop,
          },
        };
      });
      await this.productModel.insertMany(nProducts);

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * Manage Stripe Payment Api
   * payWithStripe()
   * callbackStripePayment()
   */

  private async payWithStripe(stripeConfig: {
    secretKey: string;
    production: boolean;
    amount: number;
    currency: string;
    preShopId: string;
    baseUrl: string;
  }) {
    try {
      const { secretKey, amount, currency, preShopId, baseUrl } = stripeConfig;
      const type = 'Pre Shop';
      const params = new URLSearchParams();
      params.append('mode', 'payment');
      params.append(
        'success_url',
        `${baseUrl}/api/shop/callback-stripe-payment-by-shop?status=success&preShopId=${preShopId}&type=${encodeURIComponent(type)}&sessionId={CHECKOUT_SESSION_ID}`,
      );

      params.append(
        'cancel_url',
        `${baseUrl}/api/shop/callback-stripe-payment-by-shop?status=cancel&preShopId=${preShopId}&type=${type}`,
      );

      params.append('line_items[0][price_data][currency]', currency);
      params.append(
        'line_items[0][price_data][product_data][name]',
        `Order #${preShopId}`,
      );
      params.append(
        'line_items[0][price_data][unit_amount]',
        `${Math.round(amount * 100)}`,
      );
      params.append('line_items[0][quantity]', '1');
      params.append('metadata[preShopId]', preShopId);

      const response = await axios.post(
        'https://api.stripe.com/v1/checkout/sessions',
        params,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return {
        success: true,
        message: 'Redirecting to Stripe Checkout...',
        data: {
          _id: preShopId,
          providerName: 'Stripe',
          providerType: 'api',
          link: response.data.url,
          sessionId: response.data.id,
        },
      };
    } catch (error) {
      console.error('Stripe API Error:', error?.response?.data || error);
      return {
        success: false,
        message: 'Stripe payment session creation failed',
        data: null,
      };
    }
  }

  async callbackStripePayment(
    res: Response,
    status: string,
    preShopId: string,
    sessionId: string,
    type?: string,
  ): Promise<any> {
    try {
      const redirectBase = this.configService.get<string>('frontendUrl');

      let model: any;
      let redirectUrl = redirectBase;
      let recipientPhone = '';
      const paymentRefId = '';

      if (type === 'Pre Shop') {
        model = await this.preShopModel.findOne({
          _id: preShopId,
        });
        if (!model) {
          return res.redirect(
            `${redirectBase}/payment/fail?message=Payment Config failed. No Payment config found.`,
          );
        }
        redirectUrl = `${redirectBase}/website-builder/${model._id}`;
        recipientPhone = model.phoneNo;
      } else if (type === 'Shop Renew') {
        model = await this.subscriptionReportModel.findOne({
          _id: preShopId,
        });
        if (!model) {
          return res.redirect(
            `${redirectBase}/shop-payment/unknown?paymentStatus=failed`,
          );
        }
        redirectUrl = `${redirectBase}/shop-payment/${model.shop}`;
        recipientPhone = model.phoneNo;
      }

      if (status === 'success') {
        console.log('ok');
        // Mark as paid
        await model?.constructor?.findByIdAndUpdate(model?._id, {
          $set: {
            paymentStatus: 'paid',
            paymentApiTrxID: sessionId,
            paymentRefId: sessionId,
            paymentMethod: 'Stripe',
            paidAmount: model?.amount,
          },
        });

        // type === 'Shop Renew'

        if (type === 'Shop Renew') {
          const fShop: any = await this.shopModel
            .findById(model.shop)
            .select(
              'startDate package shopType affiliateProductId affiliateId dateString',
            );

          // Determine base date
          const baseDate =
            fShop.shopType === 'free' ? new Date() : new Date(fShop.startDate);
          baseDate.setDate(
            baseDate.getDate() + (fShop.shopType === 'free' ? 0 : 30),
          );

          const extendedDate = baseDate.toISOString().split('T')[0];

          const updateData: any = {
            startDate: extendedDate,
          };

          if (fShop.shopType === 'free') {
            updateData.shopType = 'professional';
            updateData.trialPeriod = 0;

            if (fShop?.affiliateId && fShop.shopType === 'free') {
              await this.createAffiliateReport(fShop);
              // await this.createAffiliateReport(shopData);
              // console.log( 'Free');
            }
          }

          await this.shopModel.findByIdAndUpdate(model.shop, {
            $set: updateData,
          });
        }

        // Send SMS
        const msg =
          type === 'Pre Shop'
            ? `Thank you for your payment. Complete your website from here: ${redirectUrl}. You can anytime create your website from here.`
            : `We appreciate your renewal payment. Your subscription has been updated successfully.`;
        // this.bulkSmsService.sentSmsByAdmin(recipientPhone, msg);
        await this.emailService.sendEmail(
          model?.email,
          'Payment complete',
          msg,
          model?.email,
        );

        return res.redirect(`${redirectUrl}?paymentStatus=paid`);
      } else {
        return res.redirect(`${redirectUrl}?paymentStatus=failed`);
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
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
    type?: string,
  ) {
    try {
      const { tran_id } = sslCommerzInit;
      const responsePayload =
        await this.paymentControlService.sslCommerzInit(sslCommerzInit);

      if (responsePayload['status'] === 'SUCCESS') {
        if (type === 'Pre Shop') {
          await this.preShopModel.findByIdAndUpdate(tran_id, {
            $set: {
              paymentRefId: responsePayload['sessionkey'],
              paymentApiType: 'SSl Commerz',
              paymentMethod: 'SSl Commerz',
            },
          });
        } else if (type === 'Shop Renew') {
          await this.subscriptionReportModel.findByIdAndUpdate(tran_id, {
            $set: {
              paymentRefId: responsePayload['sessionkey'],
              paymentApiType: 'SSl Commerz',
              paymentMethod: 'SSl Commerz',
            },
          });
        }

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
    type: string,
  ): Promise<any> {
    try {
      const redirectBase = this.configService.get<string>('frontendUrl');
      const sslCommerzStoreId =
        this.configService.get<string>('sslCommerzStoreId');
      const sslCommerzStorePassword = this.configService.get<string>(
        'sslCommerzStorePassword',
      );
      const sslCommerzProduction = this.configService.get<string>(
        'sslCommerzProduction',
      );
      const sslBaseURL = `https://${sslCommerzProduction ? 'securepay' : 'sandbox'}.sslcommerz.com`;

      let model: any;
      let redirectUrl = '';
      let recipientPhone = '';
      let paymentRefId = '';

      if (type === 'Pre Shop') {
        model = await this.preShopModel.findOne({
          _id: tran_id,
          paymentMethod: 'SSl Commerz',
        });
        if (!model) {
          return res.redirect(
            `${redirectBase}/payment/fail?message=Payment Config failed. No Payment config found.`,
          );
        }
        redirectUrl = `${redirectBase}/website-builder/${model._id}`;
        recipientPhone = model.phoneNo;
        paymentRefId = model.paymentRefId;
      } else if (type === 'Shop Renew') {
        model = await this.subscriptionReportModel.findOne({
          _id: tran_id,
          paymentMethod: 'SSl Commerz',
        });
        if (!model) {
          return res.redirect(
            `${redirectBase}/shop-payment/unknown?paymentStatus=failed`,
          );
        }
        redirectUrl = `${redirectBase}/shop-payment/${model.shop}`;
        recipientPhone = model.phoneNo;
        paymentRefId = model.paymentRefId;
      }

      const sslCommerzApiConfig: SslCommerzApiConfig = {
        baseUrl: sslBaseURL,
        store_id: sslCommerzStoreId,
        store_passwd: sslCommerzStorePassword,
        sessionKey: paymentRefId,
        tran_id: tran_id,
      };

      if (status === 'VALID') {
        const result =
          await this.paymentControlService.transactionQueryBySessionId(
            sslCommerzApiConfig,
          );

        if (result?.status === 'VALID') {
          // Mark as paid
          await model.constructor.findByIdAndUpdate(model._id, {
            $set: { paymentStatus: 'paid' },
          });

          // type === 'Shop Renew'

          if (type === 'Shop Renew') {
            const fShop: any = await this.shopModel
              .findById(model.shop)
              .select(
                'startDate package shopType affiliateProductId affiliateId dateString',
              );

            const fPackage = await this.packageModel.findOne({
              _id: fShop.package._id,
            });

            // Determine base date
            const baseDate =
              fShop.shopType === 'free'
                ? new Date()
                : new Date(fShop.startDate);
            baseDate.setDate(
              baseDate.getDate() + (fShop.shopType === 'free' ? 0 : 30),
            );

            const extendedDate = baseDate.toISOString().split('T')[0];

            const updateData: any = {
              startDate: extendedDate,
            };

            if (fShop.shopType === 'free') {
              updateData.shopType =
                fPackage?.type === 'Starter' ? 'starter' : 'professional';
              updateData.trialPeriod = 0;

              if (fShop?.affiliateId && fShop.shopType === 'free') {
                await this.createAffiliateReport(fShop);
                // await this.createAffiliateReport(shopData);
                // console.log( 'Free');
              }
            }

            await this.shopModel.findByIdAndUpdate(model.shop, {
              $set: updateData,
            });
          }

          // Send SMS
          const msg =
            type === 'Pre Shop'
              ? `Thank you for your payment. Complete your website from here: ${redirectUrl}. You can anytime create your website from here.`
              : `We appreciate your renewal payment. Your subscription has been updated successfully.`;
          this.bulkSmsService.sentSmsByAdmin(recipientPhone, msg);

          return res.redirect(`${redirectUrl}?paymentStatus=paid`);
        } else {
          return res.redirect(`${redirectUrl}?paymentStatus=failed`);
        }
      } else {
        return res.redirect(`${redirectUrl}?paymentStatus=failed`);
      }
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  // Create Affiliate Sale Report
  private async createAffiliateReport(saveShop: any) {
    const affiliateProductData: any = await this.affiliateProductModel.findById(
      saveShop.affiliateProductId,
    );

    const finalData = {
      type: 'earning',
      affiliate: saveShop.affiliateId,
      product: saveShop.affiliateProductId,
      ownerId: affiliateProductData.ownerId, // owner ID
      ownerType: affiliateProductData.ownerType, // assuming this is a shop
      shopId: saveShop._id, // shop ID
      amount: affiliateProductData.price,
      status: 'pending', // or 'pending', based on your logic
      dateString: saveShop.dateString,
    };

    // console.log('finalData', finalData);

    await this.affiliateReportModel.create(finalData);
  }

  // async getShopDashboardStats(): Promise<ResponsePayload> {
  //   try {
  //     const today = this.utilsService.getDateString(new Date());
  //
  //     const [totalShop, ownDomain, subDomain, todayShop, demoShop] =
  //       await Promise.all([
  //         this.shopModel.countDocuments({ shopType: { $ne: 'demo' } }),
  //         this.shopModel.countDocuments({ domainType: { $ne: 'sub-domain' } }),
  //         this.shopModel.countDocuments({ domainType: 'sub-domain' }),
  //         this.shopModel.countDocuments({
  //           shopType: { $ne: 'demo' },
  //           dateString: today,
  //         }),
  //         this.shopModel.countDocuments({ shopType: 'demo' }),
  //       ]);
  //     return {
  //       success: true,
  //       message: 'Success',
  //       data: {
  //         totalShop,
  //         ownDomain,
  //         subDomain,
  //         todayShop,
  //         demoShop,
  //       },
  //     } as ResponsePayload;
  //   } catch (err) {
  //     throw new InternalServerErrorException(err.message);
  //   }
  // }

  async getShopDashboardStats(): Promise<ResponsePayload> {
    try {
      const today = this.utilsService.getDateString(new Date());
      const now = new Date();

      // -------------------------------
      // Last Month Range (String)
      // -------------------------------
      const lastMonthFirstDay = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const lastMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0);

      const lastMonthFirstDayStr = `${lastMonthFirstDay.getFullYear()}-${String(
        lastMonthFirstDay.getMonth() + 1,
      ).padStart(
        2,
        '0',
      )}-${String(lastMonthFirstDay.getDate()).padStart(2, '0')}`;

      const lastMonthLastDayStr = `${lastMonthLastDay.getFullYear()}-${String(
        lastMonthLastDay.getMonth() + 1,
      ).padStart(
        2,
        '0',
      )}-${String(lastMonthLastDay.getDate()).padStart(2, '0')}`;

      // -------------------------------
      // This Month Range (String)
      // -------------------------------
      const thisMonthFirstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthLastDay = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      );

      const thisMonthFirstDayStr = `${thisMonthFirstDay.getFullYear()}-${String(
        thisMonthFirstDay.getMonth() + 1,
      ).padStart(
        2,
        '0',
      )}-${String(thisMonthFirstDay.getDate()).padStart(2, '0')}`;

      const thisMonthLastDayStr = `${thisMonthLastDay.getFullYear()}-${String(
        thisMonthLastDay.getMonth() + 1,
      ).padStart(
        2,
        '0',
      )}-${String(thisMonthLastDay.getDate()).padStart(2, '0')}`;

      // ---------------------------------
      // Total Stats
      // ---------------------------------
      const [totalShop, ownDomain, subDomain, todayShop, demoShop] =
        await Promise.all([
          this.shopModel.countDocuments({ shopType: { $ne: 'demo' } }),
          this.shopModel.countDocuments({ domainType: { $ne: 'sub-domain' } }),
          this.shopModel.countDocuments({ domainType: 'sub-domain' }),
          this.shopModel.countDocuments({
            shopType: { $ne: 'demo' },
            dateString: today,
          }),
          this.shopModel.countDocuments({ shopType: 'demo' }),
        ]);

      // ---------------------------------
      // Fetch Shops in Month Ranges
      // ---------------------------------
      const lastMonthShops: any = await this.shopModel
        .find({
          startDate: { $gte: lastMonthFirstDayStr, $lte: lastMonthLastDayStr },
          shopType: 'professional',
        })
        .lean();

      const thisMonthShops: any = await this.shopModel
        .find({
          startDate: { $gte: thisMonthFirstDayStr, $lte: thisMonthLastDayStr },
          shopType: 'professional',
        })
        .lean();

      // ---------------------------------
      // Count Logic
      // ---------------------------------
      let lastMonthPurchaseShop = 0;
      let lastMonthRenewShop = 0;

      let thisMonthPurchaseShop = 0;
      let thisMonthRenewShop = 0;

      // Last Month Shops
      lastMonthShops.forEach((shop) => {
        const createdAt = new Date(shop.createdAt);
        const startDate = new Date(shop.startDate);
        const diffDays = Math.ceil(
          Math.abs(startDate.getTime() - createdAt.getTime()) /
          (1000 * 60 * 60 * 24),
        );
        if (diffDays <= 30) {
          lastMonthPurchaseShop += 1;
        } else {
          lastMonthRenewShop += 1;
        }
      });

      // This Month Shops
      thisMonthShops.forEach((shop) => {
        const createdAt = new Date(shop.createdAt);
        const startDate = new Date(shop.startDate);
        const diffDays = Math.ceil(
          Math.abs(startDate.getTime() - createdAt.getTime()) /
          (1000 * 60 * 60 * 24),
        );
        if (diffDays <= 30) {
          thisMonthPurchaseShop += 1;
        } else {
          thisMonthRenewShop += 1;
        }
      });

      return {
        success: true,
        message: 'Success',
        data: {
          totalShop,
          ownDomain,
          subDomain,
          todayShop,
          demoShop,
          lastMonthPurchaseShop,
          lastMonthRenewShop,
          thisMonthPurchaseShop,
          thisMonthRenewShop,
        },
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }



  async replaceUrlInAllCollections(
    fromUrl: string,
    toUrl: string,
  ): Promise<void> {
    const collections = await this.connection.db.collections();

    for (const collection of collections) {
      console.log(`🔍 Checking collection: ${collection.collectionName}`);
      const docs = await collection.find({}).toArray();

      for (const doc of docs) {
        const updatedFields: Record<string, any> = {};

        this.deepReplaceSelective(doc, fromUrl, toUrl, '', updatedFields);

        if (Object.keys(updatedFields).length > 0) {
          console.log(
            `📄 Updating document _id: ${doc._id} in ${collection.collectionName}`,
          );
          console.log(`➡️ Modified fields:`, updatedFields);

          await collection.updateOne({ _id: doc._id }, { $set: updatedFields });
        }
      }
    }

    console.log('✅ URL replacement completed in all collections.');
  }

  private deepReplaceSelective(
    obj: any,
    from: string,
    to: string,
    path: string,
    updatedFields: Record<string, any>,
  ): void {
    if (typeof obj === 'string') {
      if (obj.includes(from)) {
        updatedFields[path] = obj.replaceAll(from, to);
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const newPath = path ? `${path}.${index}` : `${index}`;
        this.deepReplaceSelective(item, from, to, newPath, updatedFields);
      });
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key of Object.keys(obj)) {
        const newPath = path ? `${path}.${key}` : key;
        this.deepReplaceSelective(obj[key], from, to, newPath, updatedFields);
      }
    }
  }
}
