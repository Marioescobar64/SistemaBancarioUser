import { Router } from 'express';
import { updateMyProfile } from './user-controller.js';
import { verifyToken } from '../../middlewares/auth-middleware.js';

const router = Router();

// Todas las rutas de usuarios requieren autenticación
router.use(verifyToken);

// Actualizar mi propio perfil (KYC)
router.put('/me', updateMyProfile);

export default router;
