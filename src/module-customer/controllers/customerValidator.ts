import { isEmpty, isEmail, matches } from 'validator';
class  customerValidator{
    private customerMessage: object;
    constructor() {
        this.customerMessage = {
            'userNameRequired': 'The userName is missing',
            'firstNameRequired': 'The firstName is missing',
            'lastNameRequired': 'The lastName is missing',
            'emailRequired': 'The Email is missing',
            'logincustomerRequired': 'No userName or Email provided',
            'passwordRequired': 'The Password is missing',
            'birthDayRequired': 'BirthDay is missing',
            'genderRequired': 'Gender is missing',
        }
    }

    public validateParamsArray = (params:any) => {
        let result: Array<string> = [];
        const validateErrorMessages: any = this.customerMessage;
        Object.keys(params).map((item: any) => {
            if(!params[item]) {
                const message = validateErrorMessages[item + 'Required'] ? validateErrorMessages[item + 'Required'] : item + ' is required';
                result.push(message);
            }
        });
        
        return result;
    }
}

export default new customerValidator()