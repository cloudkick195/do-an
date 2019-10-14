import mongoose, {Schema,model, Model, Document} from 'mongoose';
import bcrypt from 'bcrypt';
import IOrder from './OrderInterface';

interface item{
    productId: Schema.Types.ObjectId;
    qty: number;
    description?: string;
}
enum status{
    PROCESS = 'process',
    SUCCESS = 'success',
    CANCEL = 'cancel',
}
declare interface IOrderDetailSchema extends Document{
    productId: Array<Schema.Types.ObjectId>;
    orderId: Schema.Types.ObjectId;
    qty: number;
}

class OrderDetailModel{
    private _model: Model<IOrderDetailSchema>;
    constructor(){
        
        const orderDetailSchema =  new Schema({
            productId: [{type: Schema.Types.ObjectId, ref: 'products', required: true}],
            qty:{type: Number, required: true},
            orderId: {type: Schema.Types.ObjectId, ref: 'orders' }
        });
        
        this._model = model<IOrderDetailSchema>('orderDetail', orderDetailSchema);        
    }

    public get model(): Model<IOrderDetailSchema>{
        return this._model;
    }
}

export default new OrderDetailModel().model;