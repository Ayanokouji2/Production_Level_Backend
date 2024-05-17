import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import session from 'express-session'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "20Kb" }));
app.use(express.urlencoded({ extended: true, limit: "20Kb" }))
app.use(express.static("public"))  // any folder that can be accessed for storing file in the folder
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }))

app.use(cookieParser())


// import routes

import userRouter from './Routes/user.routes.js'  // can only import with different name if we export it using default keyword
import videoRouter from './Routes/video.routes.js'
import subscriptionRouter from './Routes/subscription.routes.js'
import commentRouter from './Routes/comment.routes.js'
import playlistRouter from './Routes/playlist.routes.js'

app.use("/api/v1/users", userRouter)

app.use("/api/v1/video", videoRouter)

app.use("/api/v1/subscription", subscriptionRouter)

app.use('/api/v1/comment', commentRouter)

app.use('/api/v1/playlist', playlistRouter)

export { app }