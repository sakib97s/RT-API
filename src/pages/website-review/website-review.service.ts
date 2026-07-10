import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { WebsiteReview } from './interfaces/website-review.interface';
import { UtilsService } from '../../shared/utils/utils.service';
import {
  AddWebsiteReviewDto,
  FilterAndPaginationWebsiteReviewDto,
  UpdateWebsiteReviewDto,
} from './dto/website-review.dto';

const ObjectId = Types.ObjectId;

@Injectable()
export class WebsiteReviewService {
  private logger = new Logger(WebsiteReviewService.name);

  constructor(
    @InjectModel('WebsiteReview')
    private readonly websiteReviewModel: Model<WebsiteReview>,
    private utilsService: UtilsService,
  ) {}

  /**
   * 1. addWebsiteReview()
   * 2. insertManyWebsiteReview()
   * 3. getAllWebsiteReviews()
   * 4. getWebsiteReviewById()
   * 5. updateWebsiteReviewById()
   * 6. updateMultipleWebsiteReviewById()
   * 7. deleteWebsiteReviewById()
   * 8. deleteMultipleWebsiteReviewById()
   */

  async addWebsiteReview(
    addWebsiteReviewDto: AddWebsiteReviewDto,
  ): Promise<ResponsePayload> {
    try {
      const { name } = addWebsiteReviewDto;
      const fSlug = this.utilsService.transformToSlug(name);
      const fData = await this.websiteReviewModel.exists({ slug: fSlug });

      // const finalSlug = fData
      //   ? this.utilsService.transformToSlug(name, true)
      //   : fSlug;
      //
      // const defaultData = {
      //   slug: finalSlug,
      // };

      const finalData = {
        ...addWebsiteReviewDto,
      };

      const saveData = await this.websiteReviewModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Success! Category added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async insertManyWebsiteReview(
    addWebsiteReviewsDto: AddWebsiteReviewDto[],
  ): Promise<ResponsePayload> {
    try {
      const bulkOps = addWebsiteReviewsDto.map((data) => ({
        updateOne: {
          filter: null,
          update: { $set: data },
          upsert: true,
        },
      }));

      const d = await this.websiteReviewModel.bulkWrite(bulkOps);
      // Convert the values to a string array
      const dataArr = Object.values(d.upsertedIds);

      return {
        success: true,
        message: `${
          dataArr && dataArr.length ? dataArr.length : 0
        }  Data Added Success`,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllWebsiteReviewForUi(): Promise<ResponsePayload> {
    try {
      const data = await this.websiteReviewModel
        .find({ status: 'publish' })
        .limit(12)
        .select('name images review websiteLink facebookLink')
        .sort({ priority: -1 });

      return {
        success: true,
        message: 'Success! Data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAllWebsiteReviews(
    filterWebsiteReviewDto: FilterAndPaginationWebsiteReviewDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterWebsiteReviewDto;
    const { pagination } = filterWebsiteReviewDto;
    const { sort } = filterWebsiteReviewDto;
    const { select } = filterWebsiteReviewDto;

    // Essential Variables
    const aggregateStages = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      mFilter = { ...mFilter, ...filter, readOnly: null };
    } else {
      mFilter = { readOnly: null };
    }
    if (searchQuery) {
      mFilter = {
        ...mFilter,
        ...{ websiteReview: new RegExp(searchQuery, 'i') },
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
      const dataAggregates =
        await this.websiteReviewModel.aggregate(aggregateStages);
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
      throw new InternalServerErrorException();
    }
  }

  async getWebsiteReviewById(
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.websiteReviewModel.findById(id).select(select);
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateWebsiteReviewById(
    id: string,
    updateWebsiteReviewDto: UpdateWebsiteReviewDto,
  ): Promise<ResponsePayload> {
    try {
      const { name } = updateWebsiteReviewDto;

      let finalSlug: string;
      const fData = await this.websiteReviewModel.findById(id);

      // Check Slug
      if (fData?.name.trim() !== name.trim()) {
        const newSlug = this.utilsService.transformToSlug(name);

        const isExists = await this.websiteReviewModel.exists({
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
        ...updateWebsiteReviewDto,
        ...{
          slug: finalSlug,
        },
      };

      await this.websiteReviewModel.findByIdAndUpdate(id, {
        $set: finalData,
      });

      return {
        success: true,
        message: 'Success! data updated successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleWebsiteReviewById(
    ids: string[],
    updateWebsiteReviewDto: UpdateWebsiteReviewDto,
  ): Promise<ResponsePayload> {
    try {
      if (ids && ids.length) {
        const mIds = ids.map((m) => new ObjectId(m));

        // Delete No Multiple Action Data
        if (updateWebsiteReviewDto.slug) {
          delete updateWebsiteReviewDto.slug;
        }
        await this.websiteReviewModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateWebsiteReviewDto },
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

  async deleteWebsiteReviewById(id: string): Promise<ResponsePayload> {
    try {
      await this.websiteReviewModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleWebsiteReviewById(
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.websiteReviewModel.deleteMany({ _id: mIds });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(err.message);
    }
  }
}
