import Subscription from '../Models/subscription.model.js'; 
import asyncHandler from '../Utils/asyncHandler.js';
import ApiError from '../Utils/ApiError.js';
import ApiResponse from '../Utils/ApiResponse.js';

const subscribeToChannel = asyncHandler(async (req, res) => {
    const user = req.user;
    const channel = req.params.channelId;

    if(!channel)
        throw new ApiError(400, 'Channel ID is required');

    const response = await Subscription.create({
       channel:user,
       subscriber: channel 
    })

    if(!response)
        throw new ApiError(500, 'Failed to subscribe to channel');

    res.status(201).json( new ApiResponse(201, 'Subscribed to channel successfully'))
})

export { subscribeToChannel }