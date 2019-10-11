import Schema from 'mongoose';
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
    categoryId: number,
    image?: string,
    user: string,
    slug?: string,
    price?: number,
    priceSale?: number,
    inventory: inventory,
    attribute: Attribute,
    dateCreate: Date
}

export default IProduct;