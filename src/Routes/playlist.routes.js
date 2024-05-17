import { Router } from 'express';
import { addVideoToPlaylist } from '../Controllers/playlist.controller.js';

const router = Router();

router
    .route('/add_video/:videoId')
    .post(addVideoToPlaylist)


export default router;