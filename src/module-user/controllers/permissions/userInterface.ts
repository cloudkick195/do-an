namespace permissions {
    interface UserInterface{
        getListUser(req: any, res: Response):Promise<void>;
    }
}

