import { Router } from 'express'
import { createComment } from '../Controllers/comment.controller.js'
import { verifyJWT } from '../Middleware/auth.middleware.js'

const router = Router()

router
    .route('/:videoId')
    .post(verifyJWT, createComment )


export default router