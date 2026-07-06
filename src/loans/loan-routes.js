'use strict';

import { Router } from 'express';
import {
  createLoan,
  getLoans,
  getLoanById,
  requestMicroLoan,
  payMicroLoan,
  payLoanInstallment
} from './loan-controller.js';

import {
  validateCreateLoan,
  validateGetLoanById
} from '../../middlewares/loan-validation.js';

import { verifyToken } from '../../middlewares/auth-middleware.js';

const router = Router();

// Solicitar préstamo normal
router.post(
  '/',
  verifyToken,
  validateCreateLoan,
  createLoan
);

// Solicitar micro-préstamo rápido (Zigi)
router.post(
  '/micro',
  verifyToken,
  requestMicroLoan
);

// Pagar micro-préstamo
router.post(
  '/micro/:id/pay',
  verifyToken,
  payMicroLoan
);

// Pagar préstamo normal
router.post(
  '/:id/pay',
  verifyToken,
  payLoanInstallment
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