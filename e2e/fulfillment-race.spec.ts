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
}

interface OrderItemSnapshot {
  id: string;
  productId: string;
  variantId: string | null;
  sku: string | null;
  quantity: number;
}

interface OrderSnapshot {
  id: string;
  orderNumber: string;
  status: string;
  items: OrderItemSnapshot[];
}

interface OrdersResponse {
  orders?: OrderSnapshot[];
  error?: string;
}

interface OrderTransitionResponse {
  order?: OrderSnapshot;
  error?: string;
  code?: string;
}

interface ReturnSnapshot {
  id: string;
  orderItemId: string | null;
  productId: string;
  variantId: string | null;
  sku: string | null;
  quantity: number;
  status: string;
  resolution: string;
  inventoryDisposition?: string | null;
  inventoryRestoredAt?: string | null;
  replacementShipment?: ReplacementSnapshot | null;
}

interface ReturnResponse {
  return?: ReturnSnapshot;
  error?: string;
  code?: string;
}

interface ReplacementSnapshot {
  id: string;
  status: string;
  quantity: number;
  sku: string | null;
  inventoryReservedAt: string;
  inventoryRestoredAt: string | null;
}

interface FulfillmentWorkspaceResponse {
  returns?: ReturnSnapshot[];
  error?: string;
}

interface FulfillmentOperationResponse {
  success?: boolean;
  action?: string;
  returnId?: string;
  shipmentId?: string;
  status?: string;
  idempotent?: boolean;
  error?: string;
  code?: string;
}

async function apiJson<T>(
  page: Page,
  path: string,
  method: 'GET' | 'POST' | 'PUT' = 'GET',
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

async function duplicatePut<T>(
  page: Page,
  path: string,
  body: unknown,
): Promise<Array<ApiResult<T>>> {
  const results = await page.evaluate(
    async ({ requestPath, requestBody }) =>
      Promise.all(
        [0, 1].map(async () => {
          const response = await fetch(requestPath, {
            method: 'PUT',
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

async function transitionSellerOrder(
  page: Page,
  orderId: string,
  targetStatus: string,
  extra: Record<string, unknown> = {},
) {
  const response = await apiJson<OrderTransitionResponse>(
    page,
    '/api/seller/orders',
    'PUT',
    { orderId, targetStatus, ...extra },
  );
  expect(
    response.ok,
    response.payload.error || `Order transition to ${targetStatus} failed.`,
  ).toBe(true);
  expect(response.payload.order?.status).toBe(targetStatus);
}

async function transitionReturn(
  page: Page,
  returnId: string,
  targetStatus: string,
) {
  const response = await apiJson<ReturnResponse>(
    page,
    '/api/returns',
    'PUT',
    { returnId, targetStatus },
  );
  expect(
    response.ok,
    response.payload.error || `Return transition to ${targetStatus} failed.`,
  ).toBe(true);
  expect(response.payload.return?.status).toBe(targetStatus);
}

async function fulfillmentWorkspace(
  page: Page,
): Promise<FulfillmentWorkspaceResponse> {
  const response = await apiJson<FulfillmentWorkspaceResponse>(
    page,
    '/api/seller/fulfillment',
  );
  expect(
    response.ok,
    response.payload.error || 'Fulfillment workspace lookup failed.',
  ).toBe(true);
  return response.payload;
}

function expectControlledConcurrentResults<T>(
  outcomes: Array<ApiResult<T>>,
  label: string,
) {
  expect(
    outcomes.some((outcome) => outcome.status === 200),
    `${label} produced no successful operation: ${JSON.stringify(outcomes)}`,
  ).toBe(true);
  expect(
    outcomes.every(
      (outcome) => outcome.status === 200 || outcome.status === 409,
    ),
    `${label} leaked an uncontrolled response: ${JSON.stringify(outcomes)}`,
  ).toBe(true);
}

test.describe.configure({ retries: 0 });

test.describe('P3 return disposition and replacement inventory', () => {
  test('restock and replacement cancellation mutate exact SKU stock once', async ({
    browser,
  }) => {
    const contextOptions = {
      baseURL: APP_URL,
      locale: 'en-US',
      timezoneId: 'Asia/Baghdad',
    };
    const [buyerContext, sellerContext] = await Promise.all([
      browser.newContext(contextOptions),
      browser.newContext(contextOptions),
    ]);

    try {
      const [buyerPage, sellerPage] = await Promise.all([
        buyerContext.newPage(),
        sellerContext.newPage(),
      ]);
      await Promise.all([primeBrowser(buyerPage), primeBrowser(sellerPage)]);
      await Promise.all([
        loginWithApi(buyerPage, 'demo@nexamart.com'),
        loginWithApi(sellerPage, 'seller@nexamart.com'),
      ]);

      const before = await productSnapshot(buyerPage);
      const variant = before.variantSkus.find(
        (candidate) => candidate.isActive && candidate.stock >= 2,
      );
      if (!variant) {
        throw new Error('UHC-004 has no exact SKU with two available units.');
      }
      expect(before.variantSkus).toHaveLength(1);
      expect(before.stock).toBe(variant.stock);

      const checkout = await apiJson<CheckoutResponse>(
        buyerPage,
        '/api/checkout',
        'POST',
        {
          idempotencyKey: randomUUID(),
          items: [
            {
              productId: before.id,
              variantId: variant.id,
              quantity: 2,
              variation: variant.attributes,
            },
          ],
          shippingMethod: 'standard',
          paymentMethod: 'cash_on_delivery',
          address: {
            name: 'P3 Fulfillment Buyer',
            phone: '+9647700000201',
            address1: 'Fulfillment Street 200',
            city: 'Baghdad',
            state: 'Baghdad',
            postalCode: '10001',
            country: 'Iraq',
          },
        },
      );
      expect(checkout.status, checkout.payload.error || 'Checkout failed.').toBe(
        201,
      );
      expect(checkout.payload.orderNumbers).toHaveLength(1);
      const orderNumber = checkout.payload.orderNumbers?.[0];
      if (!orderNumber) throw new Error('Checkout returned no order number.');

      const sellerOrders = await apiJson<OrdersResponse>(
        sellerPage,
        '/api/seller/orders?limit=100',
      );
      expect(
        sellerOrders.ok,
        sellerOrders.payload.error || 'Seller order lookup failed.',
      ).toBe(true);
      const order = sellerOrders.payload.orders?.find(
        (candidate) => candidate.orderNumber === orderNumber,
      );
      if (!order) throw new Error(`Seller cannot access order ${orderNumber}.`);
      const orderItem = order.items.find(
        (candidate) => candidate.productId === before.id,
      );
      if (!orderItem) throw new Error('The exact purchased order item is missing.');
      expect(orderItem).toMatchObject({
        variantId: variant.id,
        sku: variant.sku,
        quantity: 2,
      });

      await transitionSellerOrder(sellerPage, order.id, 'confirmed');
      await transitionSellerOrder(sellerPage, order.id, 'preparing');
      await transitionSellerOrder(sellerPage, order.id, 'shipped', {
        carrier: 'P3 Carrier',
        trackingNumber: 'P3-RETURN-EXCHANGE-001',
      });
      await transitionSellerOrder(sellerPage, order.id, 'delivered');

      const afterDelivery = await productSnapshot(buyerPage);
      expect(afterDelivery.stock).toBe(before.stock - 2);
      expect(afterDelivery.variantSkus[0]?.stock).toBe(variant.stock - 2);
      expect(afterDelivery.soldCount).toBe(before.soldCount + 2);

      const returnOnly = await apiJson<ReturnResponse>(
        buyerPage,
        '/api/returns',
        'POST',
        {
          orderItemId: orderItem.id,
          quantity: 1,
          reason: 'defective',
          details: 'P3 exact-SKU restock verification',
          resolution: 'return_only',
          evidencePhotos: [],
        },
      );
      expect(
        returnOnly.status,
        returnOnly.payload.error || 'Return request failed.',
      ).toBe(201);
      const returnOnlyId = returnOnly.payload.return?.id;
      if (!returnOnlyId) throw new Error('Return request returned no ID.');
      expect(returnOnly.payload.return).toMatchObject({
        orderItemId: orderItem.id,
        productId: before.id,
        variantId: variant.id,
        sku: variant.sku,
        quantity: 1,
        status: 'pending',
        resolution: 'return_only',
      });

      await transitionReturn(sellerPage, returnOnlyId, 'approved');
      await transitionReturn(sellerPage, returnOnlyId, 'processing');

      const restockOutcomes = await duplicatePut<FulfillmentOperationResponse>(
        sellerPage,
        '/api/seller/fulfillment',
        {
          action: 'set_return_disposition',
          returnId: returnOnlyId,
          disposition: 'restock',
        },
      );
      expectControlledConcurrentResults(restockOutcomes, 'Concurrent restock');

      const afterRestock = await productSnapshot(buyerPage);
      expect(afterRestock.stock).toBe(before.stock - 1);
      expect(afterRestock.variantSkus[0]?.stock).toBe(variant.stock - 1);
      expect(afterRestock.soldCount).toBe(before.soldCount + 1);

      let workspace = await fulfillmentWorkspace(sellerPage);
      const restockedReturn = workspace.returns?.find(
        (candidate) => candidate.id === returnOnlyId,
      );
      expect(restockedReturn).toMatchObject({
        inventoryDisposition: 'restock',
        status: 'processing',
      });
      expect(restockedReturn?.inventoryRestoredAt).toBeTruthy();
      const restockTimestamp = restockedReturn?.inventoryRestoredAt;

      const restockReplay = await apiJson<FulfillmentOperationResponse>(
        sellerPage,
        '/api/seller/fulfillment',
        'PUT',
        {
          action: 'set_return_disposition',
          returnId: returnOnlyId,
          disposition: 'restock',
        },
      );
      expect(restockReplay.status).toBe(200);
      expect(restockReplay.payload.idempotent).toBe(true);
      const afterRestockReplay = await productSnapshot(buyerPage);
      expect(afterRestockReplay.stock).toBe(afterRestock.stock);
      expect(afterRestockReplay.variantSkus[0]?.stock).toBe(
        afterRestock.variantSkus[0]?.stock,
      );
      expect(afterRestockReplay.soldCount).toBe(afterRestock.soldCount);

      await transitionReturn(sellerPage, returnOnlyId, 'completed');

      const exchange = await apiJson<ReturnResponse>(
        buyerPage,
        '/api/returns',
        'POST',
        {
          orderItemId: orderItem.id,
          quantity: 1,
          reason: 'wrong_item',
          details: 'P3 exact-SKU replacement verification',
          resolution: 'exchange',
          evidencePhotos: [],
        },
      );
      expect(
        exchange.status,
        exchange.payload.error || 'Exchange request failed.',
      ).toBe(201);
      const exchangeId = exchange.payload.return?.id;
      if (!exchangeId) throw new Error('Exchange request returned no ID.');
      expect(exchange.payload.return).toMatchObject({
        orderItemId: orderItem.id,
        productId: before.id,
        variantId: variant.id,
        sku: variant.sku,
        quantity: 1,
        status: 'pending',
        resolution: 'exchange',
      });

      await transitionReturn(sellerPage, exchangeId, 'approved');

      const replacementOutcomes =
        await duplicatePut<FulfillmentOperationResponse>(
          sellerPage,
          '/api/seller/fulfillment',
          {
            action: 'upsert_replacement',
            returnId: exchangeId,
            notes: 'P3 duplicate replacement reservation',
          },
        );
      expectControlledConcurrentResults(
        replacementOutcomes,
        'Concurrent replacement reservation',
      );

      const afterReplacementReservation = await productSnapshot(buyerPage);
      expect(afterReplacementReservation.stock).toBe(before.stock - 2);
      expect(afterReplacementReservation.variantSkus[0]?.stock).toBe(
        variant.stock - 2,
      );
      expect(afterReplacementReservation.soldCount).toBe(before.soldCount + 1);

      workspace = await fulfillmentWorkspace(sellerPage);
      const exchangeReturn = workspace.returns?.find(
        (candidate) => candidate.id === exchangeId,
      );
      expect(exchangeReturn).toMatchObject({
        productId: before.id,
        variantId: variant.id,
        sku: variant.sku,
        quantity: 1,
        status: 'processing',
        resolution: 'exchange',
      });
      expect(exchangeReturn?.replacementShipment).toMatchObject({
        status: 'preparing',
        quantity: 1,
        sku: variant.sku,
        inventoryRestoredAt: null,
      });
      expect(
        exchangeReturn?.replacementShipment?.inventoryReservedAt,
      ).toBeTruthy();
      const shipmentId = exchangeReturn?.replacementShipment?.id;
      if (!shipmentId) throw new Error('Replacement shipment was not persisted.');

      const quarantine = await apiJson<FulfillmentOperationResponse>(
        sellerPage,
        '/api/seller/fulfillment',
        'PUT',
        {
          action: 'set_return_disposition',
          returnId: exchangeId,
          disposition: 'quarantine',
        },
      );
      expect(quarantine.status, quarantine.payload.error).toBe(200);
      const afterQuarantine = await productSnapshot(buyerPage);
      expect(afterQuarantine.stock).toBe(afterReplacementReservation.stock);
      expect(afterQuarantine.variantSkus[0]?.stock).toBe(
        afterReplacementReservation.variantSkus[0]?.stock,
      );
      expect(afterQuarantine.soldCount).toBe(
        afterReplacementReservation.soldCount,
      );

      const cancellationOutcomes =
        await duplicatePut<FulfillmentOperationResponse>(
          sellerPage,
          '/api/seller/fulfillment',
          {
            action: 'transition_replacement',
            shipmentId,
            targetStatus: 'cancelled',
            notes: 'P3 concurrent replacement cancellation',
          },
        );
      expectControlledConcurrentResults(
        cancellationOutcomes,
        'Concurrent replacement cancellation',
      );

      const afterReplacementCancellation = await productSnapshot(buyerPage);
      expect(afterReplacementCancellation.stock).toBe(before.stock - 1);
      expect(afterReplacementCancellation.variantSkus[0]?.stock).toBe(
        variant.stock - 1,
      );
      expect(afterReplacementCancellation.soldCount).toBe(before.soldCount + 1);

      workspace = await fulfillmentWorkspace(sellerPage);
      const cancelledExchange = workspace.returns?.find(
        (candidate) => candidate.id === exchangeId,
      );
      expect(cancelledExchange).toMatchObject({
        inventoryDisposition: 'quarantine',
        inventoryRestoredAt: null,
      });
      expect(cancelledExchange?.replacementShipment).toMatchObject({
        id: shipmentId,
        status: 'cancelled',
        quantity: 1,
        sku: variant.sku,
      });
      expect(
        cancelledExchange?.replacementShipment?.inventoryRestoredAt,
      ).toBeTruthy();
      expect(restockTimestamp).toBeTruthy();

      const cancellationReplay = await apiJson<FulfillmentOperationResponse>(
        sellerPage,
        '/api/seller/fulfillment',
        'PUT',
        {
          action: 'transition_replacement',
          shipmentId,
          targetStatus: 'cancelled',
        },
      );
      expect(cancellationReplay.status).toBe(409);
      const afterCancellationReplay = await productSnapshot(buyerPage);
      expect(afterCancellationReplay.stock).toBe(
        afterReplacementCancellation.stock,
      );
      expect(afterCancellationReplay.variantSkus[0]?.stock).toBe(
        afterReplacementCancellation.variantSkus[0]?.stock,
      );
      expect(afterCancellationReplay.soldCount).toBe(
        afterReplacementCancellation.soldCount,
      );
    } finally {
      await Promise.all([buyerContext.close(), sellerContext.close()]);
    }
  });
});
