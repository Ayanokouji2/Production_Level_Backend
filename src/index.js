import 'dotenv/config';
import connectDB from './Database/connect.js';
import { app } from './app.js';

// dotenv.config({path:"./env"})
const PORT = 5000 || process.env.PORT 

connectDB() 
    .then(() => {
        app.on("error",(err)=>{
            console.log(`Unable to communicate with the App Error : ${err}`)
            throw err
        })
        app.listen(PORT, () => {
            console.log(`Server is listening in port : ${PORT}`)
        })
    })
    .catch(err => {
        console.log(`Mongodb Error connection failed at index.js : ${err}`)
        throw err
    })