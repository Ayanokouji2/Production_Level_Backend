import mongoose, { Schema, model } from 'mongoose';

const playlistSchema = new Schema({
    name:{
        type: String,
        required: [true, "PlayList Name is Requried"]
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    videos: [{
        type: Schema.Types.ObjectId,
        ref: 'Video'
    }]
},{timestamps: true})


export const Playlist = model('Playlist', playlistSchema)