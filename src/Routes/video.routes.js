import { Router } from 'express'
import { uploadVideo, getAllVideosOfChannel } from '../Controllers/video.controller.js'
import { upload } from '../Middleware/multer.middleware.js'
import { verifyJWT } from '../Middleware/auth.middleware.js'

const router = Router()


router
    .route("/upload-video")
    .post(verifyJWT, upload.fields([
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
    ]), uploadVideo)

router
    .route("/get-all-videos/:userId")
    .get(verifyJWT, getAllVideosOfChannel)


export default router