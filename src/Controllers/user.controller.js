import asyncHandler from '../Utils/asyncHandler.js'
import { ApiError } from '../Utils/ApiError.js'
import { User } from '../Models/user.model.js'
import { uploadOnCloudinary } from '../Utils/CloudinaryFileUpload.js'
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

        var coverImage = ""
        if (coverImageLocalPath && coverImageLocalPath !== "") {
            coverImage = await uploadOnCloudinary(coverImageLocalPath)
        }

        if (coverImageLocalPath !== "" && coverImage && coverImage !== "") {
            return res.status(500).json(new ApiError(500, 'cover Image  Upload failed..'))
        }

        const user_to_save = {
            username,
            email,
            fullName,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url,
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
         *  [] send secure cookies 
         *  [] return the response
         */
        const { username, password, email } = req.body

        if ((!username && !email) || !password) {
            return res.status(400).json(new ApiError(400, "Fields are Required"))
        }

        const user_from_db = await User.findOne({ $or: [{ username }, { email }] })

        if (!user_from_db) {
            return res.status(404).json(new ApiError(404, "No existing user"))
        }

        const isPasswordCorrect = await user_from_db.isPasswordCorrect(password)  // the methods are not the part of the Database Model i.e (User) but it is the methods of the instance i.e (user_from_db)
        if (!isPasswordCorrect) {
            return res.status(401).json(new ApiError(404, "Invalid credentials"))
        }

        const { refreshToken, accessToken } = await generateRefreshAndAccessToken(user_from_db._id);
        
    } catch (error) {

    }
})

export { userRegister, userLogin }