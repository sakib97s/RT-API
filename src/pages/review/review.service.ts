import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { UtilsService } from '../../shared/utils/utils.service';
import { ErrorCodes } from '../../enum/error-code.enum';
import {
  AddReviewDto,
  FilterAndPaginationReviewDto,
  UpdateReviewDto,
} from './dto/review.dto';
import { Review } from './interfaces/review.interface';
import { Product } from '../product/interfaces/product.interface';
import { User } from '../user/interfaces/user.interface';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Vendor } from '../vendor/interfaces/vendor.interface';
import { Order } from '../order/interfaces/order.interface';
import { Shop } from '../shop/interfaces/shop.interface';
import { UpdateProductDto } from '../product/dto/product.dto';
import { FilterAndPaginationOrderDto } from '../order/dto/order.dto';
import * as schedule from 'node-schedule';
const ObjectId = Types.ObjectId;

@Injectable()
export class ReviewService {
  private logger = new Logger(ReviewService.name);

  constructor(
    @InjectModel('Review') private readonly reviewModel: Model<Review>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    @InjectModel('Vendor') private readonly vendorModel: Model<Vendor>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    private configService: ConfigService,
    private utilsService: UtilsService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addReview
   * addReviewByAdmin
   */
  async addReviewByUser(
    shop: string,
    user: User,
    addReviewDto: AddReviewDto,
  ): Promise<ResponsePayload> {
    try {
      const productData = await this.productModel
        .findById({ _id: addReviewDto.product })
        .select(
          'name slug images category subcategory regularPrice discountType quantity',
        );

      const userData = await this.userModel
        .findById({ _id: user?._id })
        .select('name profileImg');

      const orderData = JSON.parse(
        JSON.stringify(
          await this.orderModel.findOne({ orderId: addReviewDto?.orderId }),
        ),
      );

      const mData = {
        ...addReviewDto,
        ...{
          product: {
            _id: productData._id,
            name: productData.name,
            images: productData?.images,
            slug: productData.slug,
            category: productData?.category,
            salePrice: productData?.salePrise,
            regularPrise: productData?.regularPrise,
          },
          user: userData,
          name: userData?.name,
          reviewBy: 'user',
          status: false,
          shop: shop,
        },
      };

      const saveData = await this.reviewModel.create(mData);

      const reviewData: any = await this.reviewModel.findById(saveData._id);

      if (orderData) {
        // console.log('orderData', orderData);

        // Find the order by orderId and update the product's isReview field if matched
        await this.orderModel.findOneAndUpdate(
          {
            _id: addReviewDto.order_Id,
            'orderedItems.product': addReviewDto.product, // Check if product exists in orderedItems
          },
          {
            $set: { 'orderedItems.$.isReview': true }, // Update isReview to true
          },
          { upsert: true, new: true }, // Return the updated document
        );
      }

      // this.updateRatingOfProduct(reviewData);

      return {
        success: true,
        // message: 'Review Added Successfully!',
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async addReviewByVendor(
    shop: string,
    user: User,
    addReviewDto: AddReviewDto,
  ): Promise<ResponsePayload> {
    try {
      const productData = await this.productModel
        .findById({ _id: addReviewDto.product })
        .select(
          'name slug images category subcategory regularPrice discountType quantity',
        );

      // const userData = await this.vendorModel
      //   .findById({ _id: user._id })
      //   .select('name profileImg');

      const orderData = JSON.parse(
        JSON.stringify(
          await this.orderModel.findOne({ orderId: addReviewDto?.orderId }),
        ),
      );

      const mData = {
        ...addReviewDto,
        ...{
          product: {
            _id: productData._id,
            name: productData.name,
            images: productData.images,
            slug: productData.slug,
            category: productData?.category,
            salePrice: productData?.salePrise,
            regularPrise: productData?.regularPrise,
            quantity: productData?.quantity,
          },
          user: null,
          reviewBy: 'Admin',
          status: true,
          shop: shop,
        },
      };

      // const saveData = await this.reviewModel.create(mData);

      // const reviewData: any = await this.reviewModel.findById(saveData._id);

      // if (orderData) {
      //   // console.log('orderData', orderData);
      //   // Find the order by orderId and update the product's isReview field if matched
      //   await this.orderModel.findOneAndUpdate(
      //     {
      //       _id: orderData._id,
      //       'orderedItems.product': addReviewDto.product, // Check if product exists in orderedItems
      //     },
      //     {
      //       $set: { 'orderedItems.$.isReview': true }, // Update isReview to true
      //     },
      //     { upsert: true, new: true }, // Return the updated document
      //   );
      // }

      // this.updateRatingOfProduct(reviewData);

      // Save the review to the database
      const savedReview: any = await this.reviewModel.create(mData);

      // After review is created, update ratings of the product and vendor
      await this.updateRatingOfProduct(savedReview);

      return {
        success: true,
        // message: 'Review Added Successfully!',
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async addReviewByAdmin(addReviewDto: AddReviewDto): Promise<ResponsePayload> {
    try {
      const productData = await this.productModel
        .findById({ _id: addReviewDto.product })
        .select('name slug images');

      const mData = {
        ...addReviewDto,
        ...{
          product: {
            _id: productData._id,
            name: productData.name,
            images: productData.images,
            slug: productData.slug,
          },
          user: {
            _id: null,
            name: addReviewDto.name,
            profileImg: null,
          },
        },
      };
      const saveData = await this.reviewModel.create(mData);

      await this.productModel.findByIdAndUpdate(addReviewDto.product, {
        $inc: {
          ratingCount: 1,
          ratingTotal: addReviewDto?.rating,
          reviewTotal: 1,
        },
      });

      switch (addReviewDto.rating) {
        case 1: {
          await this.productModel.findByIdAndUpdate(
            addReviewDto.product,
            {
              $inc: {
                'ratingDetails.oneStar': 1,
              },
            },
            {
              upsert: true,
              new: true,
            },
          );
          break;
        }
        case 2: {
          await this.productModel.findByIdAndUpdate(
            addReviewDto.product,
            {
              $inc: {
                'ratingDetails.twoStar': 1,
              },
            },
            {
              upsert: true,
              new: true,
            },
          );
          break;
        }
        case 3: {
          await this.productModel.findByIdAndUpdate(
            addReviewDto.product,
            {
              $inc: {
                'ratingDetails.threeStar': 1,
              },
            },
            {
              upsert: true,
              new: true,
            },
          );
          break;
        }
        case 4: {
          await this.productModel.findByIdAndUpdate(
            addReviewDto.product,
            {
              $inc: {
                'ratingDetails.fourStar': 1,
              },
            },
            {
              upsert: true,
              new: true,
            },
          );
          break;
        }
        case 5: {
          await this.productModel.findByIdAndUpdate(
            addReviewDto.product,
            {
              $inc: {
                'ratingDetails.fiveStar': 1,
              },
            },
            {
              upsert: true,
              new: true,
            },
          );
          break;
        }
        default: {
          //statements;
          break;
        }
      }

      return {
        success: true,
        message: 'review Added Successfully!',
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateAllProductRatingsByShop(shopId: string): Promise<any> {
    try {
      const products = await this.productModel.find({ shop: shopId });

      for (const product of products) {
        const reviews = await this.reviewModel.find({
          'product._id': product._id,
          status: true,
          shop: new ObjectId(shopId),
        });

        const ratingDetails = {
          oneStar: 0,
          twoStar: 0,
          threeStar: 0,
          fourStar: 0,
          fiveStar: 0,
        };

        let ratingTotal = 0;

        for (const review of reviews) {
          ratingTotal += review.rating;

          if (review.rating === 1) ratingDetails.oneStar++;
          else if (review.rating === 2) ratingDetails.twoStar++;
          else if (review.rating === 3) ratingDetails.threeStar++;
          else if (review.rating === 4) ratingDetails.fourStar++;
          else if (review.rating === 5) ratingDetails.fiveStar++;
        }

        const ratingCount = reviews.length;
        const reviewTotal = ratingCount;

        // Forcefully replace old values
        await this.productModel.findByIdAndUpdate(product._id, {
          ratingCount,
          ratingTotal,
          reviewTotal,
          ratingDetails,
        });
      }
      return {
        success: true,
        message: 'review Added Successfully!',
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * getReviewByUser()
   * getAllReviewsByQuery()
   * getAllReviews()
   * getReviewById()
   */

  async getAllReviewsByUser(
    shop: string,
    user: User,
    filterReviewDto: FilterAndPaginationReviewDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! no data found.',
        } as ResponsePayload;
      }

      let { filter } = filterReviewDto;
      filter = {
        ...filter,
        ...{
          shop: shop,
          'user._id': user._id,
        },
      };
      filterReviewDto.filter = filter;
      return this.getAllReviewsByQuery(filterReviewDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllPendingReviewItemsByUser(
    shop: string,
    user: User,
  ): Promise<ResponsePayload> {
    try {
      // Validate inputs
      if (!shop) {
        return {
          success: false,
          message: 'Shop ID is required.',
        } as ResponsePayload;
      }
      if (!user || !user._id) {
        return {
          success: false,
          message: 'User information is required.',
        } as ResponsePayload;
      }

      // MongoDB aggregation pipeline
      const orders = await this.orderModel.aggregate([
        {
          $match: {
            shop: new ObjectId(shop),
            user: new ObjectId(user._id),
            orderStatus: 'delivered',
          },
        },
        {
          $project: {
            orderId: 1,
            pendingReviewItems: {
              $filter: {
                input: '$orderedItems',
                as: 'item',
                cond: {
                  $not: { $ifNull: ['$$item.isReview', false] }, // Match items where !isReview
                },
              },
            },
          },
        },
        {
          $match: {
            'pendingReviewItems.0': { $exists: true },
          },
        },
      ]);

      const pendingReviewItemsWithOrderIds = orders.flatMap((order) =>
        order.pendingReviewItems.map((item) => ({
          ...item,
          orderId: order.orderId,
          order_Id: order._id,
        })),
      );

      if (!pendingReviewItemsWithOrderIds.length) {
        return {
          success: false,
          message: 'No pending review items found.',
        } as ResponsePayload;
      }

      return {
        success: true,
        message: 'Pending review items retrieved successfully.',
        data: pendingReviewItemsWithOrderIds,
      } as ResponsePayload;
    } catch (error) {
      console.error('Error fetching pending review items:', error);
      throw new InternalServerErrorException(
        'An error occurred while fetching pending review items.',
      );
    }
  }

  async getReviewByUser(user: User, shop: string): Promise<ResponsePayload> {
    try {
      const data = await this.reviewModel
        .find({ 'user._id': user._id, shop: shop })
        .populate('user', 'name phoneNo profileImg username')
        .populate('product', 'name slug images ')
        .sort({ createdAt: -1 });

      return {
        data: data,
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async getAllReviewsByQuery(
    filterReviewDto: FilterAndPaginationReviewDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterReviewDto;
    const { pagination } = filterReviewDto;
    const { sort } = filterReviewDto;
    const { select } = filterReviewDto;
    const { filterGroup } = filterReviewDto;

    // Essential Variables
    const aggregateStages = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match

    if (filter) {
      if (filter['product._id']) {
        filter['product._id'] = new ObjectId(filter['product._id']);
      }
      if (filter['user._id']) {
        filter['user._id'] = new ObjectId(filter['user._id']);
      }
      if (filter['shop']) {
        filter['shop'] = new ObjectId(filter['shop']);
      }

      if (filter['vendor'] && typeof filter['vendor'] != 'object') {
        filter['vendor'] = new ObjectId(filter['vendor']);
      }
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { orderId: { $regex: searchQuery, $options: 'i' } },
              { phoneNo: { $regex: searchQuery, $options: 'i' } },
              { 'product.name': { $regex: searchQuery, $options: 'i' } },
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

    // Finalize
    if (Object.keys(mFilter).length) {
      aggregateStages.push({ $match: mFilter });
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
      const dataAggregates = await this.reviewModel.aggregate(aggregateStages);
      // .populate('user', 'fullName profileImg username')
      //     .populate('product', 'productName productSlug images categorySlug')
      //     .sort({createdAt: -1})

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
        throw new BadRequestException('Error! Projection mismatch');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async getAllReviewByShop(
    vendor: Vendor,
    shop: string,
    filterAndPaginationReviewDto: FilterAndPaginationReviewDto,
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
      const { filter } = filterAndPaginationReviewDto;
      filterAndPaginationReviewDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllReviewsByQuery(
        filterAndPaginationReviewDto,
        searchQuery,
      );
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }
  async getAllReviews(shop: string): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! no data found.',
        } as ResponsePayload;
      }

      const reviews = await this.reviewModel
        .find({ shop: shop })
        .populate('user', 'name phoneNo profileImg username')
        .populate('product', 'name slug images ')
        .sort({ createdAt: -1 });
      return {
        success: true,
        message: 'Success',
        data: reviews,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getReviewById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.reviewModel.findById(id);
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getReviewVendorById(
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

      const data = await this.reviewModel
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

  /**
   * updateRatingOfProduct
   * updateReviewById
   * updateMultipleReviewById
   */
  async updateRatingOfProduct(
    updateReviewDto: UpdateReviewDto,
  ): Promise<ResponsePayload> {
    try {
      const review: any = await this.reviewModel.findById(updateReviewDto._id);
      const product = await this.productModel.findById(review?.product?._id);
      const vendor = await this.vendorModel.findById(product?.vendor?._id);

      // Update review information
      await this.reviewModel.updateOne(
        { _id: updateReviewDto._id },
        { $set: updateReviewDto },
      );

      // Update product's rating count and total
      await this.productModel.findByIdAndUpdate(updateReviewDto.product._id, {
        $inc: {
          ratingCount: 1, // Increment the number of reviews
          ratingTotal: updateReviewDto.rating, // Add the rating to the total
          reviewTotal: 1, // Increment the review total count
        },
      });

      // Update the product's star rating count based on the new review
      switch (updateReviewDto.rating) {
        case 1:
          await this.productModel.findByIdAndUpdate(
            updateReviewDto.product._id,
            {
              $inc: { 'ratingDetails.oneStar': 1 },
            },
          );
          break;
        case 2:
          await this.productModel.findByIdAndUpdate(
            updateReviewDto.product._id,
            {
              $inc: { 'ratingDetails.twoStar': 1 },
            },
          );
          break;
        case 3:
          await this.productModel.findByIdAndUpdate(
            updateReviewDto.product._id,
            {
              $inc: { 'ratingDetails.threeStar': 1 },
            },
          );
          break;
        case 4:
          await this.productModel.findByIdAndUpdate(
            updateReviewDto.product._id,
            {
              $inc: { 'ratingDetails.fourStar': 1 },
            },
          );
          break;
        case 5:
          await this.productModel.findByIdAndUpdate(
            updateReviewDto.product._id,
            {
              $inc: { 'ratingDetails.fiveStar': 1 },
            },
          );
          break;
        default:
          break;
      }

      // Update vendor's rating count and total
      await this.vendorModel.findByIdAndUpdate(vendor?._id, {
        $inc: {
          ratingCount: 1,
          ratingTotal: updateReviewDto.rating,
          reviewTotal: 1,
        },
      });

      return {
        success: true,
        message: 'Product rating updated successfully!',
      } as ResponsePayload;
    } catch (err) {
      console.error('Error in updateRatingOfProduct:', err);
      throw new InternalServerErrorException(
        'Error occurred while updating product rating',
        err.message,
      );
    }
  }

  // async updateRatingOfProduct(
  //   updateReviewDto: UpdateReviewDto,
  // ): Promise<ResponsePayload> {
  //   try {
  //     console.log('updateReviewDto',updateReviewDto);

  //     const rData = JSON.parse(
  //       JSON.stringify(await this.reviewModel.findById(updateReviewDto._id)),
  //     );
  //     const pData = JSON.parse(
  //       JSON.stringify(await this.productModel.findById(rData?.product?._id)),
  //     );
  //     const vData = JSON.parse(
  //       JSON.stringify(await this.vendorModel.findById(pData?.vendor?._id)),
  //     );

  //     await this.reviewModel.updateOne(
  //       { _id: updateReviewDto },
  //       { $set: updateReviewDto },
  //     );

  //     await this.productModel.findByIdAndUpdate(updateReviewDto?.product?._id, {
  //       $inc: {
  //         ratingCount: 1,
  //         ratingTotal: updateReviewDto?.rating,
  //         reviewTotal: 1,
  //       },
  //     });

  //     switch (updateReviewDto.rating) {
  //       case 1: {
  //         await this.productModel.findByIdAndUpdate(
  //           updateReviewDto.product,
  //           {
  //             $inc: {
  //               'ratingDetails.oneStar': 1,
  //             },
  //           },
  //           {
  //             upsert: true,
  //             new: true,
  //           },
  //         );
  //         break;
  //       }
  //       case 2: {
  //         await this.productModel.findByIdAndUpdate(
  //           updateReviewDto.product,
  //           {
  //             $inc: {
  //               'ratingDetails.twoStar': 1,
  //             },
  //           },
  //           {
  //             upsert: true,
  //             new: true,
  //           },
  //         );
  //         break;
  //       }
  //       case 3: {
  //         await this.productModel.findByIdAndUpdate(
  //           updateReviewDto.product,
  //           {
  //             $inc: {
  //               'ratingDetails.threeStar': 1,
  //             },
  //           },
  //           {
  //             upsert: true,
  //             new: true,
  //           },
  //         );
  //         break;
  //       }
  //       case 4: {
  //         await this.productModel.findByIdAndUpdate(
  //           updateReviewDto.product,
  //           {
  //             $inc: {
  //               'ratingDetails.fourStar': 1,
  //             },
  //           },
  //           {
  //             upsert: true,
  //             new: true,
  //           },
  //         );
  //         break;
  //       }
  //       case 5: {
  //         await this.productModel.findByIdAndUpdate(
  //           updateReviewDto.product,
  //           {
  //             $inc: {
  //               'ratingDetails.fiveStar': 1,
  //             },
  //           },
  //           {
  //             upsert: true,
  //             new: true,
  //           },
  //         );
  //         break;
  //       }
  //       default: {
  //         //statements;
  //         break;
  //       }
  //     }
  //     // // vendor review add
  //     await this.vendorModel.findByIdAndUpdate(vData?._id, {
  //       $inc: {
  //         ratingCount: 1,
  //         ratingTotal: updateReviewDto?.rating,
  //         reviewTotal: 1,
  //       },
  //     });

  //     return {
  //       success: true,
  //       message: 'Success',
  //     } as ResponsePayload;
  //   } catch (err) {
  //     console.error('Error in updateRatingOfProduct:', err);
  //     // throw new InternalServerErrorException();
  //     throw new InternalServerErrorException('Error occurred while updating product rating', err.message);
  //   }
  // }

  async updateReviewById(
    updateReviewDto: UpdateReviewDto,
  ): Promise<ResponsePayload> {
    try {
      const data = JSON.parse(
        JSON.stringify(await this.reviewModel.findById(updateReviewDto?._id)),
      );

      if (data.status === updateReviewDto.status) {
        await this.reviewModel.updateOne(
          { _id: updateReviewDto },
          { $set: updateReviewDto },
        );

        // if (!data) {
        //   throw new NotFoundException('Review not found');
        // }

        const oldRating = data?.rating; // Store old rating
        const newRating = updateReviewDto?.rating;

        if (oldRating !== newRating) {
          // await this.productModel.findByIdAndUpdate(
          //   updateReviewDto?.product?._id,
          //   {
          //     $inc: {
          //       ratingCount: 1,
          //       ratingTotal: updateReviewDto?.rating,
          //       reviewTotal: 1,
          //     },
          //   },
          // );

          await this.productModel.findByIdAndUpdate(data.product._id, {
            $inc: {
              ratingCount: -1,
              ratingTotal: -oldRating,
              reviewTotal: -1,
              [`ratingDetails.${this.getStarKey(oldRating)}`]: -1,
            },
          });

          // Add new rating count
          await this.productModel.findByIdAndUpdate(
            updateReviewDto?.product?._id,
            {
              $inc: {
                ratingCount: 1,
                ratingTotal: newRating,
                reviewTotal: 1,
                [`ratingDetails.${this.getStarKey(newRating)}`]: 1,
              },
            },
          );
        }
      } else {
        if (data.status === true && updateReviewDto.status === false) {
          await this.reviewModel.updateOne(
            { _id: updateReviewDto },
            { $set: updateReviewDto },
          );

          await this.productModel.findByIdAndUpdate(data.product._id, {
            $inc: {
              ratingCount: -1,
              ratingTotal: -updateReviewDto?.rating,
              reviewTotal: -1,
            },
          });

          switch (updateReviewDto.rating) {
            case 1: {
              await this.productModel.findByIdAndUpdate(
                data.product,
                {
                  $inc: {
                    'ratingDetails.oneStar': -1,
                  },
                },
                {
                  upsert: true,
                  new: true,
                },
              );
              break;
            }
            case 2: {
              await this.productModel.findByIdAndUpdate(
                data.product,
                {
                  $inc: {
                    'ratingDetails.twoStar': -1,
                  },
                },
                {
                  upsert: true,
                  new: true,
                },
              );
              break;
            }
            case 3: {
              await this.productModel.findByIdAndUpdate(
                data.product,
                {
                  $inc: {
                    'ratingDetails.threeStar': -1,
                  },
                },
                {
                  upsert: true,
                  new: true,
                },
              );
              break;
            }
            case 4: {
              await this.productModel.findByIdAndUpdate(
                data.product,
                {
                  $inc: {
                    'ratingDetails.fourStar': -1,
                  },
                },
                {
                  upsert: true,
                  new: true,
                },
              );
              break;
            }
            case 5: {
              await this.productModel.findByIdAndUpdate(
                data.product,
                {
                  $inc: {
                    'ratingDetails.fiveStar': -1,
                  },
                },
                {
                  upsert: true,
                  new: true,
                },
              );
              break;
            }
            default: {
              //statements;
              break;
            }
          }
        } else {
          await this.reviewModel.updateOne(
            { _id: updateReviewDto },
            { $set: updateReviewDto },
          );

          await this.productModel.findByIdAndUpdate(
            updateReviewDto?.product?._id,
            {
              $inc: {
                ratingCount: 1,
                ratingTotal: updateReviewDto?.rating,
                reviewTotal: 1,
              },
            },
          );

          switch (updateReviewDto.rating) {
            case 1: {
              await this.productModel.findByIdAndUpdate(
                data.product,
                {
                  $inc: {
                    'ratingDetails.oneStar': 1,
                  },
                },
                {
                  upsert: true,
                  new: true,
                },
              );
              break;
            }
            case 2: {
              await this.productModel.findByIdAndUpdate(
                data.product,
                {
                  $inc: {
                    'ratingDetails.twoStar': 1,
                  },
                },
                {
                  upsert: true,
                  new: true,
                },
              );
              break;
            }
            case 3: {
              await this.productModel.findByIdAndUpdate(
                data.product,
                {
                  $inc: {
                    'ratingDetails.threeStar': 1,
                  },
                },
                {
                  upsert: true,
                  new: true,
                },
              );
              break;
            }
            case 4: {
              await this.productModel.findByIdAndUpdate(
                data.product,
                {
                  $inc: {
                    'ratingDetails.fourStar': 1,
                  },
                },
                {
                  upsert: true,
                  new: true,
                },
              );
              break;
            }
            case 5: {
              await this.productModel.findByIdAndUpdate(
                data.product,
                {
                  $inc: {
                    'ratingDetails.fiveStar': 1,
                  },
                },
                {
                  upsert: true,
                  new: true,
                },
              );
              break;
            }
            default: {
              //statements;
              break;
            }
          }
        }
      }

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  private getStarKey(rating: number): string {
    switch (rating) {
      case 1:
        return 'oneStar';
      case 2:
        return 'twoStar';
      case 3:
        return 'threeStar';
      case 4:
        return 'fourStar';
      case 5:
        return 'fiveStar';
      default:
        return '';
    }
  }

  async updateReviewUserById(
    shop: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<ResponsePayload> {
    try {
      const data = JSON.parse(
        JSON.stringify(await this.reviewModel.findById(updateReviewDto?._id)),
      );

      // if (!data) {
      //   throw new NotFoundException('Review not found');
      // }

      const oldRating = data?.rating; // Store old rating
      const newRating = updateReviewDto?.rating;

      // If the status of the review is the same, just update the review
      if (data?.status === updateReviewDto?.status) {
        await this.reviewModel.updateOne(
          { _id: updateReviewDto },
          { $set: updateReviewDto },
        );
      } else {
        if (data?.status === true && updateReviewDto?.status === false) {
          // Decrease the impact of the old rating
          if (oldRating) {
            await this.productModel.findByIdAndUpdate(data.product._id, {
              $inc: {
                ratingCount: -1,
                ratingTotal: -oldRating,
                reviewTotal: -1,
              },
            });

            await this.updateStarRatingCount(data.product._id, oldRating, -1);
          }

          // Update the review status and rating
          await this.reviewModel.updateOne(
            { _id: updateReviewDto },
            { $set: updateReviewDto },
          );

          // Decrease product review data after review removal
          await this.productModel.findByIdAndUpdate(data.product._id, {
            $inc: {
              ratingCount: -1,
              ratingTotal: -newRating,
              reviewTotal: -1,
            },
          });

          // Adjust the star rating count for the new review status
          await this.updateStarRatingCount(data.product._id, newRating, -1);
        } else {
          // Update the review status and rating
          await this.reviewModel.updateOne(
            { _id: updateReviewDto },
            { $set: updateReviewDto },
          );

          // Adjust product review data after review update
          await this.productModel.findByIdAndUpdate(data.product._id, {
            $inc: {
              ratingCount: 1,
              ratingTotal: newRating - oldRating, // Adjust the rating total based on the difference
              reviewTotal: 1,
            },
          });

          // Adjust the star rating count for both old and new ratings
          await this.updateStarRatingCount(data.product._id, oldRating, -1); // Decrease old rating count
          await this.updateStarRatingCount(data.product._id, newRating, 1); // Increase new rating count
        }
      }

      return {
        success: true,
        message: 'Review updated successfully',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateStarRatingCount(
    productId: string,
    rating: number,
    increment: number,
  ) {
    // Update the star rating counts based on the rating value and increment/decrement
    switch (rating) {
      case 1:
        await this.productModel.findByIdAndUpdate(productId, {
          $inc: { 'ratingDetails.oneStar': increment },
        });
        break;
      case 2:
        await this.productModel.findByIdAndUpdate(productId, {
          $inc: { 'ratingDetails.twoStar': increment },
        });
        break;
      case 3:
        await this.productModel.findByIdAndUpdate(productId, {
          $inc: { 'ratingDetails.threeStar': increment },
        });
        break;
      case 4:
        await this.productModel.findByIdAndUpdate(productId, {
          $inc: { 'ratingDetails.fourStar': increment },
        });
        break;
      case 5:
        await this.productModel.findByIdAndUpdate(productId, {
          $inc: { 'ratingDetails.fiveStar': increment },
        });
        break;
      default:
        // Handle case for invalid rating
        break;
    }
  }

  // async updateReviewUserById(
  //   shop: string,
  //   updateReviewDto: UpdateReviewDto,
  // ): Promise<ResponsePayload> {
  //   try {
  //     const data = JSON.parse(
  //       JSON.stringify(await this.reviewModel.findById(updateReviewDto?._id)),
  //     );

  //     if (data?.status === updateReviewDto?.status) {
  //       await this.reviewModel.updateOne(
  //         { _id: updateReviewDto },
  //         { $set: updateReviewDto },
  //       );
  //     } else {
  //       if (data?.status === true && updateReviewDto?.status === false) {
  //         await this.reviewModel.updateOne(
  //           { _id: updateReviewDto },
  //           { $set: updateReviewDto },
  //         );

  //         await this.productModel.findByIdAndUpdate(data.product._id, {
  //           $inc: {
  //             ratingCount: -1,
  //             ratingTotal: -updateReviewDto?.rating,
  //             reviewTotal: -1,
  //           },
  //         });

  //         switch (updateReviewDto.rating) {
  //           case 1: {
  //             await this.productModel.findByIdAndUpdate(
  //               data.product,
  //               {
  //                 $inc: {
  //                   'ratingDetails.oneStar': -1,
  //                 },
  //               },
  //               {
  //                 upsert: true,
  //                 new: true,
  //               },
  //             );
  //             break;
  //           }
  //           case 2: {
  //             await this.productModel.findByIdAndUpdate(
  //               data.product,
  //               {
  //                 $inc: {
  //                   'ratingDetails.twoStar': -1,
  //                 },
  //               },
  //               {
  //                 upsert: true,
  //                 new: true,
  //               },
  //             );
  //             break;
  //           }
  //           case 3: {
  //             await this.productModel.findByIdAndUpdate(
  //               data.product,
  //               {
  //                 $inc: {
  //                   'ratingDetails.threeStar': -1,
  //                 },
  //               },
  //               {
  //                 upsert: true,
  //                 new: true,
  //               },
  //             );
  //             break;
  //           }
  //           case 4: {
  //             await this.productModel.findByIdAndUpdate(
  //               data.product,
  //               {
  //                 $inc: {
  //                   'ratingDetails.fourStar': -1,
  //                 },
  //               },
  //               {
  //                 upsert: true,
  //                 new: true,
  //               },
  //             );
  //             break;
  //           }
  //           case 5: {
  //             await this.productModel.findByIdAndUpdate(
  //               data.product,
  //               {
  //                 $inc: {
  //                   'ratingDetails.fiveStar': -1,
  //                 },
  //               },
  //               {
  //                 upsert: true,
  //                 new: true,
  //               },
  //             );
  //             break;
  //           }
  //           default: {
  //             //statements;
  //             break;
  //           }
  //         }
  //       } else {
  //         await this.reviewModel.updateOne(
  //           { _id: updateReviewDto },
  //           { $set: updateReviewDto },
  //         );

  //         await this.productModel.findByIdAndUpdate(
  //           updateReviewDto?.product?._id,
  //           {
  //             $inc: {
  //               ratingCount: 1,
  //               ratingTotal: updateReviewDto?.rating,
  //               reviewTotal: 1,
  //             },
  //           },
  //         );

  //         switch (updateReviewDto.rating) {
  //           case 1: {
  //             await this.productModel.findByIdAndUpdate(
  //               data.product,
  //               {
  //                 $inc: {
  //                   'ratingDetails.oneStar': 1,
  //                 },
  //               },
  //               {
  //                 upsert: true,
  //                 new: true,
  //               },
  //             );
  //             break;
  //           }
  //           case 2: {
  //             await this.productModel.findByIdAndUpdate(
  //               data.product,
  //               {
  //                 $inc: {
  //                   'ratingDetails.twoStar': 1,
  //                 },
  //               },
  //               {
  //                 upsert: true,
  //                 new: true,
  //               },
  //             );
  //             break;
  //           }
  //           case 3: {
  //             await this.productModel.findByIdAndUpdate(
  //               data.product,
  //               {
  //                 $inc: {
  //                   'ratingDetails.threeStar': 1,
  //                 },
  //               },
  //               {
  //                 upsert: true,
  //                 new: true,
  //               },
  //             );
  //             break;
  //           }
  //           case 4: {
  //             await this.productModel.findByIdAndUpdate(
  //               data.product,
  //               {
  //                 $inc: {
  //                   'ratingDetails.fourStar': 1,
  //                 },
  //               },
  //               {
  //                 upsert: true,
  //                 new: true,
  //               },
  //             );
  //             break;
  //           }
  //           case 5: {
  //             await this.productModel.findByIdAndUpdate(
  //               data.product,
  //               {
  //                 $inc: {
  //                   'ratingDetails.fiveStar': 1,
  //                 },
  //               },
  //               {
  //                 upsert: true,
  //                 new: true,
  //               },
  //             );
  //             break;
  //           }
  //           default: {
  //             //statements;
  //             break;
  //           }
  //         }
  //       }
  //     }

  //     return {
  //       success: true,
  //       message: 'Success',
  //     } as ResponsePayload;
  //   } catch (err) {
  //     console.log(err);
  //     throw new InternalServerErrorException();
  //   }
  // }

  async updateReviewByIdAndDelete(
    updateReviewDto: UpdateReviewDto,
  ): Promise<ResponsePayload> {
    try {
      await this.reviewModel.updateOne(
        { _id: updateReviewDto },
        { $set: updateReviewDto },
      );

      await this.productModel.findByIdAndUpdate(updateReviewDto?.product?._id, {
        $inc: {
          ratingCount: -1,
          ratingTotal: -updateReviewDto?.rating,
          reviewTotal: -1,
        },
      });

      switch (updateReviewDto.rating) {
        case 1: {
          await this.productModel.findByIdAndUpdate(
            updateReviewDto.product,
            {
              $inc: {
                'ratingDetails.oneStar': -1,
              },
            },
            {
              upsert: true,
              new: true,
            },
          );
          break;
        }
        case 2: {
          await this.productModel.findByIdAndUpdate(
            updateReviewDto.product,
            {
              $inc: {
                'ratingDetails.twoStar': -1,
              },
            },
            {
              upsert: true,
              new: true,
            },
          );
          break;
        }
        case 3: {
          await this.productModel.findByIdAndUpdate(
            updateReviewDto.product,
            {
              $inc: {
                'ratingDetails.threeStar': -1,
              },
            },
            {
              upsert: true,
              new: true,
            },
          );
          break;
        }
        case 4: {
          await this.productModel.findByIdAndUpdate(
            updateReviewDto.product,
            {
              $inc: {
                'ratingDetails.fourStar': -1,
              },
            },
            {
              upsert: true,
              new: true,
            },
          );
          break;
        }
        case 5: {
          await this.productModel.findByIdAndUpdate(
            updateReviewDto.product,
            {
              $inc: {
                'ratingDetails.fiveStar': -1,
              },
            },
            {
              upsert: true,
              new: true,
            },
          );
          break;
        }
        default: {
          //statements;
          break;
        }
      }
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleReviewById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateReviewDto: UpdateReviewDto,
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

        await this.reviewModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateReviewDto },
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
  /**
   * deleteReviewById
   * deleteMultipleReviewById
   */
  async deleteReviewById(id: string): Promise<ResponsePayload> {
    try {
      this.deleteReviewAdjustById(id);
      await this.reviewModel.deleteOne({ _id: id });
      return {
        success: true,
        message: 'Success',
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

      await this.reviewModel.deleteMany({ shop: shop, status: 'trash' });
      return {
        success: true,
        message: 'Success! order permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteVendorReviewById(id: string): Promise<ResponsePayload> {
    try {
      this.deleteReviewAdjustById(id);
      await this.reviewModel.deleteOne({ _id: id });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteReviewByUser(id: string, user: User): Promise<ResponsePayload> {
    try {
      this.deleteReviewAdjustById(id);
      await this.reviewModel.deleteOne({ _id: id, 'user._id': user._id });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteReviewAdjustById(id: string) {
    const rData = JSON.parse(
      JSON.stringify(await this.reviewModel.findById(id)),
    );
    const pData = JSON.parse(
      JSON.stringify(await this.productModel.findById(rData?.product?._id)),
    );
    const vData = JSON.parse(
      JSON.stringify(await this.vendorModel.findById(pData?.vendor?._id)),
    );

    await this.productModel.findByIdAndUpdate(pData?._id, {
      $inc: {
        ratingCount: -1,
        ratingTotal: -rData?.rating,
        reviewTotal: -1,
      },
    });

    switch (rData?.rating) {
      case 1: {
        await this.productModel.findByIdAndUpdate(
          pData?._id,
          {
            $inc: {
              'ratingDetails.oneStar': -1,
            },
          },
          {
            upsert: true,
            new: true,
          },
        );
        break;
      }
      case 2: {
        await this.productModel.findByIdAndUpdate(
          pData?._id,
          {
            $inc: {
              'ratingDetails.twoStar': -1,
            },
          },
          {
            upsert: true,
            new: true,
          },
        );
        break;
      }
      case 3: {
        await this.productModel.findByIdAndUpdate(
          pData?._id,
          {
            $inc: {
              'ratingDetails.threeStar': -1,
            },
          },
          {
            upsert: true,
            new: true,
          },
        );
        break;
      }
      case 4: {
        await this.productModel.findByIdAndUpdate(
          pData?._id,
          {
            $inc: {
              'ratingDetails.fourStar': -1,
            },
          },
          {
            upsert: true,
            new: true,
          },
        );
        break;
      }
      case 5: {
        await this.productModel.findByIdAndUpdate(
          pData?._id,
          {
            $inc: {
              'ratingDetails.fiveStar': -1,
            },
          },
          {
            upsert: true,
            new: true,
          },
        );
        break;
      }
      default: {
        //statements;
        break;
      }
    }
  }

  async deleteMultipleReviewById(ids: string[]): Promise<ResponsePayload> {
    try {
      for (const id of ids) {
        this.deleteReviewAdjustById(id);
      }
      await this.reviewModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
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
}
