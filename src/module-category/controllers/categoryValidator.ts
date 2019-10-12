import { isEmpty, isEmail, matches } from 'validator';
class  CategoryValidator{
    private userMessage: object;
    constructor() {
        this.userMessage = {
            'titleRequired': 'The title is missing'
        }
    }

    public validateParamsArray = (params:any) => {
        let result: Array<string> = [];
        const validateErrorMessages: any = this.userMessage;
        Object.keys(params).map((item: any) => {
            if(!params[item]) {
                const message = validateErrorMessages[item + 'Required'] ? validateErrorMessages[item + 'Required'] : item + ' is required';
                result.push(message);
            }
        });
        
        return result;
    }
}

export default new CategoryValidator()