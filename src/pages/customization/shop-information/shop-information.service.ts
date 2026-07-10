import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShopInformation } from './interfaces/shop-information.interface';
import { AddShopInformationDto } from './dto/shop-information.dto';
import { ResponsePayload } from '../../../interfaces/response-payload.interface';
import { Vendor } from '../../vendor/interfaces/vendor.interface';
import { ErrorCodes } from '../../../enum/error-code.enum';
import { Shop } from '../../shop/interfaces/shop.interface';
import { DiscountTypeEnum } from '../../../enum/product.enum';
import * as moment from 'moment';

@Injectable()
export class ShopInformationService {
  private logger = new Logger(ShopInformationService.name);

  constructor(
    @InjectModel('ShopInformation')
    private readonly shopInformationModel: Model<ShopInformation>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
  ) {}

  /**
   * addShopInformation
   */
  async addShopInformation(
    vendor: Vendor,
    shop: string,
    addShopInformationDto: AddShopInformationDto,
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

      const shopInformationData = await this.shopInformationModel.findOne({
        shop: shop,
      });

      if (shopInformationData) {
        await this.shopInformationModel.findByIdAndUpdate(
          shopInformationData._id,
          {
            $set: addShopInformationDto,
          },
        );
        const data = {
          _id: shopInformationData._id,
        };

        return {
          success: true,
          message: 'Data Updated Success',
          data: data,
        } as ResponsePayload;
      } else {
        const finalData = {
          ...addShopInformationDto,
          ...{
            shop: shop,
          },
        };
        const saveData = await this.shopInformationModel.create(finalData);

        const data = {
          _id: saveData._id,
        };

        return {
          success: true,
          message: 'Data Added Success',
          data: data,
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

  /**
   * getShopInformation
   */
  async getShopInformation(
    shop: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      // 1) Shop info (optional details)
      const data = await this.shopInformationModel
        .findOne({ shop })
        .select(select)
        .lean();

      // 2) Must-have shop domain doc
      const fShopDomain: any = await this.shopModel
        .findById(shop)
        .select(
          'domain subDomain websiteName startDate trialPeriod shopType package showBranding brandingText isTrailPrice',
        )
        .lean();

      if (!fShopDomain) {
        // Not found → 404 (500 নয়)
        throw new NotFoundException('Shop not found');
      }

      // 3) Package price resolve (যদি লাগে)
      // ধরে নিলাম package অবজেক্টে price আছে; না থাকলে 0
      const packagePrice =
        (typeof fShopDomain?.package === 'object' &&
          (fShopDomain?.package as any)?.price) ??
        (typeof fShopDomain?.package === 'number'
          ? (fShopDomain?.package as any)
          : 0);

      // 4) তারিখ ক্যালকুলেশন
      // পূর্বের লজিক: ফ্রি হলে trialPeriod দিন, otherwise 30 দিন
      const planDays =
        fShopDomain?.shopType === 'free'
          ? Number(fShopDomain?.trialPeriod ?? 0)
          : 30;

      const today = moment().startOf('day');
      const expireDate = today.clone().add(planDays, 'days').startOf('day');
      const expireDay = Math.max(0, expireDate.diff(today, 'days')); // negative guard

      // 5) ব্যালেন্স (যদি দরকার হয়: মাসিক দামের অনুপাত)
      const dailyRate = packagePrice > 0 ? packagePrice / 30 : 0;
      const balance = Math.floor(dailyRate * expireDay);

      return {
        success: true,
        message: 'Success',
        data,
        fShopDomain,
        expireDate: expireDate.format('YYYY-MM-DD'),
        shopType: fShopDomain?.shopType,
        trialPeriod: fShopDomain?.trialPeriod ?? 0,
        expireDay,
        isTrailPrice: !!fShopDomain?.isTrailPrice,
        currentBalance: balance,
      } as ResponsePayload;
    } catch (err) {
      // NotFoundException হলে 그대로 ছুঁড়ে দাও
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(
        err?.message ?? 'Unexpected error',
      );
    }
  }
}
