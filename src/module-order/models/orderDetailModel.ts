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
    items: Array<item>;
    orderId: Schema.Types.ObjectId;
    status: status;
    shipping?:{
        typeShip: string;
        address: string;
        shipCost: number;
        shipDate: Date
    }
    description?: string;
}

class OrderDetailModel{
    private _model: Model<IOrderDetailSchema>;
    constructor(){
        const itemSchema = new Schema({
            productId: {type: Schema.Types.ObjectId, ref: 'products', required: true},  
            qty:{type: Number, required: true},
            description: {type: String},
        }, { _id: false })
        const orderDetailSchema =  new Schema({
            items: { type: [itemSchema], required: true},
            orderId: {type: Schema.Types.ObjectId, ref: 'orders' },
            status: {type: String, required: true, enum: ['process', 'success', 'cancel'], default: 'process'},
            shipping: {
                typeShip: { type: String},
                address: { type: String},
                shipCost: { type: Number},
                shipDate: { type: Date }
            },
            description: { type: Schema.Types.Mixed },
        });
        this._model = model<IOrderDetailSchema>('orderDetail', orderDetailSchema);        
    }

    public get model(): Model<IOrderDetailSchema>{
        return this._model;
    }
}

export default new OrderDetailModel().model;