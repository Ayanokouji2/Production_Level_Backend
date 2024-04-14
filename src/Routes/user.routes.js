import { Router } from 'express'
import { userLogin, userRegister } from '../Controllers/user.controller.js'

const router = Router()

router
    .route("/register")
    .post(userRegister);

router
    .route("/login")
    .get(userLogin)


export default router 