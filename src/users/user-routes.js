import { Router } from 'express';
import { updateMyProfile, syncInternalUser, getMyProfile } from './user-controller.js';
import { verifyToken } from '../../middlewares/auth-middleware.js';

import { internalAuth } from '../../middlewares/internal-auth.js';

const router = Router();

// Ruta interna para sincronización S2S desde authservice
router.post('/internal/sync', internalAuth, syncInternalUser);

// Todas las rutas de usuarios requieren autenticación JWT
router.use(verifyToken);

// Actualizar mi propio perfil (KYC)
router.put('/me', updateMyProfile);

// Obtener mi perfil (KYC)
router.get('/me', getMyProfile);

export default router;
