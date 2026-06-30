import { Router } from 'express';
import { syncProfile } from './auth-controller.js';

const router = Router();

router.post('/sync', syncProfile);

export default router;