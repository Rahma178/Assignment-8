import { Router } from "express";

import * as US from "./user.services.js"

const userRouter = Router()

userRouter.post("/signUp",US.signUp)
userRouter.post("/signup/gmail",US.signUpWithGmail)
userRouter.post("/signIn",US.signIn)
userRouter.get("/getProfile",US.getProfile)


export default userRouter