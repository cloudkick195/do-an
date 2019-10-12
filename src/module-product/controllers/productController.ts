import { Request, Response } from 'express';
import productModel from '../models/productModel';
import productValidator from './productValidator';
import slugHelper from '../../includes/helper/slug-helper'
import "dotenv/config";
import { promises } from 'fs';
import { Schema } from 'mongoose';
import { ObjectId } from 'bson';
import { isEmpty } from 'validator';
import {Router} from "express";
import multer from 'multer';
import fs from 'fs';
import formidable from 'formidable';
import { Constants } from '../../common/constants/constants';

class productController{
    private secret:string = 'cloudkick';
    
    public createProduct = async (req: Request, res:  Response): Promise<any>=> {
        const {title, slug, image, content, categoryId, userId, price, priceSale, inventory, attribute} = req.body;
        
        try {
            const validateArray = productValidator.validateParamsArray({ title, categoryId, userId, inventory });
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
                    userId: userId,
                    image: image,
                    price: price,
                    priceSale: priceSale,
                    inventory: inventory,
                    attribute: attribute,
                });
                await product.save();
                return res.send({success: true, message: "Create Success" });
            }
        } catch (err) {
            return res.send({success: false, message: err.message });
        }
    }

    public uploadImage = (req: any, res:  Response):any=> {
        const Storage = multer.diskStorage({
            destination: function(req, file, callback) {
                callback(null, "./images");
            },
            filename: function(req, file, callback) {
                callback(null, + Date.now() + "-" + slugHelper.ChangeToSlugFile(file.originalname));
            }
        });

        const upload = multer({
            storage: Storage
        }).array("imgUploader", 1); //Field name and max count

        upload(req, res, function(err) {
            if (err) {
                return res.send({success: false, message:"Something went wrong!"});
            }   
            
            return res.send({success: true, image: req.files[0].filename})
        });
        
    }

    public getProductBySlug = async (req: any, res: Response): Promise<any> =>{
        try {
            const product = await productModel.findOne({slug: req.params.slug});
            if(product){
                return res.send({success: true, product: product }); 
            }
            return res.status(404).send({success: false, message: "Product not found" }); 
        } catch (err) {
            return res.send({success: false, message: err.message });
        }

    }
    
    private __trimKeyword(keyword: string) {
        let search = keyword;
        //remove space in head and tail
        search = search.trim();
        //relace mutiple space -> |
        search = search.replace(/ /gi, "|");
        search = search.replace(/\|\|\|/gi, '|');
        search = search.replace(/\|\|/gi, '|');

        return search;
    }

    public getListProduct = async (req: any, res: Response): Promise<any> =>{
        try {
            const query = req.query;
            let page = parseInt(query.page) || 1;
            let limit = parseInt(query.limit) || Constants.PARAMS.LIMIT;
            let offset = (page * limit) - limit;
            let keyword: string = query.q || null;
            let s = {};
            if(keyword) {
                keyword = this.__trimKeyword(keyword);
                s = { userName: new RegExp('('+ keyword +')', "i") };
            }

            const products = productModel.find(s).skip(offset).limit(limit).sort({ _id: -1 }).populate('categoryId');
            const count = productModel.count(s);
            const result = await Promise.all([products, count]);

            return res.json({ success: true, products: result[0], total: result[1]});
        } catch (err) {
            return res.json({ success: false, message: err.message});
        }
    }
    
    public putProduct = async (req: Request, res: Response): Promise<any> =>{
        try {
            const {title, slug, content, categoryId, userId, image, price, priceSale, inventory, attribute} = req.body;
            const product = await productModel.findById(req.params.id);
            
            if(product){
                const validateArray = productValidator.validateParamsArray({ title, categoryId, userId, inventory });
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
                    product.userId = userId;
                    product.image = image;  
                    product.price = price;
                    product.priceSale = priceSale;
                    product.inventory = inventory;
                    product.attribute = attribute;
                    await product.save();
                    return res.send({success: true, message: "Update Success" });
                }
            }else{
                return res.send({success: false, message: "Update failed" });
            }
            
        } catch (err) {
            return res.send({success: false, message: err.message });
        }
    }

    public deleteProduct = async (req: any, res: Response): Promise<any> =>{
        try {
            const product = await productModel.findOneAndRemove(req.params.id);
            if(product){
                return res.json({ success: true, message: 'Delete product Successful' });
            }
            return res.json({ success: true, message: 'Product not found' });
            
        } catch (err) {
            res.json({ success: false, message: err.message});
            throw err;
        }
    }
   
}

export default new productController();