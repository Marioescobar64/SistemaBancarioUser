import { body, param } from "express-validator";
import { checkValidators } from "./check-validation.js";

// ==============================
// Validaciones para crear Transferencia
// ==============================

export const validateCreateTransferencia = [

  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('El nombre completo del titular es obligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('accountNumber')
    .trim()
    .notEmpty()
    .withMessage('El número de cuenta es obligatorio')
    .isNumeric()
    .withMessage('El número de cuenta debe ser numérico'),

  body('accountType')
    .notEmpty()
    .withMessage('El tipo de cuenta es obligatorio')
    .isIn(['Monetaria', 'Ahorro'])
    .withMessage('El tipo de cuenta debe ser Monetaria o Ahorro'),

  body('amount')
    .notEmpty()
    .withMessage('El monto es obligatorio')
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser mayor a 0'),

  checkValidators,
];

// ==============================
// Validaciones para actualizar Transferencia
// ==============================

export const validateUpdateTransferenciaRequest = [

  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('accountNumber')
    .optional()
    .isNumeric()
    .withMessage('El número de cuenta debe ser numérico'),

  body('accountType')
    .optional()
    .isIn(['Monetaria', 'Ahorro'])
    .withMessage('El tipo de cuenta debe ser Monetaria o Ahorro'),

  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser mayor a 0'),

  checkValidators,
];

// ==============================
// Validaciones para activar/desactivar
// ==============================

export const validateTransferenciaStatusChange = [
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido de MongoDB'),

  checkValidators,
];

// ==============================
// Validación para obtener por ID
// ==============================

export const validateGetTransferenciaById = [
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido de MongoDB'),

  checkValidators,
];