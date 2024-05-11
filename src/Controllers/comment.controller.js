import { Comment } from "../Models/comment.model.js";
import asyncHandler from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { Video } from "../Models/video.model.js";

export const createComment = asyncHandler(async (req, res) => {
    const videoId = req.params.videoId
    const { content } = req.body

    if (!content)
        throw new ApiError(400, 'Content is required')

    if (!videoId)
        throw new ApiError(400, 'Video ID is required')

    const video = await Video.findById(videoId).select('_id')

    console.log(video)
    if (!video)
        throw new ApiError(404, 'Video not found')

    const comment  = await Comment.create({
        content,
        video: videoId,
        user: req.user._id
    })    

    res.status(201).json(new ApiResponse(201, comment, "user comment on the video successfully"))
})