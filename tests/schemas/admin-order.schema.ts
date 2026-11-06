import { orderSchema } from './order.schema';

// Адміністративне подання замовлення: публічні поля + власник.
export const adminOrderSchema = {
  ...orderSchema,
  properties: {
    ...orderSchema.properties,
    ownerId: { type: 'string', minLength: 1 },
  },
  required: [...orderSchema.required, 'ownerId'],
} as const;

export const adminOrderListSchema = {
  type: 'array',
  items: adminOrderSchema,
} as const;

export const errorSchema = {
  type: 'object',
  properties: { code: { type: 'string', minLength: 1 } },
  required: ['code'],
  additionalProperties: false,
} as const;
