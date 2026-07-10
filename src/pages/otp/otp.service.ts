import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UtilsService } from '../../shared/utils/utils.service';
import { Otp } from './interfaces/otp.interface';
import { BulkSmsService } from '../../shared/bulk-sms/bulk-sms.service';
import { AddOtpDto, ValidateOtpDto } from './dto/otp.dto';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { Setting } from '../customization/setting/interface/setting.interface';
import { SmsSentConfig } from '../../shared/bulk-sms/interfaces/bulk-sms.interface';
import { Shop } from '../shop/interfaces/shop.interface';
import { EmailService } from '../../shared/email/email.service';
import { ShopInformation } from '../customization/shop-information/interfaces/shop-information.interface';
import { IpBlock } from '../ip-block/interfaces/ip-block.interface';
import { IpBlockService } from '../ip-block/ip-block.service';

@Injectable()
export class OtpService {
  private logger = new Logger(OtpService.name);

  constructor(
    @InjectModel('Otp')
    private readonly otpModel: Model<Otp>,
    @InjectModel('OtpAdmin')
    private readonly otpAdminModel: Model<Otp>,
    @InjectModel('Setting') private readonly settingModel: Model<Setting>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('ShopInformation')
    private readonly shopInformationModel: Model<ShopInformation>,

    private utilsService: UtilsService,
    private bulkSmsService: BulkSmsService,
    private emailService: EmailService,
    private ipBlockService: IpBlockService,
  ) { }

  /**
   * Admin OTP Manage
   */

  async generateAdminOtpWithPhoneNo(
    addOtpDto: AddOtpDto,
  ): Promise<ResponsePayload> {
    try {
      const { phoneNo } = addOtpDto;

      const otpData = await this.otpAdminModel.findOne({
        phoneNo: phoneNo,
      });

      if (otpData) {
        const code = this.utilsService.getRandomOtpCode4();
        const expireTime = this.utilsService.addMinuteInCurrentTime(5);

        await this.otpAdminModel.findByIdAndUpdate(otpData._id, {
          $set: {
            code,
            expireTime,
            createdAt: new Date(),
          },
          $inc: {
            count: 1,
          },
        });

        const msg = `Your Tradition.com otp code is ${code}, expired in 5 minutes.`;
        this.bulkSmsService.sentSmsByAdmin(phoneNo, msg);

        console.log('code ', code);
        return {
          success: true,
          message: `Success! OTP code has been sent to your phone number.`,
        } as ResponsePayload;
      } else {
        const code = this.utilsService.getRandomOtpCode4();
        const expireTime = this.utilsService.addMinuteInCurrentTime(5);

        await this.otpAdminModel.create({
          phoneNo,
          code,
          expireTime,
          count: 1,
        });
        const msg = `Your Tradition.com otp code is ${code}, expired in 5 minutes.`;
        this.bulkSmsService.sentSmsByAdmin(phoneNo, msg);

        console.log('code ', code);

        return {
          success: true,
          message: `Success! OTP code has been sent to your phone number.`,
        } as ResponsePayload;
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async generateAdminOtpWithEmail(
    addOtpDto: AddOtpDto,
  ): Promise<ResponsePayload> {
    try {
      const { email } = addOtpDto;

      const otpData = await this.otpAdminModel.findOne({
        email: email,
      });

      if (otpData) {
        const code = this.utilsService.getRandomOtpCode4();
        const expireTime = this.utilsService.addMinuteInCurrentTime(5);

        await this.otpAdminModel.findByIdAndUpdate(otpData._id, {
          $set: {
            code,
            expireTime,
            createdAt: new Date(),
          },
          $inc: {
            count: 1,
          },
        });

        const msg = `Your tradition.com otp code is ${code}, expired in 5 minutes.`;
        await this.emailService.sendEmail(email, 'Create shop otp', msg, email);
        console.log('code ', code);

        console.log('code ', code);
        return {
          success: true,
          message: `Success! OTP code has been sent to your mail.`,
        } as ResponsePayload;
      } else {
        const code = this.utilsService.getRandomOtpCode4();
        const expireTime = this.utilsService.addMinuteInCurrentTime(5);

        await this.otpAdminModel.create({
          email,
          code,
          expireTime,
          count: 1,
        });
        const msg = `Your tradition.com otp code is ${code}, expired in 5 minutes.`;
        await this.emailService.sendEmail(email, 'Create shop otp', msg, email);

        console.log('code ', code);

        return {
          success: true,
          message: `Success! OTP code has been sent to your mail.`,
        } as ResponsePayload;
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async validateAdminOtpWithPhoneNo(
    ValidateOtpDto: ValidateOtpDto,
  ): Promise<ResponsePayload> {
    try {
      const { phoneNo } = ValidateOtpDto;
      const { code } = ValidateOtpDto;

      const otpData = await this.otpAdminModel.findOne({ phoneNo, code });

      if (otpData) {
        const isExpired = this.utilsService.getDateDifference(
          new Date(),
          new Date(otpData.expireTime),
          'seconds',
        );

        if (isExpired <= 0) {
          return {
            success: false,
            message: 'Sorry! Invalid OTP',
            data: null,
          } as ResponsePayload;
        } else {
          if (code === otpData.code) {
            return {
              success: true,
              message: 'Success! OTP matched',
              data: null,
            } as ResponsePayload;
          } else {
            return {
              success: false,
              message: 'Sorry! Invalid OTP',
              data: null,
            } as ResponsePayload;
          }
        }
      } else {
        return {
          success: false,
          message: 'Sorry! Invalid OTP',
          data: null,
        } as ResponsePayload;
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * OTP FUNCTIONS
   * generateOtpWithPhoneNo()
   * validateOtpWithPhoneNo()
   */
  async generateOtpWithPhoneNo(
    shop: string,
    addOtpDto: AddOtpDto,
    userIpAddress?: string, // 👈 নতুন প্যারামিটার
  ): Promise<ResponsePayload> {
    try {
      const { phoneNo } = addOtpDto;

      // Shop Data
      const fShopInfo = await this.shopModel
        .findById(shop)
        .select('domain subDomain');

      const domain = fShopInfo?.domain ?? fShopInfo?.subDomain;

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('orderSetting smsSendingOption currency smsMethods -_id');

      // Ip Block check

      if (fSetting.orderSetting) {
        // IP Block Logic here
        if (fSetting.orderSetting.isEnableSingleIpBlock) {
          const isBlocked = await this.ipBlockService.isIpBlocked(
            userIpAddress,
            shop,
            phoneNo,
          );
          if (isBlocked) {
            return {
              success: false,
              message: 'You are blocked from placing order. Please try later.',
            };
          }
        }

        // Ip Wise Order Limit And Block Time Check Logic here
        if (fSetting.orderSetting.isEnableIpWiseOrderLimitAndBlockTime) {
          const isBlocked = await this.ipBlockService.isIpBlocked(
            userIpAddress,
            shop,
            phoneNo,
          );
          if (isBlocked) {
            return {
              success: false,
              message: 'You are temporarily blocked from placing orders.',
            };
          }
        }
      }

      // Sms Providers
      const fSmsMethods = fSetting?.smsMethods ?? [];
      const smsMethod = fSmsMethods.find((f) => f.status === 'active');
      const smsSendingOption = fSetting?.smsSendingOption;

      const otpData = await this.otpModel.findOne({
        shop: shop,
        phoneNo: phoneNo,
      });

      if (otpData) {
        const code = this.utilsService.getRandomOtpCode4();
        const expireTime = this.utilsService.addMinuteInCurrentTime(5);

        await this.otpModel.findByIdAndUpdate(otpData._id, {
          $set: {
            code,
            expireTime,
            createdAt: new Date(),
          },
          $inc: {
            count: 1,
          },
        });
        // Sms Sending
        if (smsMethod && smsSendingOption && smsSendingOption.orderPlaced) {
          const smsSentConfig: SmsSentConfig = {
            providerName: smsMethod.providerName,
            smsSenderSecret: smsMethod.secretKey,
            smsSenderId: smsMethod.senderId,
            smsClientId: smsMethod.clientId,
            apiKey: smsMethod.apiKey,
            phoneNo: phoneNo,
            countryCode: smsMethod?.currency?.countryCode,
            message: `Your ${domain} otp code is ${code}, expired in 5 minutes.`,
          };
          this.bulkSmsService.sentSmsWithProvider(smsSentConfig);
        }
        console.log('code ', code);
        return {
          success: true,
          message: `Success! OTP code has been sent to your phone number.`,
        } as ResponsePayload;
      } else {
        const code = this.utilsService.getRandomOtpCode4();
        const expireTime = this.utilsService.addMinuteInCurrentTime(5);

        await this.otpModel.create({
          shop,
          phoneNo,
          code,
          expireTime,
          count: 1,
        });
        // Sms Sending
        if (smsMethod && smsSendingOption && smsSendingOption.orderPlaced) {
          const smsSentConfig: SmsSentConfig = {
            providerName: smsMethod.providerName,
            smsSenderSecret: smsMethod.secretKey,
            smsSenderId: smsMethod.senderId,
            smsClientId: smsMethod.clientId,
            apiKey: smsMethod.apiKey,
            phoneNo: phoneNo,
            countryCode: smsMethod?.currency?.countryCode,
            message: `Your ${domain} otp code is ${code}, expired in 5 minutes.`,
          };
          this.bulkSmsService.sentSmsWithProvider(smsSentConfig);
        }
        console.log('code ', code);

        return {
          success: true,
          message: `Success! OTP code has been sent to your phone number.`,
        } as ResponsePayload;
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async generateOtpWithEmail(
    shop: string,
    addOtpDto: any,
  ): Promise<ResponsePayload> {
    try {
      const { email } = addOtpDto;

      const shopData: any = await this.shopModel
        .findById(shop)
        .select('domain');
      const shopInfo: any = await this.shopInformationModel
        .findOne({ shop: shop })
        .select('logoPrimary websiteName');

      const otpData = await this.otpModel.findOne({
        shop: shop,
        email: email,
      });

      const settingData: any = await this.settingModel
        .findOne({ shop: shop })
        .select('orderNotification');

      if (otpData) {
        const data = {
          _id: otpData._id,
        };

        const code = this.utilsService.getRandomOtpCode4();
        const expireTime = this.utilsService.addMinuteInCurrentTime(5);

        await this.otpModel.findByIdAndUpdate(otpData._id, {
          $set: {
            code,
            expireTime,
            createdAt: new Date(),
          },
          $inc: {
            count: 1,
          },
        });

        // Sent Email

        const html = `<div style="width: 400px; font-family: Helvetica;">
        <div style="margin-bottom: 5px; padding: 0 10px;">
      <img src="${shopInfo?.logoPrimary}" alt="${shopInfo?.websiteName || 'Logo'}" width="50" style="height: auto;" loading="lazy"/>

      </div>
        <div style="background: #f1f1f1; font-size: 20px; padding: 5px 10px; line-height: 0;">
            <h4>Hello,</h4>
        </div>
        <div style="background: #f8f8f8; padding: 5px 10px;">
            <p> We've received a request to reset the password for the  ${shopData?.domain ? shopData?.domain : shopInfo?.websiteName} account associated with -
              ${addOtpDto.email}. No changes have been made to your account yet.</p>
             <p>You can reset your password by this code:</p>
            <p style="font-size: 17px; font-weight: 700;">${code}</p>
            <p>Reset your password</p>
            <p>If you did not request a new password, please let us know immediately by replying to this email.</p>
            <p></p>
            <p></p>

        </div>
        </div>`;
        if (
          settingData?.orderNotification?.isEnablePersonalNotification &&
          settingData?.orderNotification?.appEmail &&
          settingData?.orderNotification?.appPassword
        ) {
          this.emailService.sendEmailFormPersonal(
            email,
            'Reset Password Otp',
            html,
            settingData?.orderNotification,
          );
        } else {
          await this.emailService.sendEmail(
            email,
            'Reset Password Otp',
            html,
            shopInfo,
          );
        }
        console.log('code ', code);
        return {
          success: true,
          message: `Success! OTP code has been sent to your email.`,
          data,
        } as ResponsePayload;
      } else {
        const code = this.utilsService.getRandomOtpCode4();
        const expireTime = this.utilsService.addMinuteInCurrentTime(5);

        const newData = new this.otpModel({
          email: email,
          code,
          expireTime,
          count: 1,
          shop: shop,
        });

        const saveData = await newData.save();
        const data = {
          _id: saveData._id,
        };
        // Sent Email
        const html = `<div style="width: 400px; font-family: Helvetica;">
        <div style="margin-bottom: 5px; padding: 0 10px;">
          <img src="${shopInfo?.logoPrimary}" alt="${shopInfo?.websiteName || 'Logo'}" width="50" style="height: auto;" loading="lazy"/>

      </div>
        <div style="background: #f1f1f1; font-size: 20px; padding: 5px 10px; line-height: 0;">
            <h4>Hello,</h4>
        </div>
        <div style="background: #f8f8f8; padding: 5px 10px;">
            <p> We've received a request to reset the password for the  ${shopData?.domain ? shopData?.domain : shopInfo?.websiteName} account associated with -
              ${addOtpDto.email}. No changes have been made to your account yet.</p>
             <p>You can reset your password by this code:</p>
            <p style="font-size: 17px; font-weight: 700;">${code}</p>
            <p>Reset your password</p>
            <p>If you did not request a new password, please let us know immediately by replying to this email.</p>
            <p></p>
            <p></p>

        </div>
        </div>`;
        if (
          settingData?.orderNotification?.isEnablePersonalNotification &&
          settingData?.orderNotification?.appEmail &&
          settingData?.orderNotification?.appPassword
        ) {
          this.emailService.sendEmailFormPersonal(
            email,
            'Reset Password Otp',
            html,
            settingData?.orderNotification,
          );
        } else {
          await this.emailService.sendEmail(email, 'Reset Password Otp', html);
        }
        console.log('code ', code);

        return {
          success: true,
          message: `Success! OTP code has been sent to your email.`,
          data,
        } as ResponsePayload;
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  async generateAffiliateOtpWithEmail(
    addOtpDto: any,
  ): Promise<ResponsePayload> {
    try {
      const { email } = addOtpDto;

      const otpData = await this.otpModel.findOne({
        email: email,
      });

      if (otpData) {
        const data = {
          _id: otpData._id,
        };

        const code = this.utilsService.getRandomOtpCode4();
        const expireTime = this.utilsService.addMinuteInCurrentTime(5);

        await this.otpModel.findByIdAndUpdate(otpData._id, {
          $set: {
            code,
            expireTime,
            createdAt: new Date(),
          },
          $inc: {
            count: 1,
          },
        });

        // Sent Email

        const html = `<div style="width: 400px; font-family: Helvetica;">

        <div style="background: #f1f1f1; font-size: 20px; padding: 5px 10px; line-height: 0;">
            <h4>Hello,</h4>
        </div>
        <div style="background: #f8f8f8; padding: 5px 10px;">

             <p>You can reset your password by this code:</p>
            <p style="font-size: 17px; font-weight: 700;">${code}</p>
            <p>Reset your password</p>
            <p>If you did not request a new password, please let us know immediately by replying to this email.</p>
            <p></p>
            <p></p>

        </div>
        </div>`;
        await this.emailService.sendEmail(email, 'Reset Password Otp', html);
        console.log('code ', code);
        return {
          success: true,
          message: `Success! OTP code has been sent to your email.`,
          data,
        } as ResponsePayload;
      } else {
        const code = this.utilsService.getRandomOtpCode4();
        const expireTime = this.utilsService.addMinuteInCurrentTime(5);

        const newData = new this.otpModel({
          email: email,
          code,
          expireTime,
          count: 1,
        });

        const saveData = await newData.save();
        const data = {
          _id: saveData._id,
        };
        // Sent Email
        const html = `<div style="width: 400px; font-family: Helvetica;">

        <div style="background: #f1f1f1; font-size: 20px; padding: 5px 10px; line-height: 0;">
            <h4>Hello,</h4>
        </div>
        <div style="background: #f8f8f8; padding: 5px 10px;">

             <p>You can reset your password by this code:</p>
            <p style="font-size: 17px; font-weight: 700;">${code}</p>
            <p>Reset your password</p>
            <p>If you did not request a new password, please let us know immediately by replying to this email.</p>
            <p></p>
            <p></p>

        </div>
        </div>`;
        await this.emailService.sendEmail(email, 'Reset Password Otp', html);
        console.log('code ', code);

        return {
          success: true,
          message: `Success! OTP code has been sent to your email.`,
          data,
        } as ResponsePayload;
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async validateOtpWithPhoneNo(
    ValidateOtpDto: ValidateOtpDto,
  ): Promise<ResponsePayload> {
    try {
      const { phoneNo } = ValidateOtpDto;
      const { code } = ValidateOtpDto;

      const otpData = await this.otpModel.findOne({ code, phoneNo });

      if (otpData) {
        const isExpired = this.utilsService.getDateDifference(
          new Date(),
          new Date(otpData.expireTime),
          'seconds',
        );

        if (isExpired <= 0) {
          return {
            success: false,
            message: 'Sorry! Invalid OTP',
            data: null,
          } as ResponsePayload;
        } else {
          if (code === otpData.code) {
            return {
              success: true,
              message: 'Success! OTP matched',
              data: null,
            } as ResponsePayload;
          } else {
            return {
              success: false,
              message: 'Sorry! Invalid OTP',
              data: null,
            } as ResponsePayload;
          }
        }
      } else {
        return {
          success: false,
          message: 'Sorry! Invalid OTP',
          data: null,
        } as ResponsePayload;
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  async validateOtpWithPhoneNoOrEmail(
    ValidateOtpDto: ValidateOtpDto,
  ): Promise<ResponsePayload> {
    try {
      const { phoneNo } = ValidateOtpDto;
      const { code } = ValidateOtpDto;

      const otpData = await this.otpModel.findOne({ code });

      if (otpData) {
        const isExpired = this.utilsService.getDateDifference(
          new Date(),
          new Date(otpData.expireTime),
          'seconds',
        );

        if (isExpired <= 0) {
          return {
            success: false,
            message: 'Sorry! Invalid OTP',
            data: null,
          } as ResponsePayload;
        } else {
          if (code === otpData.code) {
            return {
              success: true,
              message: 'Success! OTP matched',
              data: null,
            } as ResponsePayload;
          } else {
            return {
              success: false,
              message: 'Sorry! Invalid OTP',
              data: null,
            } as ResponsePayload;
          }
        }
      } else {
        return {
          success: false,
          message: 'Sorry! Invalid OTP',
          data: null,
        } as ResponsePayload;
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async validateOtpWithUsername(
    ValidateOtpDto: ValidateOtpDto,
  ): Promise<ResponsePayload> {
    try {
      const { phoneNo } = ValidateOtpDto;
      const { code } = ValidateOtpDto;

      const otpData = await this.otpModel.findOne({ code });

      if (otpData) {
        const isExpired = this.utilsService.getDateDifference(
          new Date(),
          new Date(otpData.expireTime),
          'seconds',
        );

        if (isExpired <= 0) {
          return {
            success: false,
            message: 'Sorry! Invalid OTP',
            data: null,
          } as ResponsePayload;
        } else {
          if (code === otpData.code) {
            return {
              success: true,
              message: 'Success! OTP matched',
              data: null,
            } as ResponsePayload;
          } else {
            return {
              success: false,
              message: 'Sorry! Invalid OTP',
              data: null,
            } as ResponsePayload;
          }
        }
      } else {
        return {
          success: false,
          message: 'Sorry! Invalid OTP',
          data: null,
        } as ResponsePayload;
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async validateAffiliateOtpWithUsername(
    validateOtpDto: ValidateOtpDto,
  ): Promise<ResponsePayload> {
    try {
      const { phoneNo } = validateOtpDto;
      const { code } = validateOtpDto;

      const otpData = await this.otpModel.findOne({ code });

      if (otpData) {
        const isExpired = this.utilsService.getDateDifference(
          new Date(),
          new Date(otpData.expireTime),
          'seconds',
        );

        if (isExpired <= 0) {
          return {
            success: false,
            message: 'Sorry! Invalid OTP',
            data: null,
          } as ResponsePayload;
        } else {
          if (code === otpData.code) {
            return {
              success: true,
              message: 'Success! OTP matched',
              data: null,
            } as ResponsePayload;
          } else {
            return {
              success: false,
              message: 'Sorry! Invalid OTP',
              data: null,
            } as ResponsePayload;
          }
        }
      } else {
        return {
          success: false,
          message: 'Sorry! Invalid OTP',
          data: null,
        } as ResponsePayload;
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async validateOtpWithEmail(
    ValidateOtpDto: ValidateOtpDto,
  ): Promise<ResponsePayload> {
    try {
      const { email } = ValidateOtpDto;
      const { code } = ValidateOtpDto;

      const otpData = await this.otpModel.findOne({ phoneNo: email });

      if (otpData) {
        const isExpired = this.utilsService.getDateDifference(
          new Date(),
          new Date(otpData.expireTime),
          'seconds',
        );

        if (isExpired <= 0) {
          return {
            success: false,
            message: 'Sorry! Invalid OTP',
            data: null,
          } as ResponsePayload;
        } else {
          if (code === otpData.code) {
            return {
              success: true,
              message: 'Success! OTP matched',
              data: null,
            } as ResponsePayload;
          } else {
            return {
              success: false,
              message: 'Sorry! Invalid OTP',
              data: null,
            } as ResponsePayload;
          }
        }
      } else {
        return {
          success: false,
          message: 'Sorry! Invalid OTP',
          data: null,
        } as ResponsePayload;
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
