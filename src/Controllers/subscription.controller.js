import { Subscription } from '../Models/subscription.model.js';
import asyncHandler from '../Utils/asyncHandler.js';
import { ApiError } from '../Utils/ApiError.js';
import { ApiResponse } from '../Utils/ApiResponse.js';

const subscribeToChannel = asyncHandler(async (req, res) => {
    const user = req.user;
    const channel = req.params.channelId;

    if (!channel)
        throw new ApiError(400, 'Channel ID is required');

    const existingSubscriptionCheck = await Subscription.findOne({ $and: [{ channel }, { subscriber: user }] });   

    if (existingSubscriptionCheck)
        throw new ApiError(400, 'Already subscribed to channel');

    const response = await Subscription.create({
        channel,
        subscriber: user
    })

    /**
     * The Two Db Calls can be reduced to one Db call by using the following code
     * 
     * cosnt response = await Subscription.findOneAndUpdate({
     * $and: [{ channel }, { subscriber: user }]},  // the query that is used to find the document to update
     * { channel, subscriber: user },  // the data that is to be updated
     * { upsert: true, new: true })  //upsert is a boolean flag that is used to check whether the document exists from the query provided and if exist then update the document and it not then create a new document 
     */

    if (!response)
        throw new ApiError(500, 'Failed to subscribe to channel');

    res.status(201).json(new ApiResponse(201, null, 'Subscribed to channel successfully'))
})

const unsubscribeFromChannel = asyncHandler(async (req, res) => {
    const user = req.user;
    const channel = req.params.channelId;

    if (!channel)
        throw new ApiError(400, 'Channel ID is required');

    const response = await Subscription.findOneAndDelete({
        $and: [{ channel }, { subscriber: user }]
    })

    if (!response)
        throw new ApiError(500, 'Failed to unsubscribe from channel');

    res.status(200).json(new ApiResponse(200, response, 'Unsubscribed from channel successfully'))
})

export { subscribeToChannel, unsubscribeFromChannel }