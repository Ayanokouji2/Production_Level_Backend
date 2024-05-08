import { Router } from 'express';
import { subscribeToChannel } from '../Controllers/subscription.controller.js';
import { verifyJWT } from '../Middleware/auth.middleware.js';

const router = Router();

router
    .route('/:channelId')
    .post(verifyJWT,subscribeToChannel)


export default router;