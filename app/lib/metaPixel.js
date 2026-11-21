'use client';

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

export function isPixelReady() {
  return typeof window !== 'undefined' && typeof window.fbq === 'function' && Boolean(PIXEL_ID);
}

export function trackPageView() {
  if (!isPixelReady()) return;
  window.fbq('track', 'PageView');
}

export function trackViewContent({ id, name, price, category = 'General' }) {
  if (!isPixelReady()) return;
  window.fbq('track', 'ViewContent', {
    content_ids: id ? [String(id)] : [],
    content_name: name || '',
    content_type: 'product',
    content_category: category,
    value: Number(price) || 0,
    currency: 'BDT',
  });
}

export function trackAddToCart({ id, name, price, quantity = 1, category = 'General' }) {
  if (!isPixelReady()) return;
  window.fbq('track', 'AddToCart', {
    content_ids: id ? [String(id)] : [],
    content_name: name || '',
    content_type: 'product',
    content_category: category,
    value: (Number(price) || 0) * (Number(quantity) || 1),
    currency: 'BDT',
    num_items: Number(quantity) || 1,
  });
}

export function trackInitiateCheckout({ contentIds = [], totalValue = 0, numItems = 1 }) {
  if (!isPixelReady()) return;
  window.fbq('track', 'InitiateCheckout', {
    content_ids: contentIds.map((item) => String(item)),
    content_type: 'product',
    value: Number(totalValue) || 0,
    currency: 'BDT',
    num_items: Number(numItems) || 1,
  });
}

export function trackPurchaseOnce({ orderId, totalAmount, contentIds = [], numItems = 1 }) {
  if (!isPixelReady() || !orderId) return;

  const guardKey = `aureve_fb_purchase_tracked_${String(orderId)}`;
  try {
    if (window.sessionStorage.getItem(guardKey)) return;
    window.fbq(
      'track',
      'Purchase',
      {
        value: Number(totalAmount) || 0,
        currency: 'BDT',
        content_ids: contentIds.map((item) => String(item)),
        content_type: 'product',
        num_items: Number(numItems) || 1,
      },
      { eventID: `purchase_${String(orderId)}` }
    );
    window.sessionStorage.setItem(guardKey, '1');
  } catch {
    window.fbq(
      'track',
      'Purchase',
      {
        value: Number(totalAmount) || 0,
        currency: 'BDT',
        content_ids: contentIds.map((item) => String(item)),
        content_type: 'product',
        num_items: Number(numItems) || 1,
      },
      { eventID: `purchase_${String(orderId)}` }
    );
  }
}
