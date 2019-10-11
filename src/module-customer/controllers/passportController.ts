import {Application} from 'express';
import passport from 'passport';
import session  from 'express-session';
class passportController {
    private app:Application;
    private passport:any;
    constructor(app:Application) {
        this.app = app;
        this.passport = passport;
    }
    private config():void{
        this.app.use(this.passport.initialize());
        this.app.use(passport.session());
        this.app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: true, cookie: { secure: false } }));
    }
}