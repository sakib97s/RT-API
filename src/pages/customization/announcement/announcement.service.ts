import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ErrorCodes } from '../../../enum/error-code.enum';
import { OptionPayloadDto } from '../../../dto/api-response.dto';
import { ResponsePayload } from '../../../interfaces/response-payload.interface';
import { Announcement } from './interfaces/announcement.interface';
import {
  AddAnnouncementDto,
  FilterAndPaginationAnnouncementDto,
  UpdateAnnouncementDto,
} from './dto/announcement.dto';

const ObjectId = Types.ObjectId;

@Injectable()
export class AnnouncementService {
  private logger = new Logger(AnnouncementService.name);

  constructor(
    @InjectModel('Announcement')
    private readonly announcementModel: Model<Announcement>,
  ) {}

  /**
   * addAnnouncement()
   * insertManyAnnouncement()
   * getAllAnnouncements()
   * getAllAnnouncementsBasic()
   * getAnnouncementById()
   * updateAnnouncementById()
   * updateMultipleAnnouncementById()
   * deleteAnnouncementById()
   * deleteMultipleAnnouncementById()
   */
  async addAnnouncement(
    addAnnouncementDto: AddAnnouncementDto,
  ): Promise<ResponsePayload> {
    try {
      const newData = new this.announcementModel(addAnnouncementDto);

      const saveData = await newData.save();
      const data = {
        _id: saveData._id,
      };
      return {
        success: true,
        message: 'Data Added Successfully',
        data,
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

  async insertManyAnnouncement(
    addAnnouncementsDto: AddAnnouncementDto[],
    optionAnnouncementDto: OptionPayloadDto,
  ): Promise<ResponsePayload> {
    try {
      const { deleteMany } = optionAnnouncementDto;
      if (deleteMany) {
        await this.announcementModel.deleteMany({});
      }
      const saveData = await this.announcementModel.insertMany(
        addAnnouncementsDto,
      );
      return {
        success: true,
        message: `${
          saveData && saveData.length ? saveData.length : 0
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

  async getAllAnnouncements(
    filterAnnouncementDto: FilterAndPaginationAnnouncementDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterAnnouncementDto;
    const { pagination } = filterAnnouncementDto;
    const { sort } = filterAnnouncementDto;
    const { select } = filterAnnouncementDto;

    // Essential Variables
    const aggregateSannouncementes = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      mFilter = { ...mFilter, ...{ name: new RegExp(searchQuery, 'i') } };
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
      aggregateSannouncementes.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSannouncementes.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSannouncementes.push({ $project: mSelect });
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

      aggregateSannouncementes.push(mPagination);

      aggregateSannouncementes.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.announcementModel.aggregate(
        aggregateSannouncementes,
      );
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
        throw new BadRequestException('Error! Announcemention mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getAllAnnouncementsBasic() {
    try {
      const pageSize = 10;
      const currentPage = 1;

      const data = await this.announcementModel
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

  async getAnnouncementById(
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.announcementModel.findById(id).select(select);
      return {
        success: true,
        message: 'Single profile get Successfully',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateAnnouncementById(
    id: string,
    updateAnnouncementDto: UpdateAnnouncementDto,
  ): Promise<ResponsePayload> {
    try {
      const finalData = { ...updateAnnouncementDto };

      await this.announcementModel.findByIdAndUpdate(id, {
        $set: finalData,
      });
      return {
        success: true,
        message: 'Update Successfully',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleAnnouncementById(
    ids: string[],
    updateAnnouncementDto: UpdateAnnouncementDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.announcementModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateAnnouncementDto },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteAnnouncementById(
    id: string,
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      await this.announcementModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Delete Successfully',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleAnnouncementById(
    ids: string[],
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.announcementModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
