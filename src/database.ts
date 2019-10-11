import mongoose from 'mongoose';
class Dbconnect{
    constructor() {
      this._connect()
    }
    connectMlab(dbName: string, dbUser: string, dbPassword: string, dbPort: number){
        const mlab:string = `mongodb://${ dbUser }:${ dbPassword }@ds031925.mlab.com:${ dbPort }/${ dbName }`;
        mongoose.Promise = global.Promise;
        mongoose.connect(mlab, {useNewUrlParser: true}).catch(error => console.log(error));
    }
    connectLocal(localStr:string){
        mongoose.Promise = global.Promise;
        mongoose.connect(localStr, {useNewUrlParser: true}).catch(error => console.log(error));
    }
    _connect() {
        mongoose.connect(`mongodb://`)
        .then(() => {
          console.log('Database connection successful')
        })
        .catch(err => {
          console.error('Database connection error')
        })
     }
}
export default new Dbconnect();