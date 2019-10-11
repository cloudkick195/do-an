import {Router} from 'express';
import userControllers from '../controllers/userController';
import userProxy from '../controllers/permissions/userProxy';

class UserRoutes{
    router: Router = Router();
    constructor(){
        this.config();
    }
    config():void{
        
        this.configUser();
        this.router.use(userControllers.checkToken);
        this.configManager();
    }

    configUser():void{
        this.router.post('/register', userControllers.createUser);
        this.router.post('/authenticate', userControllers.authenticate);
        this.router.post('/resend', userControllers.postResend);
        this.router.put('/resend', userControllers.putResend);
        this.router.put('/resetpassword', userControllers.resetPassword);
        this.router.put('/savepassword', userControllers.savePassword);
        this.router.put('/token/:token', userControllers.activate);
    }

    configManager():void{
        this.router.post('/me', userControllers.postMe);
        this.router.post('/managementRegister', userProxy.createUser);
        this.router.get('/management', userProxy.getListUser);
        this.router.get('/permisson', userProxy.getPermission);
        this.router.delete('/management/:username', userProxy.deleteUser);
        this.router.put('/edit', userProxy.putUser);
        
    }
}

export default new UserRoutes().router;