import { Router } from 'express';
import { googleAuth } from '../controllers/auth.controller';

const router = Router();

// Google OAuth route
router.post('/google', googleAuth);

// ... other auth routes ...

export default router; 