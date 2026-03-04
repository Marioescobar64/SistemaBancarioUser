import { Router } from 'express';
import {
  getCards,
  getCardById,
  createCard,
  updateCard,
  changeCardStatus,
} from './card-controller.js';

import {
  validateCreateCard,
  validateUpdateCardRequest,
  validateCardStatusChange,
  validateGetCardById,
} from '../../middlewares/card-validation.js';

import { uploadFieldImage } from '../../middlewares/file-uploader.js';
import { cleanupUploadedFileOnFinish } from '../../middlewares/delete-file-on-error.js';

const router = Router();

// ====================
// RUTAS GET
// ====================

router.get('/', getCards);

router.get(
  '/:id',
  validateGetCardById,
  getCardById
);

// ====================
// RUTAS POST
// ====================

router.post(
  '/',
  uploadFieldImage.single('image'), // campo del form-data
  cleanupUploadedFileOnFinish,
  validateCreateCard,
  createCard
);

// ====================
// RUTAS PUT
// ====================

router.put(
  '/:id',
  uploadFieldImage.single('image'),
  validateUpdateCardRequest,
  updateCard
);

router.put(
  '/:id/activate',
  validateCardStatusChange,
  changeCardStatus
);

router.put(
  '/:id/deactivate',
  validateCardStatusChange,
  changeCardStatus
);

export default router;