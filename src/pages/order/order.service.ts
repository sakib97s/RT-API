import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Response } from 'express';
import Stripe from 'stripe';
import { Model, PipelineStage, Types } from 'mongoose';
import * as schedule from 'node-schedule';
import {
  FRAUD_CHECK_DAILY_LIMIT,
  MAX_NEW_REGISTRATION_ORDER_COUNT,
  MAX_ORDER_CREATE,
} from '../../config/global-variables';
import { ErrorCodes } from '../../enum/error-code.enum';
import { DiscountTypeEnum } from '../../enum/product.enum';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { UniqueId } from '../../interfaces/unique-id.interface';
import { BulkSmsService } from '../../shared/bulk-sms/bulk-sms.service';
import { SmsSentConfig } from '../../shared/bulk-sms/interfaces/bulk-sms.interface';
import { EmailService } from '../../shared/email/email.service';
import { LogReportService } from '../../shared/log-report/log-report.service';
import {
  BkashApiConfig,
  CourierApiConfig,
  SslCommerzApiConfig,
  SslCommerzInit,
} from '../../shared/payment-control/interfaces/payment-control.interface';
import { PaymentControlService } from '../../shared/payment-control/payment-control.service';
import { SmsTemplateService } from '../../shared/sms-template/sms-template.service';
import { SmsService } from '../../shared/sms/sms.service';
import { UtilsService } from '../../shared/utils/utils.service';
import { Cart } from '../cart/interfaces/cart.interface';
import { Setting } from '../customization/setting/interface/setting.interface';
import { ShopInformation } from '../customization/shop-information/interfaces/shop-information.interface';
import { IpBlock } from '../ip-block/interfaces/ip-block.interface';
import { NotificationService } from '../notification/notification.service';
import { CourierService, SteadfastCourierPayload } from '../../shared/courier/courier.service';
import { Product } from '../product/interfaces/product.interface';
import { Shop } from '../shop/interfaces/shop.interface';
import { GetUserByIdsDto } from '../user/dto/user.dto';
import { User } from '../user/interfaces/user.interface';
import {
  AddOrderByUserDto,
  AddOrderDto,
  FilterAndPaginationOrderDto,
  UpdateOrderDto,
} from './dto/order.dto';
import { IncompleteOrder } from './interfaces/incomplete-order.interface';
import { Order } from './interfaces/order.interface';
import { Vendor } from '../vendor/interfaces/vendor.interface';
import { AffiliateProduct } from '../affiliate-product/interfaces/affiliate-product.interface';
import { AffiliateReport } from '../affiliate-report/interfaces/affiliate-report.interface';
// Types: adjust to your actual typings
type AnyDoc = any;
const ObjectId = Types.ObjectId;

@Injectable()
export class OrderService {
  private logger = new Logger(OrderService.name);

  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    @InjectModel('UniqueId') private readonly uniqueIdModel: Model<UniqueId>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    @InjectModel('Cart') private readonly cartModel: Model<Cart>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('ShopInformation')
    private readonly shopInformationModel: Model<ShopInformation>,
    @InjectModel('Setting') private readonly settingModel: Model<Setting>,
    @InjectModel('Vendor') private readonly vendorModel: Model<Vendor>,
    @InjectModel('AffiliateProduct') private readonly affiliateProductModel: Model<AffiliateProduct>,
    @InjectModel('AffiliateReport') private readonly affiliateReportModel: Model<AffiliateReport>,
    @InjectModel('IpBlock') private readonly ipBlockModel: Model<IpBlock>,
    @InjectModel('Coupon') private readonly couponModel: Model<any>,
    @InjectModel('IncompleteOrder') private readonly incompleteOrderModel: Model<IncompleteOrder>,
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService,
    private readonly bulkSmsService: BulkSmsService,
    private readonly smsTemplateService: SmsTemplateService,
    private readonly smsService: SmsService,
    private readonly paymentControlService: PaymentControlService,
    private readonly logReportService: LogReportService,
    private readonly emailService: EmailService,
    private readonly httpService: HttpService,
    private readonly notificationService: NotificationService,
    private readonly courierService: CourierService,
  ) {
    // Job Scheduler
    this.checkExpireEveryday();
    this.checkAndUpdateCourierStatus();
  }

  /**
   * addOrder()
   * addOrderByUser()
   * getAllOrderByShop()
   * getAllOrders()
   * getAllOrdersByUser()
   * getOrderById()
   * updateOrderById()
   * updateOrderBeforePaymentByUser()
   * updateMultipleOrderById()
   * deleteMultipleTrashOrder()
   * deleteMultipleOrderByIdByVendor()
   * deleteMultipleOrderById()
   */

  // async getAllOrderForUi(shop: string): Promise<ResponsePayload> {
  //   try {
  //     const today = new Date();
  //     const startDate = this.utilsService.getNextDateString(today, -6); // 6 days ago from today
  //     const endDate = this.utilsService.getNextDateString(today, 0); // today
  //
  //     const data = await this.orderModel
  //       .find({
  //         shop: shop,
  //         checkoutDate: { $gte: startDate, $lte: endDate },
  //       })
  //       .select('name checkoutDate orderedItems grandTotal orderStatus')
  //       .limit(15)
  //       .sort({ checkoutDate: -1 });
  //
  //     return {
  //       success: true,
  //       message: 'Success! Data fetch successfully.',
  //       data,
  //     } as ResponsePayload;
  //   } catch (err) {
  //     throw new InternalServerErrorException(err.message);
  //   }
  // }

  async getAllOrderForUi(
    shop: string,
    page: number,
    limit: number,
  ): Promise<ResponsePayload> {
    try {
      const today = new Date();
      const startDate = this.utilsService.getNextDateString(today, -6);
      const endDate = this.utilsService.getNextDateString(today, 0);

      const skip = (page - 1) * limit;

      const data = await this.orderModel
        .find({
          shop: shop,
          checkoutDate: { $gte: startDate, $lte: endDate },
        })
        .select('name checkoutDate orderedItems grandTotal orderStatus')
        .sort({ checkoutDate: -1 })
        .skip(skip)
        .limit(limit);

      return {
        success: true,
        message: 'Success! Data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async addOrder(
    shop: string,
    addOrderDto: AddOrderDto,
  ): Promise<ResponsePayload> {
    try {
      const { orderType, orderedItems, incompleteOrderId, phoneNo } =
        addOrderDto;

      let fraudCheckerData: any = null;

      // Check if incomplete order already has fraud checker data
      if (incompleteOrderId) {
        const incompleteOrder = await this.orderModel
          .findById(incompleteOrderId)
          .select('fraudChecker')
          .lean();
        if (incompleteOrder?.fraudChecker) {
          fraudCheckerData = incompleteOrder.fraudChecker;
          this.logger.debug(
            `Using fraud checker data from incomplete order: ${incompleteOrderId}`,
          );
        }
      }

      // Only call API if we don't have fraud checker data and phone number exists
      if (!fraudCheckerData && phoneNo) {
        try {
          const apiResponse = await this.courierService.checkFraudOrder(
            phoneNo,
            shop,
          );
          if (apiResponse) {
            fraudCheckerData = {
              phone: phoneNo,
              has_fraud_record: apiResponse.has_fraud_record,
              fraud_score: apiResponse.fraud_score,
              last_status: apiResponse.last_status,
              orders: apiResponse.orders,
              courierData: apiResponse.courierData || apiResponse,
              summary: apiResponse.summary || apiResponse.courierData?.summary,
            };
          }
        } catch (error) {
          this.logger.warn(
            `Error checkFraudOrder for phone ${phoneNo}:`,
            error?.message,
          );
          // Don't fail the order if fraud checker fails
        }
      }

      // Limit with this shop
      const totalOrders = await this.orderModel.countDocuments({
        shop: shop,
      });

      if (totalOrders && totalOrders > MAX_ORDER_CREATE) {
        return {
          success: false,
          message: 'Sorry! exists your order create limit with this shop.',
        } as ResponsePayload;
      }
      // Increment Order Id Unique
      const incOrder = await this.uniqueIdModel.findOneAndUpdate(
        { shop: shop },
        { $inc: { orderId: 1 } },
        { new: true, upsert: true, returnDocument: 'after' },
      );

      const orderIdUnique = this.utilsService.padLeadingZeros(incOrder.orderId);


      let previousOrderCounts: number = 0;

      if (phoneNo) {
        previousOrderCounts = await this.orderModel.countDocuments({
          shop,
          phoneNo,
          status: { $ne: 'trash' },
        });
      }

      const dataExtra = {
        shop: shop,
        orderId: orderIdUnique,
        month: this.utilsService.getDateMonth(new Date(), false),
        year: this.utilsService.getDateYear(new Date()),
        previousOrderCount: previousOrderCounts ?? 0,
        fraudChecker: fraudCheckerData ?? null,
        // orderTimeline: {
        //   pending: {
        //     date: this.utilsService.getDateString(new Date()),
        //     time: this.utilsService.getCurrentTime(),
        //   },
        // },
      };

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select(
          'smsSendingOption currency smsMethods courierMethods productSetting -_id',
        );
      // console.log('fSetting', fSetting);

      // Product Setting Providers
      const fProductSetting = fSetting?.productSetting ?? {};

      // Courier Providers
      const fCourierMethods = fSetting?.courierMethods ?? [];
      const courierMethod = fCourierMethods.find(
        (f: any) => f.status === 'active',
      );

      // Sms Providers
      const fSmsMethods = fSetting?.smsMethods ?? [];
      const smsMethod = fSmsMethods.find((f) => f.status === 'active');
      const smsSendingOption = fSetting?.smsSendingOption;

      const mData = { ...addOrderDto, ...dataExtra };

      const saveData: any = await this.orderModel.create(mData);
      const data = {
        _id: saveData._id,
        orderId: saveData.orderId,
        orderType: saveData.orderType,
      };

      if (addOrderDto?.orderStatus) {
        await this.adjustDataOnOrderStatusUpdate({
          order_id: saveData._id,
          orderStatus: addOrderDto?.orderStatus,
          smsMethod: smsMethod,
          smsSendingOption: smsSendingOption,
          fProductSetting: fProductSetting,
        });

        // Courier Manage
        this.addSingleOrderToCourier({
          orderStatus: addOrderDto?.orderStatus,
          courierMethod: courierMethod,
          id: saveData._id,
        });
      }

      // Clean Incomplete Order
      if (saveData && incompleteOrderId) {
        try {
          // console.log('Deleting Incomplete Order ID:', incompleteOrderId);
          const result =
            await this.incompleteOrderModel.findByIdAndDelete(
              incompleteOrderId,
            );
          if (result) {
            console.log('Incomplete order deleted successfully');
          } else {
            console.log('No incomplete order found with given ID');
          }
        } catch (error) {
          console.error('Error deleting incomplete order:', error.message);
        }
      }

      // Delete Carts
      if (addOrderDto.user) {
        const productIds = orderedItems.map((m) => new ObjectId(m.product));
        await this.cartModel.deleteMany({
          product: { $in: productIds },
        });
      }

      // Notification

      const nData = {
        name: ` Order create  successful`,
        description: `Your order id is ${orderIdUnique}. `,
        url: `/single-order/${saveData._id}`,
        user: addOrderDto.user,
        shop: shop,
        isRead: false,
      };
      await this.notificationService.createNotification(nData);

      // Courier Manage

      if (saveData.orderStatus === 'confirmed') {
        // Setting Data
        const fSetting = await this.settingModel
          .findOne({ shop: shop })
          .select(
            'smsSendingOption currency smsMethods courierMethods productSetting -_id',
          );
        // Courier Providers
        const fCourierMethods = fSetting?.courierMethods ?? [];
        const courierMethod = fCourierMethods.find(
          (f: any) => f.status === 'active',
        );

        // Courier Manage
        this.addSingleOrderToCourier({
          orderStatus: saveData.orderStatus,
          courierMethod: courierMethod,
          id: saveData._id,
        });
      }

      return {
        success: true,
        message: 'Success! order placed successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  private getAdvancePaymentAmount(
    advancePayment: any[],
    division: string,
    deliveryChargeAmount: number,
    cartSaleSubTotal: number,
  ): number {
    if (advancePayment && advancePayment.length) {
      // Find the custom_advance_payment object
      const customAdvance = advancePayment.find(
        (item) =>
          item.providerName === 'custom_advance_payment' &&
          item.status === 'active' &&
          cartSaleSubTotal >= item.minimumAmount,
      );

      // If custom_advance_payment meets criteria, return its advancePaymentAmount
      if (customAdvance) {
        return customAdvance.advancePaymentAmount ?? 0;
      }

      // Else, check for advance_delivery_payment and matching division
      const deliveryAdvance = advancePayment.find(
        (item) =>
          item.providerName === 'advance_delivery_payment' &&
          item.status === 'active' &&
          item.division &&
          item.division.includes(division),
      );

      if (deliveryAdvance) {
        return deliveryChargeAmount;
      }

      // If none match, return 0
      return 0;
    } else {
      return 0;
    }
  }

  async checkIsUserBlockOrNot(
    shop: string,
    user: User,
    addOrderByUserDto: AddOrderByUserDto,
    userIpAddress: string, // 👈 নতুন প্যারামিটার
  ): Promise<ResponsePayload> {
    try {
      const { phoneNo } = addOrderByUserDto;

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select(
          'deliveryCharges currency country orderSetting productSetting smsSendingOption smsMethods paymentMethods offers orderNotification advancePayment -_id',
        );

      // ✅ STEP 1: Blocked IP Check

      // IP Block Logic here
      if (fSetting.orderSetting.isEnableSingleIpBlock) {
        const isBlocked = await this.isIpBlocked(userIpAddress, shop, phoneNo);
        if (isBlocked) {
          return {
            success: false,
            message: 'You are blocked from placing order. Please try later.',
          };
        }
      }

      // Ip Wise Order Limit And Block Time Check Logic here
      if (fSetting.orderSetting.isEnableIpWiseOrderLimitAndBlockTime) {
        const isBlocked = await this.isIpBlocked(userIpAddress, shop, phoneNo);
        if (isBlocked) {
          return {
            success: false,
            message: 'You are temporarily blocked from placing orders.',
          };
        }
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async addOrderByUser(
    shop: string,
    user: User,
    addOrderByUserDto: AddOrderByUserDto,
    userIpAddress: string, // 👈 নতুন প্যারামিটার
  ): Promise<ResponsePayload> {
    try {
      const {
        division,
        deliveryType,
        phoneNo,
        carts,
        cartData,
        orderType,
        userOffer,
        needSaveAddress,
        advancePayment,
        coupon,
        incompleteOrderId,
        affiliateId,
        affiliateProductId,
      } = addOrderByUserDto;

      let fraudCheckerData: any = null;

      // Only call fraud checker API if phone number exists
      if (phoneNo) {
        try {
          const apiResponse = await this.courierService.checkFraudOrder(
            phoneNo,
            shop,
          );
          if (apiResponse) {
            fraudCheckerData = {
              phone: phoneNo,
              has_fraud_record: apiResponse.has_fraud_record,
              fraud_score: apiResponse.fraud_score,
              last_status: apiResponse.last_status,
              orders: apiResponse.orders,
              courierData: apiResponse.courierData || apiResponse,
              summary: apiResponse.summary || apiResponse.courierData?.summary,
            };
          }
        } catch (error) {
          this.logger.warn(
            `Error checkFraudOrder for phone ${phoneNo}:`,
            error?.message,
          );
          // Don't fail the order if fraud checker fails
        }
      }

      let cartItems: any[] = [];

      // Limit with this shop
      const totalOrders = await this.orderModel.countDocuments({
        shop: shop,
      });

      if (totalOrders && totalOrders > MAX_ORDER_CREATE) {
        return {
          success: false,
          message: 'Sorry! exists your order create limit with this shop.',
        } as ResponsePayload;
      }

      if (!user) {
        const fProducts = JSON.parse(
          JSON.stringify(
            await this.productModel.find({
              _id: { $in: carts.map((m) => new ObjectId(m)) },
            }),
          ),
        );

        if (fProducts && fProducts.length) {
          cartItems = cartData.map((t1) => ({
            ...t1,
            ...{ product: fProducts.find((t2) => t2._id === t1.product) },
          }));
        }
      } else {
        cartItems = JSON.parse(
          JSON.stringify(
            await this.cartModel
              .find({ _id: { $in: carts } })
              .populate(
                'product',
                '_id name slug deliveryCharge advancePayment images unit weight isEnablePhoneModel sku category isVariation variationList variation2Options variation2 variationOptions subCategory childCategory brand regularPrice salePrice costPrice variation model minimumWholesaleQuantity deliveryCharge advancePayment',
              ),
          ),
        );
      }

      // Set Auth User if Have
      if (user) {
        addOrderByUserDto.user = user._id;
      }

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select(
          'deliveryCharges currency country orderSetting productSetting smsSendingOption smsMethods paymentMethods offers orderNotification advancePayment -_id',
        );

      // ✅ STEP 1: Blocked IP Check

      // IP Block Logic here
      if (fSetting.orderSetting.isEnableSingleIpBlock) {
        const isBlocked = await this.isIpBlocked(userIpAddress, shop, phoneNo);
        if (isBlocked) {
          return {
            success: false,
            message: 'You are blocked from placing order. Please try later.',
          };
        }
      }

      // Ip Wise Order Limit And Block Time Check Logic here
      if (fSetting.orderSetting.isEnableIpWiseOrderLimitAndBlockTime) {
        const isBlocked = await this.isIpBlocked(userIpAddress, shop, phoneNo);
        if (isBlocked) {
          return {
            success: false,
            message: 'You are temporarily blocked from placing orders.',
          };
        }
      }

      //Order Notification
      const fOrderNotification = fSetting?.orderNotification ?? {};

      //Product Setting
      const fProductSetting = fSetting?.productSetting ?? {};

      // Delivery Charges
      const fDeliveryCharges = fSetting?.deliveryCharges ?? [];
      const deliveryCharges = fDeliveryCharges.filter(
        (f) => f.status === 'active',
      );

      // Shop Data
      const fShopInfo = await this.shopModel
        .findById(shop)
        .select('domain subDomain users');

      // Sms Providers
      const fSmsMethods = fSetting?.smsMethods ?? [];
      const smsMethod = fSmsMethods.find((f) => f.status === 'active');
      const smsSendingOption = fSetting?.smsSendingOption;

      // Payment Providers
      const fPaymentMethods = fSetting?.paymentMethods ?? [];

      const products = this.getOrderItems(cartItems);
      const orderIdUnique = await this.getUniqueOrderId(shop);

      let offerDiscount: any;
      if (user && userOffer) {
        const fOffers = fSetting?.offers ?? [];
        offerDiscount = await this.offerDiscountAmount({
          offersSetting: fOffers,
          user: user,
          subTotal: this.cartSaleSubTotal(cartItems),
          userOffer: userOffer,
        });
      }

      // Previous Order Counts

      let previousOrderCounts: number = 0;

      if (phoneNo) {
        previousOrderCounts = await this.orderModel.countDocuments({
          shop,
          phoneNo,
          status: { $ne: 'trash' },
        });
      }

      // Coupon Calculation

      let couponDiscount: number;

      if (coupon) {
        const couponData: any = await this.couponModel.findOne({
          _id: coupon,
          shop,
        });

        if (couponData) {
          if (couponData.discountType === DiscountTypeEnum.PERCENTAGE) {
            couponDiscount = Math.floor(
              (couponData.discountAmount / 100) *
              this.cartSaleSubTotal(cartItems),
            );
          } else if (couponData.discountType === DiscountTypeEnum.CASH) {
            couponDiscount = Math.floor(couponData.discountAmount);
          } else {
            couponDiscount = 0;
          }
        }
      }

      const { deliveryCharge: finalDeliveryCharge, isInsideCity } =
        this.getDeliveryCharge(
          deliveryCharges,
          division,
          deliveryType,
          cartItems,
        );

      const { total: deliveryChargeTotal, hasZero: hasZeroDeliveryCharge } =
        this.getCartDeliveryChargeTotal(cartItems, isInsideCity);

      const orderSensitiveData: any = {
        shop: shop,
        carts: orderType === 'anonymous' ? [] : carts,
        orderId: orderIdUnique,
        orderedFrom: addOrderByUserDto?.orderFrom,
        paymentStatus: 'unpaid',
        orderStatus: 'pending',
        checkoutDate: this.utilsService.getDateString(new Date()),
        checkoutTime: this.utilsService.getCurrentTime(),
        month: this.utilsService.getDateMonth(new Date(), false),
        year: this.utilsService.getDateYear(new Date()),
        orderTimeline: {
          pending: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        },
        subTotal: this.cartRegularSubTotal(cartItems),
        discount: this.cartDiscountAmount(cartItems),

        // deliveryCharge: fProductSetting.isEnableDeliveryCharge
        //   ? hasZeroDeliveryCharge
        //     ? deliveryChargeTotal + finalDeliveryCharge
        //     : deliveryChargeTotal
        //   : finalDeliveryCharge,

        deliveryCharge: finalDeliveryCharge,

        offerDiscount: offerDiscount,
        // grandTotal: this.getOrderGrandTotal(
        //   cartItems,
        //   fProductSetting.isEnableDeliveryCharge
        //     ? hasZeroDeliveryCharge
        //       ? deliveryChargeTotal + finalDeliveryCharge
        //       : deliveryChargeTotal
        //     : finalDeliveryCharge,
        //   offerDiscount,
        //   couponDiscount,
        // ),

        grandTotal: this.getOrderGrandTotal(
          cartItems,
          finalDeliveryCharge,
          offerDiscount,
          couponDiscount,
        ),

        orderedItems: products,
        coupon: coupon ?? null,
        couponDiscount: couponDiscount ?? 0,
        previousOrderCount: previousOrderCounts ?? 0,
        fraudChecker: fraudCheckerData ?? null,
        userIpAddress: userIpAddress ?? null,
      };

      let finalOrderData: any;

      if (advancePayment && advancePayment > 0) {
        // Advance Payment
        const advancePaymentData: any[] =
          fSetting?.advancePayment && fSetting?.advancePayment.length
            ? fSetting?.advancePayment.filter((f) => f.status === 'active')
            : [];

        const cartSaleSubTotal = this.cartSaleSubTotal(cartItems);

        const finalAdvancePaymentAmount = this.getAdvancePaymentAmount(
          advancePaymentData,
          division,
          fProductSetting.isEnableDeliveryCharge
            ? hasZeroDeliveryCharge
              ? deliveryChargeTotal + finalDeliveryCharge
              : deliveryChargeTotal
            : finalDeliveryCharge,
          cartSaleSubTotal,
        );

        const { total: advancePaymentTotal, hasZero: hasZeroAdvancePayment } =
          this.cartAdvancePaymentTotal(cartItems);

        finalOrderData = {
          ...addOrderByUserDto,
          ...orderSensitiveData,
          ...{
            advancePaymentStatus: 'pending',
            paidAmount: fProductSetting.isEnableAdvancePayment
              ? hasZeroAdvancePayment
                ? advancePaymentTotal + finalAdvancePaymentAmount
                : advancePaymentTotal
              : finalAdvancePaymentAmount,
            advancePayment: fProductSetting.isEnableAdvancePayment
              ? hasZeroAdvancePayment
                ? advancePaymentTotal + finalAdvancePaymentAmount
                : advancePaymentTotal
              : finalAdvancePaymentAmount,
          },
        };
      } else {
        finalOrderData = {
          ...addOrderByUserDto,
          ...orderSensitiveData,
        };
      }

      // console.log('finalOrderData', finalOrderData);

      // Save Order to Appropriate Model
      // const saveData: any = {};
      const saveData = await this.orderModel.create(finalOrderData);

      this.updateProductQty(finalOrderData);

      const data = {
        _id: saveData._id,
        orderId: saveData.orderId,
        providerName: saveData.providerName,
        providerType: saveData.providerType,
      };

      // Ip Wise Order Limit And Block Time

      if (saveData && fSetting) {
        // ✅ Step 2: Count orders in last X minutes
        const isLimitEnabled =
          fSetting?.orderSetting?.isEnableIpWiseOrderLimitAndBlockTime;
        const limit = fSetting?.orderSetting?.ipWiseOrderLimit || 5;
        const blockDuration =
          fSetting?.orderSetting?.ipWiseOrderBlockTime || 1440; // in minutes
        let ipOrderCount = 0;

        if (isLimitEnabled) {
          const fromTime = new Date(Date.now() - blockDuration * 60 * 1000);
          ipOrderCount = await this.orderModel.countDocuments({
            shop,
            userIpAddress,
            createdAt: { $gte: fromTime },
            status: { $ne: 'trash' }, // skip deleted orders
          });
        }

        // ✅ Step 4: If limit exceeded, block IP
        if (isLimitEnabled && ipOrderCount >= limit) {
          const type = `Auto Block after ${ipOrderCount} orders`;
          await this.blockIp(saveData, blockDuration, type);
        }
      }

      // Clean Incomplete Order
      if (saveData && incompleteOrderId) {
        try {
          // console.log('Deleting Incomplete Order ID:', incompleteOrderId);
          const result =
            await this.incompleteOrderModel.findByIdAndDelete(
              incompleteOrderId,
            );
          if (result) {
            console.log('Incomplete order deleted successfully');
          } else {
            console.log('No incomplete order found with given ID');
          }
        } catch (error) {
          console.error('Error deleting incomplete order:', error.message);
        }
      }

      // Affiliate Sale Report generate

      if (affiliateId && affiliateProductId && finalOrderData) {
        await this.createAffiliateReport(finalOrderData);
      }

      // Save Address
      if (user && needSaveAddress) {
        const addressData: any = {
          addressType: addOrderByUserDto['addressType'],
          name: addOrderByUserDto.name,
          phoneNo: addOrderByUserDto.phoneNo,
          division: addOrderByUserDto.division,
          area: addOrderByUserDto['area'],
          zone: addOrderByUserDto['zone'],
          shippingAddress: addOrderByUserDto['shippingAddress'],
          isDefaultAddress: false,
        };

        const fUser = await this.userModel
          .findById(user._id)
          .select('addresses');

        const fAddress = fUser?.addresses.find(
          (f) => f.addressType === addOrderByUserDto['addressType'],
        );
        if (fAddress) {
          await this.userModel.findByIdAndUpdate(
            user._id,
            {
              $set: {
                'addresses.$[address]': {
                  ...addressData,
                  ...{ _id: fAddress._id },
                },
              },
            },
            { arrayFilters: [{ 'address._id': fAddress._id }] },
          );
        } else {
          if (fUser?.addresses && fUser?.addresses.length < 3) {
            await this.userModel.findByIdAndUpdate(
              user._id,
              {
                $push: { addresses: addressData },
              },
              { returnDocument: 'after' },
            );
          }
        }
      }

      // Provider wise response
      switch (data.providerName) {
        case 'Cash on Delivery':
          // Remove from Carts
          if (user) {
            await this.cartModel.deleteMany({
              _id: { $in: carts.map((m) => new ObjectId(m)) },
            });
          }

          // Sms Sending - Use new template service
          if (smsMethod && smsSendingOption && smsSendingOption.orderPlaced) {
            // Get setting for custom messages
            const setting = await this.settingModel
              .findOne({ shop })
              .select('smsSendingOption smsCustomMessages smsMethods')
              .lean();

            if (setting) {
              const order = await this.orderModel
                .findById(saveData._id)
                .populate('user')
                .populate('orderedItems.product')
                .populate('shop')
                .lean();

              if (order) {
                const message = this.smsTemplateService.getOrderPlacedMessage(
                  order,
                  setting,
                );
                await this.smsService.sendSms({
                  phoneNumber: phoneNo,
                  message,
                  provider: smsMethod,
                });
              }
            }
          }

          // Order Notification For Admin

          if (
            saveData &&
            fOrderNotification &&
            (fOrderNotification.isEnableSMSNotification ||
              fOrderNotification.isEnableEmailNotification)
          ) {
            this.orderNotificationForAdmin(
              saveData,
              fSetting,
              fOrderNotification,
            );
          }

          return {
            success: true,
            message: 'Success! Order place successfull.',
            data: data,
          } as ResponsePayload;

        case 'Stripe': {
          const fStripeMethod = fPaymentMethods.find(
            (f) => f.providerName === 'Stripe',
          );
          if (!fStripeMethod || fStripeMethod.providerType !== 'api') {
            return {
              success: false,
              message: 'Stripe payment method not found.',
              data,
            };
          }

          const totalAmount =
            finalOrderData.advancePayment && finalOrderData.advancePayment > 0
              ? finalOrderData.advancePayment
              : finalOrderData.grandTotal;

          const stripeConfig = {
            secretKey: fStripeMethod.secretKey,
            production: fStripeMethod.production,
            amount: totalAmount,
            currency: fSetting?.currency?.code,
            orderId: saveData._id.toString(),
            baseUrl: fStripeMethod.production
              ? 'https://api.saleecom.com'
              : 'http://localhost:3013',
          };

          return await this.payWithStripe(stripeConfig);
        }

        default:
          return {
            success: true,
            message: 'Success! order placed successfully.',
            data: data,
          } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async addOrderByAnonymous(
    shop: string,
    addOrderByUserDto: AddOrderByUserDto,
    userIpAddress: string, // 👈 নতুন প্যারামিটার
  ): Promise<ResponsePayload> {
    return this.addOrderByUser(shop, null, addOrderByUserDto, userIpAddress);
  }

  async addIncompleteOrderByAnonymous(
    shop: string,
    addOrderByUserDto: AddOrderByUserDto,
    userIpAddress: string, // 👈 নতুন প্যারামিটার
  ): Promise<ResponsePayload> {
    return this.addIncompleteOrderByUser(
      shop,
      null,
      addOrderByUserDto,
      userIpAddress,
    );
  }

  async addIncompleteOrderByUser(
    shop: string,
    user: User,
    addOrderByUserDto: AddOrderByUserDto,
    userIpAddress: string, // 👈 নতুন প্যারামিটার
  ): Promise<ResponsePayload> {
    try {
      const {
        division,
        deliveryType,
        phoneNo,
        carts,
        cartData,
        orderType,
        userOffer,
        needSaveAddress,
        advancePayment,
        coupon,
      } = addOrderByUserDto;

      let cartItems: any[] = [];

      if (!user) {
        const fProducts = JSON.parse(
          JSON.stringify(
            await this.productModel.find({
              _id: { $in: carts.map((m) => new ObjectId(m)) },
            }),
          ),
        );

        if (fProducts && fProducts.length) {
          cartItems = cartData.map((t1) => ({
            ...t1,
            ...{ product: fProducts.find((t2) => t2._id === t1.product) },
          }));
        }
      } else {
        cartItems = JSON.parse(
          JSON.stringify(
            await this.cartModel
              .find({ _id: { $in: carts } })
              .populate(
                'product',
                '_id name slug images category isVariation variationList variation2Options variation2 variationOptions subCategory childCategory brand regularPrice salePrice costPrice variation model minimumWholesaleQuantity deliveryCharge advancePayment',
              ),
          ),
        );
      }

      // Set Auth User if Have
      if (user) {
        addOrderByUserDto.user = user._id;
      }

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select(
          'deliveryCharges currency country productSetting smsSendingOption smsMethods paymentMethods offers orderNotification advancePayment -_id',
        );

      //Product Setting
      const fProductSetting = fSetting?.productSetting ?? {};

      // Delivery Charges
      const fDeliveryCharges = fSetting?.deliveryCharges ?? [];
      const deliveryCharges = fDeliveryCharges.filter(
        (f) => f.status === 'active',
      );

      // Shop Data
      const fShopInfo = await this.shopModel
        .findById(shop)
        .select('domain subDomain users');

      // Sms Providers
      const fSmsMethods = fSetting?.smsMethods ?? [];
      const smsMethod = fSmsMethods.find((f) => f.status === 'active');
      const smsSendingOption = fSetting?.smsSendingOption;

      // Payment Providers
      const fPaymentMethods = fSetting?.paymentMethods ?? [];

      const products = this.getOrderItems(cartItems);
      const orderIdUnique = await this.getUniqueIncompleteOrderId(shop);

      let offerDiscount: any;
      if (user && userOffer) {
        const fOffers = fSetting?.offers ?? [];
        offerDiscount = await this.offerDiscountAmount({
          offersSetting: fOffers,
          user: user,
          subTotal: this.cartSaleSubTotal(cartItems),
          userOffer: userOffer,
        });
      }

      // Previous Order Counts

      let previousOrderCounts: number = 0;

      if (phoneNo) {
        previousOrderCounts = await this.incompleteOrderModel.countDocuments({
          shop,
          phoneNo,
          status: { $ne: 'trash' },
        });
      }

      // Coupon Calculation

      let couponDiscount: number;

      if (coupon) {
        const couponData: any = await this.couponModel.findOne({
          _id: coupon,
          shop,
        });

        if (couponData) {
          if (couponData.discountType === DiscountTypeEnum.PERCENTAGE) {
            couponDiscount = Math.floor(
              (couponData.discountAmount / 100) *
              this.cartSaleSubTotal(cartItems),
            );
          } else if (couponData.discountType === DiscountTypeEnum.CASH) {
            couponDiscount = Math.floor(couponData.discountAmount);
          } else {
            couponDiscount = 0;
          }
        }
      }

      // const finalDeliveryCharge = this.getDeliveryCharge(
      //   deliveryCharges,
      //   division,
      //   deliveryType,
      //   cartItems,
      // );

      const { deliveryCharge: finalDeliveryCharge, isInsideCity } =
        this.getDeliveryCharge(
          deliveryCharges,
          division,
          deliveryType,
          cartItems,
        );

      // const { total: deliveryChargeTotal, hasZero: hasZeroDeliveryCharge } =
      //   this.cartDeliveryChargeTotal(cartItems);

      const { total: deliveryChargeTotal, hasZero: hasZeroDeliveryCharge } =
        this.getCartDeliveryChargeTotal(cartItems, isInsideCity);

      const orderSensitiveData: any = {
        shop: shop,
        carts: carts,
        orderId: orderIdUnique,
        orderedFrom: 'website',
        paymentStatus: 'unpaid',
        orderStatus: 'pending',
        checkoutDate: this.utilsService.getDateString(new Date()),
        checkoutTime: this.utilsService.getCurrentTime(),
        month: this.utilsService.getDateMonth(new Date(), false),
        year: this.utilsService.getDateYear(new Date()),
        orderTimeline: {
          pending: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        },
        subTotal: this.cartRegularSubTotal(cartItems),
        discount: this.cartDiscountAmount(cartItems),
        // deliveryCharge: fProductSetting.isEnableDeliveryCharge
        //   ? hasZeroDeliveryCharge
        //     ? deliveryChargeTotal + finalDeliveryCharge
        //     : deliveryChargeTotal
        //   : finalDeliveryCharge,

        deliveryCharge: finalDeliveryCharge,

        offerDiscount: offerDiscount,
        // grandTotal: this.getOrderGrandTotal(
        //   cartItems,
        //   fProductSetting.isEnableDeliveryCharge
        //     ? hasZeroDeliveryCharge
        //       ? deliveryChargeTotal + finalDeliveryCharge
        //       : deliveryChargeTotal
        //     : finalDeliveryCharge,
        //   offerDiscount,
        //   couponDiscount,
        // ),

        grandTotal: this.getOrderGrandTotal(
          cartItems,
          finalDeliveryCharge,
          offerDiscount,
          couponDiscount,
        ),

        orderedItems: products,
        coupon: coupon ?? null,
        couponDiscount: couponDiscount ?? 0,
        previousOrderCount: previousOrderCounts ?? 0,
        userIpAddress: userIpAddress ?? null,
      };

      let finalOrderData: any;

      if (advancePayment && advancePayment > 0) {
        // Advance Payment
        const advancePaymentData: any[] =
          fSetting?.advancePayment && fSetting?.advancePayment.length
            ? fSetting?.advancePayment.filter((f) => f.status === 'active')
            : [];

        const cartSaleSubTotal = this.cartSaleSubTotal(cartItems);

        const finalAdvancePaymentAmount = this.getAdvancePaymentAmount(
          advancePaymentData,
          division,
          fProductSetting.isEnableDeliveryCharge
            ? hasZeroDeliveryCharge
              ? deliveryChargeTotal + finalDeliveryCharge
              : deliveryChargeTotal
            : finalDeliveryCharge,
          cartSaleSubTotal,
        );

        const { total: advancePaymentTotal, hasZero: hasZeroAdvancePayment } =
          this.cartAdvancePaymentTotal(cartItems);

        finalOrderData = {
          ...addOrderByUserDto,
          ...orderSensitiveData,
          ...{
            advancePaymentStatus: 'pending',
            paidAmount: fProductSetting.isEnableAdvancePayment
              ? hasZeroAdvancePayment
                ? advancePaymentTotal + finalAdvancePaymentAmount
                : advancePaymentTotal
              : finalAdvancePaymentAmount,
            advancePayment: fProductSetting.isEnableAdvancePayment
              ? hasZeroAdvancePayment
                ? advancePaymentTotal + finalAdvancePaymentAmount
                : advancePaymentTotal
              : finalAdvancePaymentAmount,
          },
        };
      } else {
        finalOrderData = {
          ...addOrderByUserDto,
          ...orderSensitiveData,
        };
      }

      // const saveData = await this.orderModel.create(finalOrderData);
      // Save Order to Appropriate Model
      // const saveData: any = {}
      const saveData = await this.incompleteOrderModel.create(finalOrderData);

      const data = {
        _id: saveData._id,
        orderId: saveData.orderId,
        providerName: saveData.providerName,
        providerType: saveData.providerType,
      };

      return {
        success: true,
        message: 'Success! Incomplete Order place.',
        data: data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllOrderByShop(
    vendor: Vendor,
    shop: string,
    filterAndPaginationOrderDto: FilterAndPaginationOrderDto,
    searchQuery?: string,
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

      // Modify Filter
      const { filter } = filterAndPaginationOrderDto;
      filterAndPaginationOrderDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllOrders(filterAndPaginationOrderDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllIncompleteOrderByShop(
    vendor: Vendor,
    shop: string,
    filterAndPaginationOrderDto: FilterAndPaginationOrderDto,
    searchQuery?: string,
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

      // Modify Filter
      const { filter } = filterAndPaginationOrderDto;
      filterAndPaginationOrderDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllIncompleteOrders(
        filterAndPaginationOrderDto,
        searchQuery,
      );
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getUserDataByPhoneNo(
    shop: string,
    getUserByIdsDto: GetUserByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.orderModel
        .findOne({ phoneNo: getUserByIdsDto.phoneNo, shop: shop })
        .select('phoneNo name shippingAddress');

      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAllOrderByUser(
    user: User,
    shop: string,
    filterAndPaginationOrderDto: FilterAndPaginationOrderDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
      });

      const userData = await this.userModel.findById(user._id);

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      let { filter } = filterAndPaginationOrderDto;

      filter = {
        ...filter,
        ...{
          shop: shop,
          $or: [
            { user: userData?._id }, // Matches if user is provided
            { phoneNo: userData?.phoneNo }, // Matches if phoneNo is provided
          ],
        },
      };

      // Add user filter if user ID is provided
      // if (user?._id) {
      //   filter.user = user._id;
      // }
      //
      // // console.log('phoneNo',phoneNo);
      // // Add phone number filter if provided
      // if (phoneNo) {
      //   filter.phoneNo = phoneNo;
      // }

      filterAndPaginationOrderDto.filter = filter;
      // Modify Filter
      // const { filter } = filterAndPaginationOrderDto;
      // filterAndPaginationOrderDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllOrders(filterAndPaginationOrderDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  // async getAllOrders(
  //   filterOrderDto: FilterAndPaginationOrderDto,
  //   searchQuery?: string,
  // ): Promise<ResponsePayload> {
  //   const { filter } = filterOrderDto;
  //   const { pagination } = filterOrderDto;
  //   const { sort } = filterOrderDto;
  //   const { select } = filterOrderDto;
  //
  //   // Essential Variables
  //   const aggregatesOrders = [];
  //   let mFilter = {};
  //   let mSort = {};
  //   let mSelect = {};
  //   let mPagination = {};
  //
  //   // Match
  //   if (filter) {
  //     if (filter['user']) {
  //       filter['user'] = new ObjectId(filter['user']);
  //     }
  //
  //     if (!filter['user'] && filter['phoneNo']) {
  //       mFilter['phoneNo'] = filter['phoneNo'];
  //     }
  //
  //     if (filter['shop']) {
  //       filter['shop'] = new ObjectId(filter['shop']);
  //     }
  //
  //     mFilter = { ...mFilter, ...filter };
  //   }
  //   if (searchQuery) {
  //     mFilter = {
  //       $and: [
  //         mFilter,
  //         {
  //           $or: [
  //             { name: { $regex: searchQuery, $options: 'i' } },
  //             { orderId: { $regex: searchQuery, $options: 'i' } },
  //             { phoneNo: { $regex: searchQuery, $options: 'i' } },
  //             { email: { $regex: searchQuery, $options: 'i' } },
  //           ],
  //         },
  //       ],
  //     };
  //   }
  //
  //   // Sort
  //   if (sort) {
  //     mSort = sort;
  //   } else {
  //     mSort = { createdAt: -1 };
  //   }
  //
  //   // Select
  //   if (select) {
  //     mSelect = { ...select };
  //   } else {
  //     mSelect = {
  //       name: 1,
  //     };
  //   }
  //
  //   // Finalize
  //   if (Object.keys(mFilter).length) {
  //     aggregatesOrders.push({ $match: mFilter });
  //   }
  //
  //   if (Object.keys(mSort).length) {
  //     aggregatesOrders.push({ $sort: mSort });
  //   }
  //
  //   if (!pagination) {
  //     aggregatesOrders.push({ $project: mSelect });
  //   }
  //
  //   // Pagination
  //   if (pagination) {
  //     if (Object.keys(mSelect).length) {
  //       mPagination = {
  //         $facet: {
  //           metadata: [{ $count: 'total' }],
  //           data: [
  //             {
  //               $skip: pagination.pageSize * pagination.currentPage,
  //             } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
  //             { $limit: pagination.pageSize },
  //             { $project: mSelect },
  //           ],
  //         },
  //       };
  //     } else {
  //       mPagination = {
  //         $facet: {
  //           metadata: [{ $count: 'total' }],
  //           data: [
  //             {
  //               $skip: pagination.pageSize * pagination.currentPage,
  //             } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
  //             { $limit: pagination.pageSize },
  //           ],
  //         },
  //       };
  //     }
  //
  //     aggregatesOrders.push(mPagination);
  //
  //     aggregatesOrders.push({
  //       $project: {
  //         data: 1,
  //         count: { $arrayElemAt: ['$metadata.total', 0] },
  //       },
  //     });
  //   }
  //
  //   try {
  //     const dataAggregates = await this.orderModel.aggregate(aggregatesOrders);
  //     if (pagination) {
  //       return {
  //         ...{ ...dataAggregates[0] },
  //         ...{ success: true, message: 'Success' },
  //       } as ResponsePayload;
  //     } else {
  //       return {
  //         data: dataAggregates,
  //         success: true,
  //         message: 'Success',
  //         count: dataAggregates.length,
  //       } as ResponsePayload;
  //     }
  //   } catch (err) {
  //     this.logger.error(err);
  //     if (err.code && err.code.toString() === ErrorCodes.PROJECTION_MISMATCH) {
  //       throw new BadRequestException('Error! Orderion mismatch');
  //     } else {
  //       throw new InternalServerErrorException(err.message);
  //     }
  //   }
  // }

  async getAllOrders(
    filterOrderDto: FilterAndPaginationOrderDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter, pagination, sort, select } = filterOrderDto;

    let mFilter: any = {};
    let mSort: Record<string, 1 | -1> = {};
    const mSelect = select || { name: 1 };

    // 🔍 Filter construction
    if (filter) {
      if (filter['user']) {
        filter['user'] = new ObjectId(filter['user']);
      }

      if (!filter['user'] && filter['phoneNo']) {
        mFilter['phoneNo'] = filter['phoneNo'];
      }

      if (filter['shop']) {
        filter['shop'] = new ObjectId(filter['shop']);
      }

      mFilter = { ...mFilter, ...filter };
    }

    if (searchQuery) {
      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { name: { $regex: searchQuery, $options: 'i' } },
              { orderId: { $regex: searchQuery, $options: 'i' } },
              { phoneNo: { $regex: searchQuery, $options: 'i' } },
              { email: { $regex: searchQuery, $options: 'i' } },
              // ✅ New: search inside orderedItems
              { 'orderedItems.sku': { $regex: searchQuery, $options: 'i' } },
              {
                'orderedItems.variation.sku': {
                  $regex: searchQuery,
                  $options: 'i',
                },
              },
              {
                'orderedItems.category.name': {
                  $regex: searchQuery,
                  $options: 'i',
                },
              },
            ],
          },
        ],
      };
    }

    // 🔃 Sort
    if (sort && typeof sort === 'object') {
      mSort = Object.entries(sort).reduce(
        (acc, [key, value]) => {
          acc[key] = value === -1 ? -1 : 1;
          return acc;
        },
        {} as Record<string, 1 | -1>,
      );
    } else {
      mSort = { createdAt: -1 };
    }

    // ✅ Pipeline
    const pipeline: PipelineStage[] = [
      { $match: mFilter },
      {
        $facet: {
          orders: [
            { $sort: mSort },
            ...(pagination
              ? [
                { $skip: pagination.pageSize * pagination.currentPage },
                { $limit: pagination.pageSize },
              ]
              : []),
            { $project: mSelect },
          ],
          ...(pagination
            ? {
              metadata: [{ $count: 'total' }],
            }
            : {}),
          productSummary: [
            { $unwind: '$orderedItems' },
            {
              $group: {
                _id: '$orderedItems.name',
                totalQuantity: { $sum: '$orderedItems.quantity' },
              },
            },
            {
              $project: {
                _id: 0,
                productName: '$_id',
                totalQuantity: 1,
              },
            },
            { $sort: { totalQuantity: -1 } }, // 🔥 descending order
          ],
        },
      },
      {
        $project: {
          data: '$orders',
          count: pagination
            ? { $arrayElemAt: ['$metadata.total', 0] }
            : { $size: '$orders' },
          productSummary: 1,
        },
      },
    ];

    try {
      const [result] = await this.orderModel.aggregate(pipeline);

      return {
        data: result.data,
        count: result.count || 0,
        productSummary: result.productSummary,
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAllIncompleteOrders(
    filterOrderDto: FilterAndPaginationOrderDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterOrderDto;
    const { pagination } = filterOrderDto;
    const { sort } = filterOrderDto;
    const { select } = filterOrderDto;

    // Essential Variables
    const aggregatesOrders = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['user']) {
        filter['user'] = new ObjectId(filter['user']);
      }

      if (!filter['user'] && filter['phoneNo']) {
        mFilter['phoneNo'] = filter['phoneNo'];
      }

      if (filter['shop']) {
        filter['shop'] = new ObjectId(filter['shop']);
      }
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { name: { $regex: searchQuery, $options: 'i' } },
              { orderId: { $regex: searchQuery, $options: 'i' } },
              { phoneNo: { $regex: searchQuery, $options: 'i' } },
              { email: { $regex: searchQuery, $options: 'i' } },
              // ✅ New: search inside orderedItems
              { 'orderedItems.sku': { $regex: searchQuery, $options: 'i' } },
              {
                'orderedItems.variation.sku': {
                  $regex: searchQuery,
                  $options: 'i',
                },
              },
              {
                'orderedItems.category.name': {
                  $regex: searchQuery,
                  $options: 'i',
                },
              },
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
      aggregatesOrders.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregatesOrders.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregatesOrders.push({ $project: mSelect });
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

      aggregatesOrders.push(mPagination);

      aggregatesOrders.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates =
        await this.incompleteOrderModel.aggregate(aggregatesOrders);
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
        throw new BadRequestException('Error! Orderion mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getAllOrdersByUser(
    shop: string,
    user: User,
    filterOrderDto: FilterAndPaginationOrderDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! no data found.',
        } as ResponsePayload;
      }

      let { filter } = filterOrderDto;
      filter = {
        ...filter,
        ...{
          shop: shop,
          user: { $ne: null, $eq: user._id },
        },
      };
      // if (user && user._id) {
      //   // If user ID exists, filter by user ID
      //   filter.user = user._id;
      // } else if (filter.phoneNo) {
      //   // If user ID is null, filter by phoneNo if provided
      //   filter.user = null;
      //   // filter.phoneNo = filter.phoneNo;
      // }
      // if (user?._id) {
      //   filter.user = user._id;
      // }

      // Add phone number filter if provided
      // if (phoneNo) {
      //   filter.phoneNo = phoneNo;
      // }

      filterOrderDto.filter = filter;
      return this.getAllOrders(filterOrderDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getOrderById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.orderModel.findById(id).select(select);
      return {
        success: true,
        message: 'Success! Order fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async incrementInvoicePrintCount(
    id: string,
  ): Promise<ResponsePayload> {
    try {
      const result = await this.orderModel.findByIdAndUpdate(
        id,
        {
          $inc: { invoicePrintCount: 1 },
        },
        { new: true },
      );

      if (!result) {
        return {
          success: false,
          message: 'Order not found',
        } as ResponsePayload;
      }

      return {
        success: true,
        message: 'Invoice print count incremented successfully',
        data: result,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getOrdersByPhone(
    phone: string,
    select?: string,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  ): Promise<ResponsePayload> {
    try {
      const filter: any = { phoneNo: phone }; // আপনার স্কিমা অনুযায়ী key ঠিক করুন

      const [items, total] = await Promise.all([
        this.orderModel
          .find(filter)
          .select(select)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        this.orderModel.countDocuments(filter),
      ]);

      return {
        success: true,
        message: 'Success! Orders fetched by phone.',
        data: { items, total, page, limit },
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getIncompleteOrderById(
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.incompleteOrderModel.findById(id).select(select);
      return {
        success: true,
        message: 'Success! Order fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getOrderByOrderId(
    shop: string,
    orderId: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      const data = await this.orderModel
        .findOne({ shop: shop, orderId: orderId })
        .select(select);
      return {
        success: true,
        message: 'Success! Order fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async checkFraudOrder(
    shop: string,
    phoneNo: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      const fShop = await this.shopModel.findById(shop).lean();
      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! no shop found',
        } as ResponsePayload;
      }

      let updateData: any = {};

      if (fShop.fraudCheckDate) {
        const isSameDay = this.utilsService.isSameDay(
          new Date(fShop.fraudCheckDate),
        );
        if (isSameDay) {
          if ((fShop.todayFraudCheckCount || 0) >= FRAUD_CHECK_DAILY_LIMIT) {
            return {
              success: false,
              message: `Daily limit of ${FRAUD_CHECK_DAILY_LIMIT} status checks exceeded`,
            } as ResponsePayload;
          }
          updateData.todayFraudCheckCount = (fShop.todayFraudCheckCount || 0) + 1;
        } else {
          // New day
          updateData.todayFraudCheckCount = 1;
          updateData.fraudCheckDate = this.utilsService.getDateString(new Date());
        }
      } else {
        updateData.todayFraudCheckCount = 1;
        updateData.fraudCheckDate = this.utilsService.getDateString(new Date());
      }

      // Use updateOne instead of save() to avoid schema validation issues
      await this.shopModel.updateOne(
        { _id: shop },
        { $set: updateData }
      );

      const data = await this.courierService.checkFraudOrder(phoneNo, shop);

      if (!data) {
        return {
          success: false,
          message: 'No data received from fraud checker API',
        } as ResponsePayload;
      }

      return {
        success: true,
        message: 'Success!',
        data: data,
      } as ResponsePayload;
    } catch (err) {
      // Handle rate limit error specifically (check status code, message, and response data)
      const isRateLimit =
        err.response?.status === 429 ||
        (err.message && (err.message.toLowerCase().includes('rate limit') || err.message.includes('429'))) ||
        (err.response?.data?.message && err.response.data.message.toLowerCase().includes('rate limit')) ||
        (err.response?.data?.error && err.response.data.error.toLowerCase().includes('rate limit'));

      if (isRateLimit) {
        return {
          success: false,
          message: 'Fraud checker API rate limit reached. Please try again later.',
        } as ResponsePayload;
      }

      // Handle API authentication errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        return {
          success: false,
          message: 'Fraud checker API authentication failed. Please check your API key in settings.',
        } as ResponsePayload;
      }

      // Handle API errors
      if (err.response?.data) {
        return {
          success: false,
          message: err.response.data.message || 'Fraud checker API error',
          data: err.response.data,
        } as ResponsePayload;
      }

      // Handle other errors
      return {
        success: false,
        message: err.message || 'Failed to check fraud order',
      } as ResponsePayload;
    }
  }

  // async checkFraudOrder(
  //   shop: string,
  //   phoneNo: string,
  // ): Promise<ResponsePayload> {
  //   try {
  //     if (!shop) {
  //       return {
  //         success: false,
  //         message: 'Sorry! you have no access in this shop',
  //       } as ResponsePayload;
  //     }
  //
  //     const fShop = await this.shopModel.findById(shop).lean();
  //     if (!fShop) {
  //       return {
  //         success: false,
  //         message: 'Sorry! no shop found',
  //       } as ResponsePayload;
  //     }
  //
  //     // --- Daily limit logic (no save() on the whole doc) ---
  //     const now = new Date();
  //     const fraudCheckDate = fShop.fraudCheckDate
  //       ? new Date(fShop.fraudCheckDate)
  //       : null;
  //
  //     const isSameDay =
  //       fraudCheckDate && this.utilsService.isSameDay(fraudCheckDate); // expects Date -> Date
  //
  //     if (isSameDay) {
  //       if ((fShop.todayFraudCheckCount ?? 0) >= FRAUD_CHECK_DAILY_LIMIT) {
  //         return {
  //           success: false,
  //           message: `Daily limit of ${FRAUD_CHECK_DAILY_LIMIT} status checks exceeded`,
  //         } as ResponsePayload;
  //       }
  //
  //       // Same day -> just increment the counter
  //       await this.shopModel.updateOne(
  //         { _id: shop },
  //         { $inc: { todayFraudCheckCount: 1 } }, // atomic
  //         { runValidators: false }, // avoid full doc validation (createdAt issue)
  //       );
  //     } else {
  //       // New day -> reset counter and set today's date
  //       await this.shopModel.updateOne(
  //         { _id: shop },
  //         {
  //           $set: {
  //             todayFraudCheckCount: 1,
  //             // Store as Date type (not string) to avoid casting issues later
  //             fraudCheckDate: now,
  //           },
  //         },
  //         { runValidators: false },
  //       );
  //     }
  //
  //     // --- External check ---
  //     const data = await this.courierService.checkFraudOrder(phoneNo);
  //     return {
  //       success: true,
  //       message: 'Success!',
  //       data,
  //     } as ResponsePayload;
  //   } catch (err) {
  //     console.log(err);
  //     throw new InternalServerErrorException(err.message);
  //   }
  // }

  async updateOrderById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<ResponsePayload> {
    try {
      const { orderStatus, advancePaymentStatus } = updateOrderDto;

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

      await this.orderModel.findByIdAndUpdate(id, {
        $set: updateOrderDto,
      });

      // Setting Data
      const fSetting: any = await this.settingModel
        .findOne({ shop: shop })
        .select(
          'smsSendingOption currency smsMethods orderSetting courierMethods productSetting -_id',
        );

      // Product Setting Providers
      const fProductSetting = fSetting?.productSetting ?? {};

      // Courier Providers
      const fCourierMethods = fSetting?.courierMethods ?? [];
      const courierMethod = fCourierMethods.find(
        (f: any) => f.status === 'active',
      );

      // Sms Providers
      const fSmsMethods = fSetting?.smsMethods ?? [];
      const smsMethod = fSmsMethods.find((f) => f.status === 'active');
      const smsSendingOption = fSetting?.smsSendingOption;

      if (orderStatus) {
        await this.adjustDataOnOrderStatusUpdate({
          order_id: id,
          orderStatus: orderStatus,
          smsMethod: smsMethod,
          smsSendingOption: smsSendingOption,
          fProductSetting: fProductSetting,
        });

        // Courier Manage
        this.addSingleOrderToCourier({
          orderStatus: orderStatus,
          courierMethod: courierMethod,
          id: id,
        });
      }

      // IP Block Logic here
      if (fSetting.orderSetting.isEnableSingleIpBlock) {
        const fOrder: any = await this.orderModel.findById(id);
        if (fOrder.userIpAddress) {
          const durationMinutes = this.getDurationInMinutes(
            updateOrderDto.blockTime,
          ); // ← ফ্রন্টএন্ড থেকে পাঠানো blockTime
          await this.blockIp(fOrder, durationMinutes, updateOrderDto.blockTime);
        }
      }

      // Log Report Create with no await
      // const orderData = JSON.parse(
      //   JSON.stringify(await this.orderModel.findById(id)),
      // );
      // this.logReportService.createLogReport({
      //   collectionName: 'Update order',
      //   type: 'update',
      //   description: `Update order. Order Id is ${orderData?.orderId} `,
      //   vendor: {
      //     _id: vendor?._id,
      //     username: vendor?.username,
      //   },
      //   shop: shop,
      // });

      return {
        success: true,
        message: 'Success! Order updated successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateOrderUserById(
    user: User,
    shop: string,
    id: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<ResponsePayload> {
    try {
      const { orderStatus } = updateOrderDto;

      const fShop = await this.shopModel.exists({
        _id: shop,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      const orderData = JSON.parse(
        JSON.stringify(await this.orderModel.findById(id)),
      );
      const orderTimeline = orderData.orderTimeline;

      if (orderStatus === 'cancel') {
        orderTimeline.cancelled = {
          date: this.utilsService.getDateString(new Date()),
          time: this.utilsService.getCurrentTime(),
        };

        // Sent Notification
        // this.notificationService.createNotification({
        //   name: 'Order cancel.',
        //   description: `A order cancelled. Order ID #${orderData?.orderId}`,
        //   url: `/sales/order-details/${orderData._id}`,
        //   isRead: false,
        // });
      }

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select(
          'smsSendingOption currency smsMethods courierMethods productSetting -_id',
        );

      // Product Setting Providers
      const fProductSetting = fSetting?.productSetting ?? {};

      // Courier Providers
      const fCourierMethods = fSetting?.courierMethods ?? [];
      const courierMethod = fCourierMethods.find(
        (f: any) => f.status === 'active',
      );

      // Sms Providers
      const fSmsMethods = fSetting?.smsMethods ?? [];
      const smsMethod = fSmsMethods.find((f) => f.status === 'active');
      const smsSendingOption = fSetting?.smsSendingOption;

      if (orderStatus === 'cancel') {
        await this.adjustDataOnOrderStatusUpdate({
          order_id: id,
          orderStatus: orderStatus,
          smsMethod: smsMethod,
          smsSendingOption: smsSendingOption,
          fProductSetting: fProductSetting,
        });

        // Courier Manage
        this.addSingleOrderToCourier({
          orderStatus: orderStatus,
          courierMethod: courierMethod,
          id: id,
        });
      }

      const mData = {
        ...updateOrderDto,
        ...{
          orderTimeline: orderTimeline,
        },
      };
      await this.orderModel.findByIdAndUpdate(id, {
        $set: mData,
      });

      return {
        success: true,
        message: 'Success! Order updated successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateIncompleteOrderById(
    shop: string,
    id: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<ResponsePayload> {
    try {
      const { orderStatus, cartData, carts } = updateOrderDto;

      const fShop = await this.shopModel.exists({
        _id: shop,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }
      let cartItems: any[] = [];

      if (carts && carts.length > 0 && cartData && cartData.length > 0) {
        const fProducts = JSON.parse(
          JSON.stringify(
            await this.productModel.find({
              _id: { $in: carts.map((m) => new ObjectId(m)) },
            }),
          ),
        );

        if (fProducts && fProducts.length) {
          cartItems = cartData.map((t1) => ({
            ...t1,
            ...{ product: fProducts.find((t2) => t2._id === t1.product) },
          }));
        }
      }

      const products = this.getOrderItems(cartItems);

      // console.log('updateOrderDto', updateOrderDto);
      // console.log('products', products);

      const mData = {
        ...updateOrderDto,
        ...{
          orderedItems: products,
        },
      };
      await this.incompleteOrderModel.findByIdAndUpdate(id, {
        $set: mData,
      });

      return {
        success: true,
        message: 'Success! Incomplete Order updated successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleOrderById(
    vendor: Vendor,
    shop: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<ResponsePayload> {
    try {
      const { ids, orderStatus } = updateOrderDto;
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

      const mIds = ids.map((m) => new ObjectId(m));

      // --- normalize inputs ---
      const isRestore = updateOrderDto?.status === 'restore';
      const orderStatusRaw = updateOrderDto?.orderStatus
        ? String(updateOrderDto.orderStatus).trim()
        : '';

      const hasOrderStatus = !!orderStatusRaw;

      // --- Fetch orders BEFORE updating to check previous status for quantity adjustment ---
      let previousOrderStatuses: Map<string, string> = new Map();
      if (hasOrderStatus) {
        const ordersBeforeUpdate = await this.orderModel
          .find({ _id: { $in: mIds } })
          .select('_id orderStatus')
          .lean();

        ordersBeforeUpdate.forEach((order: any) => {
          previousOrderStatuses.set(
            String(order._id),
            String(order.orderStatus || '')
          );
        });
      }

      // --- build queries as per requirement ---
      let updateDoc: any;

      if (isRestore) {
        // Only unset trash markers; keep existing orderStatus as-is
        updateDoc = {
          $unset: { status: 1, deleteDateString: 1 },
        };
      } else if (hasOrderStatus) {
        // Only update orderStatus (and history). Don't touch 'status' field.
        updateDoc = {
          $set: { orderStatus: orderStatusRaw },
        };
      } else {
        // Neither restore nor orderStatus supplied: optionally allow other safe fields
        // (If you truly want "do nothing but history", keep only $push below)
        const setDoc: any = { ...updateOrderDto };
        delete setDoc.ids;
        delete setDoc.status; // control flag
        delete setDoc.orderStatus; // not provided / not to set here

        updateDoc = {
          ...(Object.keys(setDoc).length ? { $set: setDoc } : {}),
        };
      }

      // --- apply updates ---
      await this.orderModel.updateMany({ _id: { $in: mIds } }, updateDoc);
      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select(
          'smsSendingOption currency smsMethods productSetting courierMethods -_id',
        );

      // console.log("Multiple Order shop",shop);
      // console.log("Multiple Order fSetting",fSetting);

      // Product Setting Providers
      const fProductSetting = fSetting?.productSetting ?? {};

      // Courier Providers
      const fCourierMethods = fSetting?.courierMethods ?? [];
      const courierMethod = fCourierMethods.find(
        (f: any) => f.status === 'active',
      );

      // Sms Providers
      const fSmsMethods = fSetting?.smsMethods ?? [];
      const smsMethod = fSmsMethods.find((f) => f.status === 'active');
      const smsSendingOption = fSetting?.smsSendingOption;

      if (hasOrderStatus) {
        // Courier Manage
        this.addMultipleOrderToCourier({
          orderStatus: orderStatus,
          courierMethod: courierMethod,
          mIds: mIds,
        });
        // console.log('mIds', mIds);
        for (const id of mIds) {
          const previousStatus = previousOrderStatuses.get(String(id)) || '';
          await this.adjustDataOnOrderStatusUpdate({
            order_id: id,
            orderStatus: orderStatus,
            previousOrderStatus: previousStatus, // Pass previous status for quantity adjustment logic
            smsMethod: smsMethod,
            smsSendingOption: smsSendingOption,
            fProductSetting: fProductSetting,
          });
        }
      }

      return {
        success: true,
        message: 'Success! multiple order updated.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleTrashOrder(
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

      await this.orderModel.deleteMany({ _id: ids, status: 'trash' });
      return {
        success: true,
        message: 'Success! order permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
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

      await this.orderModel.deleteMany({ shop: shop, status: 'trash' });
      return {
        success: true,
        message: 'Success! order permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleOrderByIdByVendor(
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

      await this.orderModel.updateMany(
        { _id: ids },
        {
          $set: {
            status: 'trash',
            deleteDateString: this.utilsService.getDateString(new Date()),
          },
        },
      );

      for (const id of ids) {
        // Log Report Create with no await
        const orderData = JSON.parse(
          JSON.stringify(await this.orderModel.findById(id)),
        );
        this.logReportService.createLogReport({
          collectionName: 'Delete order for Trash',
          type: 'update',
          description: `Delete order for Trash. Order Id is ${orderData?.orderId} `,
          vendor: {
            _id: vendor?._id,
            username: vendor?.username,
          },
          shop: shop,
        });
      }
      return {
        success: true,
        message: 'Success! Order deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleIncompleteOrderById(
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

      await this.incompleteOrderModel.deleteMany({ _id: ids });

      return {
        success: true,
        message: 'Success! Order deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleOrdersById(
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

      await this.orderModel.deleteMany({ _id: ids });

      // for (const id of ids) {
      //   // Log Report Create with no await
      //   const orderData = JSON.parse(
      //     JSON.stringify(await this.orderModel.findById(id)),
      //   );
      //   this.logReportService.createLogReport({
      //     collectionName: 'Delete order',
      //     type: 'update',
      //     description: `Delete order. Order Id is ${orderData?.orderId} `,
      //     vendor: {
      //       _id: vendor?._id,
      //       username: vendor?.username,
      //     },
      //     shop: shop,
      //   });
      // }
      return {
        success: true,
        message: 'Success! Order deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleOrderById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.orderModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success! multiple order deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * Multiple Invoice Methods
   * generateInvoicesByIds()
   */

  private async buildInvoicePayload(shop: string, fOrderData: any) {
    const fShopInfo = await this.shopInformationModel.findOne({ shop });
    const fShopDomain = await this.shopModel
      .findById(shop)
      .select('domain subDomain');

    return {
      _id: fOrderData._id,
      shopLogo: fShopInfo.logoPrimary,
      signatureImage: null,
      shopName: fShopInfo.websiteName,
      color: fShopInfo.color,
      shopPhoneNo: fShopInfo.phones?.length ? fShopInfo.phones[0].value : '-',
      shopWhatsappNo: fShopInfo.whatsappNumber ?? '-',
      shopAddress: fShopInfo.addresses?.length
        ? fShopInfo.addresses[0].value
        : '-',
      shopEmail: fShopInfo.emails?.length ? fShopInfo.emails[0].value : '-',
      orderId: fOrderData.orderId,
      customerId: null,
      name: fOrderData.name,
      phoneNo: fOrderData.phoneNo,
      address: fOrderData.addresses,
      additionalDiscount: fOrderData.additionalDiscount,
      shippingAddress: fOrderData.shippingAddress,
      domain: fShopDomain.domain,
      date: fOrderData?.checkoutDate,
      paymentStatus: fOrderData?.paymentStatus,
      subTotal: fOrderData.subTotal,
      discount: fOrderData.discount,
      deliveryCharge: fOrderData.deliveryCharge,
      grandTotal: fOrderData.grandTotal,
      items: fOrderData.orderedItems,
      couponDiscount: fOrderData.couponDiscount,
      deliveryNote: fOrderData.deliveryNote,
      paymentType: fOrderData.paymentType,
      paidAmount: fOrderData.paidAmount,
      advancePaymentStatus: fOrderData.advancePaymentStatus,
      advancePayment: fOrderData.advancePayment,
      trackingId: fOrderData?.courierData
        ? fOrderData.courierData.providerName === 'Pathao Courier'
          ? (fOrderData.courierData.consignmentId ??
            fOrderData.courierData.trackingId ??
            null)
          : (fOrderData.courierData.consignmentId ??
            fOrderData.courierData.trackingId ??
            null)
        : null,
      customerNotes: fOrderData.customerNotes ?? null,
    };
  }

  async generateInvoicesByIds(
    shop: string,
    vendor: Vendor,
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      // access check
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });
      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        };
      }

      const objectIds = ids.map((id) => new Types.ObjectId(id));
      const orders = await this.orderModel.find({ _id: { $in: objectIds } });

      // না পাওয়া গেলে খালি
      if (!orders?.length) {
        return { success: true, message: 'No orders found', data: [] };
      }

      // payloads
      const payloads = [];
      for (const order of orders) {
        const plain = JSON.parse(JSON.stringify(order));
        const invoice = await this.buildInvoicePayload(shop, plain);
        payloads.push(invoice);
      }

      return {
        success: true,
        message: 'Success',
        data: payloads,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * Invoice Methods
   * generateInvoiceById()
   */

  async generateInvoiceById(
    shop: string,
    vendor: Vendor,
    id: string,
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

      const fShopInfo = await this.shopInformationModel.findOne({
        shop: shop,
      });

      const fOrderData = JSON.parse(
        JSON.stringify(await this.orderModel.findById(id)),
      );

      // Shop Data
      const fShopDomain = await this.shopModel
        .findById(shop)
        .select('domain subDomain');

      const invoiceData = {
        _id: fOrderData._id,
        shopLogo: fShopInfo.logoPrimary,
        signatureImage: null,
        shopName: fShopInfo.websiteName,
        color: fShopInfo.color,
        shopPhoneNo: fShopInfo.phones.length ? fShopInfo.phones[0].value : '-',
        shopWhatsappNo: fShopInfo.whatsappNumber ?? '-',
        shopAddress: fShopInfo.addresses.length
          ? fShopInfo.addresses[0].value
          : '-',
        shopEmail: fShopInfo.emails.length ? fShopInfo.emails[0].value : '-',
        orderId: fOrderData.orderId,
        customerId: null,
        name: fOrderData.name,
        phoneNo: fOrderData.phoneNo,
        sku: fOrderData.sku,
        address: fOrderData.addresses,
        additionalDiscount: fOrderData.additionalDiscount,
        shippingAddress: fOrderData.shippingAddress,
        domain: fShopDomain.domain,
        date: fOrderData?.checkoutDate,
        paymentStatus: fOrderData?.paymentStatus,
        subTotal: fOrderData.subTotal,
        discount: fOrderData.discount,
        deliveryCharge: fOrderData.deliveryCharge,
        grandTotal: fOrderData.grandTotal,
        items: fOrderData.orderedItems.map((item) => ({
          ...item,
          sku: item.variation?.sku ?? item.sku ?? null,
        })),
        couponDiscount: fOrderData.couponDiscount,
        deliveryNote: fOrderData.deliveryNote,
        paymentType: fOrderData.paymentType,
        paidAmount: fOrderData.paidAmount,
        advancePaymentStatus: fOrderData.advancePaymentStatus,
        advancePayment: fOrderData?.advancePayment,
        postCode: fOrderData?.postCode,
        trackingId: fOrderData?.courierData
          ? fOrderData.courierData.providerName === 'Pathao Courier'
            ? (fOrderData.courierData.consignmentId ??
              fOrderData.courierData.trackingId ??
              null)
            : (fOrderData.courierData.consignmentId ??
              fOrderData.courierData.trackingId ??
              null)
          : null,
        providerName: fOrderData?.courierData?.providerName ?? null,
      };

      return {
        success: true,
        message: 'Success',
        data: invoiceData,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async generateInvoiceUserById(
    shop: string,
    vendor: Vendor,
    id: string,
  ): Promise<ResponsePayload> {
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

      const fShopInfo = await this.shopInformationModel.findOne({
        shop: shop,
      });

      const fOrderData = JSON.parse(
        JSON.stringify(await this.orderModel.findById(id)),
      );

      // Shop Data
      const fShopDomain = await this.shopModel
        .findById(shop)
        .select('domain subDomain');

      const invoiceData = {
        _id: fOrderData._id,
        shopLogo: fShopInfo.logoPrimary,
        signatureImage: null,
        shopName: fShopInfo.websiteName,
        color: fShopInfo.color,
        shopPhoneNo: fShopInfo.phones.length ? fShopInfo.phones[0].value : '-',
        shopWhatsappNo: fShopInfo.whatsappNumber ?? '-',
        shopAddress: fShopInfo.addresses.length
          ? fShopInfo.addresses[0].value
          : '-',
        shopEmail: fShopInfo.emails.length ? fShopInfo.emails[0].value : '-',
        orderId: fOrderData.orderId,
        customerId: null,
        name: fOrderData.name,
        phoneNo: fOrderData.phoneNo,
        address: fOrderData.addresses,
        shippingAddress: fOrderData.shippingAddress,
        domain: fShopDomain.domain,
        date: fOrderData?.checkoutDate,
        paymentStatus: fOrderData?.paymentStatus,
        subTotal: fOrderData.subTotal,
        discount: fOrderData.discount,
        deliveryCharge: fOrderData.deliveryCharge,
        couponDiscount: fOrderData.couponDiscount,
        grandTotal: fOrderData.grandTotal,
        items: fOrderData.orderedItems,
        postCode: fOrderData?.postCode,
        trackingId: fOrderData?.courierData?.consignmentId ?? null,
      };

      return {
        success: true,
        message: 'Success',
        data: invoiceData,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * PRIVATE METHODS
   * adjustDataOnOrderStatusUpdate()
   * adjustProductQuantityOnOrderStatus()
   * sendOrderStatusSms()
   */

  /**
   * Send SMS notification based on order status using custom templates
   */
  private async sendOrderStatusSms(
    orderId: string,
    status:
      | 'orderPlaced'
      | 'orderConfirmed'
      | 'orderDelivered'
      | 'orderCanceled',
    shop: string,
  ): Promise<void> {
    try {
      // Get setting with SMS configuration
      const setting = await this.settingModel
        .findOne({ shop })
        .select('smsSendingOption smsCustomMessages smsMethods')
        .lean();

      if (!setting) {
        this.logger.log('No setting found for shop:', shop);
        return;
      }

      // Check if SMS is enabled for this status
      if (!setting.smsSendingOption?.[status]) {
        this.logger.log(`SMS disabled for ${status}`);
        return;
      }

      // Find active SMS provider
      const activeSmsMethod = setting.smsMethods?.find(
        (m) => m.status === 'active',
      );

      if (!activeSmsMethod) {
        this.logger.log('No active SMS method found');
        return;
      }

      // Get order details with customer and products
      const order: any = await this.orderModel
        .findById(orderId)
        .populate('user')
        .populate('orderedItems.product')
        .populate('shop')
        .lean();

      if (!order) {
        this.logger.log('Order not found:', orderId);
        return;
      }

      // Get phone number
      const phoneNumber = order.user?.phoneNumber || order.phoneNumber;

      if (!phoneNumber) {
        this.logger.log('No phone number found for order:', orderId);
        return;
      }

      // Get appropriate message based on status
      let message: string;

      switch (status) {
        case 'orderPlaced':
          message = this.smsTemplateService.getOrderPlacedMessage(
            order,
            setting,
          );
          break;
        case 'orderConfirmed':
          message = this.smsTemplateService.getOrderConfirmedMessage(
            order,
            setting,
          );
          break;
        case 'orderDelivered':
          message = this.smsTemplateService.getOrderDeliveredMessage(
            order,
            setting,
          );
          break;
        case 'orderCanceled':
          message = this.smsTemplateService.getOrderCanceledMessage(
            order,
            setting,
          );
          break;
        default:
          return;
      }

      // Send SMS using the new SmsService
      const success = await this.smsService.sendSms({
        phoneNumber,
        message,
        provider: activeSmsMethod,
      });

      if (success) {
        this.logger.log(
          `SMS sent successfully for order ${order.orderId} - Status: ${status}`,
        );
      } else {
        this.logger.warn(
          `Failed to send SMS for order ${order.orderId} - Status: ${status}`,
        );
      }
    } catch (error) {
      this.logger.error('Error sending order status SMS:', error.message);
      // Don't throw error - SMS failure shouldn't break order flow
    }
  }

  private async adjustDataOnOrderStatusUpdate(data: {
    order_id: any;
    orderStatus: string;
    previousOrderStatus?: string;
    smsMethod?: any;
    smsSendingOption?: any;
    fProductSetting?: any;
  }) {
    const {
      order_id,
      orderStatus,
      previousOrderStatus,
      smsMethod,
      smsSendingOption,
      fProductSetting,
    } = data;
    const fOrder = await this.orderModel
      .findById(order_id)
      .select(
        'orderTimeline orderedItems phoneNo orderId email shop phoneNo name orderStatus adjustProductQuantity',
      );
    // Use previousOrderStatus if provided (for accurate status checking before update)
    const currentStatusForCheck = previousOrderStatus || String(fOrder.orderStatus || '');
    // console.log('fOrder', fOrder);
    let orderTimeline: any;
    switch (orderStatus) {
      case 'pending':
        orderTimeline = {
          pending: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity - Only increment if currently shipped (coming back from shipped)
        // Don't increment if already in other statuses
        if (currentStatusForCheck === 'shipped') {
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '+',
            '-',
            false,
            'pending',
          );
        }
        break;

      case 'confirmed':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity - Only increment if currently shipped (coming back from shipped)
        // Don't increment if already in other statuses (even if adjustProductQuantity is true)
        if (currentStatusForCheck === 'shipped') {
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '+',
            '-',
            false,
            'confirmed',
          );
        }

        // Sms Sending - Use new template service
        if (smsMethod && smsSendingOption && smsSendingOption.orderConfirmed) {
          // Get setting for custom messages
          const setting = await this.settingModel
            .findOne({ shop: fOrder.shop })
            .select('smsSendingOption smsCustomMessages smsMethods')
            .lean();

          if (setting) {
            const order = await this.orderModel
              .findById(order_id)
              .populate('user')
              .populate('orderedItems.product')
              .populate('shop')
              .lean();

            if (order) {
              const message = this.smsTemplateService.getOrderConfirmedMessage(
                order,
                setting,
              );
              await this.smsService.sendSms({
                phoneNumber: fOrder?.phoneNo,
                message,
                provider: smsMethod,
              });
            }
          }
        }

        break;
      case 'on_hold':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: fOrder.orderTimeline.confirmed ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          onHold: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity - Only increment if currently shipped (coming back from shipped)
        // Don't increment if already in other statuses (even if adjustProductQuantity is true)
        if (currentStatusForCheck === 'shipped') {
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '+',
            '-',
            false,
            'on_hold',
          );
        }
        break;
      case 'processing':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: fOrder.orderTimeline.confirmed ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          onHold: fOrder.orderTimeline.onHold ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          processing: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity - Only increment if currently shipped (coming back from shipped)
        // Don't increment if already in other statuses (even if adjustProductQuantity is true)
        if (currentStatusForCheck === 'shipped') {
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '+',
            '-',
            false,
            'processing',
          );
        }
        break;
      case 'sent to courier':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: fOrder.orderTimeline.confirmed ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          onHold: fOrder.orderTimeline.onHold ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          'sent to courier': {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity
        if (fOrder.adjustProductQuantity) {
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '+',
            '-',
            false,
            'sent to courier',
          );
        }
        break;
      case 'shipped':
        orderTimeline = {
          // Preserve existing status history dates (using ?? to only set defaults if null/undefined)
          pending: fOrder.orderTimeline?.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: fOrder.orderTimeline?.confirmed ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          onHold: fOrder.orderTimeline?.onHold ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          processing: fOrder.orderTimeline?.processing ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          // Update shipped status with current date/time (preserve existing if already shipped)
          shipped: fOrder.orderTimeline?.shipped ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity - Only decrement if NOT already shipped (prevent double decrement)
        // If current status is already shipped, don't decrement again
        if (currentStatusForCheck !== 'shipped') {
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '-',
            '+',
            false,
            'shipped',
          );
        }
        break;

      case 'delivered':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: fOrder.orderTimeline.confirmed ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          onHold: fOrder.orderTimeline.onHold ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          processing: fOrder.orderTimeline.processing ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          shipped: fOrder.orderTimeline.shipped ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          delivered: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };

        await this.orderModel.findByIdAndUpdate(order_id, {
          $set: {
            paymentStatus: 'paid',
          },
        });

        // Adjust Quantity - Only increment if currently shipped (coming back from shipped)
        // Otherwise, normal flow: decrement quantity for delivered
        if (currentStatusForCheck === 'shipped') {
          // If coming back from shipped, increment quantity
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '+',
            '-',
            true,
            'delivered',
          );
        } else {
          // Normal flow: decrement quantity for delivered
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '-',
            '+',
            true,
            'delivered',
          );
        }

        // Sms Sending - Use new template service
        if (smsMethod && smsSendingOption && smsSendingOption.orderDelivered) {
          // Get setting for custom messages
          const setting = await this.settingModel
            .findOne({ shop: fOrder.shop })
            .select('smsSendingOption smsCustomMessages smsMethods')
            .lean();

          if (setting) {
            const order = await this.orderModel
              .findById(order_id)
              .populate('user')
              .populate('orderedItems.product')
              .populate('shop')
              .lean();

            if (order) {
              const message = this.smsTemplateService.getOrderDeliveredMessage(
                order,
                setting,
              );
              await this.smsService.sendSms({
                phoneNumber: fOrder?.phoneNo,
                message,
                provider: smsMethod,
              });
            }
          }
        }
        // Email Sending
        if (
          fOrder?.email &&
          fProductSetting?.productType === 'digitalProduct'
        ) {
          this.emailSendForPurchaseDigitalProductLinks(fOrder);
        }

        break;
      case 'returned':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: fOrder.orderTimeline.confirmed ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          onHold: fOrder.orderTimeline.onHold ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          processing: fOrder.orderTimeline.processing ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          shipped: fOrder.orderTimeline.shipped ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          delivered: fOrder.orderTimeline.delivered ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          returned: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity - Only add if cancelled or refunded hasn't already added quantity
        const hasCancelledOrRefunded =
          fOrder.orderTimeline?.cancelled ||
          fOrder.orderTimeline?.refunded;

        if (!hasCancelledOrRefunded) {
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '+',
            '-',
            false,
            'returned',
          );
        }
        break;
      case 'refunded':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          confirmed: fOrder.orderTimeline.confirmed ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          processing: fOrder.orderTimeline.processing ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          onHold: fOrder.orderTimeline.onHold ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          shipped: fOrder.orderTimeline.shipped ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          delivered: fOrder.orderTimeline.delivered ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          returned: fOrder.orderTimeline.returned ?? {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
          refunded: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity - Only add if cancelled hasn't already added quantity
        const hasCancelled = fOrder.orderTimeline?.cancelled;

        if (!hasCancelled) {
          await this.adjustProductQuantityOnOrderStatus(
            fOrder._id,
            JSON.parse(JSON.stringify(fOrder.orderedItems)),
            '+',
            '-',
            false,
            'refunded',
          );
        }
        break;
      case 'cancelled':
        orderTimeline = {
          pending: fOrder.orderTimeline.pending ?? null,
          confirmed: fOrder.orderTimeline.confirmed ?? null,
          onHold: fOrder.orderTimeline.onHold ?? null,
          processing: fOrder.orderTimeline.processing ?? null,
          shipped: fOrder.orderTimeline.shipped ?? null,
          delivered: fOrder.orderTimeline.delivered ?? null,
          returned: fOrder.orderTimeline.returned ?? null,
          cancelled: {
            date: this.utilsService.getDateString(new Date()),
            time: this.utilsService.getCurrentTime(),
          },
        };
        // Adjust Quantity
        // if (fOrder.adjustProductQuantity) {
        await this.adjustProductQuantityOnOrderStatus(
          fOrder._id,
          JSON.parse(JSON.stringify(fOrder.orderedItems)),
          '+',
          '-',
          false,
          'cancelled',
        );
        // }

        // Sms Sending - Use new template service
        if (smsMethod && smsSendingOption && smsSendingOption.orderCanceled) {
          // Get setting for custom messages
          const setting = await this.settingModel
            .findOne({ shop: fOrder.shop })
            .select('smsSendingOption smsCustomMessages smsMethods')
            .lean();

          if (setting) {
            const order = await this.orderModel
              .findById(order_id)
              .populate('user')
              .populate('orderedItems.product')
              .populate('shop')
              .lean();

            if (order) {
              const message = this.smsTemplateService.getOrderCanceledMessage(
                order,
                setting,
              );
              await this.smsService.sendSms({
                phoneNumber: fOrder?.phoneNo,
                message,
                provider: smsMethod,
              });
            }
          }
        }
        break;
    }

    await this.orderModel.findByIdAndUpdate(order_id, {
      $set: {
        orderTimeline: orderTimeline,
      },
    });

    // console.log(orderTimeline);
  }

  async emailSendForPurchaseDigitalProductLinks(fOrder: any) {
    // Make drive links array
    const driveLinks: any = await this.extractDriveLinksFromOrder(fOrder);

    const shopData: any = await this.shopModel
      .findById(fOrder.shop)
      .select('domain');
    const shopInformationData: any = await this.shopInformationModel
      .findOne({ shop: fOrder.shop })
      .select('logoPrimary');

    const settingData: any = await this.settingModel
      .findOne({ shop: fOrder.shop })
      .select('orderNotification');

    // console.log("fOrder.email",fOrder.email);

    if (fOrder.email && driveLinks && driveLinks.length) {
      //  Email html
      const html = `
       <div style="width: 450px; font-family: Helvetica, Arial, sans-serif; border: 1px solid #e2e2e2; border-radius: 6px; overflow: hidden;">
       <div style="padding: 15px 20px; background: #fff;">
        <img src="${shopInformationData.logoPrimary ?? ''}" alt="" width="70" style="margin-bottom: 10px;" loading="lazy"/>
         <h2 style="margin: 0 0 10px;">Hello, ${fOrder.name}</h2>

      <p style="margin: 4px 0;"><strong>Phone No:</strong> ${fOrder.phoneNo}</p>
      <p style="margin: 4px 0;"><strong>Order No:</strong> ${fOrder.orderId}</p>
      <p style="margin: 4px 0;"><strong>Website:</strong> <a href="${shopData.domain}" style="color: #2563eb; text-decoration: none;" target="_blank">${shopData.domain}</a></p>

      <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;" />

      <div>
        <h4 style="margin: 0 0 10px;">Your Product Links:</h4>
        ${driveLinks
          .map(
            (item) => `
              <p style="margin-bottom: 6px;"><strong>Product:</strong> ${item.productName}</p>
              ${item.driveLinks
                .map(
                  (link) =>
                    `<p style="margin: 2px 0;"><strong>${link.name}:</strong> <a href="${link.value}" style="color: #2563eb;" target="_blank">${link.value}</a></p>`,
                )
                .join('')}
            `,
          )
          .join('')}
      </div>

      <div style="margin-top: 20px; background: #f9f9f9; padding: 10px; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px;">Thank you for shopping with us! If you have any questions, feel free to contact our support team.</p>
      </div>
      </div>
     </div>
     `;

      if (
        settingData?.orderNotification?.isEnablePersonalNotification &&
        settingData?.orderNotification?.appEmail &&
        settingData?.orderNotification?.appPassword
      ) {
        this.emailService.sendEmailFormPersonal(
          fOrder.email,
          `Your order has been delivered and order id #${fOrder.orderId}`,
          html,
          settingData?.orderNotification,
        );
      } else {
        this.emailService.sendEmail(
          fOrder.email,
          `Your order has been delivered and order id #${fOrder.orderId}`,
          html,
          shopData,
        );
      }
    } else {
      //  Email html
      const html = `
       <div style="width: 450px; font-family: Helvetica, Arial, sans-serif; border: 1px solid #e2e2e2; border-radius: 6px; overflow: hidden;">
       <div style="padding: 15px 20px; background: #fff;">
        <img src="${shopInformationData.logoPrimary ?? ''}" alt="" width="70" style="margin-bottom: 10px;" loading="lazy"/>
         <h2 style="margin: 0 0 10px;">Hello, ${fOrder.name}</h2>

      <p style="margin: 4px 0;"><strong>Phone No:</strong> ${fOrder.phoneNo}</p>
      <p style="margin: 4px 0;"><strong>Order No:</strong> ${fOrder.orderId}</p>
      <p style="margin: 4px 0;"><strong>Website:</strong> <a href="${shopData.domain}" style="color: #2563eb; text-decoration: none;" target="_blank">${shopData.domain}</a></p>

      <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;" />


      <div style="margin-top: 20px; background: #f9f9f9; padding: 10px; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px;">Thank you for shopping with us! If you have any questions, feel free to contact our support team.</p>
      </div>
      </div>
     </div>
     `;

      if (
        settingData?.orderNotification?.isEnablePersonalNotification &&
        settingData?.orderNotification?.appEmail &&
        settingData?.orderNotification?.appPassword
      ) {
        this.emailService.sendEmailFormPersonal(
          fOrder.email,
          `Your order has been delivered and order id #${fOrder.orderId}`,
          html,
          settingData?.orderNotification,
        );
      } else {
        this.emailService.sendEmail(
          fOrder.email,
          `Your order has been delivered and order id #${fOrder.orderId}`,
          html,
          shopData,
        );
      }
    }
  }

  async extractDriveLinksFromOrder(order: any) {
    if (!order) {
      return {};
    }

    const driveLinks = [];

    for (const item of order.orderedItems) {
      const product = await this.productModel.findById(item.product).lean();

      if (
        product &&
        Array.isArray(product.driveLinks) &&
        product.driveLinks.length > 0
      ) {
        driveLinks.push({
          productId: product._id,
          productName: product.name,
          driveLinks: product.driveLinks.map((link) => ({
            name: link.name,
            value: link.value,
          })),
        });
      }
    }

    return driveLinks;
  }

  // private async adjustProductQuantityOnOrderStatus(
  //   order_id: any,
  //   orderedItems: any[],
  //   qtyIncrementType: '-' | '+',
  //   soldIncrementType: '-' | '+',
  //   adjustQty: boolean,
  // ) {
  //   console.log(order_id, orderedItems);
  //   for (const item of orderedItems) {
  //     if (item.variation) {
  //       try {
  //         await this.productModel.updateOne(
  //           {
  //             _id: new ObjectId(item.product),
  //             'variationList._id': new ObjectId(item.variation._id),
  //           },
  //           {
  //             $inc: {
  //               'variationList.$[e1].quantity':
  //                 qtyIncrementType === '-'
  //                   ? -item.selectedQuantity
  //                   : item.selectedQuantity,
  //               totalSold:
  //                 soldIncrementType === '-'
  //                   ? -item.selectedQuantity
  //                   : item.selectedQuantity,
  //             },
  //           },
  //           {
  //             arrayFilters: [{ 'e1._id': new ObjectId(item.variation._id) }],
  //           },
  //         );
  //       } catch (err) {
  //         console.log(err);
  //       }
  //     } else {
  //       await this.productModel.findByIdAndUpdate(item.product, {
  //         $inc: {
  //           quantity:
  //             qtyIncrementType === '-'
  //               ? -item.selectedQuantity
  //               : item.selectedQuantity,
  //           totalSold:
  //             soldIncrementType === '-'
  //               ? -item.selectedQuantity
  //               : item.selectedQuantity,
  //         },
  //       });
  //     }
  //   }
  //   await this.orderModel.findByIdAndUpdate(order_id, {
  //     $set: {
  //       adjustProductQuantity: adjustQty,
  //     },
  //   });
  // }

  private async adjustProductQuantityOnOrderStatus(
    order_id: any,
    orderedItems: any[],
    qtyIncrementType: '-' | '+',
    soldIncrementType: '-' | '+',
    adjustQty: boolean,
    orderStatus: any,
  ) {
    // Skip quantity adjustment for pending status only if it's not an increment operation
    // (Allow increment when coming back from shipped status)
    if (orderStatus === 'pending' && qtyIncrementType === '-') {
      return;
    }

    // console.log(order_id, orderedItems);
    for (const item of orderedItems) {
      const qty = item.selectedQuantity ?? item.quantity ?? 0; // fallback fix

      if (item.variation) {
        try {
          await this.productModel.updateOne(
            {
              _id: new ObjectId(item.product),
              'variationList._id': new ObjectId(item.variation._id),
            },
            {
              $inc: {
                'variationList.$[e1].quantity':
                  qtyIncrementType === '-' ? -qty : qty,
                totalSold:
                  orderStatus !== 'delivered'
                    ? soldIncrementType === '-'
                      ? -qty
                      : qty
                    : 0,
              },
            },
            {
              arrayFilters: [{ 'e1._id': new ObjectId(item.variation._id) }],
            },
          );
        } catch (err) {
          console.log(err);
        }
      } else {
        await this.productModel.findByIdAndUpdate(item.product, {
          $inc: {
            quantity:
              orderStatus !== 'delivered'
                ? qtyIncrementType === '-'
                  ? -qty
                  : qty
                : 0,
            totalSold: soldIncrementType === '-' ? -qty : qty,
          },
        });
      }
    }
    await this.orderModel.findByIdAndUpdate(order_id, {
      $set: {
        adjustProductQuantity: adjustQty,
      },
    });
  }

  /**
   * Courier Methods
   * addSingleOrderToCourier()
   * addMultipleOrderToCourier()
   */

  private async addSingleOrderToCourier(data: {
    orderStatus: string;
    courierMethod: any;
    id: string;
  }) {
    const { orderStatus, courierMethod, id } = data;
    if (orderStatus === 'sent to courier' && courierMethod) {
      const courierApiConfig: CourierApiConfig = {
        providerName: courierMethod?.providerName,
        apiKey: courierMethod?.apiKey,
        secretKey: courierMethod?.secretKey,
        username: courierMethod?.username,
        password: courierMethod?.password,
        specialInstruction: courierMethod?.specialInstruction,
        storeId: courierMethod?.storeId,
      };
      const fOrder = await this.orderModel.findById(id);
      if (courierMethod?.providerName === 'Steadfast Courier') {
        if (fOrder?.courierData && fOrder?.courierData?.consignmentId) {
        } else {
          const getFullAddress = () => {
            return `Division: ${fOrder?.division}, Area: ${fOrder?.area
              }, Zone: ${fOrder?.zone ?? 'n/a'}, ${fOrder?.shippingAddress}`;
          };

          const cashOnDeliveryAmount = () => {
            if (fOrder?.paymentStatus === 'paid') {
              return 0;
            } else {
              return fOrder?.grandTotal ?? 0;
            }
          };
          const payload: SteadfastCourierPayload = {
            invoice: fOrder?.orderId,
            recipient_name: fOrder?.name,
            recipient_phone: fOrder?.phoneNo,
            recipient_email: fOrder?.email ?? null,
            recipient_address: getFullAddress(),
            cod_amount: cashOnDeliveryAmount(),
            item_description:
              fOrder?.orderedItems?.map((i) => i.name).join(', ') || '',
            note: fOrder?.deliveryNote
              ? `${fOrder.deliveryNote} (${courierMethod?.specialInstruction || ''})`
              : courierMethod?.specialInstruction || '',
          };

          // console.log('payload', payload);

          const courierResponse =
            await this.courierService.createOrderWithProvider(
              courierApiConfig,
              payload,
            );

          if (courierResponse.status === 200) {
            // console.log('courierResponse', courierResponse);

            const orderCourierData = {
              providerName: 'Steadfast Courier',
              consignmentId: courierResponse?.consignment?.consignment_id,
              trackingId: courierResponse?.consignment?.tracking_code,
              createdAt: this.utilsService.getDateString(new Date()),
            };
            await this.orderModel.findByIdAndUpdate(id, {
              $set: {
                courierData: orderCourierData,
              },
            });
          }
        }
      }

      if (courierMethod?.providerName === 'Pathao Courier') {
        // if (courierMethod) {
        if (fOrder?.courierData && fOrder?.courierData?.consignmentId) {
        } else {
          const courierResponse =
            await this.courierService.createOrderWithProvider(
              courierApiConfig,
              fOrder,
            );

          if (courierResponse.code === 200) {
            const orderCourierData = {
              providerName: courierMethod?.providerName,
              consignmentId: courierResponse?.data?.consignment_id,
              trackingId: courierResponse?.data?.merchant_order_id,
              createdAt: this.utilsService.getDateString(new Date()),
            };
            await this.orderModel.findByIdAndUpdate(id, {
              $set: {
                courierData: orderCourierData,
              },
            });
          }
        }
      }
    }
  }

  private async addMultipleOrderToCourier(data: {
    orderStatus: string;
    courierMethod: any;
    mIds: any[];
  }) {
    const { orderStatus, courierMethod, mIds } = data;
    if (orderStatus === 'sent to courier' && courierMethod) {
      const courierApiConfig: CourierApiConfig = {
        providerName: courierMethod?.providerName,
        apiKey: courierMethod?.apiKey,
        secretKey: courierMethod?.secretKey,
        username: courierMethod?.username,
        password: courierMethod?.password,
        specialInstruction: courierMethod?.specialInstruction,
        storeId: courierMethod?.storeId,
      };
      for (const id of mIds) {
        const fOrder = await this.orderModel.findById(id);
        if (courierMethod?.providerName === 'Steadfast Courier') {
          if (fOrder?.courierData && fOrder?.courierData?.consignmentId) {
          } else {
            const getFullAddress = () => {
              return `Division: ${fOrder?.division}, Area: ${fOrder?.area
                }, Zone: ${fOrder?.zone ?? 'n/a'}, ${fOrder?.shippingAddress}`;
            };

            const cashOnDeliveryAmount = () => {
              if (fOrder?.paymentStatus === 'paid') {
                return 0;
              } else {
                return fOrder?.grandTotal ?? 0;
              }
            };
            const payload: SteadfastCourierPayload = {
              invoice: fOrder?.orderId,
              recipient_name: fOrder?.name,
              recipient_phone: fOrder?.phoneNo,
              recipient_address: getFullAddress(),
              cod_amount: cashOnDeliveryAmount(),
              item_description:
                fOrder?.orderedItems?.map((i) => i.name).join(', ') || '',
              note: fOrder?.deliveryNote
                ? `${fOrder.deliveryNote} (${courierMethod?.specialInstruction || ''})`
                : courierMethod?.specialInstruction || '',
            };

            // console.log('payload', payload);

            const courierResponse =
              await this.courierService.createOrderWithProvider(
                courierApiConfig,
                payload,
              );
            if (courierResponse.status === 200) {
              // console.log('courierResponse', courierResponse);
              const orderCourierData = {
                providerName: 'Steadfast Courier',
                consignmentId: courierResponse?.consignment?.consignment_id,
                trackingId: courierResponse?.consignment?.tracking_code,
                createdAt: this.utilsService.getDateString(new Date()),
              };
              await this.orderModel.findByIdAndUpdate(id, {
                $set: {
                  courierData: orderCourierData,
                },
              });
            }
          }
        }

        if (courierMethod?.providerName === 'Pathao Courier') {
          // if (courierMethod) {
          if (fOrder?.courierData && fOrder?.courierData?.consignmentId) {
          } else {
            const courierResponse =
              await this.courierService.createOrderWithProvider(
                courierApiConfig,
                fOrder,
              );

            if (courierResponse.code === 200) {
              const orderCourierData = {
                providerName: courierMethod?.providerName,
                consignmentId: courierResponse?.data?.consignment_id,
                trackingId: courierResponse?.data?.merchant_order_id,
                createdAt: this.utilsService.getDateString(new Date()),
              };
              await this.orderModel.findByIdAndUpdate(id, {
                $set: {
                  courierData: orderCourierData,
                },
              });
            }
          }
        }
      }
    }
  }

  /**
   * Support Methods
   * getUniqueOrderId()
   * getUniqueIncompleteOrderId()
   * getOrderItems()
   * cartRegularSubTotal()
   * cartSaleSubTotal()
   * cartDiscountAmount()
   * getDeliveryCharge()
   * getOrderGrandTotal()
   * offerDiscountAmount()
   */

  private async getUniqueOrderId(shop: string) {
    const incOrder = await this.uniqueIdModel.findOneAndUpdate(
      { shop: shop },
      { $inc: { orderId: 1 } },
      { new: true, upsert: true, returnDocument: 'after' },
    );

    return this.utilsService.padLeadingZeros(incOrder.orderId);
  }

  private async getUniqueIncompleteOrderId(shop: string) {
    const incOrder = await this.uniqueIdModel.findOneAndUpdate(
      { shop: shop },
      { $inc: { incompleteOrderId: 1 } },
      { new: true, upsert: true, returnDocument: 'after' },
    );

    return this.utilsService.padLeadingZeros(incOrder.incompleteOrderId);
  }

  private getOrderItems(cartItems: Cart[]) {
    return cartItems.map((m) => {
      return {
        product: m.product._id,
        name: m.product.name,
        slug: m.product.slug,
        image:
          m.product.images && m.product.images.length
            ? m.product.images[0]
            : null,
        category: {
          _id: m.product.category?._id,
          name: m.product.category?.name,
          slug: m.product.category?.slug,
        },
        subCategory: m.product.subCategory
          ? {
            _id: m.product.subCategory?._id,
            name: m.product.subCategory?.name,
            slug: m.product.category?.slug,
          }
          : null,
        childCategory: m.product.childCategory
          ? {
            _id: m.product.childCategory?._id,
            name: m.product.childCategory?.name,
            slug: m.product.childCategory?.slug,
          }
          : null,
        brand: m.product.brand
          ? {
            _id: m.product.brand?._id,
            name: m.product.brand?.name,
            slug: m.product.category?.slug,
          }
          : null,
        model: m.product.model ?? null,
        regularPrice: this.utilsService.getProductPrice(
          m.product,
          'regularPrice',
          m.variation?._id,
        ),
        salePrice: m.isWholesale
          ? m.product.wholesalePrice
          : this.utilsService.getProductPrice(
            m.product,
            'salePrice',
            m.variation?._id,
          ),
        costPrice: m.product.costPrice,
        quantity: m.selectedQty,
        sku: m.product.sku,
        unit: m.product.unit,
        weight: m.product.weight,
        isReview: false,
        deliveryCharge: m.product.deliveryCharge,
        advancePayment: m.product.advancePayment,
        variation: m.variation,
        purchaseType: m.isWholesale ? 'Wholesale' : 'Retail',
        phoneModel:
          m.product.isEnablePhoneModel && m.phoneModel
            ? m.phoneModel.trim()
            : null,
      };
    });
  }

  private cartRegularSubTotal(cartItems: Cart[]) {
    return cartItems
      .map((item) => {
        return this.utilsService.getProductPrice(
          item.product,
          'regularPrice',
          item.variation?._id,
          item.selectedQty,
        ) as number;
      })
      .reduce((acc, value) => acc + value, 0);
  }

  private cartSaleSubTotal(cartItems: Cart[]) {
    return cartItems
      .map((item) => {
        return this.utilsService.getProductPrice(
          item.product,
          'salePrice',
          item.variation?._id,
          item.selectedQty,
          item.isWholesale,
        ) as number;
      })
      .reduce((acc, value) => acc + value, 0);
  }

  // private cartDeliveryChargeTotal(cartItems: Cart[]): number {
  //   return cartItems
  //     .map((item: any) => (item.product.deliveryCharge || 0) * item.selectedQty)
  //     .reduce((acc, value) => acc + value, 0);
  // }

  // Service Method

  getCartDeliveryChargeTotal(
    cartItems: any[],
    isInsideCity: boolean,
  ): { total: number; hasZero: boolean } {
    let hasZero = false;

    const total = cartItems
      .map((item) => {
        const charge = isInsideCity
          ? item.product?.deliveryCharge?.insideCity || 0
          : item.product?.deliveryCharge?.outsideCity || 0;

        if (charge === 0) {
          hasZero = true;
        }

        return charge * item.selectedQty;
      })
      .reduce((acc, value) => acc + value, 0);

    return { total, hasZero };
  }

  private cartAdvancePaymentTotal(cartItems: Cart[]): {
    total: number;
    hasZero: boolean;
  } {
    let hasZero = false;

    const total = cartItems
      .map((item: any) => {
        if (item.product.advancePayment === 0) {
          hasZero = true;
        }
        return (item.product.advancePayment || 0) * item.selectedQty;
      })
      .reduce((acc, value) => acc + value, 0);

    return { total, hasZero };
  }

  private cartDiscountAmount(cartItems: Cart[]) {
    return cartItems
      .map((item) => {
        return this.utilsService.getProductPrice(
          item.product,
          'discountAmount',
          item.variation?._id,
          item.selectedQty,
          item?.isWholesale,
        ) as number;
      })
      .reduce((acc, value) => acc + value, 0);
  }

  // private getDeliveryCharge(
  //   deliveryCharges: any,
  //   division: string,
  //   deliveryType: string,
  //   cartItems: any,
  // ): number {
  //   const selectedDelivery = deliveryCharges.find(
  //     (charge: any) => charge.type === deliveryType,
  //   );
  //
  //   if (!selectedDelivery) {
  //     return 0;
  //   }
  //
  //   // For free delivery, always return 0
  //   if (deliveryType === 'free') {
  //     return 0;
  //   }
  //
  //   if (
  //     selectedDelivery?.freeDeliveryMinAmount &&
  //     this.cartSaleSubTotal(cartItems) >=
  //       selectedDelivery?.freeDeliveryMinAmount
  //   ) {
  //     return 0;
  //   }
  //
  //   // Determine charge based on city match
  //   if (selectedDelivery.city === division) {
  //     return selectedDelivery.insideCity || 0;
  //   } else {
  //     return selectedDelivery.outsideCity || 0;
  //   }
  // }

  // private getDeliveryCharge(
  //   deliveryCharges: any,
  //   division: string,
  //   deliveryType: string,
  //   cartItems: any,
  // ): { deliveryCharge: number; isInsideCity: boolean } {
  //   const selectedDelivery = deliveryCharges.find(
  //     (charge: any) => charge.type === deliveryType,
  //   );
  //
  //   if (!selectedDelivery) {
  //     return { deliveryCharge: 0, isInsideCity: true };
  //   }
  //
  //   if (deliveryType === 'free') {
  //     return { deliveryCharge: 0, isInsideCity: true };
  //   }
  //
  //   if (
  //     selectedDelivery?.freeDeliveryMinAmount &&
  //     this.cartSaleSubTotal(cartItems) >=
  //       selectedDelivery?.freeDeliveryMinAmount
  //   ) {
  //     return { deliveryCharge: 0, isInsideCity: true };
  //   }
  //
  //   const isInsideCity = selectedDelivery.city === division;
  //   const deliveryCharge = isInsideCity
  //     ? selectedDelivery.insideCity || 0
  //     : selectedDelivery.outsideCity || 0;
  //
  //   return { deliveryCharge, isInsideCity };
  // }

  private getDeliveryCharge(
    deliveryCharges: any[] = [],
    division: string,
    deliveryType: string,
    cartItems: any[] = [],
  ): { deliveryCharge: number; isInsideCity: boolean } {
    // ---- Pick the selected delivery config by type ----
    const selectedDelivery = (deliveryCharges || []).find(
      (c: any) => c?.type === deliveryType,
    );

    // Safe, case-insensitive city match
    const city = (selectedDelivery?.city ?? '').toString().trim().toLowerCase();
    const currentDivision = (division ?? '').toString().trim().toLowerCase();
    const isInsideCity =
      city && currentDivision ? city === currentDivision : true; // default `true` if unknown

    // ---- Free type → zero ----
    if (!selectedDelivery || deliveryType === 'free') {
      return { deliveryCharge: 0, isInsideCity };
    }

    // ---- Free threshold check ----
    const freeMin = Number(selectedDelivery?.freeDeliveryMinAmount) || 0;
    if (freeMin > 0 && this.cartSaleSubTotal(cartItems) >= freeMin) {
      return { deliveryCharge: 0, isInsideCity };
    }

    // ---- Per-product charges (fallback to global once if any product lacks its own) ----
    const productCharges = (cartItems ?? []).map((item: any) => {
      const pd = item?.product?.deliveryCharge;
      const enabled = pd?.isEnableDeliveryCharge === true;

      if (enabled) {
        const raw = isInsideCity ? pd?.insideCity : pd?.outsideCity;
        const n = Number(raw);
        return Number.isFinite(n) ? n : 0; // treat invalid as 0 when product-level is enabled
      }

      // No per-product charge → mark as needing global once
      return null;
    });

    // Sum valid per-product numbers
    const perProductTotal = productCharges
      .filter((v) => v !== null)
      .reduce((sum, v) => sum + (v as number), 0);

    // If any product had null, we add the global charge ONCE
    const needsGlobal = productCharges.some((v) => v === null);
    const globalOnce = needsGlobal
      ? Number(
        isInsideCity
          ? selectedDelivery?.insideCity
          : selectedDelivery?.outsideCity,
      ) || 0
      : 0;

    const total = perProductTotal + globalOnce;

    // Apply sub-area logic at the end
    const finalDeliveryCharge = isInsideCity
      ? total
      : division === 'sub-area'
        ? selectedDelivery.subArea || 0
        : total;

    return { deliveryCharge: finalDeliveryCharge, isInsideCity };
  }

  private getOrderGrandTotal(
    cartItems: Cart[],
    finalDeliveryCharge: any,
    offerDiscount?: any,
    couponDiscount?: any,
  ) {
    return (
      this.cartSaleSubTotal(cartItems) +
      finalDeliveryCharge -
      (offerDiscount?.amount ?? 0) -
      (couponDiscount ?? 0)
    );
  }

  private async offerDiscountAmount(data: {
    offersSetting: any[];
    user: User;
    userOffer: string;
    subTotal: number;
  }) {
    const { offersSetting, user, userOffer, subTotal } = data;

    const offers = offersSetting
      .filter((f) => f.status?.toLowerCase() === 'active')
      .map((m: any) => {
        return {
          offerType: m.offerType,
          discount: m.discount,
        };
      });

    function filterOffers(offers: any[], removeType: string) {
      return offers.filter((offer) => offer.offerType !== removeType);
    }

    const selectedUserOffer = offers.find((f) => f.offerType === userOffer);

    let canUserGetNewRegistration: boolean = false;
    if (
      selectedUserOffer &&
      selectedUserOffer.offerType === 'new-registration'
    ) {
      const fUser = await this.userModel
        .findById(user._id)
        .select('registrationAt');

      const regDayAgo = this.utilsService.getDateDifference(
        new Date(fUser.registrationAt),
        new Date(),
        'days',
      );
      if (regDayAgo <= 30) {
        const orderCount = await this.orderModel.countDocuments({
          user: user._id,
        });
        canUserGetNewRegistration =
          orderCount < MAX_NEW_REGISTRATION_ORDER_COUNT;
      } else {
        canUserGetNewRegistration = false;
      }
    }

    let finalData: any[];
    if (!canUserGetNewRegistration) {
      finalData = filterOffers(offers, 'new-registration');
    } else {
      finalData = offers;
    }

    if (finalData.length) {
      const getDiscountAmount = () => {
        if (selectedUserOffer) {
          const discount = selectedUserOffer.discount;
          let discountValue = 0;
          if (discount.endsWith('%')) {
            const percentage = parseFloat(discount.replace('%', ''));
            discountValue = (percentage / 100) * subTotal;
          } else {
            discountValue = parseFloat(discount);
          }
          // Ensure discount doesn't exceed subtotal
          return Math.min(discountValue, subTotal);
        } else {
          return 0;
        }
      };
      return {
        offerType: selectedUserOffer?.offerType,
        amount: getDiscountAmount(),
      };
    } else {
      return null;
    }
  }

  /**
   * On Success Payment
   * onSuccessfulPayment()
   */

  private async onSuccessfulPayment(
    paymentResult: any,
    orderData: any,
    fSetting: any,
  ) {
    await this.orderModel.findByIdAndUpdate(orderData?._id, {
      $set: paymentResult,
    });

    // Remove from Carts
    await this.cartModel.deleteMany({
      _id: { $in: orderData?.carts.map((m) => new ObjectId(m)) },
    });

    //Order Notification
    const fOrderNotification = fSetting?.orderNotification ?? {};

    // Sms Providers
    const fSmsMethods = fSetting?.smsMethods ?? [];
    const smsMethod = fSmsMethods.find((f) => f.status === 'active');
    const smsSendingOption = fSetting?.smsSendingOption;

    // Sms Sending - Use new template service
    if (smsMethod && smsSendingOption && smsSendingOption.orderPlaced) {
      // Get setting for custom messages
      const setting = await this.settingModel
        .findOne({ shop: orderData.shop })
        .select('smsSendingOption smsCustomMessages smsMethods')
        .lean();

      if (setting) {
        const order = await this.orderModel
          .findById(orderData._id)
          .populate('user')
          .populate('orderedItems.product')
          .populate('shop')
          .lean();

        if (order) {
          const message = this.smsTemplateService.getOrderPlacedMessage(
            order,
            setting,
          );
          await this.smsService.sendSms({
            phoneNumber: orderData?.phoneNo,
            message,
            provider: smsMethod,
          });
        }
      }
    }

    // Order Notification For Admin
    if (
      orderData &&
      fOrderNotification &&
      (fOrderNotification.isEnableSMSNotification ||
        fOrderNotification.isEnableEmailNotification)
    ) {
      this.orderNotificationForAdmin(orderData, fSetting, fOrderNotification);
    }
  }


  private async payWithStripe(stripeConfig: {
    secretKey: string;
    production: boolean;
    amount: number;
    currency: string;
    orderId: string;
    baseUrl: string;
  }) {
    try {
      const { secretKey, amount, currency, orderId, baseUrl } = stripeConfig;

      const params = new URLSearchParams();
      params.append('mode', 'payment');
      // params.append('customer_email', 'customer@example.com');
      params.append(
        'success_url',
        `${baseUrl}/api/order/callback-stripe-payment?status=success&orderId=${orderId}`,
      );
      params.append(
        'cancel_url',
        `${baseUrl}/api/order/callback-stripe-payment?status=cancel&orderId=${orderId}`,
      );
      params.append('line_items[0][price_data][currency]', currency);
      params.append(
        'line_items[0][price_data][product_data][name]',
        `Order #${orderId}`,
      );
      params.append(
        'line_items[0][price_data][unit_amount]',
        `${Math.round(amount * 100)}`,
      );
      params.append('line_items[0][quantity]', '1');
      params.append('payment_intent_data[metadata][orderId]', orderId);

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
          _id: orderId,
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
    orderId: string,
    sessionId: string,
  ): Promise<any> {
    try {
      const fOrder = await this.orderModel.findById(orderId);

      const fSetting = await this.settingModel
        .findOne({ shop: fOrder?.shop })
        .select(
          'smsSendingOption currency smsMethods orderNotification paymentMethods -_id',
        );

      const fShopDomain = await this.shopModel
        .findById(fOrder?.shop)
        .select('domain subDomain');

      const redirectUrlBase =
        process.env.PRODUCTION_BUILD === 'true'
          ? `https://${fShopDomain.domain}`
          : 'http://localhost:3007';

      if (status === 'success') {
        if (fOrder.advancePayment && fOrder.advancePayment > 0) {
          await this.onSuccessfulPayment(
            {
              paidAmount: fOrder?.advancePayment ?? fOrder?.grandTotal,
              paymentApiTrxID: sessionId,
              paymentMethod: 'Stripe',
              advancePaymentStatus: 'paid',
            },
            fOrder,
            fSetting,
          );

          return res.redirect(
            `${redirectUrlBase}/success-order?_id=${fOrder?._id}&orderId=${fOrder?.orderId}&message=Stripe payment successful`,
          );
        } else {
          await this.onSuccessfulPayment(
            {
              paidAmount: fOrder?.advancePayment ?? fOrder?.grandTotal,
              paymentApiTrxID: sessionId,
              paymentMethod: 'Stripe',
              paymentStatus: 'paid',
            },
            fOrder,
            fSetting,
          );
          return res.redirect(
            `${redirectUrlBase}/success-order?_id=${fOrder?._id}&orderId=${fOrder?.orderId}&message=Stripe payment successful`,
          );
        }
      } else {
        await this.orderModel.findByIdAndDelete(fOrder?._id);
        return res.redirect(
          `${redirectUrlBase}/failed-order?message=Stripe payment failed or cancelled.`,
        );
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async stripeWebhook(body: any, rawBody: Buffer, signature: string): Promise<any> {
    try {
      const eventType = body.type;
      const data = body.data?.object;

      if (!data) return { success: true };

      let fOrder: any = null;
      const orderId = data.metadata?.orderId;
      
      if (orderId) {
        fOrder = await this.orderModel.findById(orderId);
      } else if (data.payment_intent) {
        fOrder = await this.orderModel.findOne({ paymentApiTrxID: data.payment_intent });
      }

      if (!fOrder) return { success: true };

      const fSetting = await this.settingModel
        .findOne({ shop: fOrder?.shop })
        .select('smsSendingOption currency smsMethods orderNotification paymentMethods -_id');

      const fStripeMethod = fSetting?.paymentMethods?.find(f => f.providerName === 'Stripe');
      if (!fStripeMethod) return { success: true };

      if (fStripeMethod.webhookSecret && rawBody && signature) {
        try {
          const stripe = new Stripe(fStripeMethod.secretKey, { apiVersion: '2024-06-20' as any });
          stripe.webhooks.constructEvent(rawBody, signature, fStripeMethod.webhookSecret);
        } catch (err) {
          console.error('Webhook signature verification failed.', err.message);
          throw new BadRequestException(`Webhook Error: ${err.message}`);
        }
      }

      if (eventType === 'payment_intent.succeeded') {
        if (fOrder && (fOrder.paymentStatus !== 'paid' && fOrder.advancePaymentStatus !== 'paid')) {
          if (fOrder.advancePayment && fOrder.advancePayment > 0) {
              await this.onSuccessfulPayment(
                {
                  paidAmount: fOrder?.advancePayment ?? fOrder?.grandTotal,
                  paymentApiTrxID: data.id,
                  paymentMethod: 'Stripe',
                  advancePaymentStatus: 'paid',
                },
                fOrder,
                fSetting,
              );
            } else {
              await this.onSuccessfulPayment(
                {
                  paidAmount: fOrder?.advancePayment ?? fOrder?.grandTotal,
                  paymentApiTrxID: data.id,
                  paymentMethod: 'Stripe',
                  paymentStatus: 'paid',
                },
                fOrder,
                fSetting,
              );
            }
          }
        } else if (eventType === 'payment_intent.payment_failed') {
        if (orderId && fOrder && fOrder.paymentStatus !== 'paid') {
           await this.orderModel.findByIdAndDelete(orderId);
        }
      } else if (eventType === 'charge.refunded') {
        if (data.payment_intent && fOrder) {
          await this.orderModel.findByIdAndUpdate(fOrder._id, { paymentStatus: 'refunded' });
        }
      }

      return { success: true };
    } catch (error) {
      console.log('Stripe Webhook Error:', error);
      throw new InternalServerErrorException(error.message);
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

      // Perform deletion of orders with status 'trash' and deleteDateString <= 10 days ago
      await this.orderModel.deleteMany({
        status: 'trash',
        deleteDateString: {
          $lte: tenDaysAgo.toISOString().split('T')[0], // Compare as ISO string for date format matching
        },
      });

      console.log('Auto-deletion task executed successfully.');
    } catch (err) {
      console.error('Error during auto-deletion:', err);
    }
  }

  // Job Scheduler For Courier Status
  private async checkAndUpdateCourierStatus() {
    // schedule.scheduleJob('*/1 * * * *', async () => {
    // schedule.scheduleJob('0 */2 * * *', async () => {
    schedule.scheduleJob('0 */6 * * *', async () => {
      // schedule.scheduleJob('*/20 * * * *', async () => {
      console.log('Get All Courier Status And Update Start...');
      await this.getAllCourierStatusAndUpdate();
    });
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // get All Courier Status And Update

  async getAllCourierStatusAndUpdate(): Promise<void> {
    const last3Days = new Date(
      this.utilsService.getNextDateString(new Date(), -15),
    );
    const formattedDate = last3Days.toISOString().split('T')[0];

    // Fetch all orders that have courierData and were created/attached recently
    const orders: AnyDoc[] = await this.orderModel
      .find({
        'courierData.createdAt': { $gte: formattedDate },
        courierData: { $exists: true, $ne: null },
        'courierData.consignmentId': { $exists: true, $ne: null },
        orderStatus: { $nin: ['delivered', 'cancelled', 'returned'] },
      })
      .select('_id shop courierData orderStatus orderedFrom')
      .lean();

    if (orders.length === 0) {
      console.log('No orders found for the last 3 days with courierData.');
      return;
    }

    // Collect unique shops
    const shopArray = [...new Set(orders.map((o) => String(o.shop)))];

    // const courierMethodArray: { shop: string; courier: any }[] = [];

    // Resolve active courier method per shop (cache the result for this run)
    const courierMethodArray: { shop: string; courier: any }[] = [];
    for (const shop of shopArray) {
      try {
        const fSetting = await this.settingModel
          .findOne({ shop })
          .select('courierMethods -_id')
          .lean();

        const fCourierMethods = fSetting?.courierMethods ?? [];
        const activeCourier = fCourierMethods.find(
          (c: any) => c?.status === 'active',
        );
        if (activeCourier) {
          courierMethodArray.push({ shop, courier: activeCourier });
        } else {
          this.logger.warn(`No active courier method found for shop: ${shop}`);
        }
      } catch (err: any) {
        this.logger.error(
          `Failed to fetch courier setting for shop ${shop}: ${err?.message}`,
          err?.stack,
        );
      }
    }

    const BATCH_SIZE = Number(process.env.COURIER_BATCH_SIZE ?? 100);
    const BATCH_DELAY_MS = Number(process.env.COURIER_BATCH_DELAY_MS ?? 2000);

    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
      const batch = orders.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (order) => {
        const matchedCourier = courierMethodArray.find(
          (c) => c.shop === String(order.shop),
        );
        if (!matchedCourier) {
          this.logger.warn(
            `Skipped order ${order?._id}: No active courier method for its shop`,
          );
          return;
        }

        try {
          await this.getAndUpdateOrderStatusFromCourier(
            order,
            matchedCourier.courier,
          );
        } catch (err: any) {
          const msg =
            err?.response?.data ?? err?.message ?? 'Unknown error occurred';
          this.logger.error(
            `Failed to update order ${order?._id} for shop ${order?.shop}: ${msg}`,
          );
        }
      });

      await Promise.allSettled(batchPromises);
      this.logger.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}`);
      if (i + BATCH_SIZE < orders.length) {
        await this.sleep(BATCH_DELAY_MS);
      }
    }

    this.logger.log('All courier status updates complete.');
  }

  async getAndUpdateOrderStatusFromCourier(order: any, courierMethod: any) {
    try {
      let orderStatus: string | undefined;

      const courierApiConfig: CourierApiConfig = {
        providerName: courierMethod?.providerName,
        apiKey: courierMethod?.apiKey,
        secretKey: courierMethod?.secretKey,
        username: courierMethod?.username,
        password: courierMethod?.password,
      };

      if (!order.courierData?.consignmentId) return;

      const courierResponse =
        await this.courierService.getOrderStatusFormCourier(
          courierApiConfig,
          order.courierData.consignmentId,
        );

      switch (courierMethod?.providerName) {
        // --------------------- Steadfast Courier ---------------------
        case 'Steadfast Courier':
          const deliveryStatus = courierResponse?.delivery_status;
          console.log(
            'Steadfast courierResponse.delivery_status:',
            deliveryStatus,
          );

          // console.log('courierResponse.status', courierResponse.status);

          if (courierResponse.status === 200) {
            switch (deliveryStatus) {
              case 'delivered':
                if (
                  order.orderStatus !== 'delivered' &&
                  order.orderedFrom === 'Admin'
                ) {
                  this.updateProductQty(order);
                }
                orderStatus = 'delivered';
                break;
              case 'cancelled':
                orderStatus = 'cancelled';
                break;
              case 'pending':
                orderStatus = 'Steadfast Checking';
                break;
              case 'in_review':
                orderStatus = 'Steadfast In Review';
                break;
              case 'unknown':
                orderStatus = 'Steadfast Unknown Status';
                break;
              case undefined:
              case null:
              case '':
                orderStatus = 'Steadfast Status Undefined';
                console.warn(
                  `No delivery_status for order ID ${order.id}, setting default: ${orderStatus}`,
                );
                break;
              default:
                orderStatus = deliveryStatus;
                break;
            }
          }
          break;

        // --------------------- Pathao Courier ---------------------
        case 'Pathao Courier':
          const orderStatusRaw = courierResponse?.data?.order_status;
          console.log(
            'Pathao courierResponse.data.order_status:',
            orderStatusRaw,
          );

          if (courierResponse.code === 200) {
            switch (orderStatusRaw) {
              case 'Delivered':
                if (
                  order.orderStatus !== 'delivered' &&
                  order.orderedFrom === 'Admin'
                ) {
                  this.updateProductQty(order);
                }
                orderStatus = 'delivered';
                break;
              case 'Cancelled':
              case 'Cancel':
              case 'Pickup Cancel':
                orderStatus = 'cancelled';
                break;
              case 'Return':
                orderStatus = 'returned';
                break;
              case 'Pending':
                orderStatus = 'Pathao Checking';
                break;
              case undefined:
              case null:
              case '':
                orderStatus = 'Pathao Status Undefined';
                console.warn(
                  `No order_status for order ID ${order.id}, setting default: ${orderStatus}`,
                );
                break;
              default:
                orderStatus = orderStatusRaw;
                break;
            }
          }
          break;
      }

      // Update to DB if we have a valid status
      if (orderStatus) {
        await this.orderModel.findByIdAndUpdate(order._id, {
          $set: { orderStatus },
        });
      }
    } catch (error) {
      console.error(
        `Error updating order status for order ID ${order?._id}:`,
        error.message,
      );
    }
  }

  // Order Notification For Admin

  private async orderNotificationForAdmin(
    orderData: any,
    fSetting: any,
    fOrderNotification: any,
  ) {
    const { shop, orderId, phoneNo, name } = orderData;

    // Setting Data
    // const fSetting = await this.settingModel
    //   .findOne({ shop: shop })
    //   .select('smsSendingOption smsMethods orderNotification -_id');
    //
    // //Order Notification
    // const fOrderNotification = fSetting?.orderNotification ?? {};

    // Shop Data
    const fShopInfo = await this.shopModel
      .findById(shop)
      .select('domain subDomain owner');
    console.log('fShopInfo', fShopInfo);

    // Vendor Data
    const fVendorInfo = await this.vendorModel
      .findById({ _id: fShopInfo?.owner })
      .select('phoneNo email name');
    console.log('fVendorInfo', fVendorInfo);

    // Sms Providers
    const fSmsMethods = fSetting?.smsMethods ?? [];
    const smsMethod = fSmsMethods.find((f) => f.status === 'active');
    const smsSendingOption = fSetting?.smsSendingOption;

    // Shop Information
    const shopInformationData: any = await this.shopInformationModel
      .findOne({ shop: shop })
      .select('logoPrimary');

    const settingData: any = await this.settingModel
      .findOne({ shop: shop })
      .select('orderNotification');

    // Sms Sending
    if (fOrderNotification && fOrderNotification.isEnableSMSNotification) {
      if (
        smsMethod &&
        smsSendingOption &&
        smsSendingOption.orderPlaced &&
        fVendorInfo.phoneNo
      ) {

        const message = this.smsTemplateService.getOrderPlacedMessageAdmin(
          fSetting,
          name,
          orderId,
          phoneNo,
          fShopInfo,
          orderData,
        );

        const smsSentConfig: SmsSentConfig = {
          providerName: smsMethod.providerName,
          smsSenderSecret: smsMethod.secretKey,
          smsSenderId: smsMethod.senderId,
          smsClientId: smsMethod.clientId,
          apiKey: smsMethod.apiKey,
          phoneNo: fVendorInfo.phoneNo,
          countryCode: smsMethod?.currency?.countryCode,
          message: message,
        };

        this.bulkSmsService.sentSmsWithProvider(smsSentConfig);
      }
    }

    console.log(
      'fOrderNotification',
      fOrderNotification.isEnableEmailNotification,
    );

    // Email Sending
    if (fOrderNotification && fOrderNotification.isEnableEmailNotification) {
      if (fVendorInfo?.email) {
        //  Email html
        const html = `
       <div style="width: 450px; font-family: Helvetica, Arial, sans-serif; border: 1px solid #e2e2e2; border-radius: 6px; overflow: hidden;">
       <div style="padding: 15px 20px; background: #fff;">
        <img src="${shopInformationData.logoPrimary ?? ''}" width="70" alt="" style="margin-bottom: 10px;" loading="lazy"/>
         <h2 style="margin: 0 0 10px;">Hello, ${fVendorInfo?.name}</h2>

      <p style="margin: 4px 0;">You’ve got a new order on your website and order id #${orderId}</p>
      <p style="margin: 4px 0;"><strong>Customer Name:</strong> ${name}</p>
      <p style="margin: 4px 0;"><strong>Phone No:</strong> ${phoneNo}</p>
      <p style="margin: 4px 0;"><strong>Order No:</strong> ${orderId}</p>
      <p style="margin: 4px 0;"><strong>Website:</strong> <a href="${fShopInfo.domain}" style="color: #2563eb; text-decoration: none;" target="_blank">${fShopInfo?.domain}</a></p>
    <p style="margin: 4px 0;"> <strong>Order Link:</strong> <a href="https://admin.saleecom.com/order/order-details/${orderData?._id}"   style="color: #2563eb; text-decoration: none;"   target="_blank">  View order details </a></p>

      <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;" />
      <div style="margin-top: 20px; background: #f9f9f9; padding: 10px; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px;">Thank you</p>
      </div>
          </div>
        </div>
      `;
        console.log('order mail');
        console.log(
          'settingData?.orderNotification?.isEnablePersonalNotification',
          settingData?.orderNotification?.isEnablePersonalNotification,
        );
        console.log(
          'settingData?.orderNotification?.appEmail',
          settingData?.orderNotification?.appEmail,
        );
        console.log(
          'settingData?.orderNotification?.appPassword',
          settingData?.orderNotification?.appPassword,
        );
        if (
          settingData?.orderNotification?.isEnablePersonalNotification &&
          settingData?.orderNotification?.appEmail &&
          settingData?.orderNotification?.appPassword
        ) {
          this.emailService.sendEmailFormPersonal(
            fVendorInfo?.email,
            `You’ve got a new order on your website and order id #${orderId}`,
            html,
            settingData?.orderNotification,
          );
        } else {
          this.emailService.sendEmail(
            fVendorInfo?.email,
            `You’ve got a new order on your website and order id #${orderId}`,
            html,
            fShopInfo,
          );
        }
      }
    }
  }

  // Create Affiliate Sale Report
  private async createAffiliateReport(orderData: any) {
    // console.log("orderDat a",orderData);
    const affiliateProductData: any = await this.affiliateProductModel.findById(
      orderData.affiliateProductId,
    );

    const finalData = {
      type: 'earning',
      affiliate: orderData.affiliateId,
      product: orderData.affiliateProductId,
      ownerId: affiliateProductData.ownerId, // owner ID
      ownerType: affiliateProductData.ownerType, // assuming this is a shop
      shopId: orderData.shop, // shop ID
      amount: affiliateProductData.price,
      status: 'pending', // or 'pending', based on your logic
      dateString: orderData.checkoutDate,
    };

    // console.log('finalData', finalData);

    await this.affiliateReportModel.create(finalData);
  }

  private async updateProductQty(orderData: any) {
    // Skip quantity update for pending status (both regular and variation products)
    if (orderData?.orderStatus === 'pending') {
      return;
    }

    for (const g of orderData?.orderedItems) {
      const product = await this.productModel.findById(g.product); // Use g.product, not g._id
      if (!product) {
        throw new BadRequestException(`Product not found: ${g.name}`);
      }

      const orderedQty = Number(g.quantity);
      if (isNaN(orderedQty) || orderedQty <= 0) {
        throw new BadRequestException(`Invalid quantity for ${g.name}`);
      }

      // If product has no variation (simple product)
      if (!product.isVariation) {
        const currentQty = Number(product.quantity);
        if (isNaN(currentQty)) {
          throw new BadRequestException(
            `Invalid product quantity for ${g.name}`,
          );
        }

        if (currentQty < orderedQty) {
          throw new BadRequestException(
            `Insufficient stock for ${g.name}. Only ${currentQty} left.`,
          );
        }

        await this.productModel.findByIdAndUpdate(
          product._id,
          {
            $set: { quantity: currentQty - orderedQty, totalSold: orderedQty },
          },
          { new: true },
        );
      }

      // If product has variation
      if (product.isVariation && g.variation && g.variation._id) {
        const variantIndex = product.variationList.findIndex(
          (v) => v._id.toString() === g.variation._id.toString(), // match string with string
        );

        if (variantIndex === -1) {
          throw new BadRequestException(
            `Variant not found for ${g.name} - ${g.variation.name}`,
          );
        }

        const variant = product.variationList[variantIndex];
        const currentVariantQty = Number(variant.quantity);

        if (isNaN(currentVariantQty)) {
          throw new BadRequestException(
            `Invalid variant quantity for ${g.name} - ${g.variation.name}`,
          );
        }

        if (currentVariantQty < orderedQty) {
          throw new BadRequestException(
            `Insufficient stock for ${g.name} variant. Only ${currentVariantQty} left.`,
          );
        }

        // Update quantity
        product.variationList[variantIndex].quantity =
          currentVariantQty - orderedQty;

        await this.productModel.findByIdAndUpdate(
          product._id,
          {
            $set: {
              variationList: product.variationList,
              totalSold: orderedQty,
            },
          },
          { new: true },
        );
      }
    }
  }

  getDurationInMinutes(blockTime: string): number {
    if (!blockTime) return 30;

    const parts = blockTime.trim().toLowerCase().split(' ');
    if (parts.length !== 2) return 30;

    const [valueStr, unit] = parts;
    const value = parseInt(valueStr);
    if (isNaN(value)) return 30;

    switch (unit) {
      case 'minute':
      case 'minutes':
        return value;

      case 'hour':
      case 'hours':
        return value * 60;

      case 'day':
      case 'days':
        return value * 24 * 60;

      case 'month':
      case 'months':
        return value * 30 * 24 * 60;

      case 'year':
      case 'years':
        return value * 365 * 24 * 60;

      case 'all':
      case 'alltime':
      case 'forever':
      case 'lifetime':
        return 100 * 365 * 24 * 60;

      default:
        return 30; // fallback
    }
  }

  async blockIp(order: any, durationMinutes: number, type: string) {
    const now = new Date();
    const blockUntil = new Date(now.getTime() + durationMinutes * 60000);

    await this.ipBlockModel.updateOne(
      {
        userIpAddress: order.userIpAddress,
        shop: order.shop,
        phoneNo: order.phoneNo,
      },
      {
        $set: {
          type,
          blockUntil,
          dateString: now.toISOString().split('T')[0],
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );
  }

  async isIpBlocked(
    ip: string,
    shopId: string,
    phoneNo?: string,
  ): Promise<boolean> {
    const blockInfo = await this.ipBlockModel.findOne({
      userIpAddress: ip,
      shop: shopId,
      // phoneNo: phoneNo,
      blockUntil: { $gt: new Date() }, // এখনো সময় শেষ হয়নি
    });

    return !!blockInfo;
  }
}
