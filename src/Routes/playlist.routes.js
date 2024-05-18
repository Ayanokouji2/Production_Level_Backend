import { Router } from 'express';
import { addVideoToPlaylist, removeVideoFromPlaylist } from '../Controllers/playlist.controller.js';
import { verifyJWT } from '../Middleware/auth.middleware.js';

const router = Router();

router
    .use(verifyJWT)
    .route('/add_video/:videoId')
    .post(addVideoToPlaylist)
    .delete(removeVideoFromPlaylist)

export default router;