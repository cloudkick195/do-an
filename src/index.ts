import express, { Application } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import Dbconnect from './database';
import "dotenv/config";
import userModel from'./module-user/models/userModel';
import mongoose from 'mongoose';
import userRoutes from './module-user/routes/userRoutes'
import customerRoutes from './module-customer/routes/customerRoutes';

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
    }
    private routes():void{
        this.app.use('/api/users/', userRoutes);
        this.app.use('/api/customers/', customerRoutes);
    }
    public start():void{
        this.app.listen(this.app.get('port'), () => {
            console.log('Server on port: ', this.app.get('port'));
        })
    }
    private connectDB():void{
        mongoose.connect(`mongodb://root:123456qq@ds233288.mlab.com:33288/anhhoang`)
       .then(() => {
            new userModel();
            console.error('Database connection success');
       })
       .catch(err => {
         console.error('Database connection error')
       })
    }
}
const server = new Server();
server.start();