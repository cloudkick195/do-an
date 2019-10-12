import { Request, Response } from 'express';
import userModel from '../../models/userModel';
import { isEmail, matches } from 'validator';
import userValidator from '../../controllers/userValidator';
import { Constants } from '../../../common/constants/constants';
class UserProxy {
    private readonly secret:string = 'cloudkick';

    constructor(){  }
    
    public createUser = (req: Request, res:  Response) => {
        const {userName, firstName, lastName, password, confirmPassword, email, birthDay, gender, permission} = req.body;
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
                        permission: permission,
                        active: true
                    });
                    user.save()
                    
                    .then(user => {

                        res.send({ success: true, message: 'Account registered!' });
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
                                res.send({success: false, message: "Errors"});
                            }
                        }
                    });
                }
            }
        } catch (err) {
            throw err;
        }
    }
    private _findUser = async (req: any, res: Response): Promise<any>=>{
        try {
            const mainUser:any = await userModel.findOne({userName: req.decoded.userName});
            if (mainUser) {
                return mainUser;
            } else {
                res.json({ success: false, message: 'No user found' }); // Return error
                throw new Error('No user found');
            }
        } catch (err) {
            throw err;
        }

    }
    
    private __trimKeyword(keyword: string) {
        let search = keyword;
        //remove space in head and tail
        search = search.trim();
        //relace mutiple space -> |
        search = search.replace(/ /gi, "|");
        search = search.replace(/\|\|\|/gi, '|');
        search = search.replace(/\|\|/gi, '|');

        return search;
    }

    public getListUser = async (req: any, res: Response): Promise<any> =>{
        try {
            const query = req.query;
            let page = parseInt(query.page) || 1;
            let limit = parseInt(query.limit) || Constants.PARAMS.LIMIT;
            let offset = (page * limit) - limit;
            let keyword: string = query.q || null;
            let s = {};
            if(keyword) {
                keyword = this.__trimKeyword(keyword);
                s = { userName: new RegExp('('+ keyword +')', "i") };
            }
            const users: any = userModel.find(s).skip(offset).limit(limit).sort({ _id: -1 });
            const count: any = userModel.count(s);
            const result = await Promise.all([users, count]);

            return res.json({ success: true, users: result[0], total: result[1]});
        } catch (err) {
            return res.json({ success: false, message: "Some error occurred while retrieving user."});
        }
    }

    public getUser = async (req: any, res: Response): Promise<any> =>{
        try {
            const mainUser:any = await this._findUser(req, res);
            const getPermission = mainUser.permission;
            const getUser = await userModel.findOne({ userName: req.params.userName });
            // if user exist
            if(!getUser) return res.send({ success: false, message: "No user found" });

            if(!this._checkPermission(getPermission, getUser.permission) 
                && ( mainUser.userName !== getUser.userName)) {
                return res.send({ success: false, message: 'Permission denied' });
            }
           
            const count = await userModel.countDocuments();
            res.json({ success: true, users: getUser, total: count || 0 } );
            /* if(this._UserPermissions()[getPermission+'']['getListUser']){
                const query = req.query;
                const users = query && query.offset && query.limit
                            ? await userModel.find({}).skip(+query.offset).limit(+query.limit) 
                            :await userModel.find({}).sort({ _id: -1 });
                if(users){
                    res.json({ success: true, users: users, permission: mainUser.permission });
                }else{
                    res.json({ success: false, message: 'No user' });
                }
            }else{
                res.json({ success: false, message: 'Insufficient Permissions' });
            } */
            
        } catch (err) {
            throw err;
        }
    }
    
    public getPermission = async (req: any, res: Response): Promise<void> =>{
        try {
            const mainUser:any = await this._findUser(req, res);
            res.send({ success: true, permission: mainUser.permission });
        } catch (err) {
            throw err;
        }
    }

    public deleteUser = async (req: any, res: Response): Promise<any> =>{
        try {
            const mainUser:any = await this._findUser(req, res);
            const getPermission = mainUser.permission;
            const getUser = await userModel.findOne({ userName: req.params.userName });
            // if user exist
            if(!getUser) return res.send({ success: false, message: "No user found" });

            if(!this._checkPermission(getPermission, getUser.permission) 
                && ( mainUser.userName !== getUser.userName)) {
                return res.send({ success: false, message: 'Permission denied' });
            }

            const user = await userModel.findOneAndRemove({ username: req.params.userName });
            if(user){
                return res.json({ success: true, message: 'Delete User Successful' });
            }
            return res.json({ success: true, message: 'User not found' });
/*             const getPermissionAction = this._UserPermissions()[getPermission+''];
            if(getPermissionAction['deletuserModel']){
                const user = await userModel.findOneAndRemove({ username: req.params.username });
                if(user){
                    res.json({ success: false, message: 'Something went wrong.'});
                }else{
                    res.json({ success: true, message: 'Delete User Successful' });
                }
            }else if(getPermissionAction['deletuserModelPermissonIsPost_manager']){
                const deletuserModel:any = await userModel.findOne({ userName: req.params.username });
                
                if(deletuserModel.permission != 'admin' && deletuserModel.permission != 'super_admin'){
                    deletuserModel.remove();
                    res.json({ success: true, message: 'Delete User Successful' });
                }else{
                    res.json({ success: false, message: 'Insufficient Permissions' });
                }
            }else{
                res.json({ success: false, message: 'Insufficient Permissions' });
            } */
            
        } catch (err) {
            res.json({ success: false, message: 'Something went wrong.'});
            throw err;
        }
    }

    public getUserById = async (req: any, res: Response): Promise<any> =>{
        try {
            const mainUser:any = await this._findUser(req, res);
            const getPermission = mainUser.permission;
            const getUser = await userModel.findOne({ userName: req.params.userName });
            // if user exist
            if(!getUser) return res.send({ success: false, message: "No user found" });

            if(!this._checkPermission(getPermission, getUser.permission) 
                && ( mainUser.userName !== getUser.userName)) {
                return res.send({ success: false, message: 'Permission denied' });
            }

            return res.json({ success: true, user: getUser });

            /* if(this._UserPermissions()[getPermission+'']['getUserById']){
                const editUser = req.params.id;
                const user = await userModel.findOne({ _id: editUser });
                if (user) {
                    res.json({ success: true, user: user }); // Return the user to be editted
                } else {
                    res.json({ success: false, message: 'No user found' }); // Return error
                }
            }else{
                res.json({ success: false, message: 'Insufficient Permissions' });
            } */
            
        } catch (err) {
            throw err;
        }
    }

    public putUser = async (req: any, res: Response): Promise<any> => {
        try {
            const mainUser:any = await this._findUser(req, res);
            const getPermission = mainUser.permission;
            const {userName, firstName, lastName, password, confirmPassword, email, birthDay, phone, gender, permission }  = req.body;
            const editUser = await userModel.findOne({ userName: userName });
            
            // if user exist
            if(!editUser) return res.send({ success: false, message: "No user found" });

            // Check permission
            if(!this._checkPermission(getPermission, editUser.permission) 
                && ( mainUser.userName !== editUser.userName)) {
                return res.send({ success: false, message: 'Permission denied' });
            }

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
                            editUser.firstName = firstName;
                            editUser.lastName = lastName;
                            editUser.password = password;
                            editUser.email = email;
                            editUser.birthDay = birthDay;
                            editUser.gender = gender;
                            if(phone) editUser.phone = phone;
                            let permissionMsg = ' And Update permission failed, Insufficient Permissions';
                            if(mainUser.userName !== editUser.userName){
                                editUser.permission = permission;
                                permissionMsg = '';
                            }
                            
                            await editUser.save();
                            return res.send({success: true, message: "Update Success" + permissionMsg});
                        } 
                    } 

            /* let checkEdit = false;
            
            if (!editUser) {
                res.json({ success: false, message: 'No user found' }); // Return error
            } else {
                let permissionMsg = '';
                if(mainUser._id == editUserId){
                    checkEdit = true;
                    if(!isEmpty(permission)) permissionMsg = ' And Update permission failed, Insufficient Permissions';
                }else if(this._UserPermissions()[getPermission+'']['putUser'] && editUser.permission != 'super_admin'){
                    checkEdit = true;
                    if(permission) editUser.permission = permission;
                }else if(this._UserPermissions()[getPermission+'']['putUserIsPost_manager']){
                    if(editUser.permission != 'admin' && editUser.permission != 'super_admin'){
                        checkEdit = true;
                        if(permission) permissionMsg = ' And Update permission failed, Insufficient Permissions';
                    }else{
                        res.json({ success: false, message: 'Insufficient Permissions' });
                    }
                }else{
                    res.json({ success: false, message: 'Insufficient Permissions' });
                }
                
                if(checkEdit === true){
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
                            editUser.firstName = firstName;
                            editUser.lastName = lastName;
                            editUser.password = password;
                            editUser.email = email;
                            editUser.birthDay = birthDay;
                            editUser.gender = gender;
                            if(phone) editUser.phone = phone;
                            await editUser.save();
                            res.send({success: true, message: "Update Success" + permissionMsg});
                        } 
                    } 
                }
            } */


        } catch (err) {
            throw err;
        }
    }

    private _checkPermission = (userLoginedRole: string, userEditRole: string): boolean => {
        const permisson: any = {
            'super_admin': {
                roles: {
                    'getListUser': true,
                    'deletuserModel': true,
                    'getUserById': true,
                    'putUser': true,
                },
                child: {'admin': true, 'normal': true}
            },
            'admin': {
                roles: {
                    'getListUser': true,
                    'deletuserModelPermissonIsPost_manager': true,
                    'getUserById': true,
                    'putUserIsPost_manager': true,
                },
                child: { 'normal': true }
            }
        };

        return permisson[userLoginedRole] && !!permisson[userLoginedRole].child[userEditRole];
    }

}

const userProxy = new UserProxy();
export default userProxy;