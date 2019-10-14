import express, { Application } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import Dbconnect from './database';
import "dotenv/config";
import userModel from'./module-user/models/userModel';
import mongoose from 'mongoose';
import userRoutes from './module-user/routes/userRoutes'
import customerRoutes from './module-customer/routes/customerRoutes';
import productRoutes from './module-product/routes/productRoutes';
import categoryRoutes from './module-category/routes/categoryRoutes';
import orderRoutes from './module-order/routes/orderRoutes';

class Server{
    public app: Application;
    constructor(){
        this.app = express();
        this.config();
        this.connectDB();
        this.routes();
    }
    private config():void{
        this.app.set('port', process.env.PORT || 8080);
        this.app.use(morgan('dev'));
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: false}));
        this.app.use(express.static('./'));
    }
    private routes():void{
        this.app.use('/api/users/', userRoutes);
        this.app.use('/api/customers/', customerRoutes);
        this.app.use('/api/products/', productRoutes);
        this.app.use('/api/categories/', categoryRoutes);
        this.app.use('/api/orders/', orderRoutes);
    }
    public start():void{
        this.app.listen(this.app.get('port'), () => {
            console.log('Server on port: ', this.app.get('port'));
        })
    }
    private connectDB():void{
        //mongodb://root:123456qq@ds233288.mlab.com:33288/anhhoang
        //mongodb://localhost:27017/kingbuild
        mongoose.connect(`mongodb://root:123456qq@ds233288.mlab.com:33288/anhhoang`)
       .then(() => {
            console.error('Database connection success');
       })
       .catch(err => {
         console.error('Database connection error')
       })
    }
}
const server = new Server();
server.start();