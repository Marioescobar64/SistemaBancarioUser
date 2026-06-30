import { param } from "express-validator";
import { checkValidators } from "./check-validation.js";

// Validación para obtener campo por ID
export const validateGetCardById = [
    param('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId válido de MongoDB'),
    checkValidators,
];
