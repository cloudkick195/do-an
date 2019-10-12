import {Router} from 'express';
import productControllers from '../controllers/productController';
import userController from '../../module-user/controllers/userController';
import { authMiddlware } from '../../middlewares/auth.middleware';

class ProductRoutes{
    router: Router = Router();

    constructor(){
        this.config();
    }
    config():void{
        
        this.configProduct();
        this.router.use(authMiddlware);
        this.configManager();
    }

    configProduct():void{

    }

    configManager():void{
        this.router.post('/create', productControllers.createProduct);
        this.router.post('/Upload', productControllers.uploadImage);
        this.router.get('/', productControllers.getListProduct);
        this.router.get('/:slug', productControllers.getProductBySlug);
        this.router.delete('/:id', productControllers.deleteProduct);
        this.router.put('/:id', productControllers.putProduct);
        
    }
}

export default new ProductRoutes().router;