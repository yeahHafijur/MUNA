import type { OrderStatus } from '@/types';

/** Human-readable labels for order statuses — used in orders.tsx and vendor/orders.tsx */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  out_for_delivery: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
