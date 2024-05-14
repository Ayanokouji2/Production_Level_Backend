import { Comment } from "../Models/comment.model.js";
import asyncHandler from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { Video } from "../Models/video.model.js";
import mongoose from 'mongoose'

export const createComment = asyncHandler(async (req, res) => {
    const videoId = req.params.videoId
    const { content } = req.body

    const userId = new mongoose.Types.ObjectId(req.user?._id)

    if (!content)
        throw new ApiError(400, 'Content is required')

    if (!videoId)
        throw new ApiError(400, 'Video ID is required')

    const video = await Video.findById(videoId).select('_id')

    if (!video)
        throw new ApiError(404, 'Video not found')

    // const comment  = await Comment.create({
    //     content,
    //     video: videoId,
    //     user: req.user._id
    // })    


    const comment = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: "video_owner",
                pipeline: [{
                    $project: {
                        username: 1,
                        _id: 1

                    }
                }]

            }
        },
        {
            $addFields: {
                video_owner: { $arrayElemAt: ["$video_owner", 0] },
                content: content,
                owner: userId,
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $project: {
                _id: 0,  // Exclude the existing _id field to avoid conflict in the merge stage
                content: 1,
                video_owner: 1,
                title: 1,  // Assuming the title field is present in the Video document
                createdAt: 1,
                updatedAt: 1,
                owner: 1,
                video: 1,
                __v: 1
            }
        },
        {
            $addFields: {
                _id: new mongoose.Types.ObjectId()  // Generate a new _id for the comments
            }
        },
        {
            $merge: {
                into: "comments",
                on: "_id",  // Use the newly generated _id to avoid conflicts
                whenMatched: "merge",
                whenNotMatched: "insert"
            }
        }
    ])

    res.status(201).json(new ApiResponse(201, comment, "user comment on the video successfully"))
})