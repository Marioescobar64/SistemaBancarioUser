import { Router } from 'express';
import { check } from 'express-validator';
import { getServicePayments, payService } from './servicePayment-controller.js';
// Validacion general que suele tener el proyecto si no existe, la traemos de transfers o importamos 'express-validator' logica manual
// Asumo que middlewares/check-validation.js existe o se trajo de alguna forma.
// Voy a revisar si middlewares/check-validation.js existe en SistemaBancarioUser, y de hecho si existe.
import { verifyToken } from '../../middlewares/auth-middleware.js';

// No tengo checkValidators, usaré la lógica directa de express-validator en la ruta, pero primero veo si existe
// En SistemaBancarioUser listé los middlewares antes y sí existe check-validation.js
import { checkValidators } from '../../middlewares/check-validation.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

router.get('/', getServicePayments);

router.post('/', [
    check('accountId', 'El ID de la cuenta es obligatorio').isMongoId(),
    check('serviceProvider', 'El proveedor es obligatorio').not().isEmpty(),
    check('referenceNumber', 'El número de referencia es obligatorio').not().isEmpty(),
    check('amount', 'El monto es obligatorio y debe ser numérico').isNumeric(),
    checkValidators
], payService);

export default router;
