import { Router } from 'express'
import { userLogin, userRegister } from '../Controllers/user.controller.js'
import { upload } from "../Middleware/multer.middleware.js"

const router = Router()

router
    .use(upload.fields(
        [
            { name: "avatar", maxCount: 1 },
            { name: "coverImage", maxCount: 1 }
        ]
    ))
    .route("/register")
    .post(userRegister);

router
    .route("/login")
    .get(userLogin)


export default router 