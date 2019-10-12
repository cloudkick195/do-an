import {Router} from 'express';
import orderControllers from '../controllers/OrderController';
import userController from '../../module-user/controllers/userController';

class OrderRoutes{
    router: Router = Router();
    constructor(){
        this.config();
    }
    config():void{
        
        this.configOrder();
        //this.router.use(userController.checkToken);
        this.configManager();
    }

    configOrder():void{

    }

    configManager():void{
        this.router.post('/create', orderControllers.createOrder);
        this.router.get('/', orderControllers.getListOrder);
        this.router.get('/:id', orderControllers.getOrderById);
        //this.router.delete('/:Ordername', orderControllers.deleteOrder);
        this.router.put('/:id', orderControllers.putOrder);
        
    }
}

export default new OrderRoutes().router;