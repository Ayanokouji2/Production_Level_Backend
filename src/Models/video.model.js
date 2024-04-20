import { Schema, model } from 'mongoose'
import aggregate_paginate from 'mongoose-aggregate-paginate-v2'

const videoSchema = new Schema({
    videoFile: {
        type: Object,
        required: true
    },
    thumbnail: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
    },
    views: {
        type: Number,
        required: true,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    duration: {
        type: Number,
        required: true
    }
}, { timestamps: true })

videoSchema.plugin(aggregate_paginate)

export const Video = model("Video", videoSchema);