const User = require("../models/user")
const express = require("express")
const db = require("../db")
const ExpressError = require("../expressError")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");

const {DB_URI,
    SECRET_KEY,
    BCRYPT_WORK_FACTOR} = require("../config")
const ExpressError = require("../expressError")

const router = express.Router()

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login",async (req,res,next)=>{
    try{
        const {username,password} = req.body

        const user = await User.get(username)
        const auth = await bcrypt.compare(password,user.password)
        if(auth){
            User.updateLoginTimestamp(username)
            token = jwt.sign(user,BCRYPT_WORK_FACTOR)
            return res.json({token})
        }else{
            throw new ExpressError("Username/password invalid")
        }
    }catch(e){
        return next(e)
    }
})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register",async (req,res,next)=>{
    try{    
        const userData = req.body
        const user = User.register(userData)
        token = jwt.sign(user,BCRYPT_WORK_FACTOR)
        User.updateLoginTimestamp(user.username)
        return res.json({token})
    }catch(e){
        return next(e)
    }
})



module.exports = router;