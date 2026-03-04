'use strict';

import { Router } from 'express';
import { createTransfer, getTransfers } from './transfer-controller.js';
import { validateCreateTransferencia } from '../../middlewares/transfer-validation.js';
import { verifyToken, authorizeRoles } from '../../middlewares/auth-middleware.js';

const router = Router();

// Crear transferencia
router.post(
  '/',
  verifyToken,
  authorizeRoles('USER', 'ADMIN'),
  validateCreateTransferencia,
  createTransfer
);

// Obtener historial
router.get(
  '/',
  verifyToken,
  authorizeRoles('USER', 'ADMIN'),
  getTransfers
);

export default router;