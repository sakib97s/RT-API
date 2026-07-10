import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { ErrorCodes } from 'src/enum/error-code.enum';
import { OptionPayloadDto } from 'src/dto/api-response.dto';
import { Contact } from './interfaces/contact.interface';
import {
  AddContactDto,
  FilterAndPaginationContactDto,
  UpdateContactDto,
} from './dto/contact.dto';

const ObjectId = Types.ObjectId;

@Injectable()
export class ContactService {
  private logger = new Logger(ContactService.name);

  constructor(
    @InjectModel('Contact') private readonly contactModel: Model<Contact>,
    private readonly utilsService: UtilsService,
  ) {}

  /**
   * addContact()
   * insertManyContact()
   * getAllContacts()
   * getAllContactsBasic()
   * getContactById()
   * updateContactById()
   * updateMultipleContactById()
   * deleteContactById()
   * deleteMultipleContactById()
   */
  async addContact(addContactDto: AddContactDto): Promise<ResponsePayload> {
    try {
      const newData = new this.contactModel(addContactDto);

      const saveData = await newData.save();
      const data = {
        _id: saveData._id,
      };
      return {
        success: true,
        message: 'Success! Thanks for submitting your contact data.',
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

  async insertManyContact(
    addContactDto: AddContactDto[],
    optionContactDto: OptionPayloadDto,
  ): Promise<ResponsePayload> {
    try {
      const { deleteMany } = optionContactDto;
      if (deleteMany) {
        await this.contactModel.deleteMany({});
      }
      const saveData = await this.contactModel.insertMany(addContactDto);
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

  async getAllContacts(
    filterContactDto: FilterAndPaginationContactDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterContactDto;
    const { pagination } = filterContactDto;
    const { sort } = filterContactDto;
    const { select } = filterContactDto;

    // Essential Variables
    const aggregateSaddresses = [];
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
      aggregateSaddresses.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSaddresses.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSaddresses.push({ $project: mSelect });
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

      aggregateSaddresses.push(mPagination);

      aggregateSaddresses.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.contactModel.aggregate(
        aggregateSaddresses,
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
        throw new BadRequestException('Error! Addression mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getAllContactsBasic() {
    try {
      const pageSize = 10;
      const currentPage = 1;

      const data = await this.contactModel
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

  async getContactById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.contactModel.findById(id).select(select);
      return {
        success: true,
        message: 'Single profile get Successfully',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateContactById(
    id: string,
    updateContactDto: UpdateContactDto,
  ): Promise<ResponsePayload> {
    try {
      const fData = await this.contactModel.findById(id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const jData: Contact = JSON.parse(JSON.stringify(fData));

      await this.contactModel.findByIdAndUpdate(id, {
        $set: updateContactDto,
      });
      return {
        success: true,
        message: 'Update Successfully',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleContactById(
    ids: string[],
    updateContactDto: UpdateContactDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.contactModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateContactDto },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteContactById(
    id: string,
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      await this.contactModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Delete Successfully',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleContactById(
    ids: string[],
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.contactModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
