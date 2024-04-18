import { Router } from 'express'
import { userLogin, userLogout, userRegister } from '../Controllers/user.controller.js'
import { upload } from "../Middleware/multer.middleware.js"
import { verifyJWT } from '../Middleware/auth.middleware.js';

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
    .post(userLogin)


//! Secured Routes

router
    .use(verifyJWT)
    .route("/logout")
    .get(userLogout)


export default router 