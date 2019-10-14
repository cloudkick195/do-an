import { Request, Response } from 'express';
import orderModel from '../models/OrderModel';
import orderDetailModel from '../models/orderDetailModel';
import orderValidator from './OrderValidator';
import { Constants } from '../../common/constants/constants';
import slugHelper from '../../includes/helper/slug-helper';
import "dotenv/config";


class OrderController{
    private secret:string = 'cloudkick';

    public createOrder = async (req: Request, res:  Response): Promise<any>=> {
        try {
            const {customerId, description, shipping, status, orderDetail} = req.body;

            if(!orderDetail[0]){
                return res.send({success: false, message: "There are no items in the order" });
            }
            const validateArray = orderValidator.validateParamsArray({ customerId, status, orderDetail });
            if(validateArray.length > 0) {
                return res.send({ success: false, message:  validateArray});
            }else{
                const orderObject= new orderModel({
                    customerId: customerId,
                    description: description,
                    shipping: shipping,
                    status: status
                });
                const order = await orderObject.save();
                let listItem: any = [];
                
                orderDetail.map((item :any) => {
                    if(!listItem[item.productId]){
                        item.orderId = order._id
                        listItem[item.productId] = item
                    }else{
                        listItem[item.productId] = {...item, qty: item.qty + listItem[item.productId].qty}
                    }
                });
                let listOrders: Array<any> = [];
                Object.keys(listItem).map((item: any) => {
                    listOrders.push(listItem[item]);
                });
                
                orderDetailModel.insertMany(listOrders);  
                return res.send({success: true, message: "Create Success" });
            }
        } catch (err) {
            return res.send({success: false, message: err.message });
        }
    }

    public getOrderById = async (req: any, res: Response): Promise<any> =>{
        try {
            const order = await orderDetailModel.findOne({orderId: req.params.id}).populate('productId').populate('orderId');
            
            if(order){
                return res.send({success: true, Order: order }); 
            }
            return res.send({success: false, message: "Order not found" }); 
        } catch (err) {
            return res.send({success: false, message: err.message });
        }

    }
    
    public getListOrder = async (req: any, res: Response): Promise<any> =>{
        try {
            const query = req.query;
            let page = parseInt(query.page) || 1;
            let limit = parseInt(query.limit) || Constants.PARAMS.LIMIT;
            let offset = (page * limit) - limit;
            let keyword: string = query.s || null;
            let s = {};
            
            if(keyword) {
                keyword = slugHelper.__trimKeyword(keyword);
                s = { customerId: new RegExp('('+ keyword +')', "i") };
            }

            const orders = orderModel.find(s).skip(offset).limit(limit).sort({ _id: -1 }).populate('customerId');
            const count = orderModel.count(s);
            const result = await Promise.all([orders, count]);

            return res.json({ success: true, products: result[0], total: result[1]});
        } catch (err) {
            return res.json({ success: false, message: err.message});
        }
    }
    
    public putOrder = async (req: Request, res: Response): Promise<any> =>{
        try {
            const {customerId, description, shipping, status, orderDetail} = req.body;
            
                const validateArray = orderValidator.validateParamsArray({ status, orderDetail });
                if(validateArray.length > 0) {
                    return res.send({ success: false, message:  validateArray});
                }else{
                    let ordermodel = await orderModel.findById(req.params.id);
                   
                    if(ordermodel){
                        ordermodel.shipping = shipping;
                        ordermodel.description = description;
                        ordermodel.status = status;
                   
                        ordermodel.save();
                        return res.send({success: true, message: "Update Success" });
                    }
                    return res.send({success: false, message: "Update failed" });
                }
            
        } catch (err) {
            return res.send({success: false, message: err.message });
        }
    }

/*     public deleteOrder = async (req: any, res: Response): Promise<any> =>{
        try {
            const order = await orderModel.findOneAndRemove(req.params.id);
            if(order){
                return res.json({ success: true, message: 'Delete Order Successful' });
            }
            return res.json({ success: true, message: 'Order not found' });
            
        } catch (err) {
            res.json({ success: false, message: err.message});
            throw err;
        }
    } */
   
}

export default new OrderController();