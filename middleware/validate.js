// Backend/middleware/validate.js
import createError from "http-errors";

/**
 * validate(schema, source = 'body')
 * - schema: Joi schema object
 * - source: 'body' | 'query' | 'params'
 */
export default function validate(schema, source = "body") {
  return (req, res, next) => {
    const payload = req[source] || {};
    const { error, value } = schema.validate(payload, { abortEarly: false, stripUnknown: true });

    if (error) {
      // build friendly error message
      const details = error.details.map((d) => ({ message: d.message, path: d.path }));
      // you can use your existing error handling pattern; here we return 400
      return res.status(400).json({ message: "Validation failed", details });
    }

    // attach validated value back to req (optional)
    req.validated = value;
    next();
  };
}
