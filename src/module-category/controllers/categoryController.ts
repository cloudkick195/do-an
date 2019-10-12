import { Request, Response } from 'express';
import categoryModel from '../models/categoryModel';
import productModel from '../../module-product/models/productModel';
import categoryValidator from './categoryValidator';
import slugHelper from '../../includes/helper/slug-helper'
import "dotenv/config";
import { Constants } from '../../common/constants/constants';

class CategoryController{
    private secret:string = 'cloudkick';

    public createCategory = async (req: Request, res:  Response): Promise<any>=> {
        const {title, slug, content, image} = req.body;
        try {
            const validateArray = categoryValidator.validateParamsArray({ title });
            let getSlug = title;
            if(slug){
                getSlug = slug;
            }
            
            const slugConvert = slugHelper.ChangeToSlug(getSlug);
            if(validateArray.length > 0) {
                return res.send({ success: false, message:  validateArray});
            }else{
                const category = new categoryModel({
                    title:  title,
                    slug: slugConvert,
                    content: content,
                    image: image
                });
                await category.save();
                return res.send({success: true, message: "Create Success", data: category });
            }
        } catch (err) {
            return res.send({success: false, message: err.message });
        }
    }

    public getListProductByCategory= async (req: any, res: Response): Promise<any> =>{
        try {
            const query = req.query;
            let page = 1;
            let limit = 25;
            let products:any;
            let count;
            if(query.page){
                page = query.page;
            }
            if(query.limit){
                limit = query.limit;
            }
            const offset = (page - 1) * limit;
            products = productModel.find({categorySlug: req.params.slug}).skip(offset).limit(limit).sort({ _id: -1 });
            count = productModel.count({slug: req.params.slug});
            const result = await Promise.all([products, count]);
            
            if(result[0].length > 0){
                return res.json({ success: true, categorys: result[0], total: result[1]});
            }
            return res.json({ success: false, message: "Some error occurred while retrieving product by category."});     
        } catch (err) {
            return res.json({ success: false, message: err.message});     
        }
    }

    public getCategoryBySlug = async (req: any, res: Response): Promise<any> =>{
        try {
            const category = await categoryModel.findOne({slug: req.params.slug});
            if(category){
                return res.send({success: true, category: category }); 
            }
            return res.status(404).send({success: false, message: "category not found" }); 
        } catch (err) {
            return res.json({ success: false, message: err.message});
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

    public getListCategory = async (req: any, res: Response): Promise<any> =>{
        try {
            const query = req.query;
            let page = parseInt(query.page) || 1;
            let limit = parseInt(query.limit) || Constants.PARAMS.LIMIT;
            let offset = (page * limit) - limit;
            let keyword: string = query.q || null;
            let s = {};
            // Check empty keyword
            if(keyword) {
                keyword = this.__trimKeyword(keyword);
                s = { userName: new RegExp('('+ keyword +')', "i") };
            }
            const categorys = categoryModel.find(s).skip(offset).limit(limit).sort({ _id: -1 });
            const count = categoryModel.count(s);
            const result = await Promise.all([categorys, count]);

            return res.json({ success: true, categories: result[0], total: result[1]});
        } catch (err) {
            return res.json({ success: false, message: err.message});
        }
    }
    
    public putCategory = async (req: Request, res: Response): Promise<any> =>{
        try {
            const {title, slug, content, image} = req.body;
            const category = await categoryModel.findById(req.params.id);
            
            if(category){
                const validateArray = categoryValidator.validateParamsArray({ title });
                let getSlug = title;
                if(slug){
                    getSlug = slug;
                }
            
                const slugConvert = slugHelper.ChangeToSlug(getSlug);
                if(validateArray.length > 0) {
                    return res.send({ success: false, message:  validateArray});
                }else{
                    category.title =  title;
                    category.slug = slugConvert;
                    category.content = content;
                    category.image = image;
                    await category.save();
                    return res.send({success: true, message: "Update Success" });
                }
            }else{
                return res.send({success: false, message: "Update failed" });
            }
        } catch (err) {
            return res.send({success: false, message: err.message });
        }
    }

    public deleteCategory = async (req: any, res: Response): Promise<any> =>{
        try {
            const category = await categoryModel.findOneAndRemove(req.params.id);
            if(category){
                return res.json({ success: true, message: 'Delete category Successful' });
            }
            return res.json({ success: true, message: 'Category not found' });
            
        } catch (err) {
            res.json({ success: false, message: err.message});
            throw err;
        }
    }
   
}

export default new CategoryController();