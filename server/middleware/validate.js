import { ApiError } from '../utils/ApiError.js';

// validate(schema, 'body' | 'query') -> replaces req[source] with parsed, trimmed, typed data
export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(new ApiError(400, 'Validation failed', details));
    }

    // Express 5 makes req.query read-only, so define it explicitly.
    Object.defineProperty(req, source, {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };