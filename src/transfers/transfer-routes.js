'use strict';

import { Router } from 'express';
import { createTransfer, getTransfers } from './transfer-controller.js';
import { validateCreateTransferencia } from '../../middlewares/transfer-validation.js';
import { verifyToken } from '../../middlewares/auth-middleware.js';

const router = Router();

// Crear transferencia
router.post(
  '/',
  verifyToken,
  validateCreateTransferencia,
  createTransfer
);

// Obtener historial
router.get(
  '/',
  verifyToken,
  getTransfers
);

export default router;