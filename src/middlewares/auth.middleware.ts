import { NextFunction } from "express";
import jwt from 'jsonwebtoken';
import userModel from './../module-user/models/userModel';

export const authMiddlware = (req: any, res: any, next: NextFunction) => {
    const token: string = req.headers["x-access-token"] || req.headers["authorization"] || "";
    const tokenHasSplited: Array<string> = token.split(" ");
    if(token && tokenHasSplited.length > 1 && tokenHasSplited[0] == 'Bearer'){
        jwt.verify(tokenHasSplited[1], process.env.SECRET_KEY || 'cloudkick', async function (err:any, decoded:any) {
            if(err){
                res.send({success: false, message: 'token invalid'});
            }else{
                const mainUser:any = await userModel.findOne({userName: decoded.userName});
                if (mainUser) {
                    req.user = mainUser;
                    next();
                } else {
                    res.status(401).json({ success: false, message: 'Authenticate fail' });
                    throw new Error('No user found');
                }
            }
        })
    }else{
        res.send({success: false, message: 'no token provided'});
    }
}