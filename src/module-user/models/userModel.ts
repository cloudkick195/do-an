import mongoose, {Schema,model, Model, Document} from 'mongoose';
import bcrypt from 'bcrypt';
import IAccount from '../../includes/models/accountInterface';

enum permission{
    super_admin = "super_admin",
    admin = "admin",
    post_manager = "post_manager",
}
declare interface IUserSchema extends IAccount, Document{
    permission: permission;
    temporarytoken: string | undefined;
    resettoken: string | undefined;
    comparePassword(password:any):any;
}

class UserModel{
    private _model: Model<IUserSchema>;

    constructor(){
        const userSchema =  new Schema({
            userName: { type: String, required: true, unique: true },
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            birthDay: { type: Date, required: true },
            gender: { type: String, enum: ['male', 'female', 'other'],  required: true},
            email: { type: String, required: true, unique: true },
            password: {type: String, required: true, select: false},
            phone: { type: String },
            creationDate: { type: Date, default: Date.now },
            temporarytoken: { type: String, required: false },
            resettoken: { type: String, required: false },
            permission: { type: String, required: true, enum: ['super_admin', 'admin', 'normal'], default: 'normal' },
            active: {type: Boolean, required: true, default: false}
            
        });
        userSchema.pre<IUserSchema>('save', function(next) {
            const user = this;
            if(!this.isModified('password')) return next();
            bcrypt.hash(user.password, 10, function(err, hash) {
                if(err) next(err);
                user.password = hash;
                next();
            })
        });
        userSchema.methods.comparePassword = function(password:any) {
            return bcrypt.compareSync(password, this.password);
        }
        this._model = model<IUserSchema>('Users', userSchema);
        
    }

    public get model(): Model<IUserSchema>{
        return this._model;
    }
}

export default new UserModel().model;