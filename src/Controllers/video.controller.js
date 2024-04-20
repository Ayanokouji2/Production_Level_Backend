import { Video } from "../Models/video.model.js";
import asyncHandler from "../Utils/asyncHandler.js";
import ApiError from "../Utils/ApiError.js";
import { uploadOnCloudinary } from "../Utils/cloudinary.js";

/**
 *  [] Upload a video in a channel by a user
 *  [] get a video from a channel
 *  [] get all the video of channel 
 *  [] update video details { title, description, thumbnail, isPublished }
 *  [] delete a video from the channel
 */

const uploadVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description, thumbnail } = req.body

        if ([title, description, thumbnail].some(item => item !== description && item !== undefined && item.trim() !== "")) {
            return res.status(400).json(new ApiError(400, "Please provide all the required fields", true))
        }

        const videoLocalPath = req.files?.video[0]?.path
        const thumbnailLocalPath = req.files?.thumbnail[0]?.path

        if (!videoLocalPath)
            return res.status(400).json(new ApiError(400, "Please provide a video file", true))

        if (!thumbnailLocalPath)
            return res.status(400).json(new ApiError(400, "Please provide Thumbnail for the Video", true))

        const videoUploadResponse = await uploadOnCloudinary(videoLocalPath);

        const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailLocalPath);

        if (!videoUploadResponse || !thumbnailUploadResponse)
            return res.status(500).json(new ApiError(500, "Error while uploading video", true))

        const videoOption = {
            url: videoUploadResponse.url,
            pulic_id: videoUploadResponse.public_id,
        }

        const thumbnailOption = {
            url: thumbnailUploadResponse.url,
            pulic_id: thumbnailUploadResponse.public_id,
        }

        const video = await Video.create({
            title,
            description,
            thumbnail,
            videoFile: videoOption,
            thumbnail: thumbnailOption,
            owner: req.user._id,
        })

        if (!video)
            return res.status(500).json(new ApiError(500, "Error while uploading video", true))

        return res.status(201).json({ success: true, data: video })


    } catch (error) {
        return res.status(500).json(new ApiError(500, "Error while uploading video" + error.messsage, true))
    }
})


export {
    uploadVideo
}