import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ErrorCodes } from '../../enum/error-code.enum';
import * as bcrypt from 'bcrypt';
import {
  Vendor,
  VendorAuthResponse,
  VendorJwtPayload,
} from './interfaces/vendor.interface';
import {
  AuthVendorDto,
  CheckVendorDto,
  CreateVendorDto,
  FilterAndPaginationVendorDto,
  ResetVendorPasswordDto,
  UpdateVendorDto,
  VendorSelectFieldDto,
} from './dto/vendor.dto';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { UtilsService } from '../../shared/utils/utils.service';
import { ChangePasswordDto } from '../../dto/change-password.dto';
import { OtpService } from '../otp/otp.service';
import { Shop } from '../shop/interfaces/shop.interface';

import { ObjectId } from 'mongodb';

@Injectable()
export class VendorService {
  private logger = new Logger(VendorService.name);

  constructor(
    @InjectModel('Vendor') private readonly vendorModel: Model<Vendor>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    protected jwtService: JwtService,
    private configService: ConfigService,
    private utilsService: UtilsService,
    private otpService: OtpService,
  ) {}

  /**
   * Vendor Methods
   * checkVendorWithPhoneNo()
   */

  async checkVendorWithPhoneNo(
    shop: string,
    checkVendorDto: CheckVendorDto,
    handleOtp?: boolean,
  ): Promise<ResponsePayload> {
    try {
      const { phoneNo, countryCode } = checkVendorDto;

      const fVendor = await this.vendorModel.findOne({
        username: `${countryCode}${phoneNo}`,
      });

      if (!fVendor) {
        if (handleOtp) {
          await this.otpService.generateOtpWithPhoneNo(shop, {
            phoneNo: phoneNo,
          });
          return {
            success: true,
            message: 'Vendor available with this username and sent otp',
            data: { type: 'signup' },
          } as ResponsePayload;
        } else {
          return {
            success: true,
            message: 'Vendor available with this username',
            data: { type: 'signup' },
          } as ResponsePayload;
        }
      } else {
        return {
          success: true,
          message: 'Vendor already exists in this username',
          data: { _id: fVendor._id, type: 'login' },
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async vendorSignup(
    createVendorDto: CreateVendorDto,
  ): Promise<ResponsePayload> {
    try {
      const {
        isPasswordLess,
        password,
        registrationType,
        phoneNo,
        username,
        email,
        shops,
        role,
      } = createVendorDto;

      if (registrationType === 'default') {
        if (username) {
          const existingUsername = await this.vendorModel.findOne({ username });
          if (existingUsername) {
            return {
              success: false,
              message: `Sorry! Username already exists`,
              data: null,
            } as ResponsePayload;
          }
        }

        if (email) {
          const existingEmail = await this.vendorModel.findOne({ email });
          if (existingEmail) {
            return {
              success: false,
              message: `Sorry! Email already exists`,
              data: null,
            } as ResponsePayload;
          }
        }

        if (phoneNo) {
          const existingPhoneNo = await this.vendorModel.findOne({ phoneNo });
          if (existingPhoneNo) {
            return {
              success: false,
              message: `Sorry! Phone number already exists`,
              data: null,
            } as ResponsePayload;
          }
        }

        let hashedPass: string;
        if (!isPasswordLess) {
          const salt = await bcrypt.genSalt();
          hashedPass = await bcrypt.hash(password, salt);
        } else {
          return {
            success: false,
            message: `Sorry! Password less login is not acceptable here.`,
            data: null,
          } as ResponsePayload;
        }

        const defaultData = {
          password: hashedPass,
          registrationAt: this.utilsService.getDateString(new Date()),
          lastLoggedIn: null,
          status: 'active',
          role: role,
        };

        const finalData = { ...createVendorDto, ...defaultData };

        const saveData = await this.vendorModel.create(finalData);
        const data = {
          username: saveData.username,
          email: saveData.email,
          phoneNo: saveData.phoneNo,
          name: saveData.name,
          _id: saveData._id,
          role: saveData.role,
        };

        if (shops && shops.length) {
          for (const shop of shops) {
            await this.shopModel.findByIdAndUpdate(shop._id, {
              $addToSet: {
                users: {
                  _id: saveData._id,
                  username: saveData.username,
                  role: saveData.role,
                },
              },
            });
          }
        }

        return {
          success: true,
          message: 'Success',
          data: data,
        } as ResponsePayload;
      } else {
        return {
          success: false,
          message: 'Sorry! Only default registration is available',
          data: null,
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  private async vendorSignupBase(
    createVendorDto: CreateVendorDto,
  ): Promise<ResponsePayload> {
    try {
      const {
        isPasswordLess,
        password,
        registrationType,
        phoneNo,
        username,
        email,
        role,
      } = createVendorDto;

      if (registrationType === 'default') {
        if (username) {
          const existingUsername = await this.vendorModel.findOne({ username });
          if (existingUsername) {
            return {
              success: false,
              message: `Sorry! Username already exists`,
              data: null,
            } as ResponsePayload;
          }
        }

        if (email) {
          const existingEmail = await this.vendorModel.findOne({ email });
          if (existingEmail) {
            return {
              success: false,
              message: `Sorry! Email already exists`,
              data: null,
            } as ResponsePayload;
          }
        }

        if (phoneNo) {
          const existingPhoneNo = await this.vendorModel.findOne({ phoneNo });
          if (existingPhoneNo) {
            return {
              success: false,
              message: `Sorry! Phone number already exists`,
              data: null,
            } as ResponsePayload;
          }
        }

        let hashedPass: string;
        if (!isPasswordLess) {
          const salt = await bcrypt.genSalt();
          hashedPass = await bcrypt.hash(password, salt);
        } else {
          return {
            success: false,
            message: `Sorry! Password less login is not acceptable here.`,
            data: null,
          } as ResponsePayload;
        }

        const defaultData = {
          password: hashedPass,
          registrationAt: this.utilsService.getDateString(new Date()),
          lastLoggedIn: null,
          status: 'active',
        };

        const finalData = { ...createVendorDto, ...defaultData };

        const saveData = await this.vendorModel.create(finalData);
        const data = {
          username: saveData.username,
          email: saveData.email,
          phoneNo: saveData.phoneNo,
          name: saveData.name,
          _id: saveData._id,
          role: saveData.role,
        };

        return {
          success: true,
          message: 'Success',
          data: data,
        } as ResponsePayload;
      } else {
        return {
          success: false,
          message: 'Sorry! Only default registration is available',
          data: null,
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async vendorSignupOwner(
    createVendorDto: CreateVendorDto,
  ): Promise<ResponsePayload> {
    try {
      createVendorDto.role = 'owner';
      return this.vendorSignupBase(createVendorDto);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async vendorLogin(authVendorDto: AuthVendorDto): Promise<VendorAuthResponse> {
    try {
      const { identifier } = authVendorDto;
      const fVendor = await this.vendorModel
        .findOne({
          $or: [
            { username: identifier },
            { phoneNo: identifier },
            { email: identifier },
          ],
        })
        .select(
          'password username status isPasswordLess failedLoginStartTime failedLoginCount role shops',
        );

      if (!fVendor) {
        return {
          success: false,
          message: 'Sorry! No account found.',
        } as VendorAuthResponse;
      }

      // Check Failed Login
      if (fVendor.failedLoginCount && fVendor.failedLoginCount >= 10) {
        const diff = this.utilsService.getDateDifference(
          fVendor.failedLoginStartTime,
          new Date(),
          'minutes',
        );

        if (diff <= 30) {
          return {
            success: false,
            message: `Sorry! Many Failed login. Please try after ${
              30 - diff
            } minutes`,
          } as VendorAuthResponse;
        } else {
          await this.vendorModel.findByIdAndUpdate(fVendor._id, {
            $set: {
              failedLoginCount: 0,
              failedLoginStartTime: null,
            },
          });
          fVendor.failedLoginStartTime = null;
          fVendor.failedLoginCount = 0;
        }
      }

      if (fVendor.status !== 'active') {
        return {
          success: false,
          message: `No Access for Login. account status: ${fVendor.status}`,
        } as VendorAuthResponse;
      }

      if (!fVendor.isPasswordLess) {
        const isMatch = await bcrypt.compare(
          authVendorDto.password,
          fVendor.password,
        );

        if (isMatch) {
          const payload: VendorJwtPayload = {
            _id: fVendor._id,
            username: fVendor.username,
          };
          const jwtSecret = this.configService.get<string>('vendorJwtSecret');
          const expiresInDays = this.configService.get<string>(
            'vendorTokenExpiredTime',
          );

          const accessToken = this.jwtService.sign(payload, {
            secret: jwtSecret,
            expiresIn: expiresInDays as any,
          });
          // Update Login Info
          await this.vendorModel.findByIdAndUpdate(fVendor._id, {
            $set: {
              failedLoginStartTime: null,
              failedLoginCount: 0,
              lastLoggedIn: new Date(),
            },
          });
          // Find Shops
          const shops = await this.shopModel.find({ 'users._id': fVendor._id });

          const jShops = JSON.parse(JSON.stringify(shops));
          const mShops = jShops.map((m: Shop) => {
            return {
              _id: m._id,
              websiteName: m.websiteName,
              subDomain: m.subDomain,
              theme: m.theme,
              domain: m.domain,
              dateString: m.dateString,
              pages: m.pages,
              user: m.users.find(
                (f) => f._id.toString() === fVendor._id.toString(),
              ),
            };
          });

          return {
            success: true,
            message: 'Login success!',
            data: {
              _id: fVendor._id,
              role: fVendor.role,
              pages: fVendor?.shops ? fVendor?.shops[0]?.pages : null,
            },
            token: accessToken,
            tokenExpiredInDays: expiresInDays,
            shops: mShops,
          } as VendorAuthResponse;
        } else {
          await this.vendorModel.findByIdAndUpdate(
            fVendor._id,
            {
              $set: {
                failedLoginStartTime:
                  fVendor.failedLoginStartTime ?? new Date(),
              },
              $inc: {
                failedLoginCount: 1,
              },
            },
            {
              upsert: true,
              new: true,
            },
          );

          return {
            success: false,
            message: 'Password not matched!',
            data: null,
            token: null,
            tokenExpiredIn: null,
          } as VendorAuthResponse;
        }
      } else {
        return {
          success: false,
          message: 'Sorry! Password less login is not available.',
          data: null,
          token: null,
          tokenExpiredIn: null,
        } as VendorAuthResponse;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async adminLoginOfVendorPanel(
    authVendorDto: AuthVendorDto,
  ): Promise<VendorAuthResponse> {
    try {
      const vendor = await this.vendorModel.findById(authVendorDto.identifier);
      const expectedSecret = this.configService.get<string>('vendorSecretKey');
      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }

      // Generate a vendor JWT
      const payload: VendorJwtPayload = {
        _id: vendor._id,
        username: vendor.username,
      };

      const jwtSecret = this.configService.get<string>('vendorJwtSecret');
      const expiresInDays = this.configService.get<string>(
        'adminTokenExpiredTime',
      );
      const accessToken = this.jwtService.sign(payload, {
        secret: jwtSecret,
        expiresIn: expiresInDays as any,
      });

      // Find Shops
      const shops = await this.shopModel.find({ 'users._id': vendor._id });
      const jShops = JSON.parse(JSON.stringify(shops));
      const mShops = jShops.map((m: Shop) => {
        return {
          _id: m._id,
          websiteName: m.websiteName,
          subDomain: m.subDomain,
          domain: m.domain,
          dateString: m.dateString,
          user: m.users.find((f) => f._id.toString() === vendor._id.toString()),
        };
      });

      return {
        success: true,
        message: 'Login success!',
        data: {
          _id: vendor._id,
          role: vendor.role,
        },
        token: accessToken,
        secret: expectedSecret,
        // tokenExpiredInDays: expiresInDays,
        // shops: mShops,
      } as VendorAuthResponse;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async authenticateVendor(token: string, secret: any) {
    try {
      const expectedSecret = this.verifyQuerySecret(secret);
      if (!expectedSecret) {
        throw new UnauthorizedException('Authentication failed');
      }

      if (expectedSecret) {
        const jwtSecret = this.configService.get<string>('vendorJwtSecret');
        const expiresInDays = this.configService.get<string>(
          'adminTokenExpiredTime',
        );
        const decoded = this.jwtService.verify(token, { secret: jwtSecret });

        if (!decoded) {
          throw new UnauthorizedException('Invalid token');
        }

        const vendor = await this.vendorModel.findById(decoded._id);

        if (!vendor) {
          throw new UnauthorizedException('Vendor not found');
        }

        // Find Shops
        const shops = await this.shopModel.find({ 'users._id': vendor._id });
        const jShops = JSON.parse(JSON.stringify(shops));
        const mShops = jShops.map((m: Shop) => {
          return {
            _id: m._id,
            websiteName: m.websiteName,
            subDomain: m.subDomain,
            domain: m.domain,
            dateString: m.dateString,
            user: m.users.find(
              (f) => f._id.toString() === vendor._id.toString(),
            ),
          };
        });

        return {
          success: true,
          message: 'Login success!',
          data: {
            _id: vendor._id,
            role: vendor.role,
          },
          token: token,
          tokenExpiredInDays: expiresInDays,
          shops: mShops,
        } as VendorAuthResponse;
      }
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  verifyQuerySecret(secretFromQuery: string): boolean {
    if (!secretFromQuery) return false;
    const expectedSecret = this.configService.get<string>('vendorSecretKey');
    return secretFromQuery === expectedSecret;
  }

  async addVendorByAuth(
    vendor: Vendor,
    createVendorDto: CreateVendorDto,
  ): Promise<ResponsePayload> {
    try {
      createVendorDto.phoneNo = null;
      createVendorDto.email = null;
      return this.vendorSignup(createVendorDto);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async vendorSignupAndLogin(
    createVendorDto: CreateVendorDto,
  ): Promise<ResponsePayload> {
    try {
      const { phoneNo, registrationType, countryCode, password } =
        createVendorDto;

      if (registrationType === 'phone') {
        const username = `${countryCode}${phoneNo}`;
        const signupRes = await this.vendorSignup({
          ...createVendorDto,
          ...{
            username: username,
          },
        });
        if (signupRes.success) {
          const expectedSecret =
            this.configService.get<string>('vendorSecretKey');
          return this.vendorLogin({
            identifier: signupRes.data.username,
            password: password,
          });
        } else {
          return signupRes;
        }
      } else {
        return {
          success: false,
          message: 'Sorry! Only phone no registration is available',
          data: null,
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * Logged-in Vendor Info
   * Get All Vendors V3 (Filter, Pagination, Select, Sort, Search Query with Aggregation) ** Recommended
   * Get All Vendors by Search
   */

  async getLoggedInVendorData(
    vendor: Vendor,
    selectQuery: VendorSelectFieldDto,
  ): Promise<ResponsePayload> {
    try {
      let { select } = selectQuery;
      if (!select) {
        select = '-password';
      }
      const data = await this.vendorModel.findById(vendor._id).select(select);
      return {
        data,
        success: true,
      } as ResponsePayload;
    } catch (err) {
      this.logger.error(`${vendor.username} is failed to retrieve data`);
      // console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async getAllVendorsByShop(
    shop: string,
    vendor: Vendor,
    filterVendorDto: FilterAndPaginationVendorDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const fShop = JSON.parse(
      JSON.stringify(await this.shopModel.findById(shop).select('owner users')),
    );

    const mId = fShop.users.map((user: any) => new ObjectId(user._id));

    const { filter } = filterVendorDto;
    filterVendorDto.filter = { ...filter, ...{ _id: { $in: mId } } };

    return this.getAllVendors(filterVendorDto, searchQuery);
  }

  async getAllVendors(
    filterVendorDto: FilterAndPaginationVendorDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterVendorDto;
    const { pagination } = filterVendorDto;
    const { sort } = filterVendorDto;
    const { select } = filterVendorDto;

    // Essential Variables
    const aggregateStages = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
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

              {
                username: this.utilsService.createRegexFromString(searchQuery),
              },

              {
                phoneNo: this.utilsService.createRegexFromString(searchQuery),
              },
              {
                email: this.utilsService.createRegexFromString(searchQuery),
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
      // Remove Sensitive Select
      delete select.password;
      mSelect = { ...mSelect, ...select };
    } else {
      mSelect = { password: 0 };
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
      // Remove Sensitive Select
      delete mSelect['password'];
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
              { $project: { password: 0 } },
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
      const dataAggregates = await this.vendorModel.aggregate(aggregateStages);
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

  /**
   * Get Vendor by ID
   * Update Logged In Vendor Info
   * Change Logged In Vendor Password
   * Update Vendor by Id
   * Update Multiple Vendor By Id
   * Delete Vendor by Id
   * Delete Multiple Vendor By Id
   */
  async getVendorById(
    id: string,
    vendorSelectFieldDto: VendorSelectFieldDto,
  ): Promise<ResponsePayload> {
    try {
      let { select } = vendorSelectFieldDto;
      if (!select) {
        select = '-password';
      }
      const data = await this.vendorModel.findById(id).select(select);
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateLoggedInVendorInfo(
    vendor: Vendor,
    updateVendorDto: UpdateVendorDto,
  ): Promise<ResponsePayload> {
    const { password, username } = updateVendorDto;
    let user;
    try {
      user = await this.vendorModel.findById(vendor._id);
    } catch (err) {
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException('No Vendor found!');
    }
    try {
      // Remove Sensitive Fields
      if (updateVendorDto.role) {
        delete updateVendorDto.role;
      }
      if (updateVendorDto.permissions) {
        delete updateVendorDto.permissions;
      }

      // Check Username
      if (username) {
        const isExists = await this.vendorModel.findOne({ username });
        if (isExists) {
          return {
            success: false,
            message: 'Username already exists',
          } as ResponsePayload;
        }
      }
      // Check Password
      if (password) {
        const salt = await bcrypt.genSalt();
        const hashedPass = await bcrypt.hash(password, salt);
        await this.vendorModel.findByIdAndUpdate(vendor._id, {
          $set: { ...updateVendorDto, ...{ password: hashedPass } },
        });
        return {
          success: true,
          message: 'Data & Password changed success',
        } as ResponsePayload;
      }
      await this.vendorModel.findByIdAndUpdate(vendor._id, {
        $set: updateVendorDto,
      });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async checkVendorWithPhoneNoForResetPassword(
    checkVendorDto: CheckVendorDto,
  ): Promise<ResponsePayload> {
    try {
      const { phoneNo, countryCode, username } = checkVendorDto;

      const fVendor = await this.vendorModel.findOne({
        username: username,
      });

      let shop;
      if (fVendor.role === 'owner') {
        shop = await this.shopModel.findOne({
          owner: fVendor._id,
        });
      } else {
        return {
          success: false,
          message: 'Please contact with admin',
          data: null,
        } as ResponsePayload;
      }

      if (shop) {
        await this.otpService.generateOtpWithPhoneNo(shop?.owner, {
          phoneNo: fVendor.phoneNo,
        });
        return {
          success: true,
          message: 'Success! an otp has been sent to your phone no',
          data: { type: 'password-reset' },
        } as ResponsePayload;
      } else {
        return {
          success: false,
          message: 'No data exists in this username',
          data: null,
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async resetVendorPassword(
    resetVendorPasswordDto: ResetVendorPasswordDto,
  ): Promise<ResponsePayload> {
    try {
      const { countryCode, phoneNo, password, username } =
        resetVendorPasswordDto;
      // const fVendor = await this.vendorModel.findOne({
      //   username: `${countryCode}${phoneNo}`,
      // });

      const fVendor = await this.vendorModel.findOne({
        username: username,
      });

      if (fVendor) {
        const salt = await bcrypt.genSalt();
        const hashedPass = await bcrypt.hash(password, salt);
        await this.vendorModel.findByIdAndUpdate(fVendor._id, {
          $set: { password: hashedPass, isPasswordLess: false },
        });
        return {
          success: true,
          message: 'Success! Password changed',
        } as ResponsePayload;
      } else {
        return {
          success: false,
          message: 'Sorry! No data',
        } as ResponsePayload;
      }
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async changeLoggedInVendorPassword(
    vendord: Vendor,
    changePasswordDto: ChangePasswordDto,
  ): Promise<ResponsePayload> {
    const { password, oldPassword } = changePasswordDto;
    let vendor;
    try {
      vendor = await this.vendorModel.findById(vendord._id).select('password');
    } catch (err) {
      throw new InternalServerErrorException();
    }
    if (!vendor) {
      throw new NotFoundException('No Vendor found!');
    }
    try {
      // Check Old Password
      const isMatch = await bcrypt.compare(oldPassword, vendor.password);

      // Change Password
      if (isMatch) {
        const salt = await bcrypt.genSalt();
        const hashedPass = await bcrypt.hash(password, salt);
        await this.vendorModel.findByIdAndUpdate(vendor._id, {
          $set: { password: hashedPass },
        });
        return {
          success: true,
          message: 'Password changed success',
        } as ResponsePayload;
      } else {
        return {
          success: false,
          message: 'Old password is incorrect!',
        } as ResponsePayload;
      }
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateVendorById(
    id: string,
    updateVendorDto: UpdateVendorDto,
  ): Promise<ResponsePayload> {
    const { newPassword, username } = updateVendorDto;
    let user;
    try {
      user = await this.vendorModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException('No Vendor found!');
    }
    try {
      // Delete No Multiple Action Data
      // delete updateVendorDto.password;
      if (updateVendorDto.hasOwnProperty('password')) {
        delete updateVendorDto.password;
      }

      // Check Username
      if (username) {
        if (user.username !== username) {
          const isExists = await this.vendorModel.findOne({ username });
          if (isExists) {
            return {
              success: false,
              message: 'Username already exists',
            } as ResponsePayload;
          }
        }
      }
      // Check Password
      if (newPassword) {
        const salt = await bcrypt.genSalt();
        const hashedPass = await bcrypt.hash(newPassword, salt);
        await this.vendorModel.findByIdAndUpdate(id, {
          $set: { ...updateVendorDto, ...{ password: hashedPass } },
        });
        return {
          success: true,
          message: 'Data & Password changed success',
        } as ResponsePayload;
      }
      await this.vendorModel.findByIdAndUpdate(id, {
        $set: updateVendorDto,
      });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleVendorById(
    ids: string[],
    updateVendorDto: UpdateVendorDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    // Delete No Multiple Action Data
    if (updateVendorDto.hasOwnProperty('password')) {
      delete updateVendorDto.password;
    }
    if (updateVendorDto.username) {
      delete updateVendorDto.username;
    }
    if (updateVendorDto.ids) {
      delete updateVendorDto.ids;
    }

    try {
      await this.vendorModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateVendorDto },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteVendorById(id: string): Promise<ResponsePayload> {
    let user;
    try {
      user = await this.vendorModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException('No Vendor found!');
    }
    try {
      await this.vendorModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async deleteMultipleVendorById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.vendorModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async addDeletedVendor(payload: any): Promise<ResponsePayload> {
    try {
      const { _id } = payload;

      const objectId = new ObjectId(_id);

      // আগে থেকেই আছে কিনা চেক
      const exists = await this.vendorModel.exists({ _id: objectId });
      if (exists) {
        throw new ConflictException('A document already exists with this _id');
      }

      const mData = {
        ...payload,
        ...{
          _id: objectId,
        },
      };

      // _id সহ ইনসার্ট
      const doc = await this.vendorModel.create(mData);

      return {
        success: true,
        message: 'Document restored successfully with same _id',
        data: doc,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
