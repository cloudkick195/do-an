import {Router} from 'express';
import categoryControllers from '../controllers/categoryController';
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
        this.router.get('/:slug', categoryControllers.getCategoryBySlug);
    }

    configManager():void{
        this.router.post('/create', categoryControllers.createCategory);
        this.router.get('/', categoryControllers.getListCategory);
        this.router.delete('/:id', categoryControllers.deleteCategory);
        this.router.put('/:id', categoryControllers.putCategory);
    }
}

export default new ProductRoutes().router;