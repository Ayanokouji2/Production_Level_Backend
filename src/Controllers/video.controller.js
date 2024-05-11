import { Video } from "../Models/video.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from 'mongoose'
import { uploadOnCloudinary } from "../Utils/CloudinaryFileUpload.js";

/*
 *  [✔️] Upload a video in a channel by a user
 *  [] get a video from a channel
 *  [✔️] get all the video of channel 
 *  [] update video details { title, description, thumbnail, isPublished }
 *  [] delete a video from the channel
 */

const uploadVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description, isPublished } = req.body

        if (!title) {
            return res.status(400).json(new ApiError(400, "Please provide all the required fields", true))
        }
      
        const videoLocalPath = req.files?.video[0]?.path
        const thumbnailLocalPath = req.files?.thumbnail[0]?.path

        console.log(videoLocalPath)
        console.log(thumbnailLocalPath)
        if (!videoLocalPath)
            return res.status(400).json(new ApiError(400, "Please provide a video file", true))

        if (!thumbnailLocalPath)
            return res.status(400).json(new ApiError(400, "Please provide Thumbnail for the Video", true))

        const videoUploadResponse = await uploadOnCloudinary(videoLocalPath);

        const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailLocalPath);

        if (!videoUploadResponse)
            return res.status(500).json(new ApiError(500, "Errorn fuicking errror uploading video", true))

        if (!thumbnailUploadResponse)
            return res.status(500).json(new ApiError(500, "Error while uploading thumbnail", true))

        const videoOption = {
            url: videoUploadResponse.url,
            pulic_id: videoUploadResponse.public_id,
        }

        const thumbnailOption = {
            url: thumbnailUploadResponse.url,
            pulic_id: thumbnailUploadResponse.public_id,
        }


        const video = await Video.create({
            videoFile: videoOption,
            thumbnail: thumbnailOption,
            title,
            description,
            isPublished,
            owner: req.user._id,
            duration: videoUploadResponse.duration
        })

        if (!video)
            return res.status(500).json(new ApiError(500, "Error while uploading video in the data base", true))

        return res.status(201).json(new ApiResponse(201, video, "Video uploaded successfully"))


    } catch (error) {
        return res.status(500).json(new ApiError(500, "Error while Uploadiing Video-> " + error.messsage, true))
    }
})


const getAllVideosOfChannel = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params

        if (!userId)
            return res.status(400).json(new ApiError(400, "Channel Name Error", true))

        const video = await Video.aggregate([
            {

                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                password: 0,
                                email: 0,
                                refreshToken: 0,
                                watchHistory: 0,
                            }
                        }
                    ]
                }
            }
        ])

        if (!video || video.length === 0) {
            return res.status(404).json(new ApiError(404, "No Video Found", true))
        }

        return res.status(200).json(new ApiResponse(200, video, "All Videos of the Channel"))
    } catch (error) {
        res.status(500).json(new ApiError(500, error.message, true))
    }
})


const updateDetailsOfTheVideo = asyncHandler(async (req, res) => {
    try {
        //! Must check how to handle isPublished in the same function or different function
        const { title, description } = req.body

        if (!title && !description) {
            return res.status(400).json(new ApiError(402, " All fields are necessary", true))
        }

        const updateObject = {}

        if(title)
            updateObject.title = title

        if(description)
            updateObject.description = description

        const { videoId } = req.params

        if (!videoId)
            return res.status(400).json(new ApiError(400, " Select Video to update"))

        if(!updateObject)
            return  res.status(400).json(new ApiError(402, " All fields are necessary", true))
        
        const updatedVideo = await Video.findByIdAndUpdate(videoId, {
            $set: updateObject
        }, { new: true })

        if(!updatedVideo)
            return res.status(500).json(new ApiError(500,"Error While Updating Video Information",true))

        return res.status(200).json(new ApiResponse(200,updatedVideo,"video updated"))
    } catch (error) {
        res.status(500).json(new ApiError(500, "Something Went Wrong with the Updating Details " + error.message, true))
    }
})
export {
    uploadVideo,
    getAllVideosOfChannel,
    updateDetailsOfTheVideo
}