
import userModel from './../../DB/models/user.model.js';
import * as dbservice from "../../DB/db.service.js"
import { Decrypt, Encrypt } from './../../common/security/encrypt.js';
import { Compare, Hash } from '../../common/security/hash.js';
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library';

// const asyncHandler = (fn) => {
//     return (req, res, next) => {
//         fn(req, res, next).catch((error) => {
//             // res.json({ message:error.message })
//             next(error)
//         })
//     }
// }



export const signUp = (async (req, res, next) => {
    const { fName, lName, email, password, age, gender,phone } = req.body


    if (await userModel.findOne({ email: email.toLowerCase() })) {
        // return res.status(409).json({ message: "email already exist" })
        // next(new Error("email already exist"))
        throw new Error("email already exist",{cause:409})
    }
    const user = await dbservice.create({
        model: userModel,
        data: { fName, lName, email, password:await Hash(password), age, gender , phone:Encrypt(phone)}
    })
    return res.status(201).json({ message: "Done", user })
})




export const signUpWithGmail = (async (req, res, next) => {

    try {
        const { idToken } = req.body
        //  console.log(idToken);
        
        const client = new OAuth2Client();

            const decoded = await client.verifyIdToken({
                idToken,
                audience: "324586917049-jej3b57kcm7ts7df4bulabm40tuhc3ea.apps.googleusercontent.com", 
            });
            const { family_name, given_name, picture, email_verified, email } = decoded.getPayload();

        let user = await userModel.findOne({ email: email.toLowerCase() })

        if (!user) {
           user= await userModel.create({
                fName: given_name,
                lName: family_name || given_name,
                email,
                profileImage: picture,
                isConfirmed: email_verified,
                provider: "google"
            })
        }
            
           
        const access_token = jwt.sign({id:user.id, email:user.email},"rahma123",{
            expiresIn:60*50,
        })

        const refresh_token = jwt.sign({id:user.id, email:user.email},"ail123")
        return res.status(200).json({message:"Done", token:{access_token, refresh_token}})
     
         
    } catch (error) {
        return res.status(500).json({message:error.message, stack:error.stack})
    }



})



export const signIn = (async (req, res, next) => {
   
        const { email, password } = req.body
        const user = await dbservice.findOne({ 
            model:userModel,
            filter:{email: email.toLowerCase(), provider: "system" }
        })
        if (!user) {
            // return res.status(404).json({ message: "email not exist or you can login on your signup " })
            throw new Error("email not exist or you can login on your signup ",{cause:404})
        }

        // if (user.isConfirmed !== true) {
        //     return res.status(400).json({ message: "email not confirmed" })
        // }

        if (!await Compare(password,user.password)) {
            // return res.status(400).json({ message: "invalid password" })
            throw new Error("invalid password" ,{cause:400})
        }


        const access_token = jwt.sign({id:user.id, email:user.email},"rahma123",{
            expiresIn:60*50,
            audience:"http://localhost:4000",
            issuer:"http://localhost:3000",
            notBefore:30,
            noTimestamp:true
        })

        const refresh_token = jwt.sign({id:user.id, email:user.email},"ail123")
        return res.status(200).json({message:"Done", token:{access_token, refresh_token}})

        return res.status(200).json({ message: "Done", user:{...user._doc ,phone:Decrypt(user.phone)}})

  
})




export const getProfile = async (req, res, next) => {
    try {
        const { token } = req.body

        if (!token) {
            return res.status(400).json({ message: "token not exist" })
        }

        const decoded = jwt.verify(token, "rahma123")

        const user = await dbservice.findOne({
            model: userModel,
            filter: {
                email: decoded.email.toLowerCase(),
            }
        })
        if (!user) {
            // return res.status(400).json({ message: "user not exist" })
            throw new Error("user not exist",{cause:400})
        }

        return res.status(200).json({ message: "Done", user })

    } catch (error) {
        return res.status(500).json({ message: error.message, stack: error.stack })
        
    }
}