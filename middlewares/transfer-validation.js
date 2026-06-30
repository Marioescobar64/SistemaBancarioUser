import { body } from "express-validator";
import { checkValidators } from "./check-validation.js";

// ==============================
// Validaciones para crear Transferencia
// ==============================

export const validateCreateTransferencia = [

  body('fromAccount')
    .notEmpty()
    .withMessage('La cuenta de origen es obligatoria')
    .isMongoId()
    .withMessage('ID de cuenta de origen inválido'),

  body('toAccount')
    .notEmpty()
    .withMessage('La cuenta de destino es obligatoria')
    .isMongoId()
    .withMessage('ID de cuenta de destino inválido'),

  body('amount')
    .notEmpty()
    .withMessage('El monto es obligatorio')
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser mayor a 0'),

  checkValidators,
];