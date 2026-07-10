import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';


export function CheckUserRegType(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'CheckUserRegType',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const allowedTypes: string[] = [
            'default',
            'phone_number',
            'google',
            'facebook',
            'email',
          ];
          const isStatusValid = (status: any) => {
            const index = allowedTypes.indexOf(status);
            return index !== -1;
          };
          return isStatusValid(value);
        },
      },
    });
  };
}
