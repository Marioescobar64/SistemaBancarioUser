'use strict';

import { Router } from 'express';
import {
  getAccounts,
  getAccountById
} from './account-controller.js';
import { generateStatement } from './statement-controller.js';

import { validateGetAccountById } from '../../middlewares/account-validation.js';
import { verifyToken } from '../../middlewares/auth-middleware.js';

const router = Router();

// Obtener cuentas del usuario autenticado
router.get(
  '/',
  verifyToken,
  getAccounts
);

// Obtener detalle de cuenta
router.get(
  '/:id',
  verifyToken,
  validateGetAccountById,
  getAccountById
);

// Generar estado de cuenta
router.get(
  '/:accountId/statement',
  verifyToken,
  generateStatement
);

export default router;