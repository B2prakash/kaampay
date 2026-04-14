import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from './errorHandler';

/**
 * Runs an array of express-validator chains, then checks the result.
 * Throws ValidationError (→ 400) if any chain fails.
 */
export const validate = (chains: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    for (const chain of chains) {
      await chain.run(req);
    }

    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = result.array().map((e) => ({
        field: e.type === 'field' ? (e as any).path : 'unknown',
        message: e.msg,
      }));
      return next(new ValidationError('Validation failed', errors));
    }

    next();
  };
};
