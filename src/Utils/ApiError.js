class ApiError extends Error {
    constructor(statusCode, message = " Something went wrong ", errors = [], stack="") {
        super(message)
        this.statusCode = statusCode
        this.message = message // Corrected from messages to message
        this.data = undefined
        this.errors = errors
        this.success = false

        if (stack)
            this.stack = stack
        else
            Error.captureStackTrace(this, this.constructor)
    }
}

export { ApiError }
