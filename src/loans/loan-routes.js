'use strict';

import { Router } from 'express';
import {
  createLoan,
  getLoans,
  getLoanById
} from './loan-controller.js';

import {
  validateCreateLoan,
  validateGetLoanById
} from '../../middlewares/loan-validation.js';

import { verifyToken } from '../../middlewares/auth-middleware.js';

const router = Router();

// Solicitar préstamo
router.post(
  '/',
  verifyToken,
  validateCreateLoan,
  createLoan
);

// Ver historial de préstamos propios
router.get(
  '/',
  verifyToken,
  getLoans
);

// Ver detalle de préstamo propio
router.get(
  '/:id',
  verifyToken,
  validateGetLoanById,
  getLoanById
);

export default router;