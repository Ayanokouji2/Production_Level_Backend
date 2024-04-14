import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        min: [8, "Password must be greater than 8 instead got {VALUE}"]
    },
    fullName: {
        type: String,
        trim: true,
        required: true,
    },
    avatar: {
        type: String,
        required: true
    },
    coverImage: {
        type: String
    },
    refreshToken: {
        type: String
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Video'
        }
    ]
}, { timestamps: true })

// using Function instead of Arrow Function because we need reference of "this" inside the function

// Issue 1: This pre hook will run every time when the user save any data either  avatar or anything but we want to be saved only when password is changed.
userSchema.pre('save', async function (next) {
    if (!this.isModified("password")) // Issue 1 is resolved using this condition
        return next()

    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccesToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY })
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
    }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY })
}

export const User = model("User", userSchema);