import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Notification } from './interfaces/notification.interface';
import {
  AddNotificationDto,
  FilterAndPaginationNotificationDto,
  UpdateNotificationDto,
} from './dto/notification.dto';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { ErrorCodes } from '../../enum/error-code.enum';
import { OptionPayloadDto } from '../../dto/api-response.dto';
import { User } from '../user/interfaces/user.interface';
import { Vendor } from '../vendor/interfaces/vendor.interface';
import { Shop } from '../shop/interfaces/shop.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class NotificationService {
  private logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel('Notification')
    private readonly notificationModel: Model<Notification>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
  ) {}

  /**
   * addNotification()
   * insertManyNotification()
   * getAllNotifications()
   * getAllNotificationsBasic()
   * getNotificationById()
   * updateNotificationById()
   * updateMultipleNotificationById()
   * deleteNotificationById()
   * deleteMultipleNotificationById()
   */
  async addNotification(
    addNotificationDto: AddNotificationDto,
  ): Promise<ResponsePayload> {
    try {
      const newData = new this.notificationModel(addNotificationDto);

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

  async createNotification(data: any) {
    try {
      const saveData = new this.notificationModel(data);
      await saveData.save();
      return {
        success: true,
        message: 'Success',
        data: null,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
    }
  }
  async insertManyNotification(
    addNotificationsDto: AddNotificationDto[],
    optionNotificationDto: OptionPayloadDto,
  ): Promise<ResponsePayload> {
    try {
      const { deleteMany } = optionNotificationDto;
      if (deleteMany) {
        await this.notificationModel.deleteMany({});
      }
      const saveData = await this.notificationModel.insertMany(
        addNotificationsDto,
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

  async getAllNotificationByShop(
    vendor: Vendor,
    shop: string,
    filterAndPaginationNotificationDto: FilterAndPaginationNotificationDto,
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
      const { filter } = filterAndPaginationNotificationDto;
      filterAndPaginationNotificationDto.filter = {
        ...filter,
        ...{ shop: shop },
      };

      return this.getAllNotifications(
        filterAndPaginationNotificationDto,
        searchQuery,
      );
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllNotifications(
    filterNotificationDto: FilterAndPaginationNotificationDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterNotificationDto;
    const { pagination } = filterNotificationDto;
    const { sort } = filterNotificationDto;
    const { select } = filterNotificationDto;

    // Essential Variables
    const aggregatesNotifications = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['user']) {
        filter['user'] = new ObjectId(filter['user']);
      }
      if (filter['shop']) {
        filter['shop'] = new ObjectId(filter['shop']);
      }
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      mFilter = { ...mFilter, ...{ name: new RegExp(searchQuery, 'i') } };
    }

    // Add isRead filter to count unread notifications
    const unreadFilter = { ...mFilter, isRead: false };

    // Count unread notifications
    const unreadCount = await this.notificationModel.countDocuments(
      unreadFilter,
    );

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
      aggregatesNotifications.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregatesNotifications.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregatesNotifications.push({ $project: mSelect });
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

      aggregatesNotifications.push(mPagination);

      aggregatesNotifications.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.notificationModel.aggregate(
        aggregatesNotifications,
      );
      if (pagination) {
        return {
          ...{ ...dataAggregates[0] },
          unreadCount, // Return unread count
          success: true,
          message: 'Success',
        } as ResponsePayload;
      } else {
        return {
          data: dataAggregates,
          success: true,
          message: 'Success',
          count: dataAggregates.length,
          unreadCount,
        } as ResponsePayload;
      }
    } catch (err) {
      this.logger.error(err);
      if (err.code && err.code.toString() === ErrorCodes.PROJECTION_MISMATCH) {
        throw new BadRequestException('Error! Notification mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getAllNotificationsByUser(
    user: User,
    filterNotificationDto: FilterAndPaginationNotificationDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      let { filter } = filterNotificationDto;

      filter = {
        ...filter,
        ...{
          user: user._id,
        },
      };

      filterNotificationDto.filter = filter;
      return this.getAllNotifications(filterNotificationDto, searchQuery);
    } catch (error) {
      console.log(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Slug Must be Unique');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async getAllNotificationsBasic() {
    try {
      const pageSize = 10;
      const currentPage = 1;

      const data = await this.notificationModel
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

  async getNotificationById(
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.notificationModel.findById(id).select(select);
      return {
        success: true,
        message: 'Single profile get Successfully',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateNotificationById(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<ResponsePayload> {
    try {
      const finalData = { ...updateNotificationDto };

      await this.notificationModel.findByIdAndUpdate(id, {
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

  async updateMultipleNotificationById(
    ids: string[],
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.notificationModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateNotificationDto },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteNotificationById(
    id: string,
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      await this.notificationModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Delete Successfully',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleNotificationById(
    ids: string[],
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.notificationModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
