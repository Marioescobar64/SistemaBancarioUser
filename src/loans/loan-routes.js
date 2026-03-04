'use strict';

import { Router } from 'express';
import {
  createLoan,
  getLoans,
  getLoanById,
  updateLoan,
  changeLoanStatus
} from './loan-controller.js';

import {
  validateCreateLoan,
  validateUpdateLoan,
  validateLoanStatusChange,
  validateGetLoanById
} from '../../middlewares/loan-validation.js';

import { verifyToken, authorizeRoles } from '../../middlewares/auth-middleware.js';

const router = Router();

router.post(
  '/',
  verifyToken,
  authorizeRoles('ADMIN'),
  validateCreateLoan,
  createLoan
);

router.get(
  '/',
  verifyToken,
  authorizeRoles('ADMIN', 'USER'),
  getLoans
);

router.get(
  '/:id',
  verifyToken,
  authorizeRoles('ADMIN', 'USER'),
  validateGetLoanById,
  getLoanById
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('ADMIN'),
  validateUpdateLoan,
  updateLoan
);

router.patch(
  '/status/:id',
  verifyToken,
  authorizeRoles('ADMIN'),
  validateLoanStatusChange,
  changeLoanStatus
);

export default router;