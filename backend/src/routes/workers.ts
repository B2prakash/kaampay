import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { NotFoundError } from '../middleware/errorHandler';

const router = Router();

// Mock data returned when DB is not connected / contractor not found
const MOCK_WORKERS = [
  { id: 'w1', name: 'Ramesh Kumar', wallet: '7xKp...3mNq', dailyWage: 8, role: 'Mason', contractorId: 'mock', status: 'paid' },
  { id: 'w2', name: 'Sunil Sharma', wallet: '9aJr...7bXw', dailyWage: 7, role: 'Helper', contractorId: 'mock', status: 'paid' },
  { id: 'w3', name: 'Priya Devi',   wallet: '3nFt...1kLz', dailyWage: 6, role: 'Painter', contractorId: 'mock', status: 'pending' },
];

// GET /api/workers?contractorId=xxx
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractorId = typeof req.query.contractorId === 'string' ? req.query.contractorId : undefined;

    if (!contractorId) {
      return res.json({ workers: MOCK_WORKERS });
    }

    const workers = await prisma.worker.findMany({
      where: { contractorId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ workers });
  } catch (err) {
    // DB not connected — fall back to mock
    res.json({ workers: MOCK_WORKERS });
  }
});

// POST /api/workers
const createWorkerChains = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('wallet').trim().notEmpty().withMessage('wallet address is required'),
  body('dailyWage').isFloat({ gt: 0 }).withMessage('dailyWage must be a positive number'),
  body('contractorId').trim().notEmpty().withMessage('contractorId is required'),
  body('role').optional().trim(),
];

router.post(
  '/',
  validate(createWorkerChains),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, wallet, dailyWage, role, contractorId } = req.body as {
        name: string;
        wallet: string;
        dailyWage: number;
        role?: string;
        contractorId: string;
      };

      const worker = await prisma.worker.create({
        data: { name, wallet, dailyWage: Number(dailyWage), role, contractorId },
      });

      res.status(201).json({ worker });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/workers/:id
router.delete(
  '/:id',
  validate([param('id').trim().notEmpty()]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const worker = await prisma.worker.findUnique({ where: { id: String(id) } });
      if (!worker) return next(new NotFoundError('Worker not found'));

      await prisma.worker.delete({ where: { id: String(id) } });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
