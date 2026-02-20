import { apiError } from '../utils/index.js';
import { signInSchema } from './userValidatoins.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true
    });
    
    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        return next(apiError.badRequest(errorMessage, 'validation'));
    }
    
    req[source] = value;
    next();
};

export {
    signInSchema
};
