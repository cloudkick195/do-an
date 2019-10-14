import { isEmpty, isEmail, matches } from 'validator';
class  UserValidator{
    private userMessage: object;
    constructor() {
        this.userMessage = {
            'userNameRequired': 'The Username is missing',
            'firstNameRequired': 'The firstName is missing',
            'lastNameRequired': 'The lastName is missing',
            'emailRequired': 'The Email is missing',
            'loginUserRequired': 'No Username or Email provided',
            'passwordRequired': 'The Password is missing',
            'confirmPasswordRequired': 'The Confirm Password is missing',
            'birthDayRequired': 'BirthDay is missing',
            'genderRequired': 'Gender is missing',
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

export default new UserValidator()