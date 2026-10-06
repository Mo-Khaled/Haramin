import { z } from 'zod';

export type ShipmentStatus =
  | 'created'
  | 'cancelled'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'exception';

/** Maps Bosta's numeric delivery states to a small status vocabulary. */
export function mapBostaState(state: number): ShipmentStatus {
  if (state === 45) return 'delivered';
  if (state === 41) return 'out_for_delivery';
  if (state === 46 || state === 60) return 'returned';
  if (state === 47 || state === 48 || state === 49 || state === 100 || state === 101) return 'exception';
  if (state >= 30 && state < 41) return 'in_transit';
  if (state >= 20 && state < 30) return 'picked_up';
  return 'created';
}

export interface ShopifyOrderPayload {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  total_price: string;
  subtotal_price: string;
  total_outstanding?: string;
  financial_status?: string;
  payment_gateway_names?: string[];
  checkout_id?: number | null;
  cancelled_at?: string | null;
  note?: string | null;
  customer?: { id: number; first_name?: string | null; last_name?: string | null; phone?: string | null } | null;
  shipping_address?: {
    first_name?: string | null;
    last_name?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    province?: string | null;
    phone?: string | null;
  } | null;
  line_items?: { quantity: number; title: string }[];
}

export interface BostaDeliveryPayload {
  type: number;
  cod: number;
  businessReference: string;
  webhookUrl?: string;
  notes?: string;
  specs: { packageDetails: { itemsCount: number; description: string } };
  dropOffAddress: { city: string; firstLine: string; secondLine?: string };
  receiver: { firstName: string; lastName: string; phone: string; email?: string };
}

const BOSTA_SEND_TYPE = 10;

/** Amount the courier must collect: the unpaid balance for COD orders, zero otherwise. */
export function codAmount(order: ShopifyOrderPayload, collectOnDelivery: boolean): number {
  if (!collectOnDelivery) return 0;
  const outstanding = parseFloat(order.total_outstanding ?? order.total_price);
  return Number.isFinite(outstanding) ? outstanding : 0;
}

export function buildDeliveryPayload(
  order: ShopifyOrderPayload,
  collectOnDelivery: boolean,
  webhookUrl?: string,
): BostaDeliveryPayload | null {
  const address = order.shipping_address;
  const phone = address?.phone ?? order.phone ?? order.customer?.phone;
  if (!address?.address1 || !address.city || !phone) return null;

  const items = order.line_items ?? [];
  return {
    type: BOSTA_SEND_TYPE,
    cod: codAmount(order, collectOnDelivery),
    businessReference: order.name,
    webhookUrl,
    notes: order.note ?? undefined,
    specs: {
      packageDetails: {
        itemsCount: items.reduce((sum, item) => sum + item.quantity, 0) || 1,
        description: items.map((i) => i.title).join(', ').slice(0, 200) || 'Perfumes',
      },
    },
    dropOffAddress: {
      city: address.city,
      firstLine: address.address1,
      secondLine: address.address2 ?? undefined,
    },
    receiver: {
      firstName: address.first_name ?? order.customer?.first_name ?? 'Customer',
      lastName: address.last_name ?? order.customer?.last_name ?? '-',
      phone,
      email: order.email ?? undefined,
    },
  };
}

const identifier = z.union([z.string(), z.number()]).transform(String).pipe(z.string().regex(/^[A-Za-z0-9_-]{1,64}$/));

/** Runtime shape of a Bosta webhook body: identifiers are plain scalars, never Prisma filter objects. */
export const bostaEventSchema = z
  .object({
    _id: identifier.optional(),
    trackingNumber: identifier.optional(),
    state: z.union([z.number().int(), z.object({ code: z.number().int() })]),
  })
  .refine((event) => event._id !== undefined || event.trackingNumber !== undefined);

export type BostaEvent = z.infer<typeof bostaEventSchema>;

export function bostaStateCode(event: BostaEvent): number {
  return typeof event.state === 'object' ? event.state.code : event.state;
}
