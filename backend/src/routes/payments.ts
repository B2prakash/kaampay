import { Router, Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { NotFoundError, AppError } from '../middleware/errorHandler';
import { createPayment } from '../services/dodoService';
import { getWalletTransactions } from '../services/covalentService';

const router = Router();

// POST /api/payments/pay-worker
router.post(
  '/pay-worker',
  validate([
    body('workerId').trim().notEmpty().withMessage('workerId is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('amount must be a positive number'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workerId, amount } = req.body as { workerId: string; amount: number };

      const worker = await prisma.worker.findUnique({ where: { id: workerId } });
      if (!worker) return next(new NotFoundError('Worker not found'));

      const { paymentId, paymentLink } = await createPayment(
        `${worker.name.toLowerCase().replace(/\s+/g, '.')}@kaampay.io`,
        worker.name,
        Number(amount),
      );

      const payment = await prisma.payment.create({
        data: {
          workerId,
          amount: Number(amount),
          dodoId: paymentId,
          status: 'pending',
        },
      });

      res.status(201).json({ paymentId, paymentLink, paymentDbId: payment.id });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/payments/pay-all
router.post(
  '/pay-all',
  validate([body('contractorId').trim().notEmpty().withMessage('contractorId is required')]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contractorId } = req.body as { contractorId: string };

      const workers = await prisma.worker.findMany({
        where: { contractorId },
        include: { payments: { where: { status: 'pending' }, orderBy: { createdAt: 'desc' }, take: 1 } },
      });

      const results: { workerId: string; paymentId: string; paymentLink: string }[] = [];
      let failed = 0;

      for (const worker of workers) {
        try {
          const { paymentId, paymentLink } = await createPayment(
            `${worker.name.toLowerCase().replace(/\s+/g, '.')}@kaampay.io`,
            worker.name,
            worker.dailyWage,
          );

          await prisma.payment.create({
            data: { workerId: worker.id, amount: worker.dailyWage, dodoId: paymentId, status: 'pending' },
          });

          results.push({ workerId: worker.id, paymentId, paymentLink });
        } catch {
          failed++;
        }
      }

      res.json({ paid: results.length, failed, payments: results });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/payments/history?walletAddress=xxx
router.get(
  '/history',
  validate([query('walletAddress').trim().notEmpty().withMessage('walletAddress is required')]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { walletAddress } = req.query as { walletAddress: string };
      const transactions = await getWalletTransactions(walletAddress);
      res.json({ transactions });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
