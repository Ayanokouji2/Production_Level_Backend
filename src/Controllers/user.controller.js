import asyncHandler from '../Utils/asyncHandler.js'
import { ApiError } from '../Utils/ApiError.js'
import { User } from '../Models/user.model.js'
import { uploadOnCloudinary } from '../Utils/CloudinaryFileUpload.js'

const userRegister = asyncHandler(async (req, res) => {
    try {
        /**
         * [✔️] get user details from frontend
         * [✔️] validate the fields 
         * [✔️] check if user exists: username, email
         * [✔️] check for images : avatar, coverImage -> 
         * [✔️] upload it to cloudinary
         * [] create the user Object and then save it to db
         * [] check if response is comming or not
         * [] remove the hashedpassword -> password and remove refreshtoken
         * [] send the response to the frontend
         */

        const { username, email, password, fullName } = req.body

        if ([username, email, password, fullName].some((field) => field?.trim() === ""))
            throw new ApiError(400, " Required Missing Credentials")


        const existing_user = await User.findOne({ $or: [{ username }, { email }] })

        if (existing_user)
            throw new ApiError(409, "Existing User")

        
        const avatarLocalPath = req.files?.avatar[0]?.path

        var coverImageLocalPath = ""
        if(req.files.coverImage)
            coverImageLocalPath = req.files?.coverImage[0]?.path

        if (!avatarLocalPath)
            throw new ApiError(400, 'Avatar is required... Must Upload')

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar)
            throw new ApiError(500, 'Avatar Upload failed..')

        
        var coverImage = ""
        if (coverImageLocalPath && coverImageLocalPath !== "") 
            coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if (coverImageLocalPath !== "" && coverImage && coverImage !== "")
            throw new ApiError(500, 'cover Image  Upload failed..')


        const user_to_save = {
            username,
            email,
            fullName,
            password,
            avatar:avatar.url,
            coverImage : coverImage.url,
        }

        const user = await User.create(user_to_save);
        
        if(!user)
            throw new ApiError(500,"Creating User failed ...!")

        res.status(201).json({
            success: true,
            message: " User Created",
            user
        })

    } catch (error) {

    }
})


const userLogin = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "success login"
    })
})

export { userRegister, userLogin }