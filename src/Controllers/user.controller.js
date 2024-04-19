import asyncHandler from '../Utils/asyncHandler.js'
import jwt from 'jsonwebtoken'
import { ApiError } from '../Utils/ApiError.js'
import { User } from '../Models/user.model.js'
import { deleteCloudinaryImage, uploadOnCloudinary } from '../Utils/CloudinaryFileUpload.js'
import { ApiResponse } from '../Utils/ApiResponse.js'


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
    try {
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
            // console.log("command was here")
            return res.status(400).json(new ApiError(400, " Required Missing Credentials"))
        }
        const existing_user = await User.findOne({ $or: [{ username }, { email }] })

        if (existing_user) {
            return res.status(409).json(new ApiError(409, "Existing User"))
        }

        const avatarLocalPath = req.files?.avatar[0]?.path

        var coverImageLocalPath = ""
        if (req.files.coverImage)
            coverImageLocalPath = req.files?.coverImage[0]?.path

        if (!avatarLocalPath) {
            return res.status(400).json(new ApiError(400, 'Avatar is required... Must Upload'))
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar) {
            return res.status(500).json(new ApiError(500, 'Avatar Upload failed..'))
        }

        var coverImage
        if (coverImageLocalPath && coverImageLocalPath !== "") {
            coverImage = await uploadOnCloudinary(coverImageLocalPath)
        }

        if (coverImageLocalPath !== "" && !coverImage) {
            return res.status(500).json(new ApiError(500, 'cover Image  Upload failed..'))
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
            return res.status(409).json(new ApiError(500, "Creating User failed ...!"))
        }

        return res.status(201).json(new ApiResponse(200, created_User, "User Created Succesfully"))

    } catch (error) {
        return res.status(500).json(new ApiError(500, "Registeration Failed "))
    }
})


const userLogin = asyncHandler(async (req, res) => {
    try {
        /**
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
            return res.status(400).json(new ApiError(400, "Fields are Required"))
        }

        const user_from_db = await User.findOne({ $or: [{ username: username.toLowerCase() }, { email }] })

        if (!user_from_db) {
            return res.status(404).json(new ApiError(404, "No existing user"))
        }

        const isPasswordCorrect = await user_from_db.isPasswordCorrect(password)  // the methods are not the part of the Database Model i.e (User) but it is the methods of the instance i.e (user_from_db)
        if (!isPasswordCorrect) {
            return res.status(401).json(new ApiError(404, "Invalid credentials"))
        }

        const { refreshToken, accessToken } = await generateRefreshAndAccessToken(user_from_db._id);

        //! Why i feteched the user again ?
        //? Because in the generateRefreshAndAccessToken() we updated the field accessToken, bt the field is not accessible by the user_from_db 

        const user_updated = await User.findOne({ $or: [{ username }, { email }] })
            .select("-password -refreshToken")


        // To secure the cookie by making it accessible from server not from frontend


        res
            .status(200)
            .cookie("refreshToken", refreshToken, cookieOption)
            .cookie("accessToken", accessToken, cookieOption)
            .json(new ApiResponse(200, user_updated, " User authenticated ready for Login"))

    } catch (error) {
        res.status(500).json(new ApiError(500, "Error While Logging Out...!"))
    }
})


const userLogout = asyncHandler(async (req, res) => {
    try {
        /* 
        *  [✔️] get user from Db
        *  [✔️] Delete refreshToken from the cookie. 
        *  [✔️] Delete refershToken from the database.
        */

        const user = req.user

        const updated_user = await User.findByIdAndUpdate(user._id,
            { $set: { refreshToken: null } }, { new: true })
            .select("-password")

        req.user = null

        if (!updated_user) {
            return res.status(500).json(new ApiError(500, "Unable to Update User refreshToken"))
        }

        return res
            .status(200)
            .clearCookie("refreshToken", cookieOption)
            .clearCookie("accessToken", cookieOption)
            .json(new ApiResponse(200, null, " User Logout Successful"))

    } catch (error) {
        return res.status(500).json(new ApiError(500, "Unable to Logout"))
    }
})


const regeneratingAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken   // {req.body.refreshToken} -> bcz we are assuming user is using mobile phone

        if (!incomingRefreshToken)
            return res.status(401).json(new ApiError(401, "you are unauthorized to perform this action"))

        const decodedRefreshToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedRefreshToken?._id)

        if (!user)
            return res.status(404).json(new ApiError(404, "No User found "))


        if (incomingRefreshToken !== user.refreshToken)
            return res.status(401).json(new ApiError(401, "RefreshToken has expired or used "))

        const { refreshToken, accessToken } = await generateRefreshAndAccessToken(user?._id)

        res
            .status(200)
            .cookie("accessToken", accessToken, cookieOption)
            .cookie("refreshToken", refreshToken, cookieOption)
            .json(new ApiResponse(200, { accessToken, refreshToken }, "AccessToken Generated and Login Succesful"))

    } catch (error) {
        return res.status(500).json(new ApiError(500, "Unable to Logout"))
    }
})


const currentCurrentPassword = asyncHandler(async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body

        const userId = req.user?._id;

        const user = await User.findById(userId)

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

        const avatarLocalPath = req.file?.path

        if (!avatarLocalPath)
            return res.status(400).json(new ApiError(400, "Avatar is required"))
        const result = await deleteCloudinaryImage(avatarLocalPath, user_from_db.avatar.public_id)

        if (result !== "ok")
            return res.status(400).json(new ApiError(400, " user Doesn't have a image"))

        const avatar = await uploadOnCloudinary(avatarLocalPath)

        if (!avatar)
            return res.status(500).json(new ApiError(500, "Error while uploading image to cloudinary"))

        const avatarObject = {
            url: avatar.url,
            public_id: avatar.public_id
        }
        const user = await User.findByIdAndUpdate(userId, { $set: { avatar: avatarObject } }, { new: true }).select("-password -refreshToken")

        if (!user)
            return res.status(500).json(new ApiError(500, " Error while fetching or updating user "))

        return res.status(200).json(new ApiResponse(200, result, "Avatar Updated Successful"))

    } catch (error) {
        return res.status(500).json(new ApiError(500, "Unable to update current user avatar"))
    }
})


const updateUserCoverImage = asyncHandler(async (req, res) => {
    try {
        const userId = req.user ? req.user?._id : null

        if (!userId)
            return res.status(401).json(new ApiError(401, "Unauthorized to perform this action"))

        const CoverImageLocalPath = req.file?.path

        if (!CoverImageLocalPath)
            return res.status(400).json(new ApiError(400, "CoverImage is required"))

        const coverImage = await uploadOnCloudinary(CoverImageLocalPath)

        if (!coverImage)
            return res.status(500).json(new ApiError(500, "Error while uploading image to cloudinary"))

        const coverImageObject = {
            url: coverImage.url,
            public_id: coverImage.public_id
        }

        const user = await User.findByIdAndUpdate(userId, { $set: { coverImage: coverImageObject } }, { new: true }).select("-password -refreshToken")

        if (!user)
            return res.status(500).json(new ApiError(500, " Error while fetching or updating user "))

        return res.status(200).json(new ApiResponse(200, user, "CoverImage Updated Successful"))

    } catch (error) {
        return res.status(500).json(new ApiError(500, "Unable to update current user avatar"))
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
                    from: "Subscription",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },

            // Stage 3: Find the Number of Subscribed Channels by counting the number of documents in the Subscription collection where the subscriber is the userName [JOIN]
            {
                $lookup: {
                    from: "Subscription",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedChannels"
                }
            },

            // Stage 4: get All the videos of the channel [JOIN]
            // {
            //     $lookup:{
            //         from:"Video",
            //         localField:"username",   // we can not find videos with username because in the Video Collections owner field is store with _id.

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
                                $in: [req.user?._id, "$subscribers.subscribe"]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $roject: {
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

        if(!channel?.length )
            return res.status(500).json(new ApiError(500,"No Channel found using this username"))

        console.log(channel)

        return res.status(200).json(new ApiResponse(200, channel[0],"Channel Details"))

    } catch (error) {
        return res.status(500).json(new ApiError(500, "Unable to Get User channel profile"))
    }
})


const getWatchHistory = asyncHandler( async ( req, res )=>{

    const user = await User.aggregate([
        {
            $match:{
                _id: new Schema.Types.ObjectId(req.user?._id) // [ Interview - 1 ] :-> Why didn't we just use {req.user._id} bcz this is a string and we needed mongoose ObjectId , but other place we can use req.user._id because mongoose internally parses the string into ObjectId, [ and the aggregation query is went directly instead of going through mongoose ] that's why we are making an ObjectId from the string.
            }
        }
    ])
})


export {
    userRegister,
    userLogin,
    userLogout,
    regeneratingAccessToken,
    currentCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage,
    getOtherUserChannelProfile
}