import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath)
            return null;

        const response = await cloudinary.uploader.upload(localFilePath, { resourse_type: "auto" })
        
        console.log(response)
        console.log("Your File Has Been Uploadedd")

        return response
    } catch (error) {
        fs.unlinkSync('localFilePath')
        console.log(" Error while Uploading File into cloudinary and removing file from server ")

        return null;
    }
}

export { uploadOnCloudinary }