import {Router} from 'express';
import productControllers from '../controllers/productController';
import userController from '../../module-user/controllers/userController';

class ProductRoutes{
    router: Router = Router();
    constructor(){
        this.config();
    }
    config():void{
        
        this.configproduct();
        //this.router.use(userController.checkToken);
        this.configManager();
    }

    configproduct():void{

    }

    configManager():void{
        this.router.post('/create', productControllers.createProduct);
        this.router.get('/', productControllers.getListProduct);
        this.router.delete('/:productname', productControllers.deleteProduct);
        this.router.put('/:employeeId', productControllers.putProduct);
        
    }
}

export default new ProductRoutes().router;