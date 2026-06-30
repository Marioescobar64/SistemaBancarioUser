import { Router } from 'express';
import {
  getCards,
  getCardById
} from './card-controller.js';

import { validateGetCardById } from '../../middlewares/card-validation.js';
import { verifyToken } from '../../middlewares/auth-middleware.js';

const router = Router();

// ====================
// RUTAS GET
// ====================

router.get('/', verifyToken, getCards);

router.get(
  '/:id',
  verifyToken,
  validateGetCardById,
  getCardById
);

export default router;