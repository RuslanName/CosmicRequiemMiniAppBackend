import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseFilters,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { VKPaymentsService } from './vk-payments.service';
import { VKNotificationDto } from './dtos/vk-notification.dto';
import { VKPaymentsExceptionFilter } from './filters/vk-payments-exception.filter';

@ApiTags('VK payments')
@Controller('vk-payments')
@UseFilters(VKPaymentsExceptionFilter)
export class VKPaymentsController {
  constructor(private readonly vkPaymentsService: VKPaymentsService) {}

  @Get('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get колбек для обработки платёжных уведомлений от VK',
    description:
      'Обрабатывает уведомления get_item, get_item_test и order_status_change от платформы ВКонтакте. Эндпоинт не требует токена аутентификации, так как VK отправляет запросы напрямую.',
  })
  @ApiQuery({ name: 'app_id', required: false })
  @ApiQuery({
    name: 'item',
    required: false,
    description: 'Идентификатор товара (item_id)',
  })
  @ApiQuery({ name: 'item_id', required: false })
  @ApiQuery({ name: 'lang', required: false })
  @ApiQuery({ name: 'notification_type', required: false })
  @ApiQuery({ name: 'order_id', required: false })
  @ApiQuery({ name: 'receiver_id', required: false })
  @ApiQuery({ name: 'user_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'item_price', required: false })
  @ApiQuery({ name: 'sig', required: false })
  @ApiResponse({
    status: 200,
    description: 'Уведомление успешно обработано',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный формат уведомления',
  })
  @ApiResponse({
    status: 401,
    description: 'Неверная подпись уведомления',
  })
  @ApiResponse({
    status: 404,
    description: 'Товар или пользователь не найден',
  })
  async handleCallbackGet(@Query() query: any): Promise<any> {
    const notification = this.parseQueryToNotification(query);
    return this.vkPaymentsService.handleNotification(notification, query);
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Post колбек для обработки платёжных уведомлений от VK',
    description:
      'Обрабатывает уведомления get_item, get_item_test и order_status_change от платформы ВКонтакте. Эндпоинт не требует токена аутентификации, так как VK отправляет запросы напрямую.',
  })
  @ApiBody({ type: VKNotificationDto })
  @ApiResponse({
    status: 200,
    description: 'Уведомление успешно обработано',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный формат уведомления',
  })
  @ApiResponse({
    status: 401,
    description: 'Неверная подпись уведомления',
  })
  @ApiResponse({
    status: 404,
    description: 'Товар или пользователь не найден',
  })
  async handleCallbackPost(@Body() body: any): Promise<any> {
    try {
      const notification: VKNotificationDto = {
        notification_type: body.notification_type,
        item_id: body.item_id || body.item,
        order_id: body.order_id ? Number(body.order_id) : undefined,
        status: body.status,
        app_id: body.app_id ? Number(body.app_id) : undefined,
        user_id: body.user_id ? Number(body.user_id) : undefined,
        item_price: body.item_price ? Number(body.item_price) : undefined,
        sig: body.sig,
      };

      return await this.vkPaymentsService.handleNotification(
        notification,
        body,
      );
    } catch (error) {
      throw error;
    }
  }

  private parseQueryToNotification(query: any): VKNotificationDto {
    const itemId = query.item_id || query.item || undefined;
    const finalItemId =
      itemId && typeof itemId === 'string' && itemId.trim() !== ''
        ? itemId.trim()
        : itemId || undefined;

    return {
      notification_type: query.notification_type,
      item_id: finalItemId,
      order_id: query.order_id ? Number(query.order_id) : undefined,
      status: query.status,
      app_id: query.app_id ? Number(query.app_id) : undefined,
      user_id: query.user_id ? Number(query.user_id) : undefined,
      item_price: query.item_price ? Number(query.item_price) : undefined,
      sig: query.sig,
    };
  }
}
