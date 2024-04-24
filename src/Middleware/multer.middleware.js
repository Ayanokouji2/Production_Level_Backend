import multer from 'multer'

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'public')  // the (null, 'public ') => here null represent error and 'public' represents the location where to save the file
    },
    filename: (req, file, callback) => {
        const fileName = file.fieldname + Date.now() + `.${file.originalname.split(".").splice(-1)[0]}`;
        callback(null, fileName)
        console.log("Gooh")
    }

})

export const upload  = multer({ storage })
