import {Router} from 'express';
import customerControllers from '../controllers/customerController';
import userControllers from '../../module-user/controllers/userController';

class customerRoutes{
    router: Router = Router();
    constructor(){
        this.config();
    }
    config():void{
        
        this.configcustomer();
        //this.router.use(customerControllers.checkToken);
        this.configManager();
    }

    configcustomer():void{
        this.router.post('/register', customerControllers.createcustomer);
        this.router.post('/authenticate', customerControllers.authenticate);
        this.router.post('/resend', customerControllers.postResend);
        this.router.put('/resend', customerControllers.putResend);
        this.router.put('/resetpassword', customerControllers.resetPassword);
        this.router.put('/savepassword', customerControllers.savePassword);
        this.router.get('/token/:token', customerControllers.activate);
        this.router.get('/resetpassword/:token', customerControllers.getTokenPassword);
    }

    configManager():void{
        this.router.post('/me', customerControllers.postMe);
    }
}

export default new customerRoutes().router;