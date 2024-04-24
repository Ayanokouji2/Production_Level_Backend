import { Router } from 'express'
import { currentCurrentPassword, deleteUser, getCurrentUser, getOtherUserChannelProfile, getWatchHistory, regeneratingAccessToken, updateUserAvatar, updateUserCoverImage, userLogin, userLogout, userRegister } from '../Controllers/user.controller.js'
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
    .route("/logout")
    .get(verifyJWT, userLogout)

router
    .route("/regenerate-refresh-token")
    .post(regeneratingAccessToken)

router
    .use(verifyJWT) 
    .route("/change-password")
    .post(currentCurrentPassword)

router
    .use(verifyJWT)
    .route("/current-user")
    .get(getCurrentUser)

router
    .route("/change-avatar")
    .patch(verifyJWT,
        upload.single("avatar"), updateUserAvatar)

router
    .route("/change-coverImage")
    .patch(verifyJWT,
        upload.single("coverImage"), updateUserCoverImage)


router
    .use(verifyJWT)
    .route("/user-profile/:username")
    .get(getOtherUserChannelProfile)

router
    .use(verifyJWT)
    .route("/watch-history")
    .get(getWatchHistory)

router
    .route("/delete-account")
    .delete(verifyJWT, deleteUser)

export default router 
