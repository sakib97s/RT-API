import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ErrorCodes } from '../../enum/error-code.enum';
import * as bcrypt from 'bcrypt';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { UtilsService } from '../../shared/utils/utils.service';
import { ChangePasswordDto } from '../../dto/change-password.dto';
import { OtpService } from '../otp/otp.service';
import { Shop } from '../shop/interfaces/shop.interface';
import {
  User,
  UserAuthResponse,
  UserJwtPayload,
} from './interfaces/user.interface';
import {
  AddAddressDto,
  AuthUserDto,
  CheckUserDto,
  CreateUserDto,
  FilterAndPaginationUserDto,
  GetUserByIdsDto,
  ResetUserPasswordDto,
  UpdateAddressDto,
  UpdateUserDto,
  UserSelectFieldDto,
} from './dto/user.dto';
import { Vendor } from '../vendor/interfaces/vendor.interface';
import { Setting } from '../customization/setting/interface/setting.interface';
import { OAuth2Client } from 'google-auth-library';

const ObjectId = Types.ObjectId;

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('Setting') private readonly settingModel: Model<Setting>,
    protected jwtService: JwtService,
    private configService: ConfigService,
    private utilsService: UtilsService,
    private otpService: OtpService,
  ) {}

  /**
   * User Methods
   * checkUserWithPhoneNo()
   */

  async checkUserWithPhoneNo(
    shop: string,
    checkUserDto: CheckUserDto,
    handleOtp?: boolean,
  ): Promise<ResponsePayload> {
    try {
      // Check Shop
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! No shop found',
        } as ResponsePayload;
      }

      const { phoneNo, countryCode } = checkUserDto;

      const fUser = await this.userModel.findOne({
        shop: shop,
        username: `${countryCode}${phoneNo}`,
      });

      if (!fUser) {
        if (handleOtp) {
          await this.otpService.generateOtpWithPhoneNo(shop, {
            phoneNo: phoneNo,
          });
          return {
            success: true,
            message: 'User available with this username and sent otp',
            data: { type: 'signup' },
          } as ResponsePayload;
        } else {
          return {
            success: true,
            message: 'User available with this username',
            data: { type: 'signup' },
          } as ResponsePayload;
        }
      } else {
        return {
          success: true,
          message: 'User already exists in this username',
          data: { _id: fUser._id, type: 'login' },
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async userSignup(
    shop: string,
    createUserDto: CreateUserDto,
  ): Promise<ResponsePayload> {
    try {
      const {
        isPasswordLess,
        password,
        registrationType,
        countryCode,
        phoneNo,
        username,
      } = createUserDto;

      if (registrationType === 'phone') {
        let hashedPass = null;
        const fullPhoneNo = countryCode + phoneNo;

        const fUser = await this.userModel.findOne({
          shop: shop,
          username: fullPhoneNo,
        });
        if (fUser) {
          return {
            success: false,
            message: 'Sorry! user is already exists with this phone no',
            data: { _id: fUser._id },
          } as ResponsePayload;
        }

        if (!isPasswordLess) {
          const salt = await bcrypt.genSalt();
          hashedPass = await bcrypt.hash(password, salt);
        }

        const defaultData = {
          shop: shop,
          username: fullPhoneNo,
          fullPhoneNo: fullPhoneNo,
          password: hashedPass,
          registrationAt: this.utilsService.getDateString(new Date()),
          lastLoggedIn: null,
          status: 'active',
          hasAccess: true,
        };

        const finalData = { ...createUserDto, ...defaultData };

        const saveData = await this.userModel.create(finalData);
        const data = {
          username: saveData.username,
          name: saveData.name,
          _id: saveData._id,
        };
        return {
          success: true,
          message: 'Success! User registration successfully complete.',
          data,
        } as ResponsePayload;
      } else if (registrationType === 'default') {
        let hashedPass = null;

        const fUser = await this.userModel.findOne({
          shop: shop,
          username: username,
        });
        if (fUser) {
          return {
            success: false,
            message: 'Sorry! user is already exists with this phone no',
            data: { _id: fUser._id },
          } as ResponsePayload;
        }

        if (!isPasswordLess) {
          const salt = await bcrypt.genSalt();
          hashedPass = await bcrypt.hash(password, salt);
        }

        const defaultData = {
          shop: shop,
          username: username,
          fullPhoneNo: phoneNo,
          password: hashedPass,
          registrationAt: this.utilsService.getDateString(new Date()),
          lastLoggedIn: null,
          status: 'active',
          hasAccess: true,
        };

        const finalData = { ...createUserDto, ...defaultData };

        const saveData = await this.userModel.create(finalData);
        const data = {
          username: saveData.username,
          name: saveData.name,
          _id: saveData._id,
        };
        return {
          success: true,
          message: 'Success! User registration successfully complete.',
          data,
        } as ResponsePayload;
      } else if (registrationType === 'google') {
        const defaultData = {
          shop: shop,
          registrationAt: this.utilsService.getDateString(new Date()),
          lastLoggedIn: null,
          status: 'active',
          hasAccess: true,
        };

        const finalData = { ...createUserDto, ...defaultData };

        const saveData = await this.userModel.create(finalData);
        const data = {
          username: saveData.username,
          name: saveData.name,
          _id: saveData._id,
        };
        return {
          success: true,
          message: 'Success! User registration successfully complete.',
          data,
        } as ResponsePayload;
      } else {
        return {
          success: false,
          message: 'Sorry! Only phone no registration is available',
          data: null,
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async userLogin(authUserDto: AuthUserDto): Promise<UserAuthResponse> {
    try {
      const { username, password, shop } = authUserDto;
      const fUser = await this.userModel
        .findOne({ username: username, shop: shop })
        .select(
          'password username hasAccess status isPasswordLess failedLoginStartTime failedLoginCount',
        );

      if (!fUser) {
        return {
          success: false,
          message: 'Username is invalid',
        } as UserAuthResponse;
      }

      // Check Failed Login
      if (fUser.failedLoginCount && fUser.failedLoginCount >= 10) {
        const diff = this.utilsService.getDateDifference(
          fUser.failedLoginStartTime,
          new Date(),
          'minutes',
        );

        if (diff <= 30) {
          return {
            success: false,
            message: `Sorry! Many Failed login. Please try after ${
              30 - diff
            } minutes`,
          } as UserAuthResponse;
        } else {
          await this.userModel.findByIdAndUpdate(fUser._id, {
            $set: {
              failedLoginCount: 0,
              failedLoginStartTime: null,
            },
          });
          fUser.failedLoginStartTime = null;
          fUser.failedLoginCount = 0;
        }
      }

      if (fUser.status !== 'active') {
        return {
          success: false,
          message: `No Access for Login. account status: ${fUser.status}`,
        } as UserAuthResponse;
      }

      if (!fUser.isPasswordLess) {
        const isMatch = await bcrypt.compare(
          authUserDto.password,
          fUser.password,
        );

        if (isMatch) {
          const payload: UserJwtPayload = {
            _id: fUser._id,
            username: fUser.username,
          };
          const jwtSecret = this.configService.get<string>('userJwtSecret');
          const expiresInDays = this.configService.get<string>(
            'userTokenExpiredTime',
          );

          const accessToken = this.jwtService.sign(payload, {
            secret: jwtSecret,
            expiresIn: expiresInDays,
          });
          // Update Login Info
          await this.userModel.findByIdAndUpdate(fUser._id, {
            $set: {
              failedLoginStartTime: null,
              failedLoginCount: 0,
              lastLoggedIn: new Date(),
            },
          });

          return {
            success: true,
            message: 'Login success!',
            data: {
              _id: fUser._id,
            },
            token: accessToken,
            tokenExpiredInDays: expiresInDays,
          } as UserAuthResponse;
        } else {
          await this.userModel.findByIdAndUpdate(
            fUser._id,
            {
              $set: {
                failedLoginStartTime: fUser.failedLoginStartTime ?? new Date(),
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
          } as UserAuthResponse;
        }
      } else {
        const payload: UserJwtPayload = {
          _id: fUser._id,
          username: fUser.username,
        };
        const jwtSecret = this.configService.get<string>('userJwtSecret');
        const expiresInDays = this.configService.get<string>(
          'userTokenExpiredTime',
        );

        const accessToken = this.jwtService.sign(payload, {
          secret: jwtSecret,
          expiresIn: expiresInDays,
        });
        // Update Login Info
        await this.userModel.findByIdAndUpdate(fUser._id, {
          $set: {
            failedLoginStartTime: null,
            failedLoginCount: 0,
            lastLoggedIn: new Date(),
          },
        });

        return {
          success: true,
          message: 'Login success!',
          data: {
            _id: fUser._id,
          },
          token: accessToken,
          tokenExpiredInDays: expiresInDays,
        } as UserAuthResponse;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async userSignupAndLogin(
    shop: string,
    createUserDto: CreateUserDto,
  ): Promise<ResponsePayload> {
    try {
      const { phoneNo, registrationType, countryCode, password, username } =
        createUserDto;

      if (registrationType === 'phone') {
        const mUsername = `${countryCode}${phoneNo}`;
        const signupRes = await this.userSignup(shop, {
          ...createUserDto,
          ...{
            username: mUsername,
            shop: shop,
          },
        });
        if (signupRes.success) {
          return this.userLogin({
            username: signupRes.data.username,
            password: password,
            shop: shop,
          });
        } else {
          return signupRes;
        }
      }

      else if (registrationType === 'default') {
        const signupRes = await this.userSignup(shop, {
          ...createUserDto,
          ...{
            username: username,
            shop: shop,
          },
        });
        if (signupRes.success) {
          return this.userLogin({
            username: signupRes.data.username,
            password: password,
            shop: shop,
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
   * Logged-in User Info
   * Get All Users V3 (Filter, Pagination, Select, Sort, Search Query with Aggregation) ** Recommended
   * Get All Users by Search
   */

  async getAllUserByShop(
    shop: string,
    filterUserDto: FilterAndPaginationUserDto,
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
      const { filter } = filterUserDto;
      filterUserDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllUsers(filterUserDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getUserBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.userModel
        .findOne({ slug: slug, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.userModel.findByIdAndUpdate(data._id, {
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

  async getUserByIds(
    shop: string,
    getUserByIdsDto: GetUserByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getUserByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.userModel
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

  async getUserDataByPhoneNo(
    shop: string,
    getUserByIdsDto: GetUserByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.userModel
        .findOne({ phoneNo: getUserByIdsDto.phoneNo, shop: shop })
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

  // getLoggedInUserData

  async getLoggedInUserData(
    user: User,
    selectQuery: UserSelectFieldDto,
  ): Promise<ResponsePayload> {
    try {
      let { select } = selectQuery;
      if (!select) {
        select = '-password';
      }
      const data = await this.userModel.findById(user._id).select(select);
      return {
        data,
        success: true,
      } as ResponsePayload;
    } catch (err) {
      this.logger.error(`${user.username} is failed to retrieve data`);
      // console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async getAllUsers(
    filterUserDto: FilterAndPaginationUserDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterUserDto;
    const { pagination } = filterUserDto;
    const { sort } = filterUserDto;
    const { select } = filterUserDto;

    // Essential Variables
    const aggregateStages = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['shop']) {
        filter['shop'] = new ObjectId(filter['shop']);
      }
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      mFilter = { ...mFilter, ...{ shopName: new RegExp(searchQuery, 'i') } };
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
      const dataAggregates = await this.userModel.aggregate(aggregateStages);

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
   * Get User by ID
   * Update Logged In User Info
   * Change Logged In User Password
   * Update User by Id
   * Update Multiple User By Id
   * Delete User by Id
   * Delete Multiple User By Id
   */
  async getUserById(
    id: string,
    userSelectFieldDto: UserSelectFieldDto,
  ): Promise<ResponsePayload> {
    try {
      let { select } = userSelectFieldDto;
      if (!select) {
        select = '-password';
      }
      const data = await this.userModel.findById(id).select(select);
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async getUserByPhoneNo(
    phoneNo: string,
    userSelectFieldDto: UserSelectFieldDto,
  ): Promise<ResponsePayload> {
    try {

      let { select } = userSelectFieldDto;
      if (!select) {
        select = '-password';
      }
      const data = await this.userModel
        .findOne({ phoneNo: phoneNo })
        .select(select);
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async getAllAddress(shop: string, user: User): Promise<ResponsePayload> {
    try {
      const data = await this.userModel
        .findById(user._id)
        .select('addresses -_id');

      // Define the desired order
      const sortOrder = ['home', 'hometown', 'office'];

      return {
        success: true,
        message: 'Address Get Successfully!',
        data:
          data && data.addresses && data.addresses.length
            ? data.addresses.sort((a, b) => {
                return (
                  sortOrder.indexOf(a.addressType) -
                  sortOrder.indexOf(b.addressType)
                );
              })
            : [],
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateLoggedInUserInfo(
    user: User,
    updateUserDto: UpdateUserDto,
  ): Promise<ResponsePayload> {
    try {
      const { password, username } = updateUserDto;
      // Remove Sensitive Fields
      if (updateUserDto.permissions) {
        delete updateUserDto.permissions;
      }

      // Check Username
      if (username) {
        const isExists = await this.userModel.findOne({ username });
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
        await this.userModel.findByIdAndUpdate(user._id, {
          $set: { ...updateUserDto, ...{ password: hashedPass } },
        });
        return {
          success: true,
          message: 'Data & Password changed success',
        } as ResponsePayload;
      }
      await this.userModel.findByIdAndUpdate(user._id, {
        $set: updateUserDto,
      });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async checkUserWithPhoneNoForResetPassword(
    shop: string,
    checkUserDto: CheckUserDto,
  ): Promise<ResponsePayload> {
    try {
      const { username } = checkUserDto;

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
      const isPhoneNo = /^(\+?\d{1,4}[-.\s]?)?\d{10,15}$/.test(username);

      let fUser = null;

      if (isEmail) {
        fUser = await this.userModel.findOne({ shop, email: username });
      } else if (isPhoneNo) {
        fUser = await this.userModel.findOne({ shop, phoneNo: username });
      } else {
        return {
          success: false,
          message: 'Invalid email or phone number format',
          data: null,
        };
      }

      if (fUser && isPhoneNo) {
        await this.otpService.generateOtpWithPhoneNo(shop, {
          phoneNo: username,
        });

        return {
          success: true,
          message: 'Success! An OTP has been sent to your phone number',
          data: { type: 'password-reset' },
        };
      } else if (fUser && isEmail) {
        // You can optionally handle email-based reset here
        this.otpService.generateOtpWithEmail(shop, {
          email: username,
        });
        return {
          success: true,
          message:
            'Email found. Please check your email for reset instructions.',
          data: { type: 'password-reset' },
        };
      } else {
        return {
          success: false,
          message: 'No user found with this identifier',
          data: null,
        };
      }
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException();
    }
  }

  async resetUserPassword(
    resetUserPasswordDto: ResetUserPasswordDto,
  ): Promise<ResponsePayload> {
    try {
      const { countryCode, phoneNo, password, username } = resetUserPasswordDto;
      const fUser = await this.userModel.findOne({
        username: username,
      });

      if (fUser) {
        const salt = await bcrypt.genSalt();
        const hashedPass = await bcrypt.hash(password, salt);
        await this.userModel.findByIdAndUpdate(fUser._id, {
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

  async changeLoggedInUserPassword(
    userd: User,
    changePasswordDto: ChangePasswordDto,
  ): Promise<ResponsePayload> {
    const { password, oldPassword } = changePasswordDto;
    let user;
    try {
      user = await this.userModel.findById(userd._id).select('password');
    } catch (err) {
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException('No User found!');
    }
    try {
      // Check Old Password
      const isMatch = await bcrypt.compare(oldPassword, user.password);

      // Change Password
      if (isMatch) {
        const salt = await bcrypt.genSalt();
        const hashedPass = await bcrypt.hash(password, salt);
        await this.userModel.findByIdAndUpdate(user._id, {
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

  async updateUserById(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<ResponsePayload> {
    const { newPassword, username } = updateUserDto;
    let user;
    try {
      user = await this.userModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException('No User found!');
    }
    try {
      // Delete No Multiple Action Data
      if (updateUserDto.password) {
        delete updateUserDto.password;
      }

      // Check Username
      if (username) {
        if (user.username !== username) {
          const isExists = await this.userModel.findOne({ username });
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
        await this.userModel.findByIdAndUpdate(id, {
          $set: { ...updateUserDto, ...{ password: hashedPass } },
        });
        return {
          success: true,
          message: 'Data & Password changed success',
        } as ResponsePayload;
      }
      await this.userModel.findByIdAndUpdate(id, {
        $set: updateUserDto,
      });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleUserById(
    ids: string[],
    updateUserDto: UpdateUserDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    // Delete No Multiple Action Data
    if (updateUserDto.password) {
      delete updateUserDto.password;
    }
    if (updateUserDto.username) {
      delete updateUserDto.username;
    }
    if (updateUserDto.ids) {
      delete updateUserDto.ids;
    }

    try {
      await this.userModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateUserDto },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateMultipleUserByIds(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateUserDto: UpdateUserDto,
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

        await this.userModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateUserDto },
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

  async deleteUserById(id: string): Promise<ResponsePayload> {
    let user;
    try {
      user = await this.userModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException('No User found!');
    }
    try {
      await this.userModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async deleteMultipleUserById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.userModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleUserByIdByVendor(
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

      await this.userModel.updateMany(
        { _id: ids },
        {
          $set: {
            status: 'trash',
            deleteDateString: this.utilsService.getDateString(new Date()),
          },
        },
      );
      return {
        success: true,
        message: 'Success! User deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleUsersByIdByVendor(
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

      await this.userModel.deleteMany({ _id: ids });

      return {
        success: true,
        message: 'Success! User deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * Address control
   * addNewAddress()
   * updateAddressById()
   */

  async addNewAddress(
    shop: string,
    user: User,
    addAddressDto: AddAddressDto,
  ): Promise<ResponsePayload> {
    try {
      const fUser = await this.userModel.findById(user._id).select('addresses');
      if (!fUser) {
        return {
          success: false,
          message: 'Sorry! No user found.',
        } as ResponsePayload;
      }

      if (fUser.addresses && fUser.addresses.length < 3) {
        // Ensure that all other addresses have `isDefaultAddress` set to false.
        await this.userModel.findByIdAndUpdate(user._id, {
          $set: { 'addresses.$[].isDefaultAddress': false },
        });

        const saveData = await this.userModel.findByIdAndUpdate(
          user._id,
          {
            $push: { addresses: addAddressDto },
          },
          { returnDocument: 'after' },
        );

        const newSaveData = saveData.addresses[saveData.addresses.length - 1];
        return {
          success: true,
          message: 'Data Added Successfully',
          data: {
            _id: newSaveData?._id,
          },
        } as ResponsePayload;
      } else {
        return {
          success: false,
          message: 'Sorry! You can save maximum 3 address.',
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Slug Must be Unique');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async updateAddressById(
    shop: string,
    user: User,
    id: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<ResponsePayload> {
    try {
      // Ensure that all other addresses have `isDefaultAddress` set to false.
      await this.userModel.findByIdAndUpdate(user._id, {
        $set: { 'addresses.$[].isDefaultAddress': false },
      });

      await this.userModel.findByIdAndUpdate(
        user._id,
        {
          $set: {
            'addresses.$[address]': { ...updateAddressDto, ...{ _id: id } },
          },
        },
        { arrayFilters: [{ 'address._id': id }] },
      );

      return {
        success: true,
        message: 'Success! address updated successfully!',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async deleteAddressById(
    shop: string,
    user: User,
    id: string,
  ): Promise<ResponsePayload> {
    try {
      await this.userModel.findByIdAndUpdate(user._id, {
        $pull: { addresses: { _id: new ObjectId(id) } },
      });

      return {
        success: true,
        message: 'Success! address deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  /**
   * Social Login Methods
   * userLoginWithSocial()
   * verifyGoogleLoginWithToken()
   */

  private async userLoginWithSocial(
    shop: string,
    createUserDto: CreateUserDto,
  ): Promise<ResponsePayload> {
    try {
      const { registrationType, password, username } = createUserDto;
      if (registrationType === 'google') {
        const fUser = await this.userModel.findOne({
          shop: shop,
          registrationType: registrationType,
          username: username,
        });

        if (fUser) {
          return this.userLogin({
            username: username,
            password: null,
            shop: shop,
          });
        } else {
          const signupRes = await this.userSignup(shop, createUserDto);
          if (signupRes.success) {
            return this.userLogin({
              username: signupRes.data.username,
              password: password,
              shop: shop,
            });
          } else {
            return signupRes;
          }
        }
      }

      return {
        success: false,
        message: 'Sorry! Only phone no registration is available',
        data: null,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async verifyGoogleLoginWithToken(shop: string, token: string): Promise<any> {
    // Setting Data
    const fSetting = await this.settingModel
      .findOne({ shop: shop })
      .select('socialLogins -_id');

    // Social Login
    const fSocialLogins = fSetting?.socialLogins ?? [];
    const socialLogin = fSocialLogins.find(
      (f: any) => f.providerName === 'Google',
    );

    const client = new OAuth2Client(socialLogin.authId);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: socialLogin.authId,
    });
    const payload = ticket.getPayload();

    const authData: any = {
      registrationType: 'google',
      name: payload.name,
      email: payload.email,
      profileImg: payload.picture,
      username: payload.email,
      password: null,
      isPasswordLess: true,
    };

    return this.userLoginWithSocial(shop, authData);
  }
}
