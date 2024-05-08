import jwt from "jsonwebtoken";
import { ApiError } from "../Utils/ApiError.js";
import asyncHandler from "../Utils/asyncHandler.js";
import { User } from "../Models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {

        const userCookie = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!userCookie) {
            throw new ApiError(401, "Unauthorized Access")
        }

        const userToken = jwt.verify(userCookie, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(userToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user

        next()
    // } catch (error) {
    //     return res.status(401).json(new ApiError(401, error.message || "Something went wrong while verifying jwt Token"))
    // }
})