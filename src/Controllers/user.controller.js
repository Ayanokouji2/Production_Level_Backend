import asyncHandler from '../Utils/asyncHandler.js'

const userRegister = asyncHandler ( async ( req, res )=>{
    res.status(201).json({
        message:"ok"
    })
})


const userLogin = asyncHandler( async ( req, res ) =>{
    console.log('user came heher')
    res.status(200).json({
        message:"success login"
    })
})

export { userRegister, userLogin }