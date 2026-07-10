import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { ErrorCodes } from 'src/enum/error-code.enum';
import { OptionPayloadDto } from 'src/dto/api-response.dto';
import { CustomShop } from './interfaces/custom-shop.interface';
import {
  AddCustomShopDto,
  FilterAndPaginationCustomShopDto,
  UpdateCustomShopDto,
} from './dto/custom-shop.dto';
import { UtilsService } from '../../shared/utils/utils.service';

const ObjectId = Types.ObjectId;

@Injectable()
export class CustomShopService {
  private logger = new Logger(CustomShopService.name);

  constructor(
    @InjectModel('CustomShop')
    private readonly customShopModel: Model<CustomShop>,
    private readonly utilsService: UtilsService,
  ) {}

  /**
   * checkCustomShopAvailability()
   * buildCustomShop()
   * insertManyCustomShop()
   * getAllCustomShop()
   * getAllCustomShopBasic()
   * getCustomShopById()
   * updateCustomShopById()
   * updateMultipleCustomShopById()
   * deleteCustomShopById()
   * deleteMultipleCustomShopById()
   * getCustomShopCategory()
   * getCustomShopSubCategory()
   */

  // async createCustomShop(
  //   admin: Admin,
  //   addCustomShopDto: AddCustomShopDto,
  // ): Promise<ResponsePayload> {
  //   try {
  //     const {
  //       theme,
  //       domain,
  //       subDomain,
  //       packageId,
  //       owner,
  //       websiteName,
  //       needWebsiteBuild,
  //     } = addCustomShopDto;
  //
  //     let filter: any;
  //     if (domain) {
  //       filter = { domain: domain };
  //     } else {
  //       filter = { subDomain: subDomain };
  //     }
  //
  //     // Check CustomShop Availability
  //     const fCustomShop = await this.customShopModel.exists(filter);
  //     if (fCustomShop) {
  //       return {
  //         success: false,
  //         message: `Sorry! website domain name not available for domain`,
  //       } as ResponsePayload;
  //     }
  //
  //     const fPort = await this.portModel.aggregate([
  //       {
  //         $match: { status: 'publish' },
  //       },
  //       {
  //         $sample: { size: 1 },
  //       },
  //     ]);
  //
  //     if (!fPort || (fPort && !fPort.length)) {
  //       return {
  //         success: false,
  //         message: `Sorry! no available port found.`,
  //       } as ResponsePayload;
  //     }
  //
  //     // Find Theme
  //     const fTheme = JSON.parse(
  //       JSON.stringify(await this.themeModel.findById(theme)),
  //     );
  //
  //     // Find Package
  //     const fPackage = await this.packageModel.findById(packageId);
  //
  //     if (!fPackage) {
  //       return {
  //         success: false,
  //         message: `Sorry! no package selected.`,
  //       } as ResponsePayload;
  //     }
  //
  //     const fVendor = await this.vendorModel.findById(owner);
  //     if (fVendor?.role !== 'owner') {
  //       return {
  //         success: false,
  //         message: `Sorry! this role can not open a customShop`,
  //       } as ResponsePayload;
  //     }
  //
  //     // Create customShop
  //     const customShopData: any = {
  //       ...addCustomShopDto,
  //       ...{
  //         dateString: this.utilsService.getDateString(new Date()),
  //         owner: owner,
  //         theme: fTheme,
  //         package: fPackage,
  //         port: fPort[0].port,
  //         users: [
  //           {
  //             _id: fVendor._id,
  //             username: fVendor.username,
  //             email: fVendor.email,
  //             phoneNo: fVendor.phoneNo,
  //             role: 'admin',
  //           },
  //         ],
  //         buildStatus: 'complete',
  //         status: 'publish',
  //         startDate: this.utilsService.getDateString(new Date()),
  //         paymentStatus: 'custom',
  //       },
  //     };
  //     const saveCustomShop = await this.customShopModel.create(customShopData);
  //
  //     // Update CustomShop Information
  //     await this.customShopInformationModel.create({
  //       customShop: saveCustomShop._id,
  //       websiteName: websiteName,
  //     });
  //
  //     // Update Port
  //     await this.portModel.findByIdAndUpdate(fPort[0]._id, {
  //       $set: {
  //         status: 'running',
  //       },
  //     });
  //
  //     // Update Settings
  //     const filteredThemeCustomOptions = fTheme.themeCustomOptions
  //       .map((option: any) => ({
  //         ...option,
  //         value: option.value.filter((item: any) => item.isDefault),
  //       }))
  //       .filter((option: any) => option.value.length > 0);
  //     await this.settingModel.create({
  //       customShop: saveCustomShop._id,
  //       websiteName: websiteName,
  //       themeCustomOptions: filteredThemeCustomOptions,
  //     });
  //     return {
  //       success: true,
  //       data: {
  //         customShop: saveCustomShop._id,
  //       },
  //       message: `Success! CustomShop created successfully`,
  //     } as ResponsePayload;
  //   } catch (error) {
  //     console.log(error);
  //     throw new InternalServerErrorException(error.message);
  //   }
  // }
  //

  async insertManyCustomShop(
    addCustomShopDto: AddCustomShopDto[],
    optionCustomShopDto: OptionPayloadDto,
  ): Promise<ResponsePayload> {
    try {
      const { deleteMany } = optionCustomShopDto;
      if (deleteMany) {
        await this.customShopModel.deleteMany({});
      }
      const saveData = await this.customShopModel.insertMany(addCustomShopDto);
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

  async getAllCustomShop(
    filterCustomShopDto: FilterAndPaginationCustomShopDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterCustomShopDto;
    const { pagination } = filterCustomShopDto;
    const { sort } = filterCustomShopDto;
    const { select } = filterCustomShopDto;

    if (filter && filter['users._id']) {
      filter['users._id'] = new ObjectId(filter['users._id']);
    }

    // Essential Variables
    const aggregateSbanneres = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      const regex = this.utilsService.createRegexFromString(searchQuery);

      const orConditions: any[] = [
        { name: regex },
        { subDomain: regex },
        { domain: regex },
        { websiteName: regex },
        { 'users.phoneNo': regex },
        { 'users.email': regex },
      ];

      // Attempt to add _id match if valid
      try {
        if (ObjectId.isValid(searchQuery)) {
          orConditions.unshift({ _id: new ObjectId(searchQuery) });
        }
      } catch (e) {
        // skip invalid _id
      }

      mFilter = {
        $and: [mFilter, { $or: orConditions }],
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
      aggregateSbanneres.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSbanneres.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSbanneres.push({ $project: mSelect });
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

      aggregateSbanneres.push(mPagination);

      aggregateSbanneres.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates =
        await this.customShopModel.aggregate(aggregateSbanneres);
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
        throw new BadRequestException('Error! Bannerion mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getAllCustomShopBasic() {
    try {
      const pageSize = 10;
      const currentPage = 1;

      const data = await this.customShopModel
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

  async getCustomShopById(
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.customShopModel.findById(id).select(select);
      return {
        success: true,
        message: 'Single profile get Successfully',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getCustomShopInfoById(
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.customShopModel
        .findById(id)
        .select('websiteName owner')
        .populate('owner', 'name phoneNo'); // select fields from User model

      return {
        success: true,
        message: 'Single profile get Successfully',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getCustomShopPageByPage(
    pageName: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.customShopModel
        .findOne({ pageName: pageName })
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

  async updateCustomShopById(
    id: string,
    updateCustomShopDto: UpdateCustomShopDto,
  ): Promise<ResponsePayload> {
    try {
      const finalData = { ...updateCustomShopDto };

      await this.customShopModel.findByIdAndUpdate(id, {
        $set: finalData,
      });
      return {
        success: true,
        message: 'Update Successfully',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err);
    }
  }

  async updateMultipleCustomShopById(
    ids: string[],
    updateCustomShopDto: UpdateCustomShopDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.customShopModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateCustomShopDto },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteCustomShopById(
    id: string,
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    try {
      await this.customShopModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Delete Successfully',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleCustomShopById(
    ids: string[],
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.customShopModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
