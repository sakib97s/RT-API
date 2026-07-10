import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddTutorialDto,
  FilterAndPaginationTutorialDto,
  OptionTutorialDto,
  UpdateTutorialDto,
} from './dto/tutorial.dto';
import { Tutorial } from './interfaces/tutorial.interface';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { UtilsService } from '../../shared/utils/utils.service';

const ObjectId = Types.ObjectId;

@Injectable()
export class TutorialService {
  private logger = new Logger(TutorialService.name);

  constructor(
    @InjectModel('Tutorial') private readonly tutorialModel: Model<Tutorial>,
    private utilsService: UtilsService,
  ) {}

  /**
   * addTutorial()
   * insertManyTutorial()
   * getAllTutorials()
   * getTutorialById()
   * updateTutorialById()
   * updateMultipleTutorialById()
   * deleteTutorialById()
   * deleteMultipleTutorialById()
   */
  async addTutorial(addTutorialDto: AddTutorialDto): Promise<ResponsePayload> {
    try {
      const saveData = await this.tutorialModel.create(addTutorialDto);
      const data = {
        _id: saveData._id,
      };
      return {
        success: true,
        message: 'Data Added Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async insertManyTutorial(
    addTutorialsDto: AddTutorialDto[],
  ): Promise<ResponsePayload> {
    try {
      const bulkOps = addTutorialsDto.map((data) => ({
        updateOne: {
          filter: { name: data.name },
          update: { $set: data },
          upsert: true,
        },
      }));

      const d = await this.tutorialModel.bulkWrite(bulkOps);
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

  async getAllTutorialByShop(
    shop: string,
    filterTutorialDto: FilterAndPaginationTutorialDto,
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
      const { filter } = filterTutorialDto;
      filterTutorialDto.filter = { ...filter };

      return this.getAllTutorials(filterTutorialDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllTutorialByClintShop(
    shop: string,
    filterTutorialDto: FilterAndPaginationTutorialDto,
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
      const { filter } = filterTutorialDto;
      filterTutorialDto.filter = { ...filter };

      return this.getAllTutorials(filterTutorialDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllTutorials(
    filterTutorialDto: FilterAndPaginationTutorialDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterTutorialDto;
    const { pagination } = filterTutorialDto;
    const { sort } = filterTutorialDto;
    const { select } = filterTutorialDto;

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
      // const mSearchQuery = searchQuery.replace(/[^a-zA-Z0-9 ]/g, '');

      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { name: this.utilsService.createRegexFromString(searchQuery) },
              { keyword: this.utilsService.createRegexFromString(searchQuery) },
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
        await this.tutorialModel.aggregate(aggregateStages);
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

  async getTutorialById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.tutorialModel.findById(id).select(select);
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateTutorialById(
    id: string,
    updateTutorialDto: UpdateTutorialDto,
  ): Promise<ResponsePayload> {
    try {
      await this.tutorialModel.findByIdAndUpdate(id, {
        $set: updateTutorialDto,
      });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleTutorialById(
    ids: string[],
    updateTutorialDto: UpdateTutorialDto,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.tutorialModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateTutorialDto },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteTutorialById(id: string): Promise<ResponsePayload> {
    try {
      await this.tutorialModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleTutorialById(ids: string[]): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.tutorialModel.deleteMany({ _id: mIds });
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
