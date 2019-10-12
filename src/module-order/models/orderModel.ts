import mongoose, {Schema,model, Model, Document} from 'mongoose';
import bcrypt from 'bcrypt';
import IOrder from './OrderInterface';

declare interface IOrderSchema extends IOrder, Document{
    
}

class OrderModel{
    private _model: Model<IOrderSchema>;
    constructor(){
        const OrderSchema =  new Schema({
            description: { type: Schema.Types.Mixed },
            customerId: { type: Schema.Types.ObjectId, ref: 'customers' },
            userId: { type: Schema.Types.ObjectId, ref: 'users' },
            status: {type: String, required: true, enum: ['process', 'success', 'cancel'], default: 'process'},
            shipping: {
                type: String,
                address: String,
                shipCost: Number,
            },
            OrderDetail: [   
                { productId:{type: Schema.Types.ObjectId, ref: 'products'},  qty:{type: Number}, description: Schema.Types.Mixed}
            ],
            createDate: { type: Date, default: Date.now },
        });
        this._model = model<IOrderSchema>('orders', OrderSchema);        
    }

    public get model(): Model<IOrderSchema>{
        return this._model;
    }
}

export default new OrderModel().model;