// Minimal analytics adapter. Swap the impl for GA4 / Segment / etc. later.

type EventName =
  | "view_item_list"
  | "view_item"
  | "select_item"
  | "add_to_cart"
  | "remove_from_cart"
  | "view_cart"
  | "begin_checkout"
  | "add_shipping_info"
  | "add_payment_info"
  | "purchase";

export function track(event: EventName, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line no-console
  console.info(`[analytics] ${event}`, params);
}
