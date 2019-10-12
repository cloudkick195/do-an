import {Router} from 'express';
import productControllers from '../controllers/productController';

class ProductRoutes{
    router: Router = Router();

    constructor(){
        this.config();
    }
    config():void{
        
        this.configProduct();
        //this.router.use(userController.checkToken);
        this.configManager();
    }

    configProduct():void{

    }

    configManager():void{
        this.router.post('/create', productControllers.createProduct);
        this.router.get('/', productControllers.getListProduct);
        this.router.get('/:slug', productControllers.getProductBySlug);
        this.router.delete('/:productname', productControllers.deleteProduct);
        this.router.put('/:id', productControllers.putProduct);
        
    }
}

export default new ProductRoutes().router;