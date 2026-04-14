import { Router, Request, Response, NextFunction } from 'express';
import { query } from 'express-validator';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { getDashboardStats } from '../services/covalentService';

const router = Router();

// GET /api/analytics/dashboard?contractorWallet=xxx&contractorId=xxx
router.get(
  '/dashboard',
  validate([
    query('contractorWallet').optional().trim(),
    query('contractorId').optional().trim(),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contractorWallet, contractorId } = req.query as {
        contractorWallet?: string;
        contractorId?: string;
      };

      // Worker count
      const totalWorkers = contractorId
        ? await prisma.worker.count({ where: { contractorId } })
        : 0;

      // Today's payments
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayPayments = await prisma.payment.findMany({
        where: { createdAt: { gte: startOfDay } },
        include: { worker: true },
      });

      const paidToday = todayPayments
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      const pendingToday = todayPayments
        .filter((p) => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);

      // This month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthPayments = await prisma.payment.findMany({
        where: { createdAt: { gte: startOfMonth }, status: 'completed' },
      });
      const thisMonth = monthPayments.reduce((sum, p) => sum + p.amount, 0);

      // Recent 10 payments
      const recentPayments = await prisma.payment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { worker: true },
      });

      // On-chain stats (optional — if wallet provided)
      const onChain = contractorWallet
        ? await getDashboardStats(contractorWallet)
        : null;

      res.json({
        totalWorkers,
        paidToday,
        pendingToday,
        thisMonth,
        recentPayments,
        onChain,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
