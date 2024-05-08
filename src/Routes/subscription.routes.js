import { Router } from 'express';
import { subscribeToChannel, unsubscribeFromChannel } from '../Controllers/subscription.controller.js';
import { verifyJWT } from '../Middleware/auth.middleware.js';

const router = Router();

router
    .use(verifyJWT)
    .route('/:channelId')
    .post(subscribeToChannel)
    .delete(unsubscribeFromChannel)


export default router;