const asyncHandler = (requestHandler) => {
    try {
        return (req, res, next) => {
            Promise
                .resolve(requestHandler(req, res, next))
                .catch((err) => {
                    next(err)
                    // res.status(err.status || 500).json({
                    //     success: false,
                    //     message: err.message
                    // })
                })
        }
    } catch (error) {
        console.log("Error while handling Request in AsyncHandler")
    }
}

export default asyncHandler

//TODO Another way to achieve the same

/*
const asyncHandler = (requestHandler) = async (req, res, next) => {
    try {
        await requestHandler(req, res, next)
    } catch (err) {
        res.status(err.status || 500).json({
            success: false,
            message: err.message
        })
    }
}

*/