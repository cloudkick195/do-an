import Schema from 'mongoose';
import { ObjectId } from 'bson';
enum status{
    PROCESS = "process",
    SUCCESS = "success",
    CANCEL = "cancel"
}
interface OrderDetail{
    productId: Schema.Types.ObjectId,
    qty: number,
    description?: string
}
interface IOrder{
    customerId: Schema.Types.ObjectId,
    createDate: Date,
    description?: string,
    shipping?:{
        type:string,
        address: string,
        shipCost: number,
        shipDate: Date
    },
    status:status
    orderDetail: Array<OrderDetail>
}

export default IOrder;