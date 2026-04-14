import DodoPayments from 'dodopayments';

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY ?? '',
  environment: (process.env.DODO_ENV as 'live_mode' | 'test_mode') ?? 'test_mode',
});

export interface PaymentResult {
  paymentId: string;
  paymentLink: string;
}

export interface InvoiceEscrowResult {
  escrowId: string;
}

/**
 * Creates a DodoPayments payment for a worker wage disbursement.
 */
export async function createPayment(
  workerEmail: string,
  workerName: string,
  amount: number,
): Promise<PaymentResult> {
  try {
    const payment = await client.payments.create({
      billing: {
        city: 'Mumbai',
        country: 'IN',
        state: 'Maharashtra',
        street: 'N/A',
        zipcode: '400001',
      },
      customer: {
        create_new_customer: false,
        customer_id: workerEmail,
      } as any,
      product_cart: [
        {
          product_id: process.env.DODO_WAGE_PRODUCT_ID ?? 'wage-usdc',
          quantity: 1,
        },
      ],
      // metadata passes amount as custom field
      metadata: {
        worker_email: workerEmail,
        worker_name: workerName,
        amount_usdc: String(amount),
      },
    } as any);

    return {
      paymentId: (payment as any).payment_id ?? (payment as any).id ?? '',
      paymentLink: (payment as any).payment_link ?? (payment as any).url ?? '',
    };
  } catch (err: any) {
    throw new Error(`DodoPayments createPayment failed: ${err?.message ?? err}`);
  }
}

/**
 * Creates an escrow invoice between buyer and seller.
 */
export async function createInvoiceEscrow(
  amount: number,
  buyerEmail: string,
  sellerEmail: string,
): Promise<InvoiceEscrowResult> {
  try {
    const invoice = await (client.invoices as any).create({
      amount,
      buyer_email: buyerEmail,
      seller_email: sellerEmail,
      currency: 'USD',
    });

    return {
      escrowId: invoice?.id ?? invoice?.invoice_id ?? '',
    };
  } catch (err: any) {
    throw new Error(`DodoPayments createInvoiceEscrow failed: ${err?.message ?? err}`);
  }
}

/**
 * Releases escrowed funds to the seller.
 */
export async function releaseEscrow(escrowId: string): Promise<boolean> {
  try {
    await (client.invoices as any).release(escrowId);
    return true;
  } catch (err: any) {
    throw new Error(`DodoPayments releaseEscrow failed: ${err?.message ?? err}`);
  }
}

/**
 * Verifies a Dodo webhook signature.
 * Dodo sends X-Dodo-Signature header — compare HMAC-SHA256 of raw body.
 */
export function verifyWebhook(rawBody: string, signature: string): boolean {
  try {
    const crypto = require('crypto');
    const secret = process.env.DODO_WEBHOOK_SECRET ?? '';
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex');
    return expected === signature;
  } catch {
    return false;
  }
}
