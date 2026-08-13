const createValidationError = (details) => {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.details = details;
    return error;
};

const validateObject = (schema, data) => {
    if (!schema) {
        return { valid: true, value: data };
    }

    const result = schema.safeParse ? schema.safeParse(data) : { success: true, data };
    if (!result.success) {
        const details = result.error?.issues?.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
        })) || [];
        throw createValidationError(details);
    }

    return { valid: true, value: result.data };
};

module.exports = { createValidationError, validateObject };
