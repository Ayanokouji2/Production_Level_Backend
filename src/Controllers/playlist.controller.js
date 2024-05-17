import { Playlist } from '../Models/playlist.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const addVideoToPlaylist = asyncHandler( async ( req, res ) =>{
    const { playlistId } = req.body

    const videoId = req.params.videoId

    if(!videoId)
        throw new ApiError(400, 'Video ID is required')
    
    const videos_playlist = await Playlist.findById(playlistId).select("videos")

    if(videos_playlist.videos.includes(videoId))
        return res.status(200).json(new ApiResponse(200, videos_playlist, 'Video already in playlist'))

    const updated_playlist = await Playlist.findByIdAndUpdate(playlistId, {
        $push:{
            videos: videoId
        }
    },{ new: true, useFindAndModify: false })

    // console.log(updated_playlist)
    if(!updated_playlist)
        throw new ApiError(404, 'Playlist not found')

    res.status(200).json(new ApiResponse(200, updated_playlist,'Video added to playlist')) 
})