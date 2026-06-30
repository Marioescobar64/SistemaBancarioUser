import { body, param } from "express-validator";
import { checkValidators } from "./check-validation.js";

export const validateCreateLoan = [
  body('amount')
    .notEmpty()
    .withMessage('El monto es obligatorio')
    .isNumeric()
    .withMessage('El monto debe ser numérico'),

  body('interestRate')
    .notEmpty()
    .withMessage('La tasa de interés es obligatoria')
    .isNumeric()
    .withMessage('Debe ser numérica'),

  checkValidators,
];

export const validateGetLoanById = [
  param('id')
    .isMongoId()
    .withMessage('ID inválido'),
  checkValidators,
];