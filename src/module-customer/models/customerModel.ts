import mongoose, {Schema,model, Model, Document} from 'mongoose';
import bcrypt from 'bcrypt';
import IAccount from '../../includes/models/accountInterface';

declare interface IcustomerSchema extends IAccount, Document{
    temporarytoken: string | undefined;
    resettoken: string | undefined;
    comparePassword(password:any):any;
}

class customerModel{
    private _model: Model<IcustomerSchema>;

    constructor(){
        const customerSchema =  new Schema({
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
            active: {type: Boolean, required: true, default: false}
            
        });
        //customerSchema.set("toJSON", { getters: true });
        customerSchema.pre<IcustomerSchema>('save', function(next) {
            const customer = this;
            if(!this.isModified('password')) return next();
            bcrypt.hash(customer.password, 10, function(err, hash) {
                if(err) next(err);
                customer.password = hash;
                next();
            })
        });
        customerSchema.methods.comparePassword = function(password:any) {
            return bcrypt.compareSync(password, this.password);
        }

        customerSchema.virtual('fullName').get(function (this:IcustomerSchema) {
            return this.firstName + ' ' + this.lastName;
        });

        this._model = model<IcustomerSchema>('customers', customerSchema);
        
        
    }

    public get model(): Model<IcustomerSchema>{
        return this._model;
    }
}

export default new customerModel().model;