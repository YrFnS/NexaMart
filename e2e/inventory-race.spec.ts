import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { APP_URL, loginWithApi, primeBrowser } from './helpers';

interface ApiResult<T> {
  ok: boolean;
  status: number;
  payload: T;
}

interface VariantSnapshot {
  id: string;
  sku: string;
  attributes: string;
  optionKey: string;
  stock: number;
  isActive: boolean;
}

interface ProductSnapshot {
  id: string;
  stock: number;
  soldCount: number;
  variantSkus: VariantSnapshot[];
}

interface ProductResponse {
  product?: ProductSnapshot;
  error?: string;
}

interface CheckoutResponse {
  orderNumbers?: string[];
  error?: string;
  code?: string;
}

interface OrderItemSnapshot {
  productId: string;
  variantId: string | null;
  sku: string | null;
  quantity: number;
}

interface StatusEventSnapshot {
  status: string;
  toStatus: string;
}

interface OrderSnapshot {
  id: string;
  orderNumber: string;
  status: string;
  inventoryRestoredAt: string | null;
  items: OrderItemSnapshot[];
  statusEvents: StatusEventSnapshot[];
}

interface OrdersResponse {
  orders?: OrderSnapshot[];
  error?: string;
}

interface TransitionResponse {
  order?: OrderSnapshot;
  error?: string;
  code?: string;
}

async function apiJson<T>(
  page: Page,
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown,
): Promise<ApiResult<T>> {
  const result = await page.evaluate(
    async ({ requestPath, requestMethod, requestBody }) => {
      const response = await fetch(requestPath, {
        method: requestMethod,
        credentials: 'same-origin',
        headers:
          requestBody === undefined
            ? undefined
            : { 'Content-Type': 'application/json' },
        body:
          requestBody === undefined
            ? undefined
            : JSON.stringify(requestBody),
      });
      return {
        ok: response.ok,
        status: response.status,
        payload: await response.json().catch(() => ({})),
      };
    },
    {
      requestPath: path,
      requestMethod: method,
      requestBody: body,
    },
  );

  return result as ApiResult<T>;
}

async function duplicatePost<T>(
  page: Page,
  path: string,
  body: unknown,
): Promise<Array<ApiResult<T>>> {
  const results = await page.evaluate(
    async ({ requestPath, requestBody }) =>
      Promise.all(
        [0, 1].map(async () => {
          const response = await fetch(requestPath, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });
          return {
            ok: response.ok,
            status: response.status,
            payload: await response.json().catch(() => ({})),
          };
        }),
      ),
    { requestPath: path, requestBody: body },
  );

  return results as Array<ApiResult<T>>;
}

async function productSnapshot(page: Page): Promise<ProductSnapshot> {
  const response = await apiJson<ProductResponse>(
    page,
    '/api/products/UHC-004',
  );
  expect(response.ok, response.payload.error || 'Product lookup failed.').toBe(
    true,
  );
  if (!response.payload.product) {
    throw new Error('The deterministic UHC-004 product is missing.');
  }
  return response.payload.product;
}

function cancellationEventCount(order: OrderSnapshot): number {
  return order.statusEvents.filter(
    (event) => event.status === 'cancelled' || event.toStatus === 'cancelled',
  ).length;
}

test.describe('P3 exact-SKU concurrency and restoration', () => {
  test('one competing checkout wins and cancellation restores stock once', async ({
    browser,
  }) => {
    const contextOptions = {
      baseURL: APP_URL,
      locale: 'en-US',
      timezoneId: 'Asia/Baghdad',
    };
    const [firstContext, secondContext] = await Promise.all([
      browser.newContext(contextOptions),
      browser.newContext(contextOptions),
    ]);

    try {
      const [firstPage, secondPage] = await Promise.all([
        firstContext.newPage(),
        secondContext.newPage(),
      ]);
      await Promise.all([primeBrowser(firstPage), primeBrowser(secondPage)]);
      await Promise.all([
        loginWithApi(firstPage, 'demo@nexamart.com'),
        loginWithApi(secondPage, 'ahmed@nexamart.com'),
      ]);

      const before = await productSnapshot(firstPage);
      const variant = before.variantSkus.find(
        (candidate) => candidate.isActive && candidate.stock > 0,
      );
      if (!variant) {
        throw new Error('UHC-004 has no active in-stock SKU.');
      }

      expect(before.variantSkus).toHaveLength(1);
      expect(before.stock).toBe(variant.stock);
      expect(variant.stock).toBeGreaterThan(0);
      expect(variant.stock).toBeLessThanOrEqual(100);

      const checkoutBody = (buyer: string) => ({
        idempotencyKey: randomUUID(),
        items: [
          {
            productId: before.id,
            variantId: variant.id,
            quantity: variant.stock,
            variation: variant.attributes,
          },
        ],
        shippingMethod: 'standard',
        paymentMethod: 'cash_on_delivery',
        address: {
          name: `P3 SKU Race ${buyer}`,
          phone: buyer === 'A' ? '+9647700000101' : '+9647700000102',
          address1: `Concurrency Street ${buyer}`,
          city: 'Baghdad',
          state: 'Baghdad',
          postalCode: '10001',
          country: 'Iraq',
        },
      });

      const outcomes = await Promise.all([
        apiJson<CheckoutResponse>(
          firstPage,
          '/api/checkout',
          'POST',
          checkoutBody('A'),
        ),
        apiJson<CheckoutResponse>(
          secondPage,
          '/api/checkout',
          'POST',
          checkoutBody('B'),
        ),
      ]);

      const winnerIndexes = outcomes.flatMap((outcome, index) =>
        outcome.status === 201 ? [index] : [],
      );
      const conflicts = outcomes.filter((outcome) => outcome.status === 409);
      expect(
        winnerIndexes,
        `Expected one checkout winner, received ${JSON.stringify(outcomes)}`,
      ).toHaveLength(1);
      expect(
        conflicts,
        `Expected one stock conflict, received ${JSON.stringify(outcomes)}`,
      ).toHaveLength(1);
      expect(conflicts[0].payload.error).toMatch(/stock|changed|available/i);

      const winnerIndex = winnerIndexes[0];
      const winnerPage = winnerIndex === 0 ? firstPage : secondPage;
      const winner = outcomes[winnerIndex];
      expect(winner.payload.orderNumbers).toHaveLength(1);
      const orderNumber = winner.payload.orderNumbers?.[0];
      if (!orderNumber) throw new Error('Winning checkout returned no order number.');

      const reserved = await productSnapshot(firstPage);
      expect(reserved.stock).toBe(0);
      expect(reserved.variantSkus[0]?.stock).toBe(0);
      expect(reserved.soldCount).toBe(before.soldCount + variant.stock);

      const ordersResponse = await apiJson<OrdersResponse>(
        winnerPage,
        '/api/orders?limit=100',
      );
      expect(
        ordersResponse.ok,
        ordersResponse.payload.error || 'Order lookup failed.',
      ).toBe(true);
      const order = ordersResponse.payload.orders?.find(
        (candidate) => candidate.orderNumber === orderNumber,
      );
      if (!order) throw new Error(`Order ${orderNumber} was not persisted.`);

      expect(order.status).toBe('pending');
      expect(order.inventoryRestoredAt).toBeNull();
      expect(cancellationEventCount(order)).toBe(0);
      expect(order.items).toHaveLength(1);
      expect(order.items[0]).toMatchObject({
        productId: before.id,
        variantId: variant.id,
        sku: variant.sku,
        quantity: variant.stock,
      });

      const cancellationPath = `/api/orders/${encodeURIComponent(order.id)}/transition`;
      const cancellationBody = {
        targetStatus: 'cancelled',
        reason: 'P3 concurrent exact-SKU restoration verification',
      };
      const cancellationOutcomes = await duplicatePost<TransitionResponse>(
        winnerPage,
        cancellationPath,
        cancellationBody,
      );

      expect(cancellationOutcomes.some((outcome) => outcome.status === 200)).toBe(
        true,
      );
      expect(
        cancellationOutcomes.every(
          (outcome) => outcome.status === 200 || outcome.status === 409,
        ),
        `Unexpected cancellation race result: ${JSON.stringify(
          cancellationOutcomes,
        )}`,
      ).toBe(true);

      const restored = await productSnapshot(firstPage);
      expect(restored.stock).toBe(before.stock);
      expect(restored.variantSkus[0]?.stock).toBe(variant.stock);
      expect(restored.soldCount).toBe(before.soldCount);

      const afterCancellationResponse = await apiJson<OrdersResponse>(
        winnerPage,
        `/api/orders?id=${encodeURIComponent(order.id)}`,
      );
      const afterCancellation = afterCancellationResponse.payload.orders?.[0];
      if (!afterCancellation) {
        throw new Error('Cancelled order could not be reloaded.');
      }
      expect(afterCancellation.status).toBe('cancelled');
      expect(afterCancellation.inventoryRestoredAt).toBeTruthy();
      expect(cancellationEventCount(afterCancellation)).toBe(1);
      const restorationTimestamp = afterCancellation.inventoryRestoredAt;

      const idempotentCancellation = await apiJson<TransitionResponse>(
        winnerPage,
        cancellationPath,
        'POST',
        cancellationBody,
      );
      expect(idempotentCancellation.status).toBe(200);
      expect(idempotentCancellation.payload.order?.inventoryRestoredAt).toBe(
        restorationTimestamp,
      );
      expect(
        idempotentCancellation.payload.order
          ? cancellationEventCount(idempotentCancellation.payload.order)
          : 0,
      ).toBe(1);

      const afterReplay = await productSnapshot(firstPage);
      expect(afterReplay.stock).toBe(before.stock);
      expect(afterReplay.variantSkus[0]?.stock).toBe(variant.stock);
      expect(afterReplay.soldCount).toBe(before.soldCount);
    } finally {
      await Promise.all([firstContext.close(), secondContext.close()]);
    }
  });
});
