import { Request, Response } from 'express';
import customerModel from '../models/customerModel';
import { isEmpty, isEmail, matches } from 'validator';
import jwt from 'jsonwebtoken';
import database from '../../database';
import { promises } from 'dns';
import nodemailer from 'nodemailer';
import "dotenv/config";
import customerValidator from './customerValidator';
class CustomerController{
    private secret:string = 'cloudkick';
    public createcustomer = (req: Request, res:  Response) => {
        const {userName, firstName, lastName, password, confirmPassword, email, birthDay, gender} = req.body;
        
        try {
            
            const validateArray = customerValidator.validateParamsArray({ userName, firstName, lastName, password, confirmPassword, email, birthDay, gender });
        
            if(validateArray.length > 0) {
                res.send({ success: false, message:  validateArray});
            }else{
                if(matches(userName, /^([a-zA-Z0-9]{3,20})+$/) === false){
                    res.send({success: false, message: "userName Must be at least 3 characters, max 20, no special characters, length 3->20"});
                }else if(!isEmail(email)){
                    res.send({success: false, message: "The Email is invalid"});
                }else if(matches(password, /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[\d])(?=.*?[\W]).{8,35}$/) === false){
                    res.send({success: false, message: "Password needs to have at least one lower case, one uppercase, onenumber, one special character, and must be at 8 -> 35 character"});
                }else if(confirmPassword !== password){
                    res.send({success: false, message: "Password confirmation does not match password"});
                }else{
                    const customer = new customerModel({
                        userName: userName,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        password: password,
                        birthDay: new Date(birthDay),
                        gender: gender,
                        temporarytoken: jwt.sign({ userName: userName, email: email }, this.secret, { expiresIn: 300 })
                    });
                    customer.save()
                    
                    .then(customer => {
                        // Create e-mail object to send to customer
                        const email = {
                            from: 'KingBuild, tetst@gmail.com',
                            to: [customer.email],
                            subject: 'KingBuild, Your Activation Link in 5 minutes time',
                            text: 'Hello ' + customer.userName + ', thank you for registering at localhost.com. Please click on the following link to complete your activation:'+ `${process.env.SEVER_LINK}`+'/api/customers/token',
                            html: 'Hello<strong> ' + customer.userName + '</strong>,<br><br>Thank you for registering at localhost.com. Please click on the link below to complete your activation:<br><br><a href="'+ `${process.env.SEVER_LINK}`+'/api/customers/token/' + customer.temporarytoken + '">http://localhost/token/</a> in 5 minutes time'
                        };
                        
                        const client = this.getCreateTransport();
                        // Function to send e-mail to the customer
                        client.sendMail(email).then((info: any) => {
                            console.log('Message sent: %s', info);
                        }).catch((err: any) => {
                            console.log(err);
                        });
                        res.send({ success: true, message: 'Account registered! Please check your e-mail for activation link.' });
                    })
                    .catch((err:any) => {
                        if(err){
                            if (err.code == 11000) {
                                if (err.errmsg[62] == "u") {
                                    res.send({success: false, message: "The userName is already taken"});
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
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // upgrade later with STARTTLS
            auth: {
                user: 'cloudkick195@gmail.com',
                pass: 'eomaimcneqiequxh'
            }
            
        });
    }

    public authenticate = async (req: Request, res: Response): Promise<void> => {
        const { password, logincustomer } = req.body;
        let customer: any;
        const validateArray = customerValidator.validateParamsArray({ password, logincustomer });
        
        if(validateArray.length > 0) {
            res.send({ success: false, message:  validateArray});
        }else{
            const findParams = isEmail(logincustomer) ? { email: logincustomer } : { userName: logincustomer };
            customer = await customerModel.findOne(findParams).select('email userName password active');
            
            if (customer) {
                const validPassword = customer.comparePassword(req.body.password);
                if (!validPassword) {
                    res.send({ success: false, message: 'Could not authenticate Password' });
                } else if (!customer.active) {
                    res.send({ success: false, message: 'Account is not yet activated. Please check your email for activation link', expired: true });
                } else {
                    const token = jwt.sign({ userName: customer.userName, email: customer.email }, this.secret, { expiresIn: '24h' });
                    customer.password = undefined;
                    res.send({ success: true, message: 'customer authenticated!', token: token, customer:customer  });
                }
            }else{
                res.send({ success: false, message: 'No userName or Email found' });
            }
        }
    }

    public activate = async (req: Request, res: Response): Promise<void> =>{
        try {
            let customer = await customerModel.findOne({temporarytoken: req.params.token}).select('email userName password temporarytoken active');
            if(customer){
                if(customer.active === false){
                    jwt.verify(req.params.token, this.secret);
                    customer.temporarytoken = undefined;
                    customer.active = true;
                    await customer.save(); 
                    const email = {
                        from: 'KingBuild, tetst@gmail.com',
                        to: customer.email,
                        subject: 'Account Activated',
                        text: 'Hello ' + customer.userName + ', Your account has been successfully activated!',
                        html: 'Hello<strong> ' + customer.userName + '</strong>,<br><br>Your account has been successfully activated!'
                    };
                    const client = this.getCreateTransport();
                    // Send e-mail object to customer
                    client.sendMail(email); 
                }
                res.send({ success: true, message: 'Account activated!' });       
            }else{
                res.send({ success: false, message: 'customer was not found' });
            }
            
            
        } catch (err) {
            res.send({ success: false, message: 'Invalid Token or Activation link has expired.' });
            throw err;
        }
    }

    public postResend = async (req: Request, res: Response): Promise<void> =>{
        const { password, logincustomer } = req.body;
        const findParams = isEmail(logincustomer) ? { email: logincustomer } : { userName: logincustomer };
        const customer = await customerModel.findOne(findParams).select('email userName password active');
        
        if(customer){
            if (password) {
                const validPassword = customer.comparePassword(password); // Password was provided. Now check if matches password in database
                
                if (!validPassword) {
                    res.send({ success: false, message: 'Could not authenticate password' }); // Password does not match password found in database
                } else if (customer.active) {
                    res.send({ success: false, message: 'Account is already activated.' }); // Account is already activated
                } else {
                    res.send({ success: true, customer: customer.userName });
                }
            } else {
                res.send({ success: false, message: 'No password provided' }); // No password was provided
            }
        }else{
            res.send({ success: false, message: 'customer was not found' });
        }
    }

    public putResend = async (req: Request, res: Response): Promise<void> =>{
        try {
            const { logincustomer } = req.body;
            const findParams = isEmail(logincustomer) ? { email: logincustomer } : { userName: logincustomer };
            const customer = await customerModel.findOne(findParams).select('email userName password temporarytoken active');
            
            if(customer){
                if (customer.active) {
                    res.send({ success: false, message: 'Account is already activated.' }); // Account is already activated
                } else {
                    customer.temporarytoken = jwt.sign({ userName: customer.userName, email: customer.email }, this.secret, { expiresIn: 300 });
                    await customer.save(); 
                    const email = {
                        from: 'KingBuild, tetst@gmail.com',
                        to: [customer.email],
                        subject: 'KingBuild, Your Resend Link in 5 minutes time',
                        text: 'Hello ' + customer.userName + ', You recently requested a new account activation link. Please click on the following link to complete your activation: '+ `${process.env.SEVER_LINK}`+'/api/customers/activate/' ,
                        html: 'Hello<strong> ' + customer.userName + '</strong>,<br><br>You recently requested a new account activation link. Please click on the link below to complete your activation:<br><br><a href="'+ `${process.env.SEVER_LINK}`+'/api/customers/activate/' + customer.userName + '/token/' + customer.temporarytoken + '">http://localhost/activate/</a> in 5 minutes time'
                    };
    
                    const client = this.getCreateTransport();
                    // Function to send e-mail to the customer
                    client.sendMail(email).then( (info: any) => {
                        console.log('Message sent: %s', info);
                    }).catch((err: any) => {
                        console.log(err);
                    });
                    res.send({ success: true, message: 'Resend Activation link has been sent to ' + customer.email + '!' });
                }
            }else{
                res.send({ success: false, message: 'customer was not found' });
            }
        } catch (err) {
            
        }
    }

    public resetPassword = async (req: Request, res: Response): Promise<void> =>{
        try {
            const { logincustomer } = req.body;
            const findParams = isEmail(logincustomer) ? { email: logincustomer } : { userName: logincustomer };
            const customer = await customerModel.findOne(findParams).select('email userName password active');
            if (customer) {
                if (customer.active) {
                    customer.resettoken = jwt.sign({ userName: customer.userName, email: customer.email }, this.secret, { expiresIn: 300 });
                    await customer.save(); 
                    const email = {
                        from: 'KingBuild, tetst@gmail.com',
                        to: [customer.email],
                        subject: 'KingBuild, Reset Password Request',
                        text: 'You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="'+ `${process.env.SEVER_LINK}`+'/api/customers/reset/' + customer.resettoken,
                        html: 'you recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="'+ `${process.env.SEVER_LINK}`+'/api/customers/reset/' + customer.resettoken + '">http://localhost/reset/</a>'
                            
                    };
    
                    const client = this.getCreateTransport();
                    // Function to send e-mail to the customer
                    client.sendMail(email).then( (info: any) => {
                        console.log('Message sent: %s', info);
                    }).catch((err: any) => {
                        console.log(err);
                    });
                    res.send({ success: true, message: 'Reset Password link has been sent to ' + customer.email + '!' });

                } else {
                    res.send({ success: false, message: 'Account has not yet been activated' });
                }
            } else {
                res.send({ success: false, message: 'customer was not found' });
            }
        } catch (err) {
            
        }
    }

    public getTokenPassword = async (req: Request, res: Response): Promise<void> =>{
        try {
            const customer = await customerModel.findOne({ resettoken: req.params.token });
            if (customer) {
                jwt.verify(req.params.token, this.secret);
                res.send({ success: true, customer: customer });
            } else {
                res.send({ success: false, message: 'customer was not found' });
            }
        } catch (err) {
            res.send({ success: false, message: 'Password link has expired' });
            throw err;
        }
    }

    public savePassword = async (req: Request, res: Response): Promise<void> =>{
        try {
            const customer = await customerModel.findOne({ userName: req.body.userName }).select('userName email name password resettoken');
            if (customer) {
                if (isEmpty(req.body.password)) {
                    res.send({ success: false, message: 'Password not provided' });
                } else {
                    customer.password = req.body.password; // Save customer's new password to the customer object
                    customer.resettoken = undefined; // Clear customer's resettoken 
                    
                    customer.save();
                    const email = {
                        from: 'KingBuild, tetst@gmail.com',
                        to: [customer.email],
                        subject: 'KingBuild, Password Recently Reset',
                        text: 'This e-mail is to notify you that your password was recently reset at localhost.com',
                        html: 'This e-mail is to notify you that your password was recently reset at localhost.com'
                            
                    };
    
                    const client = this.getCreateTransport();
                    // Function to send e-mail to the customer
                    client.sendMail(email).then( (info: any) => {
                        console.log('Message sent: %s', info);
                    }).catch((err: any) => {
                        console.log(err);
                    });
                    res.send({ success: true, message: 'Password has been reset!' });
                }
                
            } else {
                res.send({ success: false, message: 'customer was not found' });
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

export default new CustomerController();