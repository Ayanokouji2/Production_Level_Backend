import { Router } from 'express';
import { addVideoToPlaylist } from '../Controllers/playlist.controller.js';
import { verifyJWT } from '../Middleware/auth.middleware.js';

const router = Router();

router
    .route('/add_video/:videoId')
    .post(verifyJWT,addVideoToPlaylist)


export default router;