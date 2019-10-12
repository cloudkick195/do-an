import { isEmpty, isEmail, matches } from 'validator';
class  OrderValidator{
    private userMessage: object;
    constructor() {
        this.userMessage = {
            'customerIdRequired': 'The title is missing',
            'statusRequired': 'The status is missing',
            'orderDetailRequired': 'The orderDetail is missing'
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

export default new OrderValidator()