import { Request, Response } from 'express';
import orderModel from '../models/OrderModel';
import orderDetailModel from '../models/orderDetailModel';
import orderValidator from './OrderValidator';
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
                    customerId: customerId
                });
                const order = await orderObject.save();
                const orderDetailitems = new orderDetailModel({
                    items: orderDetail,
                    orderId: order._id,
                    description: description,
                    shipping: shipping,
                    status: status
                })
                orderDetailitems.save();    
                
                return res.send({success: true, message: "Create Success" });
            }
        } catch (err) {
            return res.send({success: false, message: err.message });
        }
    }

    public getOrderById = async (req: any, res: Response): Promise<any> =>{
        try {
            const order = await orderDetailModel.findOne({orderId: req.params.id})
            .populate({
                path: 'items'
            });
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
            let page = 1;
            let limit = 25;
            let s = {}
            let orders;
            let count;
            if(query.s){
                let search = query.s;
                //remove space in head and tail
                search = search.trim();
                //relace mutiple space -> |
                search = search.replace(/ /gi, "|");
                search = search.replace(/\|\|\|/gi, '|');
                search = search.replace(/\|\|/gi, '|');
                
                //find mutiple word
                s = {title: new RegExp('('+search+')', "i")}
                //((?!).)*?('+search+').*? => find cau trong doan, vd dinh nhat trong dinh nhat hoang
            }
            if(query.page){
                page = query.page;
            }
            if(query.limit){
                limit = +query.limit;
            }
            
            const offset = (page - 1) * limit
            orders = orderModel.find(s).skip(offset).limit(limit).sort({ _id: -1 }).populate('categoryId');
            count = orderModel.count(s);
            
           const result = await Promise.all([orders, count]);
 
           if(result[0].length > 0){
               return res.json({ success: true, orders: result[0], total: result[1]});
           }
           return res.json({ success: false, message: "Some error occurred while retrieving Order."});
        } catch (err) {
            return res.json({ success: false, message: err.message});
        }
    }
    
    public putOrder = async (req: Request, res: Response): Promise<any> =>{
        try {
            const {customerId, description, shipping, status, orderDetail} = req.body;
            
            const orderDetailmodel = await orderDetailModel.findOne({orderId: req.params.id});
            
            if(orderDetailmodel){
                const validateArray = orderValidator.validateParamsArray({ status, orderDetail });
                if(validateArray.length > 0) {
                    return res.send({ success: false, message:  validateArray});
                }else{
                    if(shipping){
                        orderDetailmodel.shipping = shipping;
                    }
                    orderDetailmodel.description= description;
                    orderDetailmodel.status = status;
                    orderDetailmodel.items = orderDetail; 
                    orderDetailmodel.save();
                    return res.send({success: true, message: "Update Success" });
                }
            }
            return res.send({success: false, message: "Update failed" });
            
        } catch (err) {
            return res.send({success: false, message: err.message });
        }
    }

    public deleteOrder = async (req: any, res: Response): Promise<any> =>{
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
    }
   
}

export default new OrderController();