import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { User } from '../user/interfaces/user.interface';
import { Admin } from '../admin/interfaces/admin.interface';
import { Order } from '../order/interfaces/order.interface';
import { Vendor } from '../vendor/interfaces/vendor.interface';
import { UtilsService } from '../../shared/utils/utils.service';
import { Product } from '../product/interfaces/product.interface';
import { FilterAndPaginationOrderDto } from '../order/dto/order.dto';
import { Shop } from '../shop/interfaces/shop.interface';
import { ErrorCodes } from '../../enum/error-code.enum';
import { Category } from '../catalog/category/interfaces/category.interface';
import { AffiliateProduct } from '../affiliate-product/interfaces/affiliate-product.interface';
import { AffiliateReport } from '../affiliate-report/interfaces/affiliate-report.interface';
import { Affiliate } from '../affiliate/interfaces/affiliate.interface';
import { Expense } from '../expense/interfaces/expense.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class DashboardService {
  private logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Admin') private readonly adminModel: Model<Admin>,
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
    @InjectModel('Product')
    private readonly productModel: Model<Product>,
    @InjectModel('AffiliateReport')
    private readonly affiliateReportModel: Model<AffiliateReport>,
    @InjectModel('AffiliateProduct')
    private readonly affiliateProductModel: Model<AffiliateProduct>,

    @InjectModel('Affiliate')
    private readonly affiliateModel: Model<Affiliate>,
    @InjectModel('Expense')
    private readonly expenseModel: Model<Expense>,

    private utilsService: UtilsService,
  ) {}

  /**
   * getAdminDashboard()
   */

  async getAdminDashboard(): Promise<ResponsePayload> {
    try {
      const totalUsers = await this.userModel.countDocuments({});
      const totalAdmins = await this.adminModel.countDocuments({});
      const totalOrders = await this.orderModel.countDocuments({});

      const data = {
        totalUsers,
        totalAdmins,
        totalOrders,
      };

      return {
        success: true,
        message: 'Data Retrieve Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getVendorDashboard(shop: any): Promise<ResponsePayload> {
    try {
      // Date Modify
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const last7Days = new Date(
        this.utilsService.getNextDateString(new Date(), -7),
      );

      last7Days.setHours(23, 59, 59, 999);

      const totalProducts = await this.productModel.countDocuments({
        shop: shop,
      });

      const todayProducts = await this.productModel.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate },
        shop: shop,
      });

      const last7DaysProducts = await this.productModel.countDocuments({
        createdAt: { $gte: last7Days, $lte: startDate },
        shop: shop,
      });

      const data = {
        totalProducts,
        todayProducts,
        last7DaysProducts,
      };

      return {
        success: true,
        message: 'Data Retrieve Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllAffiliate(
    filterDto: any,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      const { filter } = filterDto;
      const affiliateId = filter.affiliate;
      const search = searchQuery?.toLowerCase() || '';

      // Step 1: Load all affiliate products
      const allProducts: any[] = await this.affiliateProductModel.find();

      // Step 2: Load approved connections (to exclude from count)
      const approvedConnections = []; // await this.affiliateConnectionModel.find({ affiliate: affiliateId });

      const approvedOwnerSet = new Set(
        approvedConnections.map(
          (conn) => `${conn.ownerType}_${conn.ownerId.toString()}`,
        ),
      );

      // Step 3: Group unapproved products by owner
      let availableAffiliateProductCount = 0;

      for (const product of allProducts) {
        const key = `${product.ownerType}_${product.ownerId?.toString()}`;

        // Skip if already approved
        if (approvedOwnerSet.has(key)) continue;

        // Optional search by product name or ownerId (string match)
        if (search) {
          const nameMatch = product.name?.toLowerCase()?.includes(search);
          const ownerMatch = product.ownerId?.toString()?.includes(search);
          if (!nameMatch && !ownerMatch) continue;
        }

        availableAffiliateProductCount++;
      }

      // Step 4: Earnings & Withdrawals from affiliateReportModel
      const earningFilter = { ...filter, type: 'earning' };
      const withdrawalFilter = {
        ...filter,
        type: 'withdrawal',
        status: 'paid',
      };

      const earningReports: any[] =
        await this.affiliateReportModel.find(earningFilter);
      const withdrawalReports: any[] =
        await this.affiliateReportModel.find(withdrawalFilter);

      const totalEarnings = earningReports.reduce(
        (sum, report) => sum + (report.amount || 0),
        0,
      );
      const totalPayment = withdrawalReports.reduce(
        (sum, report) => sum + (report.amount || 0),
        0,
      );

      // Step 5: Final summary
      const finalData = {
        totalEarning: totalEarnings,
        totalRefers: earningReports.length,
        paidAmount: totalPayment,
        dueAmount: totalEarnings - totalPayment,
        availableAffiliate: availableAffiliateProductCount,
      };

      // Optional: Update balance in background
      this.updateAffiliateBalance(affiliateId);

      return {
        data: finalData,
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (error) {
      console.error('Error in getAllAffiliate:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllAffiliateInfoForOwner(
    filterDto: any,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      const { filter } = filterDto;
      const affiliateId = filter.affiliate;
      const search = searchQuery?.toLowerCase() || '';

      // Step 1: Load approved shop connections with populated shop info
      const shopConnections = [];

      // Step 2: Load approved admin connections with populated admin info
      const adminConnections = [];

      // Step 3: Merge all approved connections
      const allConnections = [...shopConnections, ...adminConnections];

      // Step 4: Apply search filter if needed
      const filteredConnections = allConnections.filter((conn) => {
        const owner: any = conn.ownerId;
        const name =
          conn.ownerType === 'shop' ? owner?.websiteName : owner?.name;
        return !search || name?.toLowerCase().includes(search);
      });

      // Step 5: Count connected shops and admins
      const connectedShopCount = filteredConnections.filter(
        (c) => c.ownerType === 'shop',
      ).length;

      const connectedAdminCount = filteredConnections.filter(
        (c) => c.ownerType === 'admin',
      ).length;

      const totalConnected = connectedShopCount + connectedAdminCount;

      // Step 6: Get affiliate earnings and paid withdrawals
      const earningReports: any[] = await this.affiliateReportModel.find({
        ...filter,
        type: 'earning',
      });

      const withdrawalReports: any[] = await this.affiliateReportModel.find({
        ...filter,
        type: 'withdrawal',
        status: 'paid',
      });

      const totalEarnings = earningReports.reduce(
        (sum, report) => sum + (report.amount || 0),
        0,
      );

      const totalPayment = withdrawalReports.reduce(
        (sum, report) => sum + (report.amount || 0),
        0,
      );

      const finalData = {
        totalEarning: totalEarnings,
        totalRefers: earningReports.length,
        paidAmount: totalPayment,
        dueAmount: totalEarnings - totalPayment,
        availableAffiliate: totalConnected,
      };

      this.updateAffiliateBalance(affiliateId); // Optional async balance update

      return {
        data: finalData,
        success: true,
        message: 'Success',
      };
    } catch (error) {
      console.error('Error in getAllAffiliateInfoForOwner:', error);
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

  async getAllOrders(
    filterOrderDto: FilterAndPaginationOrderDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterOrderDto;
    const { sort } = filterOrderDto;

    let gteDate: Date | undefined, lteDate: Date | undefined;
    let gteDate1: any, lteDate1: any;
    if (filter['checkoutDate']) {
      gteDate = new Date(filter['checkoutDate']['$gte']);
      lteDate = new Date(filter['checkoutDate']['$lte']);
      gteDate1 = filter['checkoutDate']['$gte'];
      lteDate1 = filter['checkoutDate']['$lte'];
      gteDate.setHours(0, 0, 0, 0);
      lteDate.setHours(23, 59, 59, 999);
      delete filter['checkoutDate'];
    }

    // Pipelines
    const aggregatesOrders: any[] = [];
    const aggregatesOrdersCourier: any[] = [];
    const aggregatesOrdersCheckout: any[] = [];
    const aggregatesTotalOrders: any[] = [];

    // Working vars
    let mFilter: any = {};
    const mFilterCourier: any = {};
    let mSort: any = {};

    // Match base
    if (filter) {
      if (filter['user']) filter['user'] = new ObjectId(filter['user']);
      if (filter['shop']) filter['shop'] = new ObjectId(filter['shop']);
      mFilter = { ...mFilter, ...filter };
      if (filter['shop']) mFilterCourier['shop'] = new ObjectId(filter['shop']);
    }

    if (searchQuery) {
      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { name: { $regex: searchQuery, $options: 'i' } },
              { phoneNo: { $regex: searchQuery, $options: 'i' } },
              { email: { $regex: searchQuery, $options: 'i' } },
            ],
          },
        ],
      };
    }

    // Always exclude 'trash'
    const statusExclusion = { status: { $ne: 'trash' } };

    if (Object.keys(mFilter).length) {
      aggregatesOrders.push({ $match: { $and: [mFilter, statusExclusion] } });
    } else {
      aggregatesOrders.push({ $match: statusExclusion });
    }

    mSort = sort || { createdAt: -1 };
    if (Object.keys(mSort).length) aggregatesOrders.push({ $sort: mSort });

    // Normalize timeline dates (string 'YYYY-MM-DD' -> Date)
    aggregatesOrders.push({
      $addFields: {
        confirmedDate: {
          $switch: {
            branches: [
              {
                case: {
                  $and: [
                    { $ifNull: ['$orderTimeline.confirmed.date', false] },
                    {
                      $eq: [
                        { $type: '$orderTimeline.confirmed.date' },
                        'string',
                      ],
                    },
                    {
                      $regexMatch: {
                        input: '$orderTimeline.confirmed.date',
                        regex: /^\d{4}-\d{2}-\d{2}$/,
                      },
                    },
                  ],
                },
                then: {
                  $dateFromString: {
                    dateString: '$orderTimeline.confirmed.date',
                    format: '%Y-%m-%d',
                  },
                },
              },
            ],
            default: null,
          },
        },
        deliveredDate: {
          $switch: {
            branches: [
              {
                case: {
                  $and: [
                    { $ifNull: ['$orderTimeline.delivered.date', false] },
                    {
                      $eq: [
                        { $type: '$orderTimeline.delivered.date' },
                        'string',
                      ],
                    },
                    {
                      $regexMatch: {
                        input: '$orderTimeline.delivered.date',
                        regex: /^\d{4}-\d{2}-\d{2}$/,
                      },
                    },
                  ],
                },
                then: {
                  $dateFromString: {
                    dateString: '$orderTimeline.delivered.date',
                    format: '%Y-%m-%d',
                  },
                },
              },
            ],
            default: null,
          },
        },
        pendingDate: {
          $switch: {
            branches: [
              {
                case: {
                  $and: [
                    { $ifNull: ['$orderTimeline.pending.date', false] },
                    {
                      $eq: [{ $type: '$orderTimeline.pending.date' }, 'string'],
                    },
                    {
                      $regexMatch: {
                        input: '$orderTimeline.pending.date',
                        regex: /^\d{4}-\d{2}-\d{2}$/,
                      },
                    },
                  ],
                },
                then: {
                  $dateFromString: {
                    dateString: '$orderTimeline.pending.date',
                    format: '%Y-%m-%d',
                  },
                },
              },
            ],
            default: null,
          },
        },
        // NOTE: field key has space ("sent to courier"); if needed, keep as-is
        courierDate: {
          $switch: {
            branches: [
              {
                case: {
                  $and: [
                    { $ifNull: ['$orderTimeline.sent to courier.date', false] },
                    {
                      $eq: [
                        { $type: '$orderTimeline.sent to courier.date' },
                        'string',
                      ],
                    },
                    {
                      $regexMatch: {
                        input: '$orderTimeline.sent to courier.date',
                        regex: /^\d{4}-\d{2}-\d{2}$/,
                      },
                    },
                  ],
                },
                then: {
                  $dateFromString: {
                    dateString: '$orderTimeline.sent to courier.date',
                    format: '%Y-%m-%d',
                  },
                },
              },
            ],
            default: null,
          },
        },
        holdDate: {
          $switch: {
            branches: [
              {
                case: {
                  $and: [
                    { $ifNull: ['$orderTimeline.onHold.date', false] },
                    {
                      $eq: [{ $type: '$orderTimeline.onHold.date' }, 'string'],
                    },
                    {
                      $regexMatch: {
                        input: '$orderTimeline.onHold.date',
                        regex: /^\d{4}-\d{2}-\d{2}$/,
                      },
                    },
                  ],
                },
                then: {
                  $dateFromString: {
                    dateString: '$orderTimeline.onHold.date',
                    format: '%Y-%m-%d',
                  },
                },
              },
            ],
            default: null,
          },
        },
        cancelledDate: {
          $switch: {
            branches: [
              {
                case: {
                  $and: [
                    { $ifNull: ['$orderTimeline.cancelled.date', false] },
                    {
                      $eq: [
                        { $type: '$orderTimeline.cancelled.date' },
                        'string',
                      ],
                    },
                    {
                      $regexMatch: {
                        input: '$orderTimeline.cancelled.date',
                        regex: /^\d{4}-\d{2}-\d{2}$/,
                      },
                    },
                  ],
                },
                then: {
                  $dateFromString: {
                    dateString: '$orderTimeline.cancelled.date',
                    format: '%Y-%m-%d',
                  },
                },
              },
            ],
            default: null,
          },
        },
        refundedDate: {
          $switch: {
            branches: [
              {
                case: {
                  $and: [
                    { $ifNull: ['$orderTimeline.refunded.date', false] },
                    {
                      $eq: [
                        { $type: '$orderTimeline.refunded.date' },
                        'string',
                      ],
                    },
                    {
                      $regexMatch: {
                        input: '$orderTimeline.refunded.date',
                        regex: /^\d{4}-\d{2}-\d{2}$/,
                      },
                    },
                  ],
                },
                then: {
                  $dateFromString: {
                    dateString: '$orderTimeline.refunded.date',
                    format: '%Y-%m-%d',
                  },
                },
              },
            ],
            default: null,
          },
        },
        returnedDate: {
          $switch: {
            branches: [
              {
                case: {
                  $and: [
                    { $ifNull: ['$orderTimeline.returned.date', false] },
                    {
                      $eq: [
                        { $type: '$orderTimeline.returned.date' },
                        'string',
                      ],
                    },
                    {
                      $regexMatch: {
                        input: '$orderTimeline.returned.date',
                        regex: /^\d{4}-\d{2}-\d{2}$/,
                      },
                    },
                  ],
                },
                then: {
                  $dateFromString: {
                    dateString: '$orderTimeline.returned.date',
                    format: '%Y-%m-%d',
                  },
                },
              },
            ],
            default: null,
          },
        },
      },
    });

    // Dashboard group & net
    aggregatesOrders.push({
      $group: {
        _id: null,

        // Cancelled বাদ দিয়ে count
        allOrders: {
          $sum: { $cond: [{ $ne: ['$orderStatus', 'cancelled'] }, 1, 0] },
        },

        // NEW: Gross amount (reference)
        grossOrderAmount: { $sum: '$grandTotal' },

        // UPDATED: Cancelled বাদ দিয়ে amount
        orderAmount: {
          $sum: {
            $cond: [{ $ne: ['$orderStatus', 'cancelled'] }, '$grandTotal', 0],
          },
        },

        confirmOrders: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'confirmed'] },
                  gteDate ? { $gte: ['$confirmedDate', gteDate] } : {},
                  lteDate ? { $lte: ['$confirmedDate', lteDate] } : {},
                ],
              },
              1,
              0,
            ],
          },
        },
        confirmOrdersAmount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'confirmed'] },
                  gteDate ? { $gte: ['$confirmedDate', gteDate] } : {},
                  lteDate ? { $lte: ['$confirmedDate', lteDate] } : {},
                ],
              },
              '$grandTotal',
              0,
            ],
          },
        },

        deliveredOrders: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'delivered'] },
                  gteDate ? { $gte: ['$deliveredDate', gteDate] } : {},
                  lteDate ? { $lte: ['$deliveredDate', lteDate] } : {},
                ],
              },
              1,
              0,
            ],
          },
        },
        deliveredOrdersAmount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'delivered'] },
                  gteDate ? { $gte: ['$deliveredDate', gteDate] } : {},
                  lteDate ? { $lte: ['$deliveredDate', lteDate] } : {},
                ],
              },
              '$grandTotal',
              0,
            ],
          },
        },

        courierOrders: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'sent to courier'] },
                  gteDate ? { $gte: ['$courierDate', gteDate] } : {},
                  lteDate ? { $lte: ['$courierDate', lteDate] } : {},
                ],
              },
              1,
              0,
            ],
          },
        },
        courierOrdersAmount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'sent to courier'] },
                  gteDate ? { $gte: ['$courierDate', gteDate] } : {},
                  lteDate ? { $lte: ['$courierDate', lteDate] } : {},
                ],
              },
              '$grandTotal',
              0,
            ],
          },
        },

        holdOrders: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'on_hold'] },
                  gteDate ? { $gte: ['$holdDate', gteDate] } : {},
                  lteDate ? { $lte: ['$holdDate', lteDate] } : {},
                ],
              },
              1,
              0,
            ],
          },
        },
        holdOrdersAmount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'on_hold'] },
                  gteDate ? { $gte: ['$holdDate', gteDate] } : {},
                  lteDate ? { $lte: ['$holdDate', lteDate] } : {},
                ],
              },
              '$grandTotal',
              0,
            ],
          },
        },

        pendingOrders: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'pending'] },
                  gteDate ? { $gte: ['$pendingDate', gteDate] } : {},
                  lteDate ? { $lte: ['$pendingDate', lteDate] } : {},
                ],
              },
              1,
              0,
            ],
          },
        },
        pendingOrdersAmount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'pending'] },
                  gteDate ? { $gte: ['$pendingDate', gteDate] } : {},
                  lteDate ? { $lte: ['$pendingDate', lteDate] } : {},
                ],
              },
              '$grandTotal',
              0,
            ],
          },
        },

        cancelOrders: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'cancelled'] },
                  gteDate ? { $gte: ['$cancelledDate', gteDate] } : {},
                  lteDate ? { $lte: ['$cancelledDate', lteDate] } : {},
                ],
              },
              1,
              0,
            ],
          },
        },
        cancelOrdersAmount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'cancelled'] },
                  gteDate ? { $gte: ['$cancelledDate', gteDate] } : {},
                  lteDate ? { $lte: ['$cancelledDate', lteDate] } : {},
                ],
              },
              '$grandTotal',
              0,
            ],
          },
        },

        refundOrders: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'refunded'] },
                  gteDate ? { $gte: ['$refundedDate', gteDate] } : {},
                  lteDate ? { $lte: ['$refundedDate', lteDate] } : {},
                ],
              },
              1,
              0,
            ],
          },
        },
        refundOrdersAmount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'refunded'] },
                  gteDate ? { $gte: ['$refundedDate', gteDate] } : {},
                  lteDate ? { $lte: ['$refundedDate', lteDate] } : {},
                ],
              },
              '$grandTotal',
              0,
            ],
          },
        },

        returnOrders: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'returned'] },
                  gteDate ? { $gte: ['$returnedDate', gteDate] } : {},
                  lteDate ? { $lte: ['$returnedDate', lteDate] } : {},
                ],
              },
              1,
              0,
            ],
          },
        },
        returnOrdersAmount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$orderStatus', 'returned'] },
                  gteDate ? { $gte: ['$returnedDate', gteDate] } : {},
                  lteDate ? { $lte: ['$returnedDate', lteDate] } : {},
                ],
              },
              '$grandTotal',
              0,
            ],
          },
        },

        activeOrders: {
          $sum: { $cond: [{ $ne: ['$orderStatus', 'cancelled'] }, 1, 0] },
        },
        activeOrdersAmount: {
          $sum: {
            $cond: [{ $ne: ['$orderStatus', 'cancelled'] }, '$grandTotal', 0],
          },
        },
      },
    });

    // Net for dashboard (kept for backward compatibility)
    aggregatesOrders.push({
      $addFields: {
        // If you keep this, it's now equal to 'orderAmount'
        orderAmountNet: {
          $subtract: ['$grossOrderAmount', '$cancelOrdersAmount'],
        },
      },
    });

    // --- Total Orders (shop scope) ---
    const statusExclusionTotal = {
      $and: [
        { status: { $ne: 'trash' } },
        { shop: new ObjectId(filter['shop']) },
      ],
    };
    aggregatesTotalOrders.push({ $match: statusExclusionTotal });
    aggregatesTotalOrders.push({
      $group: {
        _id: null,

        // NEW: gross + net amounts for overall total
        grossOrderAmount: { $sum: '$grandTotal' },
        orderAmount: {
          $sum: {
            $cond: [{ $ne: ['$orderStatus', 'cancelled'] }, '$grandTotal', 0],
          },
        },

        allOrders: { $sum: 1 },
        cancelOrdersAmount: {
          $sum: {
            $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, '$grandTotal', 0],
          },
        },
        cancelOrders: {
          $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 1, 0] },
        },
      },
    });
    aggregatesTotalOrders.push({
      $addFields: {
        netOrderAmount: {
          $subtract: ['$grossOrderAmount', '$cancelOrdersAmount'],
        },
        netOrders: { $subtract: ['$allOrders', '$cancelOrders'] },
      },
    });

    // --- Checkout totals (use date range + shop; don't exclude cancelled here initially)
    const statusExclusionCheckout: any[] = [
      { status: { $ne: 'trash' } },
      { shop: new ObjectId(filter['shop']) },
    ];
    if (gteDate && lteDate) {
      statusExclusionCheckout.push({
        checkoutDate: { $gte: gteDate1, $lte: lteDate1 },
      });
    }

    aggregatesOrdersCheckout.push({
      $match: { $and: statusExclusionCheckout },
    });
    aggregatesOrdersCheckout.push({
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        grossTotalOrderAmount: { $sum: '$grandTotal' },
        cancelOrders: {
          $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 1, 0] },
        },
        cancelOrdersAmount: {
          $sum: {
            $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, '$grandTotal', 0],
          },
        },
        // Net (exclude cancelled)
        netTotalOrderAmount: {
          $sum: {
            $cond: [{ $ne: ['$orderStatus', 'cancelled'] }, '$grandTotal', 0],
          },
        },
      },
    });
    aggregatesOrdersCheckout.push({
      $addFields: {
        netTotalOrders: { $subtract: ['$totalOrders', '$cancelOrders'] },
      },
    });

    // --- Courier orders ---
    aggregatesOrdersCourier.push({
      $match: {
        $and: [
          mFilterCourier,
          { status: { $ne: 'trash' } },
          { orderStatus: { $ne: 'cancelled' } },
        ],
      },
    });
    aggregatesOrdersCourier.push({
      $addFields: {
        courierCreatedAt: {
          $cond: [
            {
              $and: [
                { $ifNull: ['$courierData.createdAt', false] },
                { $eq: [{ $type: '$courierData.createdAt' }, 'string'] },
              ],
            },
            {
              $dateFromString: {
                dateString: '$courierData.createdAt',
                format: '%Y-%m-%d',
              },
            },
            '$courierData.createdAt',
          ],
        },
      },
    });
    aggregatesOrdersCourier.push({
      $group: {
        _id: null,
        courierOrders: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$courierCreatedAt', null] },
                  gteDate ? { $gte: ['$courierCreatedAt', gteDate] } : {},
                  lteDate ? { $lte: ['$courierCreatedAt', lteDate] } : {},
                ],
              },
              1,
              0,
            ],
          },
        },
        courierOrdersAmount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$courierCreatedAt', null] },
                  gteDate ? { $gte: ['$courierCreatedAt', gteDate] } : {},
                  lteDate ? { $lte: ['$courierCreatedAt', lteDate] } : {},
                ],
              },
              '$grandTotal',
              0,
            ],
          },
        },
      },
    });

    try {
      const [
        dataAggregates,
        dataAggregatesCourier,
        dataAggregatesTotalOrders,
        dataAggregatesCheckoutOrders,
      ] = await Promise.all([
        this.orderModel.aggregate(aggregatesOrders),
        this.orderModel.aggregate(aggregatesOrdersCourier),
        this.orderModel.aggregate(aggregatesTotalOrders),
        this.orderModel.aggregate(aggregatesOrdersCheckout),
      ]);

      return {
        data: dataAggregates[0] || {},
        courier: dataAggregatesCourier[0] || {},
        totalOrder: dataAggregatesTotalOrders[0] || {},
        totalOrderCheckoutDate: dataAggregatesCheckoutOrders[0] || {},
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      this.logger.error(err);
      if (err.code && err.code.toString() === ErrorCodes.PROJECTION_MISMATCH) {
        throw new BadRequestException('Error! Orderion mismatch');
      }
      throw new InternalServerErrorException(err.message);
    }
  }

  // async getAllOrders(
  //   filterOrderDto: FilterAndPaginationOrderDto,
  //   searchQuery?: string,
  // ): Promise<ResponsePayload> {
  //   const { filter } = filterOrderDto;
  //   const { sort } = filterOrderDto;
  //
  //   let gteDate, lteDate, gteDate1, lteDate1;
  //   if (filter['checkoutDate']) {
  //     gteDate = new Date(filter['checkoutDate']['$gte']);
  //     lteDate = new Date(filter['checkoutDate']['$lte']);
  //     gteDate1 = filter['checkoutDate']['$gte'];
  //     lteDate1 = filter['checkoutDate']['$lte'];
  //     gteDate.setHours(0, 0, 0, 0);
  //     lteDate.setHours(23, 59, 59, 999);
  //     delete filter['checkoutDate'];
  //   }
  //
  //   // Essential Variables
  //   const aggregatesOrders = [];
  //   const aggregatesOrdersCourier = [];
  //   const aggregatesOrdersCheckout = [];
  //   const aggregatesTotalOrders = [];
  //   let mFilter = {};
  //   const mFilterCourier = {};
  //   let mSort = {};
  //
  //   // Match
  //   if (filter) {
  //     if (filter['user']) filter['user'] = new ObjectId(filter['user']);
  //     if (filter['shop']) filter['shop'] = new ObjectId(filter['shop']);
  //     mFilter = { ...mFilter, ...filter };
  //     mFilterCourier['shop'] = new ObjectId(filter['shop']);
  //   }
  //
  //   if (searchQuery) {
  //     mFilter = {
  //       $and: [
  //         mFilter,
  //         {
  //           $or: [
  //             { name: { $regex: searchQuery, $options: 'i' } },
  //             { phoneNo: { $regex: searchQuery, $options: 'i' } },
  //             { email: { $regex: searchQuery, $options: 'i' } },
  //           ],
  //         },
  //       ],
  //     };
  //   }
  //
  //   // Always exclude 'trash' status orders
  //   const statusExclusion = { status: { $ne: 'trash' } };
  //
  //   if (Object.keys(mFilter).length) {
  //     aggregatesOrders.push({
  //       $match: {
  //         $and: [mFilter, statusExclusion],
  //       },
  //     });
  //   } else {
  //     aggregatesOrders.push({ $match: statusExclusion });
  //   }
  //
  //   mSort = sort || { createdAt: -1 };
  //   if (Object.keys(mSort).length) {
  //     aggregatesOrders.push({ $sort: mSort });
  //   }
  //
  //   // --- Convert timeline string dates to Date objects for status-based group calculation ---
  //   aggregatesOrders.push({
  //     $addFields: {
  //       confirmedDate: {
  //         $switch: {
  //           branches: [
  //             {
  //               case: {
  //                 $and: [
  //                   { $ifNull: ['$orderTimeline.confirmed.date', false] },
  //                   {
  //                     $eq: [
  //                       { $type: '$orderTimeline.confirmed.date' },
  //                       'string',
  //                     ],
  //                   },
  //                   {
  //                     $regexMatch: {
  //                       input: '$orderTimeline.confirmed.date',
  //                       regex: /^\d{4}-\d{2}-\d{2}$/,
  //                     },
  //                   },
  //                 ],
  //               },
  //               then: {
  //                 $dateFromString: {
  //                   dateString: '$orderTimeline.confirmed.date',
  //                   format: '%Y-%m-%d',
  //                 },
  //               },
  //             },
  //           ],
  //           default: null,
  //         },
  //       },
  //       deliveredDate: {
  //         $switch: {
  //           branches: [
  //             {
  //               case: {
  //                 $and: [
  //                   { $ifNull: ['$orderTimeline.delivered.date', false] },
  //                   {
  //                     $eq: [
  //                       { $type: '$orderTimeline.delivered.date' },
  //                       'string',
  //                     ],
  //                   },
  //                   {
  //                     $regexMatch: {
  //                       input: '$orderTimeline.delivered.date',
  //                       regex: /^\d{4}-\d{2}-\d{2}$/,
  //                     },
  //                   },
  //                 ],
  //               },
  //               then: {
  //                 $dateFromString: {
  //                   dateString: '$orderTimeline.delivered.date',
  //                   format: '%Y-%m-%d',
  //                 },
  //               },
  //             },
  //           ],
  //           default: null,
  //         },
  //       },
  //       // Repeat for each field:
  //       pendingDate: {
  //         $switch: {
  //           branches: [
  //             {
  //               case: {
  //                 $and: [
  //                   { $ifNull: ['$orderTimeline.pending.date', false] },
  //                   {
  //                     $eq: [{ $type: '$orderTimeline.pending.date' }, 'string'],
  //                   },
  //                   {
  //                     $regexMatch: {
  //                       input: '$orderTimeline.pending.date',
  //                       regex: /^\d{4}-\d{2}-\d{2}$/,
  //                     },
  //                   },
  //                 ],
  //               },
  //               then: {
  //                 $dateFromString: {
  //                   dateString: '$orderTimeline.pending.date',
  //                   format: '%Y-%m-%d',
  //                 },
  //               },
  //             },
  //           ],
  //           default: null,
  //         },
  //       },
  //       courierDate: {
  //         $switch: {
  //           branches: [
  //             {
  //               case: {
  //                 $and: [
  //                   { $ifNull: ['$orderTimeline.sent to courier.date', false] },
  //                   {
  //                     $eq: [
  //                       { $type: '$orderTimeline.sent to courier.date' },
  //                       'string',
  //                     ],
  //                   },
  //                   {
  //                     $regexMatch: {
  //                       input: '$orderTimeline.sent to courier.date',
  //                       regex: /^\d{4}-\d{2}-\d{2}$/,
  //                     },
  //                   },
  //                 ],
  //               },
  //               then: {
  //                 $dateFromString: {
  //                   dateString: '$orderTimeline.sent to courier.date',
  //                   format: '%Y-%m-%d',
  //                 },
  //               },
  //             },
  //           ],
  //           default: null,
  //         },
  //       },
  //       holdDate: {
  //         $switch: {
  //           branches: [
  //             {
  //               case: {
  //                 $and: [
  //                   { $ifNull: ['$orderTimeline.onHold.date', false] },
  //                   {
  //                     $eq: [{ $type: '$orderTimeline.onHold.date' }, 'string'],
  //                   },
  //                   {
  //                     $regexMatch: {
  //                       input: '$orderTimeline.onHold.date',
  //                       regex: /^\d{4}-\d{2}-\d{2}$/,
  //                     },
  //                   },
  //                 ],
  //               },
  //               then: {
  //                 $dateFromString: {
  //                   dateString: '$orderTimeline.onHold.date',
  //                   format: '%Y-%m-%d',
  //                 },
  //               },
  //             },
  //           ],
  //           default: null,
  //         },
  //       },
  //       cancelledDate: {
  //         $switch: {
  //           branches: [
  //             {
  //               case: {
  //                 $and: [
  //                   { $ifNull: ['$orderTimeline.cancelled.date', false] },
  //                   {
  //                     $eq: [
  //                       { $type: '$orderTimeline.cancelled.date' },
  //                       'string',
  //                     ],
  //                   },
  //                   {
  //                     $regexMatch: {
  //                       input: '$orderTimeline.cancelled.date',
  //                       regex: /^\d{4}-\d{2}-\d{2}$/,
  //                     },
  //                   },
  //                 ],
  //               },
  //               then: {
  //                 $dateFromString: {
  //                   dateString: '$orderTimeline.cancelled.date',
  //                   format: '%Y-%m-%d',
  //                 },
  //               },
  //             },
  //           ],
  //           default: null,
  //         },
  //       },
  //       refundedDate: {
  //         $switch: {
  //           branches: [
  //             {
  //               case: {
  //                 $and: [
  //                   { $ifNull: ['$orderTimeline.refunded.date', false] },
  //                   {
  //                     $eq: [
  //                       { $type: '$orderTimeline.refunded.date' },
  //                       'string',
  //                     ],
  //                   },
  //                   {
  //                     $regexMatch: {
  //                       input: '$orderTimeline.refunded.date',
  //                       regex: /^\d{4}-\d{2}-\d{2}$/,
  //                     },
  //                   },
  //                 ],
  //               },
  //               then: {
  //                 $dateFromString: {
  //                   dateString: '$orderTimeline.refunded.date',
  //                   format: '%Y-%m-%d',
  //                 },
  //               },
  //             },
  //           ],
  //           default: null,
  //         },
  //       },
  //       returnedDate: {
  //         $switch: {
  //           branches: [
  //             {
  //               case: {
  //                 $and: [
  //                   { $ifNull: ['$orderTimeline.returned.date', false] },
  //                   {
  //                     $eq: [
  //                       { $type: '$orderTimeline.returned.date' },
  //                       'string',
  //                     ],
  //                   },
  //                   {
  //                     $regexMatch: {
  //                       input: '$orderTimeline.returned.date',
  //                       regex: /^\d{4}-\d{2}-\d{2}$/,
  //                     },
  //                   },
  //                 ],
  //               },
  //               then: {
  //                 $dateFromString: {
  //                   dateString: '$orderTimeline.returned.date',
  //                   format: '%Y-%m-%d',
  //                 },
  //               },
  //             },
  //           ],
  //           default: null,
  //         },
  //       },
  //     },
  //   });
  //
  //   // const andCond = (...conds) => conds.filter(Boolean);
  //   // --- Grouping for Dashboard Data ---
  //   aggregatesOrders.push({
  //     $group: {
  //       _id: null,
  //       allOrders: { $sum: 1 },
  //       orderAmount: { $sum: '$grandTotal' },
  //
  //       confirmOrders: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'confirmed'] },
  //                 gteDate && { $gte: ['$confirmedDate', gteDate] },
  //                 lteDate && { $lte: ['$confirmedDate', lteDate] },
  //               ],
  //             },
  //             1,
  //             0,
  //           ],
  //         },
  //       },
  //       confirmOrdersAmount: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'confirmed'] },
  //                 gteDate ? { $gte: ['$confirmedDate', gteDate] } : {},
  //                 lteDate ? { $lte: ['$confirmedDate', lteDate] } : {},
  //               ],
  //             },
  //             '$grandTotal',
  //             0,
  //           ],
  //         },
  //       },
  //
  //       deliveredOrders: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'delivered'] },
  //                 gteDate ? { $gte: ['$deliveredDate', gteDate] } : {},
  //                 lteDate ? { $lte: ['$deliveredDate', lteDate] } : {},
  //               ],
  //             },
  //             1,
  //             0,
  //           ],
  //         },
  //       },
  //       deliveredOrdersAmount: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'delivered'] },
  //                 gteDate ? { $gte: ['$deliveredDate', gteDate] } : {},
  //                 lteDate ? { $lte: ['$deliveredDate', lteDate] } : {},
  //               ],
  //             },
  //             '$grandTotal',
  //             0,
  //           ],
  //         },
  //       },
  //       courierOrders: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'sent to courier'] },
  //                 gteDate ? { $gte: ['$deliveredDate', gteDate] } : {},
  //                 lteDate ? { $lte: ['$deliveredDate', lteDate] } : {},
  //               ],
  //             },
  //             1,
  //             0,
  //           ],
  //         },
  //       },
  //       courierOrdersAmount: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'sent to courier'] },
  //                 gteDate ? { $gte: ['$deliveredDate', gteDate] } : {},
  //                 lteDate ? { $lte: ['$deliveredDate', lteDate] } : {},
  //               ],
  //             },
  //             '$grandTotal',
  //             0,
  //           ],
  //         },
  //       },
  //       holdOrders: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'on_hold'] },
  //                 gteDate ? { $gte: ['$holdDate', gteDate] } : {},
  //                 lteDate ? { $lte: ['$holdDate', lteDate] } : {},
  //               ],
  //             },
  //             1,
  //             0,
  //           ],
  //         },
  //       },
  //       holdOrdersAmount: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'on_hold'] },
  //                 gteDate ? { $gte: ['$holdDate', gteDate] } : {},
  //                 lteDate ? { $lte: ['$holdDate', lteDate] } : {},
  //               ],
  //             },
  //             '$grandTotal',
  //             0,
  //           ],
  //         },
  //       },
  //       pendingOrders: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'pending'] },
  //                 gteDate ? { $gte: ['$pendingDate', gteDate] } : {},
  //                 lteDate ? { $lte: ['$pendingDate', lteDate] } : {},
  //               ],
  //             },
  //             1,
  //             0,
  //           ],
  //         },
  //       },
  //       pendingOrdersAmount: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'pending'] },
  //                 gteDate ? { $gte: ['$pendingDate', gteDate] } : {},
  //                 lteDate ? { $lte: ['$pendingDate', lteDate] } : {},
  //               ],
  //             },
  //             '$grandTotal',
  //             0,
  //           ],
  //         },
  //       },
  //
  //       cancelOrders: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'cancelled'] },
  //                 gteDate ? { $gte: ['$cancelledDate', gteDate] } : {},
  //                 lteDate ? { $lte: ['$cancelledDate', lteDate] } : {},
  //               ],
  //             },
  //             1,
  //             0,
  //           ],
  //         },
  //       },
  //       cancelOrdersAmount: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'cancelled'] },
  //                 gteDate ? { $gte: ['$cancelledDate', gteDate] } : {},
  //                 lteDate ? { $lte: ['$cancelledDate', lteDate] } : {},
  //               ],
  //             },
  //             '$grandTotal',
  //             0,
  //           ],
  //         },
  //       },
  //
  //       refundOrders: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'refunded'] },
  //                 gteDate ? { $gte: ['$refundedDate', gteDate] } : {},
  //                 lteDate ? { $lte: ['$refundedDate', lteDate] } : {},
  //               ],
  //             },
  //             1,
  //             0,
  //           ],
  //         },
  //       },
  //       refundOrdersAmount: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'refunded'] },
  //                 gteDate ? { $gte: ['$refundedDate', gteDate] } : {},
  //                 lteDate ? { $lte: ['$refundedDate', lteDate] } : {},
  //               ],
  //             },
  //             '$grandTotal',
  //             0,
  //           ],
  //         },
  //       },
  //
  //       returnOrders: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'returned'] },
  //                 gteDate ? { $gte: ['$returnedDate', gteDate] } : {},
  //                 lteDate ? { $lte: ['$returnedDate', lteDate] } : {},
  //               ],
  //             },
  //             1,
  //             0,
  //           ],
  //         },
  //       },
  //       returnOrdersAmount: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $eq: ['$orderStatus', 'returned'] },
  //                 gteDate ? { $gte: ['$returnedDate', gteDate] } : {},
  //                 lteDate ? { $lte: ['$returnedDate', lteDate] } : {},
  //               ],
  //             },
  //             '$grandTotal',
  //             0,
  //           ],
  //         },
  //       },
  //
  //       activeOrders: {
  //         $sum: {
  //           $cond: [{ $ne: ['$orderStatus', 'cancelled'] }, 1, 0],
  //         },
  //       },
  //       activeOrdersAmount: {
  //         $sum: {
  //           $cond: [{ $ne: ['$orderStatus', 'cancelled'] }, '$grandTotal', 0],
  //         },
  //       },
  //     },
  //   });
  //
  //   // --- For Total Orders ---
  //   const statusExclusionTotal = {
  //     $and: [
  //       { status: { $ne: 'trash' } },
  //       { shop: new ObjectId(filter['shop']) },
  //     ],
  //   };
  //   aggregatesTotalOrders.push({ $match: statusExclusionTotal });
  //   aggregatesTotalOrders.push({
  //     $group: {
  //       _id: null,
  //       allOrders: { $sum: 1 },
  //       orderAmount: { $sum: '$grandTotal' },
  //     },
  //   });
  //
  //   // --- For Checkout Orders by Date ---
  //   const statusExclusionCheckout: any[] = [
  //     { status: { $ne: 'trash' } },
  //     { orderStatus: { $ne: 'cancelled' } },
  //     { shop: new ObjectId(filter['shop']) },
  //   ];
  //   if (gteDate && lteDate) {
  //     statusExclusionCheckout.push({
  //       checkoutDate: { $gte: gteDate1, $lte: lteDate1 },
  //     });
  //   }
  //
  //   aggregatesOrdersCheckout.push({
  //     $match: { $and: statusExclusionCheckout },
  //   });
  //   aggregatesOrdersCheckout.push({
  //     $group: {
  //       _id: null,
  //       totalOrders: { $sum: 1 },
  //       totalOrderAmount: { $sum: '$grandTotal' },
  //     },
  //   });
  //
  //   // --- For Courier Orders ---
  //   aggregatesOrdersCourier.push({
  //     $match: {
  //       $and: [
  //         mFilterCourier,
  //         { status: { $ne: 'trash' } },
  //         { orderStatus: { $ne: 'cancelled' } },
  //       ],
  //     },
  //   });
  //   aggregatesOrdersCourier.push({
  //     $addFields: {
  //       courierCreatedAt: {
  //         $cond: [
  //           {
  //             $and: [
  //               { $ifNull: ['$courierData.createdAt', false] },
  //               { $eq: [{ $type: '$courierData.createdAt' }, 'string'] },
  //             ],
  //           },
  //           {
  //             $dateFromString: {
  //               dateString: '$courierData.createdAt',
  //               format: '%Y-%m-%d',
  //             },
  //           },
  //           '$courierData.createdAt',
  //         ],
  //       },
  //     },
  //   });
  //   aggregatesOrdersCourier.push({
  //     $group: {
  //       _id: null,
  //       courierOrders: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $ne: ['$courierCreatedAt', null] },
  //                 gteDate ? { $gte: ['$courierCreatedAt', gteDate] } : {},
  //                 lteDate ? { $lte: ['$courierCreatedAt', lteDate] } : {},
  //               ],
  //             },
  //             1,
  //             0,
  //           ],
  //         },
  //       },
  //       courierOrdersAmount: {
  //         $sum: {
  //           $cond: [
  //             {
  //               $and: [
  //                 { $ne: ['$courierCreatedAt', null] },
  //                 gteDate ? { $gte: ['$courierCreatedAt', gteDate] } : {},
  //                 lteDate ? { $lte: ['$courierCreatedAt', lteDate] } : {},
  //               ],
  //             },
  //             '$grandTotal',
  //             0,
  //           ],
  //         },
  //       },
  //     },
  //   });
  //
  //   try {
  //     const dataAggregates = await this.orderModel.aggregate(aggregatesOrders);
  //     const dataAggregatesCourier = await this.orderModel.aggregate(
  //       aggregatesOrdersCourier,
  //     );
  //     const dataAggregatesTotalOrders = await this.orderModel.aggregate(
  //       aggregatesTotalOrders,
  //     );
  //     const dataAggregatesCheckoutOrders = await this.orderModel.aggregate(
  //       aggregatesOrdersCheckout,
  //     );
  //
  //     return {
  //       data: dataAggregates[0] || {},
  //       courier: dataAggregatesCourier[0] || {},
  //       totalOrder: dataAggregatesTotalOrders[0] || {},
  //       totalOrderCheckoutDate: dataAggregatesCheckoutOrders[0] || {},
  //       success: true,
  //       message: 'Success',
  //     } as ResponsePayload;
  //   } catch (err) {
  //     this.logger.error(err);
  //     if (err.code && err.code.toString() === ErrorCodes.PROJECTION_MISMATCH) {
  //       throw new BadRequestException('Error! Orderion mismatch');
  //     } else {
  //       throw new InternalServerErrorException(err.message);
  //     }
  //   }
  // }

  async getDashboardCategoryByProduct(
    vendor: Vendor,
    shop: any,
  ): Promise<ResponsePayload> {
    try {
      // Initialize the data array
      const data: { categoryName: string; productCount: number }[] = [];

      // Find categories by shop
      const categoryData = await this.categoryModel.find({ shop: shop });

      // Iterate through each category
      for (const cData of categoryData) {
        // Count products associated with the category
        const productCount = await this.orderModel.countDocuments({
          'orderedItems.category._id': cData._id,
        });

        // Only add categories with productCount > 0
        if (productCount > 0) {
          data.push({
            categoryName: cData.name,
            productCount: productCount,
          });
        }
      }

      // Sort the data array in descending order by productCount
      data.sort((a, b) => b.productCount - a.productCount);

      return {
        success: true,
        message: 'Data Retrieved Successfully',
        data,
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getSalesData(period: string, shopId: string): Promise<any> {
    let startDate: Date;
    const endDate = new Date(); // Current date as the end date

    // Define the start date based on the period
    if (period === 'yearly') {
      startDate = new Date(endDate.getFullYear() - 2, 0, 1); // Start from 2 years ago
    } else if (period === 'monthly') {
      startDate = new Date(endDate.getFullYear(), 0, 1); // Start of the current year
    } else if (period === 'weekly') {
      // Calculate the start of the current week (Monday to Sunday)
      const currentDay = endDate.getDay();
      const daysToStartOfWeek = currentDay === 0 ? 6 : currentDay - 1; // If it's Sunday (0), go back 6 days
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - daysToStartOfWeek); // Move to Monday of the same week
      startDate.setHours(0, 0, 0, 0); // Set start of the day
    } else {
      throw new Error('Invalid period');
    }

    // Fetch sales data
    const salesData = await this.orderModel.aggregate([
      {
        $match: {
          ...(shopId && shopId !== 'null' && shopId !== 'undefined' ? { shop: new ObjectId(shopId) } : {}),

          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
          orderStatus: {
            $ne: 'cancelled', // Exclude cancelled orders
          },
          status: {
            $ne: 'trash', // Exclude status orders
          },
        },
      },
      {
        $addFields: {
          // Calculate orderProfit for each document
          orderProfit: {
            $reduce: {
              input: '$orderedItems', // Access orderedItems array
              initialValue: 0,
              in: {
                $add: [
                  '$$value',
                  {
                    $multiply: [
                      {
                        $subtract: ['$$this.regularPrice', '$$this.costPrice'],
                      }, // Reference array fields
                      '$$this.quantity',
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          // Calculate totalProfit by subtracting discount
          totalProfit: {
            $subtract: ['$orderProfit', { $ifNull: ['$discount', 0] }], // Ensure discount is handled
          },
        },
      },
      {
        $group: {
          _id:
            period === 'yearly'
              ? { $year: '$createdAt' }
              : period === 'monthly'
                ? { $month: '$createdAt' }
                : { $dayOfWeek: '$createdAt' },
          totalRevenue: { $sum: '$grandTotal' },
          totalProfit: { $sum: '$totalProfit' }, // Sum totalProfit
        },
      },
      {
        $sort: { _id: 1 }, // Sort by the grouped field (year, month, or day of the week)
      },
    ]);

    // Prepare data for chart display
    let labels: string[] = [];
    const revenueData: number[] = [];
    const profitData: number[] = [];

    if (period === 'yearly') {
      // Handle yearly data
      labels = [
        String(endDate.getFullYear() - 2),
        String(endDate.getFullYear() - 1),
        String(endDate.getFullYear()),
      ];
      labels.forEach((year) => {
        const data = salesData.find((item) => String(item._id) === year);
        revenueData.push(data ? data.totalRevenue : 0);
        profitData.push(data ? data.totalProfit : 0);
      });
    } else if (period === 'monthly') {
      // Handle monthly data
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      labels = months;
      labels.forEach((_, index) => {
        const data = salesData.find((item) => item._id === index + 1); // Month index starts from 1
        revenueData.push(data ? data.totalRevenue : 0);
        profitData.push(data ? data.totalProfit : 0);
      });
    } else if (period === 'weekly') {
      // Handle weekly data
      const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      labels = days;
      labels.forEach((_, index) => {
        const data = salesData.find((item) => item._id === index + 1); // $dayOfWeek starts from 1 (Sunday)
        revenueData.push(data ? data.totalRevenue : 0);
        profitData.push(data ? data.totalProfit : 0);
      });
    }

    const data = {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: revenueData,
          borderColor: '#5457cd',
          backgroundColor: '#5457cd',
        },
        {
          label: 'Profit',
          data: profitData,
          borderColor: '#dadafc',
          backgroundColor: '#dadafc',
        },
      ],
    };
    return {
      data,
    };
  }

  private async updateAffiliateBalance(affiliateId: any) {
    // 6. Earning & withdrawal data from affiliateReportModel
    const earningFilter = { affiliate: affiliateId, type: 'earning' };
    const withdrawalFilter = {
      affiliate: affiliateId,
      type: 'withdrawal',
      status: 'paid',
    };

    const earningReports: any[] =
      await this.affiliateReportModel.find(earningFilter);
    const withdrawalReports: any[] =
      await this.affiliateReportModel.find(withdrawalFilter);

    const totalEarnings = earningReports.reduce(
      (sum, report) => sum + (report.amount || 0),
      0,
    );
    const totalPayment = withdrawalReports.reduce(
      (sum, report) => sum + (report.amount || 0),
      0,
    );

    // Final response
    const finalData = {
      totalEarning: totalEarnings,
      totalRefers: earningReports.length,
      paidAmount: totalPayment,
      dueAmount: totalEarnings - totalPayment,
    };

    await this.affiliateModel.findByIdAndUpdate(
      affiliateId,
      { $set: finalData },
      { new: true, upsert: true },
    );
  }

  async getAffiliateData(period: string, affiliateId: string): Promise<any> {
    let startDate: Date;
    const endDate = new Date();

    // Calculate start date based on period
    if (period === 'yearly') {
      startDate = new Date(endDate.getFullYear() - 2, 0, 1);
    } else if (period === 'monthly') {
      startDate = new Date(endDate.getFullYear(), 0, 1);
    } else if (period === 'weekly') {
      const currentDay = endDate.getDay();
      const daysToStartOfWeek = currentDay === 0 ? 6 : currentDay - 1;
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - daysToStartOfWeek);
      startDate.setHours(0, 0, 0, 0);
    } else {
      throw new Error('Invalid period');
    }

    const reports = await this.affiliateReportModel.aggregate([
      {
        $match: {
          affiliate: new ObjectId(affiliateId),
          createdAt: { $gte: startDate, $lte: endDate },
          $or: [
            { type: 'earning' },
            { type: 'withdrawal', status: 'paid' }, // ✅ Only paid withdrawals
          ],
        },
      },
      {
        $group: {
          _id:
            period === 'yearly'
              ? { $year: '$createdAt' }
              : period === 'monthly'
                ? { $month: '$createdAt' }
                : { $dayOfWeek: '$createdAt' },
          totalEarning: {
            $sum: {
              $cond: [{ $eq: ['$type', 'earning'] }, '$amount', 0],
            },
          },
          totalWithdrawal: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$type', 'withdrawal'] },
                    { $eq: ['$status', 'paid'] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Prepare output
    let labels: string[] = [];
    const earningData: number[] = [];
    const withdrawalData: number[] = [];

    if (period === 'yearly') {
      labels = [
        String(endDate.getFullYear() - 2),
        String(endDate.getFullYear() - 1),
        String(endDate.getFullYear()),
      ];
      labels.forEach((year) => {
        const data = reports.find((item) => String(item._id) === year);
        earningData.push(data ? data.totalEarning : 0);
        withdrawalData.push(data ? data.totalWithdrawal : 0);
      });
    } else if (period === 'monthly') {
      labels = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      labels.forEach((_, index) => {
        const data = reports.find((item) => item._id === index + 1);
        earningData.push(data ? data.totalEarning : 0);
        withdrawalData.push(data ? data.totalWithdrawal : 0);
      });
    } else if (period === 'weekly') {
      labels = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      labels.forEach((_, index) => {
        const data = reports.find((item) => item._id === index + 1);
        earningData.push(data ? data.totalEarning : 0);
        withdrawalData.push(data ? data.totalWithdrawal : 0);
      });
    }

    return {
      data: {
        labels,
        datasets: [
          {
            label: 'Affiliate Earning',
            data: earningData,
            borderColor: '#36b37e',
            backgroundColor: '#36b37e',
          },
          {
            label: 'Withdrawal',
            data: withdrawalData,
            borderColor: '#ff595e',
            backgroundColor: '#ff595e',
          },
        ],
      },
    };
  }

  async getAllShopReportCompact(filterDto: any, q?: string): Promise<any> {
    const { filter, sort } = filterDto || {};

    // Shop match
    let shopMatch: any = this.sanitizeShopFilter(filter);

    if (q?.trim()) {
      const rx = new RegExp(this.escapeRegex(q.trim()), 'i');
      shopMatch = {
        $and: [
          Object.keys(shopMatch).length ? shopMatch : {},
          {
            $or: [
              { websiteName: rx },
              { domain: rx },
              { 'users.phoneNo': rx },
              { 'users.email': rx },
            ],
          },
        ],
      };
    }

    // Date filters for lookups
    const orderDateMatch = this.buildDateMatch(filter);
    const productDateMatch = this.buildDateMatch(filter);

    // Status logic
    const DELIVERED = [
      'delivered',
      'completed',
      'success',
      'delivered_by_courier',
    ];
    const CANCELED = [
      'canceled',
      'cancelled',
      'rejected',
      'returned',
      'failed',
    ];
    const PENDING = 'pending';
    const courierRegex =
      /(Pathao|Steadfast|Redx|Sundarban|Courier|Shipped|Dispatched|In\s*Transit|Picked\s*Up)/i;

    // Base pipeline (shared)
    const base: any[] = [
      { $match: Object.keys(shopMatch).length ? shopMatch : {} },

      // Orders stats
      {
        $lookup: {
          from: this.orderModel.collection.name,
          let: { shopId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$shop', '$$shopId'] },
                ...(Object.keys(orderDateMatch).length ? orderDateMatch : {}),
              },
            },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                pending: {
                  $sum: { $cond: [{ $eq: ['$orderStatus', PENDING] }, 1, 0] },
                },
                delivered: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          { $toLower: '$orderStatus' },
                          DELIVERED.map((v) => v.toLowerCase()),
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                canceled: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          { $toLower: '$orderStatus' },
                          CANCELED.map((v) => v.toLowerCase()),
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                courierAttached: {
                  $sum: {
                    $cond: [
                      { $ne: [{ $ifNull: ['$courierData', null] }, null] },
                      1,
                      0,
                    ],
                  },
                },
                courierInProgress: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          {
                            $regexMatch: {
                              input: { $ifNull: ['$orderStatus', ''] },
                              regex: courierRegex,
                            },
                          },
                          { $ne: [{ $ifNull: ['$courierData', null] }, null] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          as: 'orderStats',
        },
      },
      {
        $set: {
          orderStats: {
            $ifNull: [
              { $first: '$orderStats' },
              {
                totalOrders: 0,
                pending: 0,
                delivered: 0,
                canceled: 0,
                courierAttached: 0,
                courierInProgress: 0,
              },
            ],
          },
        },
      },

      // Products stats
      {
        $lookup: {
          from: this.productModel.collection.name,
          let: { shopId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$shop', '$$shopId'] },
                ...(Object.keys(productDateMatch).length
                  ? productDateMatch
                  : {}),
              },
            },
            { $group: { _id: null, totalProducts: { $sum: 1 } } },
          ],
          as: 'productStats',
        },
      },
      {
        $set: {
          productStats: {
            $ifNull: [{ $first: '$productStats' }, { totalProducts: 0 }],
          },
        },
      },

      // Flatten row
      {
        $project: {
          _id: 1,
          websiteName: 1,
          domain: 1,
          status: 1,
          owner: 1,
          paymentStatus: 1,
          theme: { name: 1, version: 1 },
          affiliateAccess: 1,
          users: {
            $map: {
              input: { $ifNull: ['$users', []] },
              as: 'u',
              in: {
                _id: '$$u._id',
                username: '$$u.username',
                phoneNo: '$$u.phoneNo',
                email: '$$u.email',
                role: '$$u.role',
              },
            },
          },
          totalOrders: '$orderStats.totalOrders',
          pending: '$orderStats.pending',
          delivered: '$orderStats.delivered',
          canceled: '$orderStats.canceled',
          courierAttached: '$orderStats.courierAttached',
          courierInProgress: '$orderStats.courierInProgress',
          totalProducts: '$productStats.totalProducts',
        },
      },
    ];

    // Sort for data
    const sortDoc = this.normalizeSort(sort);
    const sortStage: any = { $sort: sortDoc };

    // Facet: data + summary
    const pipeline: any[] = [
      {
        $facet: {
          data: [...base, sortStage],
          summary: [
            ...base,
            {
              $group: {
                _id: null,
                totalShops: { $sum: 1 },
                totalOrdersAll: { $sum: '$totalOrders' },
                totalPendingAll: { $sum: '$pending' },
                totalDeliveredAll: { $sum: '$delivered' },
                totalCanceledAll: { $sum: '$canceled' },
                totalCourierAttachedAll: { $sum: '$courierAttached' },
                totalCourierInProgressAll: { $sum: '$courierInProgress' },
                totalProductsAll: { $sum: '$totalProducts' },
              },
            },
            {
              $project: {
                _id: 0,
                totalShops: 1,
                totalOrdersAll: 1,
                totalPendingAll: 1,
                totalDeliveredAll: 1,
                totalCanceledAll: 1,
                totalCourierAttachedAll: 1,
                totalCourierInProgressAll: 1,
                totalProductsAll: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          data: '$data',
          summary: {
            $ifNull: [
              { $first: '$summary' },
              {
                totalShops: 0,
                totalOrdersAll: 0,
                totalPendingAll: 0,
                totalDeliveredAll: 0,
                totalCanceledAll: 0,
                totalCourierAttachedAll: 0,
                totalCourierInProgressAll: 0,
                totalProductsAll: 0,
              },
            ],
          },
        },
      },
    ];

    const [res] = await this.shopModel
      .aggregate(pipeline)
      .allowDiskUse(true)
      .exec();

    return {
      summary: res?.summary || {
        totalShops: 0,
        totalOrdersAll: 0,
        totalPendingAll: 0,
        totalDeliveredAll: 0,
        totalCanceledAll: 0,
        totalCourierAttachedAll: 0,
        totalCourierInProgressAll: 0,
        totalProductsAll: 0,
      },
      data: res?.data || [],
    };
  }
  private escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private buildDateMatch(filter?: any) {
    const m: any = {};
    if (filter?.dateFrom || filter?.dateTo) {
      m.createdAt = {};
      if (filter.dateFrom) m.createdAt.$gte = new Date(filter.dateFrom);
      if (filter.dateTo) {
        const end = new Date(filter.dateTo);
        end.setHours(23, 59, 59, 999);
        m.createdAt.$lte = end;
      }
      return m;
    }
    if (typeof filter?.month === 'number') m.month = filter.month;
    if (typeof filter?.year === 'number') m.year = filter.year;
    return m;
  }

  // Accepts either { field, dir } or { totalOrders: -1, _id: 1 }
  private normalizeSort(input: any): Record<string, 1 | -1> {
    const FALLBACK: Record<string, 1 | -1> = { totalOrders: -1, _id: 1 };
    if (!input || typeof input !== 'object') return FALLBACK;

    // shape A: { field: 'totalOrders' | 'totalProducts', dir: -1 | 1 | 'asc' | 'desc' }
    if ('field' in input) {
      const allowed = new Set(['totalOrders', 'totalProducts']);
      const fld = allowed.has(input.field)
        ? String(input.field)
        : 'totalOrders';
      const raw = input.dir;
      const dir: 1 | -1 = raw === 1 || raw === 'asc' || raw === '+1' ? 1 : -1;
      return { [fld]: dir, _id: 1 };
    }

    // shape B: { totalOrders: -1, _id: 1 } – sanitize
    const out: Record<string, 1 | -1> = {};
    for (const [k, v] of Object.entries(input)) {
      if (k === 'field' || k === 'dir') continue;
      if (k.startsWith('$')) continue;
      const dir: 1 | -1 = v === 1 || v === 'asc' || v === '+1' ? 1 : -1;
      out[k] = dir;
    }
    if (!('totalOrders' in out) && !('totalProducts' in out))
      out['totalOrders'] = -1;
    if (!('_id' in out)) out['_id'] = 1;
    return out;
  }

  // Only keep real Shop fields in $match (avoid dateFrom/dateTo leaking)
  private sanitizeShopFilter(filter?: any) {
    if (!filter || typeof filter !== 'object') return {};
    const out: any = {};
    const allow = new Set([
      '_id',
      'owner',
      'websiteName',
      'domain',
      'status',
      'paymentStatus',
      'affiliateAccess',
      // NOTE: dateFrom/dateTo/month/year are handled in lookups, NOT here.
    ]);
    for (const [k, v] of Object.entries(filter)) {
      if (!allow.has(k)) continue;
      out[k] = v;
    }
    if (out['_id']) out['_id'] = new ObjectId(out['_id']);
    if (out['owner']) out['owner'] = new ObjectId(out['owner']);
    return out;
  }

  /**
   * POS Dashboard Methods
   * getPOSDashboard()
   * getPOSSalesSummary()
   * getPOSProductSummary()
   */
  async getPOSDashboard(
    vendor: Vendor,
    shop: string,
    day: number = 0,
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

      let dateFilterSale;
      let dateFilterDateString;
      const today = this.utilsService.getDateString(new Date());

      if (day === 0) {
        const nextDay = this.utilsService.getNextDateString(new Date(), 1);
        dateFilterSale = {
          soldDateString: { $gte: today, $lt: nextDay },
          shop: new ObjectId(shop),
        };
        dateFilterDateString = {
          dateString: { $gte: today, $lt: nextDay },
          shop: new ObjectId(shop),
        };
      } else if (day === 1) {
        const previousDay = this.utilsService.getNextDateString(new Date(), -1);
        dateFilterSale = {
          soldDateString: { $gte: previousDay, $lt: today },
          shop: new ObjectId(shop),
        };
        dateFilterDateString = {
          dateString: { $gte: previousDay, $lt: today },
          shop: new ObjectId(shop),
        };
      } else if (day > 1) {
        const pDay = this.utilsService.getNextDateString(new Date(), -day);
        dateFilterSale = {
          soldDateString: { $gte: pDay },
          shop: new ObjectId(shop),
        };
        dateFilterDateString = {
          dateString: { $gte: pDay },
          shop: new ObjectId(shop),
        };
      } else {
        dateFilterSale = {
          soldDateString: { $gte: today },
          shop: new ObjectId(shop),
        };
        dateFilterDateString = {
          dateString: { $gte: today },
          shop: new ObjectId(shop),
        };
      }

      // Sales Calculation
      const salesAggregate = [
        { $match: dateFilterSale },
        {
          $group: {
            _id: null,
            totalSale: { $sum: '$total' },
            totalLoss: {
              $sum: {
                $subtract: ['$totalPurchasePrice', '$total'],
              },
            },
            totalProfit: {
              $sum: {
                $subtract: ['$total', '$totalPurchasePrice'],
              },
            },
            totalSalesCount: { $sum: 1 },
          },
        },
      ];

      // Expense Calculation
      const expenseAggregate = [
        {
          $match: {
            date: dateFilterDateString.dateString
              ? {
                  $gte: new Date(
                    dateFilterDateString.dateString.$gte || dateFilterDateString.dateString,
                  ),
                  $lte: dateFilterDateString.dateString.$lte
                    ? new Date(dateFilterDateString.dateString.$lte)
                    : new Date(),
                }
              : { $gte: new Date(today) },
            shop: new ObjectId(shop),
          },
        },
        {
          $group: {
            _id: null,
            totalExpense: { $sum: '$amount' },
          },
        },
      ];

      // Income Calculation
      const incomeAggregate = [
        { $match: dateFilterDateString },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: '$amount' },
          },
        },
      ];

      // Transactions Calculation
      const transactionsAggregate = [
        { $match: dateFilterDateString },
        {
          $group: {
            _id: null,
            totalVendorPayable: { $sum: '$payableAmount' },
            totalVendorPaid: { $sum: '$paidAmount' },
          },
        },
      ];

      // Product Purchase Calculation
      const purchaseAggregate = [
        { $match: dateFilterDateString },
        {
          $group: {
            _id: null,
            totalPurchase: {
              $sum: {
                $multiply: [
                  '$product.purchasePrice',
                  { $subtract: ['$updatedQuantity', '$previousQuantity'] },
                ],
              },
            },
          },
        },
      ];

      // Return Sales Calculation
      const returnSalesAggregate = [
        {
          $match: {
            returnDateString: dateFilterSale.soldDateString,
            shop: new ObjectId(shop),
          },
        },
        {
          $group: {
            _id: null,
            totalReturn: { $sum: '$grandTotal' },
            returnCount: { $sum: 1 },
          },
        },
      ];

      // Pre-Order Calculation
      const preOrderAggregate = [
        {
          $match: {
            soldDateString: dateFilterSale.soldDateString,
            shop: new ObjectId(shop),
          },
        },
        {
          $group: {
            _id: null,
            totalPreOrder: { $sum: '$total' },
            preOrderCount: { $sum: 1 },
          },
        },
      ];

      // Customer Count
      const customerCount = 0; // await this.customerModel.countDocuments({ shop: shop });

      const [
        salesResult,
        expenseResult,
        incomeResult,
        transactionsResult,
        purchaseResult,
        returnSalesResult,
        preOrderResult,
      ] = await Promise.all([
        [], // this.salesModel.aggregate(salesAggregate),
        this.expenseModel.aggregate(expenseAggregate),
        [], // this.incomeModel.aggregate(incomeAggregate),
        [], // this.transactionsModel.aggregate(transactionsAggregate),
        [], // this.productPurchaseModel.aggregate(purchaseAggregate),
        [], // this.returnSalesModel.aggregate(returnSalesAggregate),
        [], // this.preOrderModel.aggregate(preOrderAggregate),
      ]);

      const data = {
        ...(salesResult[0] || {
          totalSale: 0,
          totalLoss: 0,
          totalProfit: 0,
          totalSalesCount: 0,
        }),
        ...(expenseResult[0] || { totalExpense: 0 }),
        ...(incomeResult[0] || { totalIncome: 0 }),
        ...(transactionsResult[0] || {
          totalVendorPayable: 0,
          totalVendorPaid: 0,
        }),
        ...(purchaseResult[0] || { totalPurchase: 0 }),
        ...(returnSalesResult[0] || { totalReturn: 0, returnCount: 0 }),
        ...(preOrderResult[0] || { totalPreOrder: 0, preOrderCount: 0 }),
        totalCustomers: customerCount,
      };

      return {
        success: true,
        message: 'Data Retrieve Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getPOSSalesSummary(
    vendor: Vendor,
    shop: string,
    startDate?: string,
    endDate?: string,
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

      let dateFilter: any = { shop: new ObjectId(shop) };

      if (startDate && endDate) {
        dateFilter.soldDateString = { $gte: startDate, $lte: endDate };
      } else if (startDate) {
        dateFilter.soldDateString = { $gte: startDate };
      } else if (endDate) {
        dateFilter.soldDateString = { $lte: endDate };
      }

      const salesSummary: any[] = []; /* await this.salesModel.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$soldDateString',
            totalSale: { $sum: '$total' },
            totalProfit: {
              $sum: {
                $subtract: ['$total', '$totalPurchasePrice'],
              },
            },
            salesCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]); */

      return {
        success: true,
        message: 'Data Retrieve Success',
        data: salesSummary,
        count: salesSummary.length,
      } as ResponsePayload;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
