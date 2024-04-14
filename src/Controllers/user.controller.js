import asyncHandler from '../Utils/asyncHandler.js'
import { ApiError } from '../Utils/ApiError.js'
import { User } from '../Models/user.model.js'

const userRegister = asyncHandler(async (req, res) => {
    try {
        /**
         * [✔️] get user details from frontend
         * [✔️] validate the fields 
         * [✔️] check if user exists: username, email
         * [✔️] check for images : avatar, coverImage -> 
         * [] upload it to cloudinary
         * [] create the user Object and then save it to db
         * [] check if response is comming or not
         * [] remove the hashedpassword -> password and remove refreshtoken
         * [] send the response to the frontend
         */

        const { username, email, password, fullName } = req.body

        if ([username, email, password, fullName].some((field) => field?.trim() === ""))
            throw new ApiError(400, " Required Missing Credentials")


        const existing_user = await User.findOne({ $or: [ { username }, { email } ] })

        if( existing_user )
            throw new ApiError(409, "Existing User")

        const avatarLocalPath = req.files?.avatar[0]?.path
        const coverImageLocalPath = req.files?.coverImage[0]?.path

        
    } catch (error) {

    }
})


const userLogin = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "success login"
    })
})

export { userRegister, userLogin }