import mongoose, {Schema,model, Model, Document} from 'mongoose';
import bcrypt from 'bcrypt';
import ICategory from './categoryInterface';

declare interface IcategorySchema extends ICategory, Document{
    
}

class CategoryModel{
    private _model: Model<IcategorySchema>;

    constructor(){
        const categorySchema =  new Schema({
            title: { type: String, required: true},
            slug: { type: String, required: true, unique: true},
            content: { type: Schema.Types.Mixed },
            image: { type: String },
        });
        this._model = model<IcategorySchema>('categories', categorySchema);        
    }

    public get model(): Model<IcategorySchema>{
        return this._model;
    }
}

export default new CategoryModel().model;