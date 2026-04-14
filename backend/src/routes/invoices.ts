import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { NotFoundError, AppError } from '../middleware/errorHandler';
import { createInvoiceEscrow, releaseEscrow } from '../services/dodoService';

const router = Router();

// POST /api/invoices
router.post(
  '/',
  validate([
    body('amount').isFloat({ gt: 0 }).withMessage('amount must be a positive number'),
    body('buyerEmail').isEmail().withMessage('valid buyerEmail is required'),
    body('sellerEmail').isEmail().withMessage('valid sellerEmail is required'),
    body('description').optional().trim(),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount, buyerEmail, sellerEmail, description } = req.body as {
        amount: number;
        buyerEmail: string;
        sellerEmail: string;
        description?: string;
      };

      const { escrowId } = await createInvoiceEscrow(Number(amount), buyerEmail, sellerEmail);

      const invoice = await prisma.invoice.create({
        data: { amount: Number(amount), buyerEmail, sellerEmail, description, escrowId },
      });

      res.status(201).json({ invoice });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/invoices
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ invoices });
  } catch (err) {
    next(err);
  }
});

// PUT /api/invoices/:id/confirm — buyer confirms receipt
router.put(
  '/:id/confirm',
  validate([param('id').trim().notEmpty()]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);

      const invoice = await prisma.invoice.findUnique({ where: { id } });
      if (!invoice) return next(new NotFoundError('Invoice not found'));
      if (invoice.status !== 'pending') {
        return next(new AppError(`Invoice is already ${invoice.status}`, 409));
      }

      const updated = await prisma.invoice.update({
        where: { id },
        data: { status: 'confirmed' },
      });

      res.json({ invoice: updated });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/invoices/:id/release — release escrow to seller
router.put(
  '/:id/release',
  validate([param('id').trim().notEmpty()]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);

      const invoice = await prisma.invoice.findUnique({ where: { id } });
      if (!invoice) return next(new NotFoundError('Invoice not found'));
      if (!invoice.escrowId) return next(new AppError('No escrow ID found for this invoice', 400));

      await releaseEscrow(invoice.escrowId);

      const updated = await prisma.invoice.update({
        where: { id },
        data: { status: 'completed' },
      });

      res.json({ invoice: updated });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
