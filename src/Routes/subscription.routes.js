import { Router } from 'express';
import { subscribeToChannel } from '../Controllers/subscription.controller';

const router = Router();

router
    .route('/:channelId')
    .post(subscribeToChannel)


export default router;