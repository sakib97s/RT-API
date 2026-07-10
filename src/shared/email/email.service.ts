import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { ResponsePayload } from '../../interfaces/response-payload.interface';

/**
 * REf Video: https://youtu.be/-rcRf7yswfM
 */

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {
    // TODO IF NEED
  }

  /**
   * EMAIL METHODS
   * sendEmail
   */

  async sendEmail(
    email: string,
    subject: string,
    htmlBody: string,
    shopData?: any,
  ) {
    try {
      return {
        success: true,
        message: `Success! OTP code has been sent to your email.`,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async sendEmailAdmin(
    email: string,
    subject: string,
    htmlBody: string,
    shopData?: any,
  ) {
    try {
      // ⚙️ SMTP Config for Namecheap Private Email
      const smtpHost = this.configService.get<string>('SMTP_HOST') || 'mail.privateemail.com';
      const smtpPort = Number(this.configService.get<string>('SMTP_PORT')) || 465; // SSL port (use 587 for TLS)
      const smtpUser = this.configService.get<string>('SMTP_USER') || 'info@tradition.com';
      const smtpPass = this.configService.get<string>('SMTP_PASS') || 'sA*fa24Ub-S_kG@m'; // <-- use App Password if 2FA enabled

      // 📦 Create Transporter
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: true, // true for 465, false for 587
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // 📨 Email Details
      const emailFrom = `"${shopData?.domain || shopData?.websiteName || 'tradition Administrator'}" <${smtpUser}>`;
      const toReceiver = email;

      console.log('sendEmailAdmin ->>');

      const info = await transporter.sendMail({
        from: emailFrom,
        replyTo: smtpUser,
        to: toReceiver,
        subject: subject,
        html: htmlBody,
      });

      console.log('info', info);

      return {
        success: true,
        message: `Success! Email has been sent to ${email}.`,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Email Send Error:', error);
      // Do not throw to avoid crashing the server on unhandled rejections
      // throw new InternalServerErrorException(`Failed to send email: ${error.message}`);
      return { success: false, message: `Failed to send email: ${error.message}` };
    }
  }

  // async sendEmailAdmin(
  //   email: string,
  //   subject: string,
  //   htmlBody: string,
  //   shopData?: any,
  // ) {
  //   try {
  //     const gmail = this.configService.get<string>('gmail');
  //     const googleClientId = this.configService.get<string>('googleClientId');
  //     const googleClientSecret =
  //       this.configService.get<string>('googleClientSecret');
  //     const googleClientRedirectUrl = this.configService.get<string>(
  //       'googleClientRedirectUrl',
  //     );
  //     const googleRefreshToken =
  //       this.configService.get<string>('googleRefreshToken');
  //
  //     const oAuth2Client = new google.auth.OAuth2(
  //       googleClientId,
  //       googleClientSecret,
  //       googleClientRedirectUrl,
  //     );
  //     oAuth2Client.setCredentials({ refresh_token: googleRefreshToken });
  //
  //     const accessToken = await oAuth2Client.getAccessToken();
  //
  //     const transporter = nodemailer.createTransport({
  //       service: 'gmail',
  //       auth: {
  //         type: 'OAuth2',
  //         user: gmail,
  //         clientId: googleClientId,
  //         clientSecret: googleClientSecret,
  //         refreshToken: googleRefreshToken,
  //         accessToken: accessToken,
  //       },
  //     });
  //
  //     const emailFrom = gmail;
  //     const toReceiver = email;
  //
  //     const info = await transporter.sendMail({
  //       from: ` ${shopData?.domain ? shopData?.domain : (shopData?.websiteName ?? 'tradition')} <${emailFrom}>`,
  //       replyTo: emailFrom,
  //       to: toReceiver, //receiver
  //       subject: subject, // Subject line
  //       // text: "Hello this is text body", // plain text body
  //       html: htmlBody, // html body
  //     });
  //
  //     return {
  //       success: true,
  //       message: `Success! OTP code has been sent to your email.`,
  //     } as ResponsePayload;
  //   } catch (error) {
  //     console.log(error);
  //     throw new InternalServerErrorException(error.message);
  //   }
  // }

  async sendEmailFormPersonal(
    email: string,
    subject: string,
    htmlBody: string,
    shopData?: any,
  ) {
    try {
      // const transporter = nodemailer.createTransport({
      //   service: 'gmail',
      //   auth: {
      //     user: shopData?.appEmail, // Your Gmail
      //     pass: shopData?.appPassword, // App password
      //   },
      //   tls: {
      //     rejectUnauthorized: false, // ✅ Self-signed cert accept
      //   },
      // });
      // const mailOptions = {
      //   from: shopData?.appEmail,
      //   to: email,
      //   subject: subject,
      //   html: htmlBody,
      // };
      //
      // const info = await transporter.sendMail(mailOptions);
      // console.log('Email sent:', info.response);
      return null;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new InternalServerErrorException('Failed to send email.');
    }
  }

  // async sendEmail(name, email, file): Promise<ResponsePayload> {
  //   try {
  //     const gmail = this.configService.get<string>('gmail');
  //     const googleClientId = this.configService.get<string>('googleClientId');
  //     const googleClientSecret =
  //       this.configService.get<string>('googleClientSecret');
  //     const googleClientRedirectUrl = this.configService.get<string>(
  //       'googleClientRedirectUrl',
  //     );
  //     const googleRefreshToken =
  //       this.configService.get<string>('googleRefreshToken');
  //
  //     const oAuth2Client = new google.auth.OAuth2(
  //       googleClientId,
  //       googleClientSecret,
  //       googleClientRedirectUrl,
  //     );
  //     oAuth2Client.setCredentials({ refresh_token: googleRefreshToken });
  //
  //     const accessToken = await oAuth2Client.getAccessToken();
  //
  //     const transporter = nodemailer.createTransport({
  //       service: 'gmail',
  //       auth: {
  //         type: 'OAuth2',
  //         user: 'info@mkshippinglines.com',
  //         clientId: googleClientId,
  //         clientSecret: googleClientSecret,
  //         refreshToken: googleRefreshToken,
  //         accessToken: accessToken,
  //       },
  //     });
  //
  //     const emailFrom = gmail;
  //     const toReceiver = email;
  //
  //     const info = await transporter.sendMail({
  //       from: `"MK shipping Lines" <${emailFrom}>`,
  //       replyTo: emailFrom,
  //       to: toReceiver, //receiver
  //       subject: 'Thanks for your Cabin rentals.', // Subject line
  //       // text: "Hello this is text body", // plain text body
  //       html: `
  //           <p>Hi: (${name})</p>
  //           <p>We have completed your Cabin rentals. We hope you will enjoy travelling with us.</p>
  //           <p>Thanks for travelling with us.</p>
  //           <p>MK Shipping Lines</p>
  //           <p>Download App: <a href="https://rb.gy/aia3mx">https://rb.gy/aia3mx</a></p>
  //           `, // html body
  //       attachments: [
  //         {
  //           filename: `.pdf`, //my pdf name
  //           path: file, // the pdf content
  //           contentType: 'application/pdf', //Content type
  //         },
  //       ],
  //     });
  //
  //     return {
  //       success: true,
  //       message: 'Data Added Success',
  //     } as ResponsePayload;
  //   } catch (error) {
  //     console.log(error);
  //     throw new InternalServerErrorException(error.message);
  //   }
  // }
}
