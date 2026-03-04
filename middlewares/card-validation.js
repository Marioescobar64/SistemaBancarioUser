import { body, param } from "express-validator";

import { checkValidators } from "./check-validation.js";

// Validaciones para crear campos (field)
export const validateCreateCard = [

body('ownerCard')
    .trim()
    .notEmpty()
    .withMessage('El nombre del propietario es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

body('cardNumbers')
    .notEmpty()
    .withMessage('El Numero de las tarjeta es obligartoria')
    .isNumeric()
    .withMessage('El numero de tarjeta debe ser numerico'),

body('expirationDate')
    .notEmpty()
    .withMessage('La fecha de expiración es obligatoria')
    .isISO8601()
    .withMessage('Debe ser una fecha válida'),

body('securityCode')
    .notEmpty()
    .withMessage('El Numero de las tarjeta es obligartoria')
    .isNumeric()
    .withMessage('El codigo de seguridad debe ser numerico'),

    checkValidators,
];
 
export const validateUpdateCardRequest = [
    body('ownerCard')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

body('cardNumbers')
    .optional()
    .isNumeric()
    .withMessage('El numero de tarjeta debe ser numerico'),

body('expirationDate')
    .optional()
    .isISO8601()
    .withMessage('Debe ser una fecha válida'),

body('securityCode')
    .optional()
    .isNumeric()
    .withMessage('El codigo de seguridad debe ser numerico'),
    
    checkValidators,
];
 
// Validaciones para activar/desactivar campos
export const validateCardStatusChange = [
    param('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId válido de MongoDB'),
    checkValidators,
];
 
// Validación para obtener campo por ID
export const validateGetCardById = [
    param('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId válido de MongoDB'),
    checkValidators,
];
