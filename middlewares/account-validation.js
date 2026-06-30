import { param } from "express-validator";
import { checkValidators } from "./check-validation.js";

export const validateGetAccountById = [
  param('id')
    .isMongoId()
    .withMessage('ID inválido'),
  checkValidators,
];