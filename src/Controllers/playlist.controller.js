import { Playlist } from '../Models/playlist.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import mongoose from 'mongoose';

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
    var { playlistId, playlistName } = req.body

    const videoId = req.params.videoId

    if (!videoId)
        throw new ApiError(400, 'Video ID is required')

    if (!playlistId) {
        playlistId = new mongoose.Types.ObjectId()
    }

    const videos_playlist = await Playlist.findById(playlistId).select("videos")

    if (videos_playlist && videos_playlist.videos.includes(videoId))
        return res.status(200).json(new ApiResponse(200, videos_playlist, 'Video already in playlist'))


    var updated_playlist = await Playlist.findByIdAndUpdate(playlistId, {
        $push: {
            videos: videoId
        }
    }, { new: true, useFindAndModify: false })

    
    if (!updated_playlist)
        updated_playlist = await Playlist.create({
            _id: playlistId,
            name: playlistName,
            videos: [videoId],
            owner: req.user?._id
        })

    res.status(200).json(new ApiResponse(200, updated_playlist, 'Video added to playlist'))
})