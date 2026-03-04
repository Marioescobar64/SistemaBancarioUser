'use strict';

import { Router } from 'express';
import {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  changeAccountStatus,
  depositMoney,
  withdrawMoney
} from './account-controller.js';

import {
  validateCreateAccount,
  validateUpdateAccount,
  validateAccountStatusChange,
  validateGetAccountById
} from '../../middlewares/account-validation.js';

import { verifyToken, authorizeRoles } from '../../middlewares/auth-middleware.js';

const router = Router();

// Crear cuenta (ADMIN)
router.post(
  '/',
  verifyToken,
  authorizeRoles('ADMIN', 'USER'),
  validateCreateAccount,
  createAccount
);

// Obtener cuentas
router.get(
  '/',
  verifyToken,
  authorizeRoles('ADMIN', 'USER'),
  getAccounts
);

// Obtener por ID
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('ADMIN', 'USER'),
  validateGetAccountById,
  getAccountById
);

// Actualizar
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('ADMIN'),
  validateUpdateAccount,
  updateAccount
);

// Activar / Desactivar
router.patch(
  '/status/:id',
  verifyToken,
  authorizeRoles('ADMIN'),
  validateAccountStatusChange,
  changeAccountStatus
);

router.patch(
  '/deposit/:id',
  verifyToken,
  authorizeRoles('ADMIN', 'USER'),
  depositMoney
);

router.patch(
  '/withdraw/:id',
  verifyToken,
  authorizeRoles('ADMIN', 'USER'),
  withdrawMoney
);

export default router;