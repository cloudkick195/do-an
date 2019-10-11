import { Document } from 'mongoose';


enum gender{
    male = "male",
    female = "female",
    other = "other",
}
interface IAccount{
    userName: string;
    firstName: string;
    lastName: string;
    birthDay: Date;
    gender: gender;
    email: string;
    password: string;
    phone?: string;
    creationDate: Date;
    active:Boolean;
}

export default IAccount;