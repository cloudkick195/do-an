import mongoose, {Schema,model, Model, Document} from 'mongoose';
import bcrypt from 'bcrypt';
import IProduct from './productInterface';

declare interface IproductSchema extends IProduct, Document{
    
}

class productModel{
    private _model: Model<IproductSchema>;

    constructor(){
        const productSchema =  new Schema({
            title: { type: String, required: true},
            slug: { type: String, required: true, unique: true},
            content: { type: Schema.Types.Mixed },
            categoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
            userId: { type: Schema.Types.ObjectId, ref: 'users' },
            image: { type: String },
            price: {type: Number},
            priceSale: {type: Number},
            inventory: {type: String, required: true, enum: ['instock', 'outstock'], default: 'instock'},
            attribute: { type: Object},
            creationDate: { type: Date, default: Date.now },
        });
        this._model = model<IproductSchema>('products', productSchema);        
    }

    public get model(): Model<IproductSchema>{
        return this._model;
    }
}

export default new productModel().model;