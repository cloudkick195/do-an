import { Request, Response } from 'express';
import productModel from '../models/productModel';
import productValidator from './productValidator';
import slugHelper from '../../includes/helper/slug-helper'
import "dotenv/config";

class productController{
    private secret:string = 'cloudkick';

    public createProduct = (req: Request, res:  Response): any=> {
        const {title, slug, content, categoryId, user, image, price, priceSale, inventory, attribute} = req.body;
        
        try {
            const validateArray = productValidator.validateParamsArray({ title, categoryId, user, inventory });
            let getSlug = title;
            if(slug){
                getSlug = slug;
            }
            
            const slugConvert = slugHelper.ChangeToSlug(getSlug);
            if(validateArray.length > 0) {
                return res.send({ success: false, message:  validateArray});
            }else{
                const product = new productModel({
                    title:  title,
                    slug: slugConvert,
                    content: content,
                    categoryId: categoryId,
                    user: user,
                    image: image,
                    price: price,
                    priceSale: priceSale,
                    inventory: inventory,
                    attribute: attribute,
                });
                product.save();
                return res.send({success: true, message: "Create Complete" });
            }
        } catch (err) {
            return res.send({success: false, message: "Create failed, title exist" });
        }
    }

    public getListProduct= async (req: any, res: Response): Promise<any> =>{
        try {
            const query = req.query;

            const products = query && query.offset && query.limit
                        ? productModel.find({}).skip(+query.offset).limit(+query.limit) 
                        : productModel.find({}).sort({ _id: -1 });
            const count = productModel.countDocuments();
            const result = await Promise.all([products, count]);
            if(result[0].length > 0){
                return res.json({ success: true, products: result[0], total: result[1]});
            }
            
            return res.json({ success: false, message: "Some error occurred while retrieving Product."});
        } catch (err) {
            return res.json({ success: false, message: "Some error occurred while retrieving Product."});
        }
    }
    
    public getsearchProduct = async (req: Request, res: Response): Promise<any> =>{
        try {
            const products = productModel.find({title: new RegExp('^'+req.params.s+'$', "i")});

            const count = productModel.count({ title: new RegExp('^'+req.params.s+'$', "i") });
            const result = await Promise.all([products, count]);
            if(result[0].length > 0){
                return res.json({ success: true, products: result[0], total: result[1]});
            }
            return res.json({ success: false, message: "Some error occurred while retrieving Product."});
        }catch (err) {
            return res.json({ success: false, message: "Some error occurred while retrieving Product."});
        }
    }

    public putProduct = async (req: Request, res: Response): Promise<any> =>{
        try {
            const {title, slug, content, categoryId, user, image, price, priceSale, inventory, attribute} = req.body;
            const product = await productModel.findOne(slug);
            if(product){
                const validateArray = productValidator.validateParamsArray({ title, categoryId, user, inventory });
                let getSlug = title;
                if(slug){
                    getSlug = slug;
                }
            
                const slugConvert = slugHelper.ChangeToSlug(getSlug);
                if(validateArray.length > 0) {
                    return res.send({ success: false, message:  validateArray});
                }else{
                    product.title =  title;
                    product.slug = slugConvert;
                    product.content = content;
                    product.categoryId = categoryId;
                    product.user = user;
                    product.image = image;
                    product.price = price;
                    product.priceSale = priceSale;
                    product.inventory = inventory;
                    product.attribute = attribute;
                    product.save();
                    return res.send({success: true, message: "Update Complete" });
                }
            }else{
                return res.send({success: false, message: "Update failed" });
            }
            
        } catch (err) {
            return res.send({success: false, message: "Update failed, title exist" });
        }
    }

    public deleteProduct = async (req: any, res: Response): Promise<any> =>{
        try {
            const product = await productModel.findOneAndRemove({ slug: req.params.slug });
            if(product){
                return res.json({ success: false, message: 'Something went wrong.'});
            }else{
                return res.json({ success: true, message: 'Delete Product Successful' });
            }
            
        } catch (err) {
            res.json({ success: false, message: 'Something went wrong.'});
            throw err;
        }
    }
   
}

export default new productController();