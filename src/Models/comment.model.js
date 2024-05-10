import { Schema, model } from 'mongoose'

const commentSchema = new Schema(
    {
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        video:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
        content:{
            type:String,
            required:true
        }
    },{
        timestamps:true
    }
)

export const Comment = model('Comment', commentSchema)