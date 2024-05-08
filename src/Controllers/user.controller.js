import asyncHandler from '../Utils/asyncHandler.js'
import jwt from 'jsonwebtoken'
import { ApiError } from '../Utils/ApiError.js'
import { User } from '../Models/user.model.js'
import { deleteCloudinaryImage, uploadOnCloudinary } from '../Utils/CloudinaryFileUpload.js'
import { ApiResponse } from '../Utils/ApiResponse.js'
import mongoose from 'mongoose'


const generateRefreshAndAccessToken = async (userId) => {
    try {

        const user = await User.findById({ _id: userId })
        const access_token = user.generateAccesToken()
        const refresh_token = user.generateRefreshToken()

        user.refreshToken = refresh_token

        await user.save({ validateBeforeSave: false });

        return { accessToken: access_token, refreshToken: refresh_token }
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Something went wrong while generating refresh Token or access Token"))
    }
}


const cookieOption = {
    httpOnly: true,
    secure: true
}


const userRegister = asyncHandler(async (req, res) => {
    /*
     * [✔️] get user details from frontend
     * [✔️] validate the fields 
     * [✔️] check if user exists: username, email
     * [✔️] check for images : avatar, coverImage -> 
     * [✔️] upload it to cloudinary
     * [✔️] create the user Object and then save it to db
     * [✔️] check if response is comming or not
     * [✔️] remove the hashedpassword -> password and remove refreshtoken
     * [✔️] send the response to the frontend
     */

    const { username, email, password, fullName } = req.body

    if ([username, email, password, fullName].some((field) => field === undefined || field?.trim() === "")) {
        throw new ApiError(400, " Required Missing Credentials thrown by the command")
    }
    const existing_user = await User.findOne({ $or: [{ username }, { email }] })

    if (existing_user) {
        throw new ApiError(409, "Existing User")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path      // If this throws error like cannot read property of undefined even when the file is uploaded then it is because of the multer sends an connect.sid and if this is not updated then it will not send the file to the req.files. So, to solve this issue we need to create a new request in postman and then try again.

    var coverImageLocalPath = ""
    if (req.files.coverImage)
        coverImageLocalPath = req.files?.coverImage[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar is required... Must Upload')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
        throw new ApiError(500, 'Avatar Upload failed..')
    }

    var coverImage
    if (coverImageLocalPath && coverImageLocalPath !== "") {
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
    }

    if (coverImageLocalPath !== "" && !coverImage) {
        throw new ApiError(500, 'cover Image  Upload failed..')
    }

    const user_to_save = {
        username,
        email,
        fullName,
        password,
        avatar: {
            url: avatar.url,
            public_id: avatar.public_id
        },
        coverImage: {
            url: coverImage?.url,
            public_id: coverImage?.public_id
        },
    }

    const user = await User.create(user_to_save);

    const created_User = await User.findById(user._id).select("-password -refreshToken")

    if (!created_User) {
        throw new ApiError(500, "Creating User failed ...!")
    }

    return res.status(201).json(new ApiResponse(200, created_User, "User Created Succesfully"))

})


const userLogin = asyncHandler(async (req, res) => {
    /*
     *  [✔️] Get (username or email) and password from req.body
     *  [✔️] Validate username and password
     *  [✔️] fetch user using username or email
     *  [✔️] Check if user exists 
     *  [✔️] validate the password
     *  [✔️] generate ACCESS & REFRESH jwt token
     *  [✔️] send secure cookies 
     *  [✔️] return the response
     */
    const { username, password, email } = req.body

    if ((!username && !email) || !password) {
        throw new ApiError(400, "Fields are Required")
    }

    const user_from_db = await User.findOne({ $or: [{ username: username.toLowerCase() }, { email }] })

    if (!user_from_db) {
        throw new ApiError(404, "No existing user")
    }

    const isPasswordCorrect = await user_from_db.isPasswordCorrect(password)  // the methods are not the part of the Database Model i.e (User) but it is the methods of the instance i.e (user_from_db)
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials")
    }

    const { refreshToken, accessToken } = await generateRefreshAndAccessToken(user_from_db._id);

    //! Why i feteched the user again ?
    //? Because in the generateRefreshAndAccessToken() we updated the field accessToken, bt the field is not accessible by the user_from_db 

    const user_updated = await User.findOne({ $or: [{ username: username.toLowerCase() }, { email }] })
        .select("-password")


    // To secure the cookie by making it accessible from server not from frontend
    res
        .status(200)
        .cookie("refreshToken", refreshToken, cookieOption)
        .cookie("accessToken", accessToken, cookieOption)
        .json(new ApiResponse(200, user_updated, " User authenticated ready for Login"))


})


const userLogout = asyncHandler(async (req, res) => {

    /* 
    *  [✔️] get user from Db
    *  [✔️] Delete refreshToken from the cookie. 
    *  [✔️] Delete refershToken from the database.
    */

    const user = req.user

    const updated_user = await User.findByIdAndUpdate(user._id,
        { $unset: { refreshToken: 1 } }, { new: true })
        .select("-password")


    if (!updated_user) {
        throw new ApiError(500, "Unable to Update User refreshToken")
    }

    req.user = undefined

    return res
        .status(200)
        .clearCookie("refreshToken", cookieOption)
        .clearCookie("accessToken", cookieOption)
        .json(new ApiResponse(200, null, " User Logout Successful"))


})


const regeneratingAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken   // {req.body.refreshToken} -> bcz we are assuming user is using mobile phone

    if (!incomingRefreshToken)
        throw new ApiError(401, "you are unauthorized to perform this action")

    const decodedRefreshToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedRefreshToken?._id)

    if (!user)
        throw new ApiError(404, "No User found ")


    if (incomingRefreshToken !== user.refreshToken)
        throw new ApiError(401, "RefreshToken has expired or used ")

    const { refreshToken, accessToken } = await generateRefreshAndAccessToken(user?._id)

    res
        .status(200)
        .cookie("accessToken", accessToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
        .json(new ApiResponse(200, { accessToken, refreshToken }, "AccessToken Generated and Login Succesful"))

})


const currentCurrentPassword = asyncHandler(async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body

        const userId = req.user?._id;

        const user = await User.findById(userId)
        console.log("this is password", oldPassword)

        if (!user.isPasswordCorrect(oldPassword)) {
            return res.status(401).json(new ApiError(401, "Invalid Password"))
        }

        user.password = newPassword

        await user.save({ validateBeforeSave: false })

        return res.status(200).json(new ApiResponse(200, null, "Password Changed Successfully"))

    } catch (error) {
        return res.status(500).json(new ApiError(500, "Unable to change Password"))
    }
})


const getCurrentUser = asyncHandler(async (req, res) => {
    try {
        return res.status(200).json(new ApiResponse(200, req.user, "Current User"))

    } catch (error) {
        return res.status(500).json(new ApiError(500, "Unable to Get current user "))
    }
})


const updateUserAvatar = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id

        if (!userId)
            return res.status(401).json(new ApiError(401, "Unauthorized to perform this action"))

        const user_from_db = await User.findById(userId)

        const avatarLocalPath = req.files?.avatar[0]?.path


        console.log("Hello avatarr", avatarLocalPath)
        if (!avatarLocalPath)
            return res.status(400).json(new ApiError(400, "Avatar is required"))

        const result = await deleteCloudinaryImage(avatarLocalPath, user_from_db.avatar.public_id)

        if (result === null || result !== "ok")
            return res.status(400).json(new ApiError(400, " user Doesn't have a image to delete"))

        console.log("Avatar LocalPath", avatarLocalPath)
        const avatar = await uploadOnCloudinary(avatarLocalPath)

        if (!avatar)
            return res.status(500).json(new ApiError(500, "Error while uploading image to cloudinary"))

        console.log("Uploade Avatar", avatar)
        const avatarObject = {
            url: avatar.url,
            public_id: avatar.public_id
        }
        const user = await User.findByIdAndUpdate(userId, { $set: { avatar: avatarObject } }, { new: true }).select("-password -refreshToken")

        console.log("User Image is Updated", user)
        if (!user)
            return res.status(500).json(new ApiError(500, " Error while fetching or updating user "))

        return res.status(200).json(new ApiResponse(200, result, "Avatar Updated Successful"))

    } catch (error) {
        return res.status(500).json(new ApiError(500, "Unable to update current user avatar" + error.message))
    }
})


const updateUserCoverImage = asyncHandler(async (req, res) => {
    try {
        const userId = req.user ? req.user?._id : null

        if (!userId)
            return res.status(401).json(new ApiError(401, "Unauthorized to perform this action"))

        const coverImageLocalPath = req.files?.coverImage[0]?.path

        if (!coverImageLocalPath)
            return res.status(400).json(new ApiError(400, "CoverImage is required"))

        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if (!coverImage)
            return res.status(500).json(new ApiError(500, "Error while uploading image to cloudinary"))

        const coverImageObject = {
            url: coverImage.url,
            public_id: coverImage.public_id
        }

        const user = await User.findByIdAndUpdate(userId, { $set: { coverImage: coverImageObject } }).select("-password -refreshToken")

        if (!user)
            return res.status(500).json(new ApiError(500, " Error while fetching or updating user "))

        if (user.coverImage.public_id) {
            await deleteCloudinaryImage(user.coverImage.public_id)
        }

        return res.status(200).json(new ApiResponse(200, user, "CoverImage Updated Successful"))

    } catch (error) {
        return res.status(500).json(new ApiError(500, "Unable to update current user CoverImage"))
    }
})


const getOtherUserChannelProfile = asyncHandler(async (req, res) => {
    try {
        const { username } = req.params

        if (!username)
            return res.status(400).json(new ApiError(400, "Username is required"))

        const channel = await User.aggregate([
            //stage 1: Find the user with the username
            {
                $match: { username: username?.toLowerCase() }
            },

            // Stage 2: Find the Number of Subscriber by counting the number of documents in the Susbcription collection where the channel is the userName [JOIN]   
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },

            // Stage 3: Find the Number of Subscribed Channels by counting the number of documents in the Subscription collection where the subscriber is the userName [JOIN]
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedChannels"
                }
            },

            // Stage 4: get All the videos of the channel [JOIN]
            // {
            //     $lookup:{
            //         from:"Video",
            //         localField:"_id", // This is the field of the current document
            //         foreignField:"owner",
            //         as:"videos_of_channel"
            //     }
            // },

            // Stage 5: Add the Above Fields into the document
            {
                $addFields: {
                    subscriberCount: { $size: "$subscribers" },
                    subscribedChannelCount: { $size: "$subscribedChannels" },
                    isSubscribed: {
                        $cond: {
                            if: {
                                $in: [req.user?._id, "$subscribers.subscriber"]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscriberCount: 1,
                    subscribedChannelCount: 1,
                    isSubscribed: 1
                }
            }

        ])

        if (!channel?.length)
            return res.status(500).json(new ApiError(500, "No Channel found using this username"))


        return res.status(200).json(new ApiResponse(200, channel[0], "Channel Details"))

    } catch (error) {
        return res.status(500).json(new ApiError(500, error.message || "Unable to Get User channel profile"))
    }
})


const getWatchHistory = asyncHandler(async (req, res) => {
    console.log(req.user._id)
    try {
        const userWatchHistory = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user?._id) // [ Interview - 1 ] :-> Why didn't we just use {req.user._id} bcz this is a string and we needed mongoose ObjectId , but other place we can use req.user._id because mongoose internally parses the string into ObjectId, [ and the aggregation query is went directly instead of going through mongoose ] that's why we are making an ObjectId from the string.
                }
            },
            {
                $lookup: {
                    from: 'videos',
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "Owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            avatar: 1,
                                            username: 1
                                        }
                                    }
                                ]
                            }
                        },
                        // {  // can be done like this also
                        //     $project: {
                        //         fullName: 1,

                        //     }
                        // },
                        // This step is done for formatting of data as instead of array of object os size [1] we get only object ⬇️
                        {
                            $addFields: {
                                owner: {
                                    $first: "$Owner"
                                }
                            }
                        }
                    ]
                }
            },
            {
                addFields: {
                    watchHistory: {
                        $first: "$watchHistory"
                    }
                }
            }
        ])

        if (!userWatchHistory) {
            res.status(400).json(new ApiError(400, "No History Found"))
        }

        res.status(200).json(new ApiResponse(200, userWatchHistory, " Watch History of the user"))
    } catch (error) {
        return res.status(500).json(new ApiError(500, error.message || "Unable to Get User Watch History"))
    }
})


const deleteUser = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;

        // Delete user from the database
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        // Delete avatar and coverImage from Cloudinary if they exist
        if (deletedUser.avatar && deletedUser.avatar.public_id) {
            await deleteCloudinaryImage(deletedUser.avatar.public_id);
        }

        if (deletedUser.coverImage && deletedUser.coverImage.public_id) {
            await deleteCloudinaryImage(deletedUser.coverImage.public_id);
        }

        return res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));

    } catch (error) {
        return res.status(500).json(new ApiError(500, "Unable to delete user"));
    }
});


export {
    userRegister,
    userLogin,
    userLogout,
    regeneratingAccessToken,
    currentCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage,
    getOtherUserChannelProfile,
    getWatchHistory,
    deleteUser
}