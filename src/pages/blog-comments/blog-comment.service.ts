import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddBlogCommentDto,
  FilterAndPaginationBlogCommentDto,
  GetBlogCommentByIdsDto,
  UpdateBlogCommentDto,
} from './dto/blog-comment.dto';
import { BlogComment } from './interfaces/blog-comment.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from 'src/pages/shop/interfaces/shop.interface';
import * as schedule from 'node-schedule';
import { Blog } from '../blog/interfaces/blog.interface';
import { User } from '../user/interfaces/user.interface';
const ObjectId = Types.ObjectId;

@Injectable()
export class BlogCommentService {
  private logger = new Logger(BlogCommentService.name);

  constructor(
    @InjectModel('BlogComment')
    private readonly blogCommentModel: Model<BlogComment>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Blog') private readonly blogModel: Model<Blog>,
    private utilsService: UtilsService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addBlogComment()
   * getAllBlogCommentByShop()
   * getBlogCommentById()
   * getAllBlogComments()
   * getBlogCommentBySlug()
   * getBlogCommentByIds()
   * updateBlogCommentById()
   * updateMultipleBlogCommentById()
   * updateMultipleVendorBlogCommentById()
   * deleteMultipleTrashBlogComment()
   * deleteMultipleBlogCommentByIdByVendor()
   * deleteMultipleBlogCommentById()
   */
  async addBlogComment(
    vendor: Vendor,
    shop: string,
    addBlogCommentDto: AddBlogCommentDto,
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

      const finalData = {
        ...addBlogCommentDto,
        ...{
          shop: shop,
        },
      };

      const saveData = await this.blogCommentModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! BlogComment added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async addBlogCommentByUser(
    user: User,
    shop: string,
    addBlogCommentDto: AddBlogCommentDto,
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

      const blogData = await this.blogModel
        .findOne({ slug: addBlogCommentDto.blog, shop: shop })
        .select('slug title images');

      const userData = await this.userModel
        .findById({ _id: user._id, shop: shop })
        .select('name profileImg');
      // const finalData = {
      //   ...addBlogCommentDto,
      //   ...{
      //     shop: shop,
      //   },
      // };

      const finalData = {
        ...addBlogCommentDto,
        ...{
          shop: shop,
          status: 'draft',
        },
        ...{
          blog: {
            _id: blogData._id,
            title: blogData.title,
            images: blogData.images,
            slug: blogData.slug,
          },
          user: {
            _id: userData._id,
            name: userData.name,
            profileImg: userData.profileImg,
          },
        },
      };

      const saveData = await this.blogCommentModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! BlogComment added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getBlogCommentForUi(shop: string): Promise<ResponsePayload> {
    try {
      const data = await this.blogCommentModel
        .findOne({ shop: shop, status: 'publish' })
        .select('url urlType images')
        .sort({ createdAt: -1 });

      return {
        success: true,
        message: 'Success! Data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAllBlogCommentByShop(
    shop: string,
    filterBlogCommentDto: FilterAndPaginationBlogCommentDto,
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
      const { filter } = filterBlogCommentDto;
      filterBlogCommentDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllBlogComments(filterBlogCommentDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getBlogCommentById(
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

      const data = await this.blogCommentModel
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

  async getAllBlogComments(
    filterBlogCommentDto: FilterAndPaginationBlogCommentDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterBlogCommentDto;
    const { pagination } = filterBlogCommentDto;
    const { sort } = filterBlogCommentDto;
    const { select } = filterBlogCommentDto;
    const { filterGroup } = filterBlogCommentDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateBlogCommentGroupStages = [];
    const aggregateBrandGroupStages = [];
    const aggregateSubBlogCommentGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['blogComment._id']) {
        filter['blogComment._id'] = new ObjectId(filter['blogComment._id']);
      }

      if (filter['subBlogComment._id']) {
        filter['subBlogComment._id'] = new ObjectId(
          filter['subBlogComment._id'],
        );
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
              { url: this.utilsService.createRegexFromString(searchQuery) },
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
    let groupBlogComment: any;
    let groupBrand: any;
    let groupSubBlogComment: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.blogComment) {
        groupBlogComment = {
          $group: {
            _id: { blogComment: '$blogComment._id' },
            name: { $first: '$blogComment.name' },
            slug: { $first: '$blogComment.slug' },
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

      if (filterGroup.subBlogComment) {
        groupSubBlogComment = {
          $group: {
            _id: { subBlogComment: '$subBlogComment._id' },
            name: { $first: '$subBlogComment.name' },
            slug: { $first: '$subBlogComment.slug' },
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

      // BlogComment Groups
      if (groupBlogComment) {
        // aggregateBlogCommentGroupStages.push({ $match: mFilter });
        aggregateBlogCommentGroupStages.push(groupBlogComment);
      }

      // Sub BlogComment Groups
      if (groupSubBlogComment) {
        // aggregateSubBlogCommentGroupStages.push({ $match: mFilter });
        aggregateSubBlogCommentGroupStages.push(groupSubBlogComment);
      }

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }
    } else {
      if (groupBlogComment) {
        aggregateBlogCommentGroupStages.push(groupBlogComment);
      }
      if (groupSubBlogComment) {
        aggregateSubBlogCommentGroupStages.push(groupSubBlogComment);
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
      const dataAggregates = await this.blogCommentModel.aggregate(
        aggregateStages,
        {
          allowDiskUse: true,
        },
      );

      // GROUP FILTER PRODUCTS DATA
      let blogCommentAggregates: any;
      let subBlogCommentAggregates: any;
      let brandAggregates: any;
      // BlogComment
      if (filterGroup && filterGroup.isGroup && filterGroup.blogComment) {
        blogCommentAggregates = await this.blogCommentModel.aggregate(
          aggregateBlogCommentGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub BlogComment
      if (filterGroup && filterGroup.isGroup && filterGroup.subBlogComment) {
        subBlogCommentAggregates = await this.blogCommentModel.aggregate(
          aggregateSubBlogCommentGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.blogCommentModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            blogCommentAggregates && blogCommentAggregates.length
              ? blogCommentAggregates
              : [],
          subCategories:
            subBlogCommentAggregates && subBlogCommentAggregates.length
              ? subBlogCommentAggregates
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

  async getBlogCommentBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.blogCommentModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.blogCommentModel.findByIdAndUpdate(data._id, {
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

  async getBlogCommentByIds(
    shop: string,
    getBlogCommentByIdsDto: GetBlogCommentByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getBlogCommentByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.blogCommentModel
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
   * updateBlogCommentById
   * updateMultipleBlogCommentById
   */
  async updateBlogCommentById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateBlogCommentDto: UpdateBlogCommentDto,
  ): Promise<ResponsePayload> {
    try {
      // const { name } = updateBlogCommentDto;

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
      const fData = await this.blogCommentModel.findOne({
        _id: id,
        shop: shop,
      });

      // Check Slug
      // if (fData?.name.trim() !== name.trim()) {
      //   const newSlug = this.utilsService.transformToSlug(name);

      //   const isExists = await this.blogCommentModel.exists({ slug: newSlug });
      //   if (isExists) {
      //     finalSlug = this.utilsService.transformToSlug(name, true);
      //   } else {
      //     finalSlug = newSlug;
      //   }
      // } else {
      //   finalSlug = fData.slug;
      // }

      const finalData = {
        ...updateBlogCommentDto,
      };

      await this.blogCommentModel.findByIdAndUpdate(id, {
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

  async updateMultipleBlogCommentById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateBlogCommentDto: UpdateBlogCommentDto,
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
        // if (updateBlogCommentDto.slug) {
        //   delete updateBlogCommentDto.slug;
        // }
        await this.blogCommentModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateBlogCommentDto },
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

  async deleteMultipleTrashBlogComment(
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

      await this.blogCommentModel.deleteMany({ _id: ids, status: 'trash' });
      return {
        success: true,
        message: 'Success! BlogComment permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleBlogCommentByIdByVendor(
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

      // await this.blogCommentModel.updateMany(
      //   { _id: ids },
      //   {
      //     $set: {
      //       status: 'trash',
      //       deleteDateString: this.utilsService.getDateString(new Date()),
      //     },
      //   },
      // );

      await this.blogCommentModel.deleteMany({ _id: ids });

      return {
        success: true,
        message: 'Success! BlogComment deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleBlogCommentById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.blogCommentModel.deleteMany({ _id: ids });
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

      await this.blogCommentModel.deleteMany({ shop: shop, status: 'trash' });
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
      await this.blogCommentModel.deleteMany({
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
