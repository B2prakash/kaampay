import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { verifyWebhook } from '../services/dodoService';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /api/webhooks/dodo
// Dodo sends raw JSON body + X-Dodo-Signature header
router.post('/dodo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-dodo-signature'] as string | undefined;
    if (!signature) return next(new AppError('Missing webhook signature', 400));

    // req.body was parsed as string by raw body parser mounted in index.ts
    const rawBody =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const valid = verifyWebhook(rawBody, signature);
    if (!valid) return next(new AppError('Invalid webhook signature', 401));

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { type, data } = event as { type: string; data: any };

    if (type === 'payment.completed' && data?.payment_id) {
      await prisma.payment.updateMany({
        where: { dodoId: data.payment_id },
        data: { status: 'completed', txHash: data.tx_hash ?? null },
      });
    }

    if (type === 'payment.failed' && data?.payment_id) {
      await prisma.payment.updateMany({
        where: { dodoId: data.payment_id },
        data: { status: 'failed' },
      });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
});

export default router;
