import { Injectable } from '@nestjs/common';
import * as moment from 'moment-timezone';
import * as crypto from 'crypto';
import { Model, Types } from 'mongoose';
import { Product } from '../../pages/product/interfaces/product.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';

@Injectable()
export class UtilsService {
  constructor(
    @InjectModel('Product') private readonly productModel: Model<Product>,
  ) {
    // TODO IF NEED
  }

  /**
   * MOMENT DATE FUNCTIONS
   * getDateString
   */
  getDateString(date: Date): string {
    return moment(date).format('YYYY-MM-DD');
  }

  getNextDateString(date: Date, day: number): string {
    return moment(date).add(day, 'days').format('YYYY-MM-DD');
  }

  getLocalDateTime(): Date {
    const newDate = moment().tz('Asia/Dhaka');
    return newDate.toDate();
  }

  getDateYear(date?: any): number {
    let d;
    if (date) {
      d = new Date(date);
    } else {
      d = new Date();
    }
    return d.getFullYear();
  }

  getCurrentTime(): string {
    return moment(new Date()).format('hh:mm a');
  }

  getDateMonth(date?: any, fromZero?: boolean): number {
    let d;
    if (date) {
      d = new Date(date);
    } else {
      d = new Date();
    }
    const month = d.getMonth();
    return fromZero ? month : month + 1;
  }

  getDateWithCurrentTime(date: Date): Date {
    const _ = moment().tz('Asia/Dhaka');
    // const newDate = moment(date).add({hours: _.hour(), minutes:_.minute() , seconds:_.second()});
    const newDate = moment(date).add({ hours: _.hour(), minutes: _.minute() });
    return newDate.toDate();
  }

  addMinuteInCurrentTime(time: number): Date {
    const newDate = moment().tz('Asia/Dhaka').add(time, 'minutes');
    return newDate.toDate();
  }

  getDateDifference(
    date1: Date | string,
    date2: Date | string,
    unit?: string,
  ): number {
    /**
     * If First Date is Current or Future Date
     * If Second Date is Expire or Old Date
     * Return Positive Value If Not Expired
     */
    const a = moment(date1).tz('Asia/Dhaka');
    const b = moment(date2).tz('Asia/Dhaka');

    switch (unit) {
      case 'seconds': {
        return b.diff(a, 'seconds');
      }
      case 'minutes': {
        return b.diff(a, 'minutes');
      }
      case 'hours': {
        return b.diff(a, 'hours');
      }
      case 'days': {
        return b.diff(a, 'days');
      }
      case 'weeks': {
        return b.diff(a, 'weeks');
      }
      default: {
        return b.diff(a, 'hours');
      }
    }
  }

  /**
   * STRING FUNCTIONS
   * transformToSlug
   */
  transformToSlug(value: string, salt?: boolean): string {
    let text = value?.toLowerCase()?.trim() || '';

    // Space to hyphen
    text = text.replace(/\s+/g, '-');

    // Remove any character except Bengali, English, digits, hyphen
    text = text.replace(/[^\u0980-\u09FFa-zA-Z0-9-]/g, '');

    // Remove multiple hyphens
    text = text.replace(/-+/g, '-');
    // Remove trailing hyphen
    text = text.replace(/-+$/, '');
    return salt ? `${text}-${Math.floor(Math.random() * 100000)}` : text;
  }

  public createRegexFromString(inputString: string) {
    // Escape any special characters in the input string
    const escapedString = inputString.replace(
      /[-[\]{}()*+?.,\\^$|/#]/g,
      '\\$&',
    );
    // return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    // Create a regex pattern that matches any symbol, number, and character
    // const regexPattern = `.*[${escapedString}].*`;

    // Create a case-insensitive regex
    return new RegExp(escapedString.trim(), 'i');
  }

  /**
   * RANDOM FUNCTIONS
   * getRandomInt()
   * getRandomString()
   */
  getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getRandomString(count: number, lastValue: string | number) {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let result = ' ';
    const charactersLength = characters.length;
    for (let i = 0; i < count; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return `${result}${lastValue}`;
  }

  /**
   * PAD LEADING
   */
  padLeadingZeros(num): string {
    return String(num).padStart(4, '0');
  }

  /**
   * Ensure 6-character ID with padding
   */
  public padAlphanumeric(str: string): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
    while (str.length < 6) {
      str = characters[Math.floor(Math.random() * characters.length)] + str;
    }
    return str;
  }
  /**
   * GENERATE OTP
   * getRandomOtpCode4()
   * getRandomOtpCode6()
   */
  getRandomOtpCode4(): string {
    return (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
  }

  getRandomOtpCode6(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  bytesToKb(bytes: number): number {
    const res = bytes * 0.001;
    return Number(res.toFixed(2));
  }

  /**
   * Calculation
   * getProductPrice()
   * basicPriceCalc()
   */

  getProductPrice(
    product: any,
    type:
      | 'regularPrice'
      | 'salePrice'
      | 'discountAmount'
      | 'discountPercentage',
    variationId?: string,
    quantity?: number,
    isWholesale?: boolean,
  ): number {
    if (product) {
      switch (type) {
        case 'salePrice': {
          if (product.isVariation && product.variationList.length) {
            const item = product.variationList.find(
              (f) =>
                f._id.toString() ===
                (variationId?.toString() ??
                  product.variationList[0]._id.toString()),
            );
            if (item) {
              if (quantity) {
                return Math.round(
                  ((isWholesale ? item.wholesalePrice : item.salePrice) ?? 0) *
                    quantity,
                );
              }
              return (isWholesale ? item.wholesalePrice : item.salePrice) ?? 0;
            } else {
              return 0;
            }
          } else {
            if (quantity) {
              return Math.round(
                ((isWholesale ? product.wholesalePrice : product.salePrice) ??
                  0) * quantity,
              );
            }
            return (
              (isWholesale ? product.wholesalePrice : product.salePrice) ?? 0
            );
          }
        }

        case 'regularPrice': {
          if (product.isVariation && product.variationList.length) {
            const item = product.variationList.find(
              (f) =>
                f._id.toString() ===
                (variationId?.toString() ??
                  product.variationList[0]._id.toString()),
            );
            if (item) {
              if (quantity) {
                return Math.round((item.regularPrice ?? 0) * quantity);
              }
              return item.regularPrice ?? 0;
            } else {
              return 0;
            }
          } else {
            if (quantity) {
              return Math.round((product.regularPrice ?? 0) * quantity);
            }
            return product.regularPrice ?? 0;
          }
        }

        case 'discountAmount': {
          if (product.isVariation && product.variationList.length) {
            const item = product.variationList.find(
              (f) =>
                f._id.toString() ===
                (variationId?.toString() ??
                  product.variationList[0]._id.toString()),
            );
            if (item) {
              if (quantity) {
                return Math.round(
                  ((item.regularPrice ?? 0) - (item.salePrice ?? 0)) * quantity,
                );
              }
              return (item.regularPrice ?? 0) - (item.salePrice ?? 0);
            } else {
              return 0;
            }
          } else {
            if (quantity) {
              return Math.round(
                ((product.regularPrice ?? 0) -
                  ((isWholesale ? product.wholesalePrice : product.salePrice) ??
                    0)) *
                  quantity,
              );
            }
            return (
              (product.regularPrice ?? 0) -
              ((isWholesale ? product.wholesalePrice : product.salePrice) ?? 0)
            );
          }
        }

        case 'discountPercentage': {
          if (product.isVariation && product.variationList.length) {
            const item = product.variationList.find(
              (f) =>
                f._id.toString() ===
                (variationId.toString() ??
                  product.variationList[0]._id.toString()),
            );
            if (item) {
              if (quantity) {
                return Math.round(
                  (((item.regularPrice ?? 0) - (item.salePrice ?? 0)) /
                    (item.regularPrice ?? 0)) *
                    100 *
                    quantity,
                );
              }
              return Math.round(
                (((item.regularPrice ?? 0) - (item.salePrice ?? 0)) /
                  (item.regularPrice ?? 0)) *
                  100,
              );
            } else {
              return 0;
            }
          } else {
            if (quantity) {
              return Math.round(
                (((product.regularPrice ?? 0) -
                  ((isWholesale ? product.wholesalePrice : product.salePrice) ??
                    0)) /
                  (product.regularPrice ?? 0)) *
                  100 *
                  quantity,
              );
            }
            return Math.round(
              (((product.regularPrice ?? 0) -
                ((isWholesale ? product.wholesalePrice : product.salePrice) ??
                  0)) /
                (product.regularPrice ?? 0)) *
                100,
            );
          }
        }

        default: {
          return (
            (isWholesale ? product.wholesalePrice : product.salePrice) ?? 0
          );
        }
      }
    } else {
      return 0;
    }
  }

  basicPriceCalc(price: number, discountAmount: number, discountType: string) {
    if (discountType === 'cash') {
      return price - discountAmount;
    } else if (discountType === 'percent') {
      const dis = (discountAmount / 100) * price;
      return price - dis;
    } else {
      return price;
    }
  }

  /**
   * Hash Data
   * SHA256 hashing Format
   * hashDataSha256()
   * formatPhoneNumber()
   */
  hashDataSha256(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  formatPhoneNumber(phone: string): string {
    // Ensure phone is in E.164 format (e.g., +1234567890)
    return phone.replace(/\D/g, ''); // Remove non-numeric characters
  }

  isSameDay(date: Date) {
    const today = moment().startOf('day').toDate();
    return moment(date).isSame(today, 'day');
  }

  /**
   * Domain Validation
   */

  isValidDomain(domain: string): boolean {
    const allowedTLDs = [
      '.com',
      '.net',
      '.org',
      '.shop',
      '.store',
      '.com.bd',
      '.xyz',
      '.sg',
      '.ae',
      '.me',
      '.in',
      '.eu',
      '.site',
      '.vip',
    ];
    domain = domain.trim().toLowerCase();

    if (
      domain.length > 253 || // Max length
      domain.includes(' ') || // No spaces
      domain.includes('/') || // No forward slash
      domain.includes('\\') || // No backslash
      domain.includes('@') || // No email format
      domain.includes('#') ||
      domain.includes('$') ||
      domain.includes('%') ||
      domain.includes('&') ||
      domain.includes('..') || // No double dot
      domain.includes('_') || // No underscore
      /[^\x00-\x7F]/.test(domain) || // No unicode/emoji
      domain.startsWith('.') ||
      domain.endsWith('.') ||
      domain.startsWith('-') ||
      domain.endsWith('-')
    ) {
      return false;
    }

    // Match general domain format
    const domainRegex = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z]{2,})+$/;
    if (!domainRegex.test(domain)) return false;

    // Check for allowed TLD
    return allowedTLDs.some((tld) => domain.endsWith(tld));
  }

  isValidFacebookAccessTokenFormat(token: string) {
    if (!token || typeof token !== 'string') return false;

    // Must start with EAA or EAAB/EAAC... (valid Facebook app token prefix)
    const validPrefixes = ['EAA', 'EAAB', 'EAAC', 'EAAD', 'EAAF', 'EAAG'];
    const startsWithValidPrefix = validPrefixes.some((prefix) =>
      token.startsWith(prefix),
    );

    // Check if token is reasonably long (to avoid short or malformed tokens)
    const isLengthValid = token.length >= 100;

    // Check for invalid characters (spaces, control characters)
    const hasInvalidCharacters = /\s/.test(token);

    return startsWithValidPrefix && isLengthValid && !hasInvalidCharacters;
  }

  isValidFacebookPixelId(pixelId: string): boolean {
    if (!pixelId || typeof pixelId !== 'string') return false;

    // Check: Only digits and at least 10-20 characters long
    const pixelIdRegex = /^\d{10,20}$/;

    return pixelIdRegex.test(pixelId);
  }

  getClientIp(req: Request): string | undefined {
    const xff = (req.headers['x-forwarded-for'] ||
      req.headers['cf-connecting-ip'] ||
      '') as string;
    const remote = (req.socket?.remoteAddress || '') as string;

    const candidates = String(xff || remote)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // প্রথম public IP
    for (const ip of candidates) {
      if (!this.isPrivateOrLoopback(ip)) return ip;
    }
    return undefined;
  }

  private isPrivateOrLoopback(ip: string): boolean {
    // খুব সরল চেক; চাইলে আরও রোবাস্ট প্যাকেজ ব্যবহার করতে পারেন (e.g., ipaddr.js)
    const v4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);
    if (v4) {
      const parts = ip.split('.').map(Number);
      const [a, b] = parts;
      if (ip === '127.0.0.1') return true;
      if (a === 10) return true;
      if (a === 192 && b === 168) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      return false;
    }
    // treat IPv6
    const lower = ip.toLowerCase();
    if (lower === '::1') return true; // loopback
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local (fc00::/7)
    return false;
  }

  /**
   * METHODS
   * updateProductsOnOfferStart()
   */

  public async updateProductsOnOfferStart(items: any[]) {
    const ids = items.map((i) => new Types.ObjectId(i.product));
    const types = items.map((i) => i.offerDiscountType);
    const amts = items.map((i) => i.offerDiscountAmount);

    await this.productModel.updateMany({ _id: { $in: ids } }, [
      { $set: { _idx: { $indexOfArray: [ids, '$_id'] } } },
      {
        $set: {
          _type: { $arrayElemAt: [types, '$_idx'] },
          _amt: { $arrayElemAt: [amts, '$_idx'] },
          discountType: { $arrayElemAt: [types, '$_idx'] },
          discountAmount: { $arrayElemAt: [amts, '$_idx'] },
        },
      },

      // variation না হলে -> regularPrice - discount
      {
        $set: {
          salePrice: {
            $cond: [
              { $ne: ['$isVariation', true] },
              {
                $let: {
                  vars: {
                    base: { $ifNull: ['$regularPrice', 0] },
                    disc: {
                      $cond: [
                        { $eq: ['$_type', 1] }, // percent
                        {
                          $divide: [
                            { $multiply: ['$regularPrice', '$_amt'] },
                            100,
                          ],
                        },
                        '$_amt', // flat
                      ],
                    },
                  },
                  in: {
                    $max: [
                      0,
                      { $round: [{ $subtract: ['$$base', '$$disc'] }, 2] },
                    ],
                  },
                },
              },
              '$salePrice',
            ],
          },
        },
      },

      // variation হলে প্রতিটি variationList.regularPrice - discount
      {
        $set: {
          variationList: {
            $cond: [
              { $eq: ['$isVariation', true] },
              {
                $map: {
                  input: '$variationList',
                  as: 'v',
                  in: {
                    $mergeObjects: [
                      '$$v',
                      {
                        salePrice: {
                          $let: {
                            vars: {
                              vbase: { $ifNull: ['$$v.regularPrice', 0] },
                              vdisc: {
                                $cond: [
                                  { $eq: ['$_type', 1] }, // percent
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          '$$v.regularPrice',
                                          '$_amt',
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                  '$_amt',
                                ],
                              },
                            },
                            in: {
                              $max: [
                                0,
                                {
                                  $round: [
                                    { $subtract: ['$$vbase', '$$vdisc'] },
                                    2,
                                  ],
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
              '$variationList',
            ],
          },
        },
      },

      { $unset: ['_idx', '_type', '_amt'] },
    ]);
  }

  public async updateProductsOnOfferEnd(items: any) {
    if (!items?.length) return;

    const ids = items.map((i) => new Types.ObjectId(i.product));
    const resets = items.map((i) => !!i.resetDiscount);

    await this.productModel.updateMany({ _id: { $in: ids } }, [
      // map incoming arrays -> doc-local temp fields
      { $set: { _idx: { $indexOfArray: [ids, '$_id'] } } },
      { $set: { _reset: { $arrayElemAt: [resets, '$_idx'] } } },

      // 1) Non-variation: salePrice_new = salePrice_current + discountAmountComputed
      //    where discountAmountComputed = (discountType==1 ? regularPrice * discountAmount/100 : discountAmount)
      {
        $set: {
          salePrice: {
            $cond: [
              { $and: [{ $ne: ['$isVariation', true] }, '$_reset'] },
              {
                $let: {
                  vars: {
                    base: { $ifNull: ['$salePrice', '$regularPrice'] },
                    disc: {
                      $cond: [
                        { $eq: ['$discountType', 1] }, // percent
                        {
                          $divide: [
                            {
                              $multiply: [
                                { $ifNull: ['$regularPrice', 0] },
                                { $ifNull: ['$discountAmount', 0] },
                              ],
                            },
                            100,
                          ],
                        },
                        { $ifNull: ['$discountAmount', 0] }, // flat
                      ],
                    },
                  },
                  in: { $round: [{ $add: ['$$base', '$$disc'] }, 2] },
                },
              },
              '$salePrice',
            ],
          },
        },
      },

      // 2) Variation: প্রতিটি variationList আইটেমে salePrice_new = salePrice_current + vDiscount
      //    vDiscount = (discountType==1 ? v.regularPrice * discountAmount/100 : discountAmount)
      {
        $set: {
          variationList: {
            $cond: [
              { $and: [{ $eq: ['$isVariation', true] }, '$_reset'] },
              {
                $map: {
                  input: '$variationList',
                  as: 'v',
                  in: {
                    $mergeObjects: [
                      '$$v',
                      {
                        salePrice: {
                          $let: {
                            vars: {
                              vbase: {
                                $ifNull: ['$$v.salePrice', '$$v.regularPrice'],
                              },
                              vdisc: {
                                $cond: [
                                  { $eq: ['$discountType', 1] }, // percent
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          { $ifNull: ['$$v.regularPrice', 0] },
                                          { $ifNull: ['$discountAmount', 0] },
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                  { $ifNull: ['$discountAmount', 0] }, // flat
                                ],
                              },
                            },
                            in: {
                              $round: [{ $add: ['$$vbase', '$$vdisc'] }, 2],
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
              '$variationList',
            ],
          },
        },
      },

      // 3) reset হলে discount ফিল্ডগুলো null করুন
      {
        $set: {
          discountType: { $cond: ['$_reset', null, '$discountType'] },
          discountAmount: { $cond: ['$_reset', null, '$discountAmount'] },
        },
      },

      // temp cleanup
      { $unset: ['_idx', '_reset'] },
    ]);
  }
}

