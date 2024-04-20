import { Router } from 'express'
import { uploadVideo } from '../Controllers/video.controller'
import { upload } from '../Middleware/multer.middleware'

const router = Router()


router
    .route("/upload-video")
    .post(upload.fields([
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
    ]), uploadVideo)


export { router }