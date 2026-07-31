import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Newsletter } from '../../interfaces/newsletter.interface';
import { AddNewsletterDto } from './dto/add-newsletter.dto';
import { ResponsePayload } from '../../interfaces/response-payload.interface';

@Injectable()
export class NewsletterService {
  private logger = new Logger(NewsletterService.name);

  constructor(
    @InjectModel('Newsletter')
    private readonly newsletterModel: Model<Newsletter>,
  ) {}

  async addNewsletter(
    addNewsletterDto: AddNewsletterDto,
  ): Promise<ResponsePayload> {
    try {
      const existing = await this.newsletterModel.findOne({ email: addNewsletterDto.email });
      if (existing) {
        return {
          success: true,
          message: 'Already subscribed to newsletter',
        } as ResponsePayload;
      }

      const newData = new this.newsletterModel(addNewsletterDto);
      await newData.save();

      return {
        success: true,
        message: 'Successfully subscribed to newsletter',
      } as ResponsePayload;
    } catch (error) {
      this.logger.error(error);
      return {
        success: false,
        message: error.message,
      } as ResponsePayload;
    }
  }

  async getAllNewsletters(paginate: any): Promise<ResponsePayload> {
    try {
      const query = {};
      const pageSize = paginate.pageSize ? Number(paginate.pageSize) : 0;
      const currentPage = paginate.currentPage ? Number(paginate.currentPage) : 0;
      let skip = 0;
      if (pageSize && currentPage) {
        skip = pageSize * (currentPage - 1);
      }

      let data = [];
      let count = 0;

      if (pageSize && currentPage) {
        data = await this.newsletterModel
          .find(query)
          .skip(skip)
          .limit(pageSize)
          .sort({ createdAt: -1 });
        count = await this.newsletterModel.countDocuments(query);
      } else {
        data = await this.newsletterModel.find(query).sort({ createdAt: -1 });
        count = await this.newsletterModel.countDocuments(query);
      }

      return {
        success: true,
        message: 'Success',
        data: {
          data,
          count,
        },
      } as ResponsePayload;
    } catch (error) {
      this.logger.error(error);
      return {
        success: false,
        message: error.message,
      } as ResponsePayload;
    }
  }

  async deleteNewsletterById(id: string): Promise<ResponsePayload> {
    try {
      await this.newsletterModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (error) {
      this.logger.error(error);
      return {
        success: false,
        message: error.message,
      } as ResponsePayload;
    }
  }
}
