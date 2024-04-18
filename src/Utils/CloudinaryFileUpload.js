import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath){
            console.log("No localPath to upload the image")
            return null;
        }

        const response = await cloudinary.uploader.upload(localFilePath, { resourse_type: "auto" })
        // fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        // fs.unlinkSync(localFilePath)
        console.log(" Error while Uploading File into cloudinary and removing file from server ")

        return null;
    }finally{
        fs.unlinkSync(localFilePath)
    }

}

const deleteCloudinaryImage = async(localPath, public_id)=>{
    try {
        console.log("command in cloudinary file",public_id)
        if(!public_id){
            console.log("No public_id to delete the image")
            return null
        }

        const response = await cloudinary.uploader.destroy(public_id)

        console.log(response)
        if(!response){
            console.log("Something went wrong || public_id didn't match any image")
            return null
        }

        return response

    } catch (error) {
        console.log("Error while deleting image from cloudinary")
        return null;
    }
    finally{
        fs.unlink(localPath)
    }
}

export { uploadOnCloudinary, deleteCloudinaryImage }