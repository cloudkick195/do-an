import Schema from 'mongoose';
import { ObjectId } from 'bson';
enum inventory{
    INSTOCK = 'instock',
    OUTSTOCK = 'outstock' 
}
interface Attribute{
    color?: string,
    size?: string,
    image?: string,
}
interface IProduct{
    title: string;
    content?: string;
    categoryId: Schema.Types.ObjectId,
    image?: string,
    userId: Schema.Types.ObjectId,
    slug: string,
    price?: number,
    priceSale?: number,
    inventory: inventory,
    attribute: Attribute,
    dateCreate: Date
}

export default IProduct;