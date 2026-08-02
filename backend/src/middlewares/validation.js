import { ZodError } from "zod";


export const validateBody = (schema) => {
    return (req, res, next) => {
        try {

            const validateData = schema.parse(req.body);
            req.body = validateData;

            next()

        }catch(error) {
            if(error instanceof ZodError) {
                return res.status(400).json({
                    error: 'validation failed',
                    details: error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            next(error)
        }
    }
}

export const validateParams = (schema) => {
    return (req, res, next) => {
        try {

            schema.parse(req.params);

            next()

        }catch(error) {
            if(error instanceof ZodError) {
                return res.status(400).json({
                    error: 'Invalid parameters',
                    details: error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            next(error)
        }
    }
}

export const validateQuery = (schema) => {
    return (req, res, next) => {
        try {

            schema.parse(req.query);

            next()

        }catch(error) {
            if(error instanceof ZodError) {
                return res.status(400).json({
                    error: 'Invalid query parameters',
                    details: error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            next(error)
        }
    }
}