import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsTemplateService {
  /**
   * Process SMS template by replacing dynamic tags with actual values
   * @param template - Custom message template from database (can be empty)
   * @param orderData - Object containing order information
   * @param defaultMessage - Fallback message if template is empty
   * @returns Processed message ready to send
   */
  processSmsTemplate(
    template: string,
    orderData: {
      orderId?: string;
      productNames?: string; // Already comma-separated
      estimateDelivery?: string;
      customerName?: string;
      customerPhone?: string;
      shopName?: string;
      orderTotal?: string;
    },
    defaultMessage: string,
  ): string {
    // If no custom template, use default
    if (!template || template.trim() === '') {
      return defaultMessage;
    }

    let processedMessage = template;

    // Replace all dynamic tags with actual values
    if (orderData.orderId) {
      processedMessage = processedMessage.replace(
        /{OrderId}/g,
        orderData.orderId,
      );
    }

    if (orderData.productNames) {
      processedMessage = processedMessage.replace(
        /{ProductName}/g,
        orderData.productNames,
      );
    }

    if (orderData.estimateDelivery) {
      processedMessage = processedMessage.replace(
        /{EstimateDelivery}/g,
        orderData.estimateDelivery,
      );
    }

    // Optional: Add more dynamic tags as needed
    if (orderData.customerName) {
      processedMessage = processedMessage.replace(
        /{CustomerName}/g,
        orderData.customerName,
      );
    }

    if (orderData.customerPhone) {
      processedMessage = processedMessage.replace(
        /{CustomerPhone}/g,
        orderData.customerPhone,
      );
    }

    if (orderData.shopName) {
      processedMessage = processedMessage.replace(
        /{ShopName}/g,
        orderData.shopName,
      );
    }

    if (orderData.orderTotal) {
      processedMessage = processedMessage.replace(
        /{OrderTotal}/g,
        orderData.orderTotal,
      );
    }

    return processedMessage;
  }

  /**
   * Get SMS message for Order Placed status
   */
  getOrderPlacedMessage(order: any, setting: any): string {
    const defaultMessage = `Dear customer, your order #${order.orderId} has been placed successfully. Thank you for shopping with us!`;

    // Get product names (comma-separated for multiple products)
    const productNames = this.extractProductNames(order.orderedItems);

    return this.processSmsTemplate(
      setting.smsCustomMessages?.orderPlaced || '',
      {
        orderId: order.orderId,
        productNames: productNames,
        estimateDelivery: this.formatDeliveryDate(order.estimatedDeliveryDate),
        customerName: order.user?.name || order.name,
        shopName:
          order.shop?.websiteName ||
          order.shop?.name ||
          setting?.shop?.websiteName ||
          'Your Shop',
        orderTotal: this.formatOrderTotal(order.grandTotal),
      },
      defaultMessage,
    );
  }

  getOrderPlacedMessageAdmin(
    fSetting: any,
    name: any,
    orderId: any,
    phoneNo: any,
    fShopInfo: any,
    orderData: any,
  ): string {
    const defaultMessage = `You've got a new order on your website! Order ID: ${orderId}. Customer Name: ${name},  Phone No: ${phoneNo} and Website: ${fShopInfo.domain}. View Order: https://admin.saleecom.com/order/order-details/${orderData._id}`;

    // Get product names (comma-separated for multiple products)
    // const productNames = this.extractProductNames(orderData.orderedItems);

    return this.processSmsTemplate(
      fSetting.smsCustomMessages?.adminNotification || '',
      {
        orderId: orderId,
        // estimateDelivery: this.formatDeliveryDate(order.estimatedDeliveryDate),
        customerName: name,
        customerPhone: phoneNo,
        shopName: fShopInfo.domain || 'Your Shop',
        // orderTotal: this.formatOrderTotal(order.grandTotal),
      },
      defaultMessage,
    );
  }

  /**
   * Get SMS message for Order Confirmed status
   */
  getOrderConfirmedMessage(order: any, setting: any): string {
    const defaultMessage = `Your order #${order.orderId} has been confirmed and is being prepared for delivery.`;

    const productNames = this.extractProductNames(order.orderedItems);

    return this.processSmsTemplate(
      setting.smsCustomMessages?.orderConfirmed || '',
      {
        orderId: order.orderId,
        productNames: productNames,
        estimateDelivery: this.formatDeliveryDate(order.estimatedDeliveryDate),
        customerName: order.user?.name || order.name,
        shopName:
          order.shop?.websiteName ||
          order.shop?.name ||
          setting?.shop?.websiteName ||
          'Your Shop',
        orderTotal: this.formatOrderTotal(order.grandTotal),
      },
      defaultMessage,
    );
  }

  /**
   * Get SMS message for Order Delivered status
   */
  getOrderDeliveredMessage(order: any, setting: any): string {
    const defaultMessage = `Your order #${order.orderId} has been delivered successfully. Thank you for your business!`;

    const productNames = this.extractProductNames(order.orderedItems);

    return this.processSmsTemplate(
      setting.smsCustomMessages?.orderDelivered || '',
      {
        orderId: order.orderId,
        productNames: productNames,
        estimateDelivery:
          this.formatDeliveryDate(order.deliveredDate) || 'Delivered',
        customerName: order.user?.name || order.name,
        shopName:
          order.shop?.websiteName ||
          order.shop?.name ||
          setting?.shop?.websiteName ||
          'Your Shop',
        orderTotal: this.formatOrderTotal(order.grandTotal),
      },
      defaultMessage,
    );
  }

  /**
   * Get SMS message for Order Canceled status
   */
  getOrderCanceledMessage(order: any, setting: any): string {
    const defaultMessage = `Your order #${order.orderId} has been canceled. If you have any questions, please contact our support team.`;

    const productNames = this.extractProductNames(order.orderedItems);

    return this.processSmsTemplate(
      setting.smsCustomMessages?.orderCanceled || '',
      {
        orderId: order.orderId,
        productNames: productNames,
        estimateDelivery: 'N/A',
        customerName: order.user?.name || order.name,
        shopName:
          order.shop?.websiteName ||
          order.shop?.name ||
          setting?.shop?.websiteName ||
          'Your Shop',
        orderTotal: this.formatOrderTotal(order.grandTotal),
      },
      defaultMessage,
    );
  }

  /**
   * Helper: Extract product names from order
   * Returns comma-separated string for multiple products
   */
  private extractProductNames(orderedItems: any[]): string {
    if (!orderedItems || orderedItems.length === 0) {
      return 'Your products';
    }

    // If single item
    if (orderedItems.length === 1) {
      const item = orderedItems[0];
      return item.name || item.product?.name || 'Your product';
    }

    // Multiple items - join with comma
    const names = orderedItems
      .map((item) => item.name || item.product?.name)
      .filter(Boolean)
      .slice(0, 3); // Limit to first 3 products to avoid too long SMS

    if (orderedItems.length > 3) {
      return names.join(', ') + ` and ${orderedItems.length - 3} more`;
    }

    return names.join(', ');
  }

  /**
   * Helper: Format delivery date
   */
  private formatDeliveryDate(date: Date | string): string {
    if (!date) {
      return 'Soon';
    }

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Soon';
    }
  }

  /**
   * Helper: Format order total amount
   */
  private formatOrderTotal(total: number): string {
    if (!total || total === 0) {
      return '৳0';
    }

    // Format with Bangladeshi Taka symbol and proper number formatting
    return `৳${total.toLocaleString('en-BD')}`;
  }
}
