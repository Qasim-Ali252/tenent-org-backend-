import Joi from 'joi';
import { signInSchema } from './userValidatoins.js';

// Middleware for validating request body or query with Joi schema
export function validate(schema, property = 'body') {
    return (req, res, next) => {
        const data = req[property];
        const { error } = schema.validate(data, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                message: 'Validation error',
                details: error.details.map((d) => d.message),
            });
        }
        next();
    };
}

export { signInSchema };