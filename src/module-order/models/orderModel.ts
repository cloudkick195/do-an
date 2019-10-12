import mongoose, {Schema,model, Model, Document} from 'mongoose';
import bcrypt from 'bcrypt';
import IOrder from './OrderInterface';

declare interface IOrderSchema extends IOrder, Document{
    
}

class OrderModel{
    private _model: Model<IOrderSchema>;
    constructor(){
        const OrderSchema =  new Schema({      
            customerId: { type: Schema.Types.ObjectId, ref: 'customers' },
            createDate: { type: Date, default: Date.now },
            status: {type: String, required: true, enum: ['process', 'success', 'cancel'], default: 'process'},
            shipping: {
                typeShip: { type: String},
                address: { type: String},
                shipCost: { type: Number},
                shipDate: { type: Date }
            },
            description: { type: Schema.Types.Mixed }
        });
        this._model = model<IOrderSchema>('orders', OrderSchema);        
    }

    public get model(): Model<IOrderSchema>{
        return this._model;
    }
}

export default new OrderModel().model;