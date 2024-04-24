import { Router } from 'express'
import { uploadVideo, getAllVideosOfChannel, updateDetailsOfTheVideo } from '../Controllers/video.controller.js'
import { upload } from '../Middleware/multer.middleware.js'
import { verifyJWT } from '../Middleware/auth.middleware.js'

const router = Router()


//! Protected Route Begin From Here

router
    .use(verifyJWT)

router
    .route("/upload-video")
    .post(upload.fields([
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
    ]), uploadVideo)

router
    .route("/get-all-videos/:userId")
    .get(getAllVideosOfChannel)

router
    .route("/update-video-details/:videoId")
    .patch(updateDetailsOfTheVideo)


export default router