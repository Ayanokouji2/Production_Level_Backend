import { Router } from 'express';
import { subscribeToChannel, unsubscribeFromChannel } from '../Controllers/subscription.controller.js';
import { verifyJWT } from '../Middleware/auth.middleware.js';

const router = Router();

router
    .route('/:channelId')
    .post(verifyJWT,subscribeToChannel)
    .delete(verifyJWT,unsubscribeFromChannel)


export default router;