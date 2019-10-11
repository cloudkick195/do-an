import { Request, Response } from 'express';
import userModel from '../models/userModel';
import { isEmpty, isEmail, matches } from 'validator';
import jwt from 'jsonwebtoken';
import database from '../../database';
import { promises } from 'dns';
import nodemailer from 'nodemailer';
import "dotenv/config";
import userValidator from '../controllers/userValidator';
class UserController{
    private secret:string = 'cloudkick';
    public createUser = (req: Request, res:  Response) => {
        const {userName, firstName, lastName, password, confirmPassword, email, birthDay, gender} = req.body;
        
        try {
            
            const validateArray = userValidator.validateParamsArray({ userName, firstName, lastName, password, confirmPassword, email, birthDay, gender });
        
            if(validateArray.length > 0) {
                res.send({ success: false, message:  validateArray});
            }else{
                if(matches(userName, /^([a-zA-Z0-9]{3,20})+$/) === false){
                    res.send({success: false, message: "Username Must be at least 3 characters, max 20, no special characters, length 3->20"});
                }else if(!isEmail(email)){
                    res.send({success: false, message: "The Email is invalid"});
                }else if(matches(password, /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[\d])(?=.*?[\W]).{8,35}$/) === false){
                    res.send({success: false, message: "Password needs to have at least one lower case, one uppercase, onenumber, one special character, and must be at 8 -> 35 character"});
                }else if(confirmPassword !== password){
                    res.send({success: false, message: "Password confirmation does not match password"});
                }else{
                    const user = new userModel({
                        userName: userName,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        password: password,
                        birthDay: new Date(birthDay),
                        gender: gender,
                        temporarytoken: jwt.sign({ username: userName, email: email }, this.secret, { expiresIn: 300 })
                    });
                    user.save()
                    
                    .then(user => {
                        // Create e-mail object to send to user
                        const email = {
                            from: 'KingBuild, tetst@gmail.com',
                            to: [user.email],
                            subject: 'KingBuild, Your Activation Link in 5 minutes time',
                            text: 'Hello ' + user.userName + ', thank you for registering at localhost.com. Please click on the following link to complete your activation:'+ `${process.env.SEVER_LINK}`+'/api/users/token',
                            html: 'Hello<strong> ' + user.userName + '</strong>,<br><br>Thank you for registering at localhost.com. Please click on the link below to complete your activation:<br><br><a href="'+ `${process.env.SEVER_LINK}`+'/api/users/token/' + user.temporarytoken + '">http://localhost/token/</a> in 5 minutes time'
                        };
                        
                        const client = this.getCreateTransport();
                        // Function to send e-mail to the user
                        client.sendMail(email).then( info => {
                            console.log('Message sent: %s', info);
                        }).catch(err => {
                            console.log(err);
                        });
                        res.send({ success: true, message: 'Account registered! Please check your e-mail for activation link.' });
                    })
                    .catch((err:any) => {
                        if(err){
                            if (err.code == 11000) {
                                if (err.errmsg[62] == "u") {
                                    res.send({success: false, message: "The username is already taken"});
                                } else if(err.errmsg[62] == "e") {
                                    res.send({success: false, message: "That E-mail is already taken"});
                                }
                            }else{
                                res.send({success: false, message:err });
                            }
                        }
                    });
                }
            }
        } catch (err) {
            throw err;
        }
    }

    private getCreateTransport(){
        return nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // upgrade later with STARTTLS
            auth: {
                user: 'cloudkick195@gmail.com',
                pass: 'eomaimcneqiequxh'
            }
        });
    }

    public authenticate = async (req: Request, res: Response): Promise<void> => {
        const { password, loginUser } = req.body;
        let user: any;
        const validateArray = userValidator.validateParamsArray({ password, loginUser });
        
        if(validateArray.length > 0) {
            res.send({ success: false, message:  validateArray});
        }else{
            const findParams = isEmail(loginUser) ? { email: loginUser } : { userName: loginUser };
            user = await userModel.findOne(findParams).select('email userName password active');
            
            if (user) {
                const validPassword = user.comparePassword(req.body.password);
                if (!validPassword) {
                    res.send({ success: false, message: 'Could not authenticate Password' });
                } else if (!user.active) {
                    res.send({ success: false, message: 'Account is not yet activated. Please check your email for activation link', expired: true });
                } else {
                    const token = jwt.sign({ userName: user.userName, email: user.email }, this.secret, { expiresIn: 7200 });
                    user.password = undefined;
                    user.expires_at = 7200;
                    user.active = undefined;
                    res.send({ success: true, message: 'User authenticated!', token: token, user:user  });
                }
            }else{
                res.send({ success: false, message: 'No Username or Email found' });
            }
        }
    }

    public activate = async (req: Request, res: Response): Promise<void> =>{
        try {
            let user = await userModel.findOne({temporarytoken: req.params.token}).select('email userName password temporarytoken active');
            if(user){
                if(user.active === false){
                    jwt.verify(req.params.token, this.secret);
                    user.temporarytoken = undefined;
                    user.active = true;
                    await user.save(); 
                    const email = {
                        from: 'KingBuild, tetst@gmail.com',
                        to: user.email,
                        subject: 'Account Activated',
                        text: 'Hello ' + user.userName + ', Your account has been successfully activated!',
                        html: 'Hello<strong> ' + user.userName + '</strong>,<br><br>Your account has been successfully activated!'
                    };
                    const client = this.getCreateTransport();
                    // Send e-mail object to user
                    client.sendMail(email); 
                }
                res.send({ success: true, message: 'Account activated!' });       
            }else{
                res.send({ success: false, message: 'User was not found' });
            }
            
            
        } catch (err) {
            res.send({ success: false, message: 'Invalid Token or Activation link has expired.' });
            throw err;
        }
    }

    public postResend = async (req: Request, res: Response): Promise<void> =>{
        const { password, loginUser } = req.body;
        const findParams = isEmail(loginUser) ? { email: loginUser } : { userName: loginUser };
        const user = await userModel.findOne(findParams).select('email userName password active');
        
        if(user){
            if (password) {
                const validPassword = user.comparePassword(password); // Password was provided. Now check if matches password in database
                
                if (!validPassword) {
                    res.send({ success: false, message: 'Could not authenticate password' }); // Password does not match password found in database
                } else if (user.active) {
                    res.send({ success: false, message: 'Account is already activated.' }); // Account is already activated
                } else {
                    res.send({ success: true, user: user.userName });
                }
            } else {
                res.send({ success: false, message: 'No password provided' }); // No password was provided
            }
        }else{
            res.send({ success: false, message: 'User was not found' });
        }
    }

    public putResend = async (req: Request, res: Response): Promise<void> =>{
        try {
            const { loginUser } = req.body;
            const findParams = isEmail(loginUser) ? { email: loginUser } : { userName: loginUser };
            const user = await userModel.findOne(findParams).select('email userName password temporarytoken active');
            
            if(user){
                if (user.active) {
                    res.send({ success: false, message: 'Account is already activated.' }); // Account is already activated
                } else {
                    user.temporarytoken = jwt.sign({ userName: user.userName, email: user.email }, this.secret, { expiresIn: 300 });
                    await user.save(); 
                    const email = {
                        from: 'KingBuild, tetst@gmail.com',
                        to: [user.email],
                        subject: 'KingBuild, Your Resend Link in 5 minutes time',
                        text: 'Hello ' + user.userName + ', You recently requested a new account activation link. Please click on the following link to complete your activation: '+ `${process.env.SEVER_LINK}`+'/api/users/activate/' ,
                        html: 'Hello<strong> ' + user.userName + '</strong>,<br><br>You recently requested a new account activation link. Please click on the link below to complete your activation:<br><br><a href="'+ `${process.env.SEVER_LINK}`+'/api/users/activate/' + user.userName + '/token/' + user.temporarytoken + '">http://localhost/activate/</a> in 5 minutes time'
                    };
    
                    const client = this.getCreateTransport();
                    // Function to send e-mail to the user
                    client.sendMail(email).then( info => {
                        console.log('Message sent: %s', info);
                    }).catch(err => {
                        console.log(err);
                    });
                    res.send({ success: true, message: 'Resend Activation link has been sent to ' + user.email + '!' });
                }
            }else{
                res.send({ success: false, message: 'User was not found' });
            }
        } catch (err) {
            
        }
    }

    public resetPassword = async (req: Request, res: Response): Promise<void> =>{
        try {
            const { loginUser } = req.body;
            const findParams = isEmail(loginUser) ? { email: loginUser } : { userName: loginUser };
            const user = await userModel.findOne(findParams).select('email userName password active');
            if (user) {
                if (user.active) {
                    user.resettoken = jwt.sign({ username: user.userName, email: user.email }, this.secret, { expiresIn: 300 });
                    await user.save(); 
                    const email = {
                        from: 'KingBuild, tetst@gmail.com',
                        to: [user.email],
                        subject: 'KingBuild, Reset Password Request',
                        text: 'You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="'+ `${process.env.SEVER_LINK}`+'/api/users/reset/' + user.resettoken,
                        html: 'you recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="'+ `${process.env.SEVER_LINK}`+'/api/users/reset/' + user.resettoken + '">http://localhost/reset/</a>'
                            
                    };
    
                    const client = this.getCreateTransport();
                    // Function to send e-mail to the user
                    client.sendMail(email).then( info => {
                        console.log('Message sent: %s', info);
                    }).catch(err => {
                        console.log(err);
                    });
                    res.send({ success: true, message: 'Reset Password link has been sent to ' + user.email + '!' });

                } else {
                    res.send({ success: false, message: 'Account has not yet been activated' });
                }
            } else {
                res.send({ success: false, message: 'User was not found' });
            }
        } catch (err) {
            
        }
    }

    public getTokenPassword = async (req: Request, res: Response): Promise<void> =>{
        try {
            const user = await userModel.findOne({ resettoken: req.params.token });
            if (user) {
                jwt.verify(req.params.token, this.secret);
                res.send({ success: true, user: user });
            } else {
                res.send({ success: false, message: 'User was not found' });
            }
        } catch (err) {
            res.send({ success: false, message: 'Password link has expired' });
            throw err;
        }
    }

    public savePassword = async (req: Request, res: Response): Promise<void> =>{
        try {
            const user = await userModel.findOne({ userName: req.body.userName }).select('username email name password resettoken');
            if (user) {
                if (isEmpty(req.body.password)) {
                    res.send({ success: false, message: 'Password not provided' });
                } else {
                    user.password = req.body.password; // Save user's new password to the user object
                    user.resettoken = undefined; // Clear user's resettoken 
                    
                    user.save();
                    const email = {
                        from: 'KingBuild, tetst@gmail.com',
                        to: [user.email],
                        subject: 'KingBuild, Password Recently Reset',
                        text: 'This e-mail is to notify you that your password was recently reset at localhost.com',
                        html: 'This e-mail is to notify you that your password was recently reset at localhost.com'
                            
                    };
    
                    const client = this.getCreateTransport();
                    // Function to send e-mail to the user
                    client.sendMail(email).then( info => {
                        console.log('Message sent: %s', info);
                    }).catch(err => {
                        console.log(err);
                    });
                    res.send({ success: true, message: 'Password has been reset!' });
                }
                
            } else {
                res.send({ success: false, message: 'User was not found' });
            }
        } catch (err) {
            
        }
    }

    public checkToken = (req: any, res: Response, next:any):void => {
        
        const token = req.headers["x-access-token"] || req.headers["authorization"];
        if(token){
            jwt.verify(token, this.secret, function(err:any, decoded:any) {
                if(err){
                    res.send({success: false, message: 'token invalid'});
                }else{
                    req.decoded = decoded;
                    next();
                }
            })
        }else{
            res.send({success: false, message: 'no token provided'});
        }
    }

    public postMe(req: any, res: Response){
        try {
            res.send({success: true, me: req.decoded}); // Return the token acquired from middleware
        } catch (err) {
            throw err;
        }
    }
   
}

export default new UserController();