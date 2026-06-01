const Joi = require('joi')
const ApiResponse = require('../utils/apiResponse')

const validate = (schema) => (req, res, next) => {
  const validSchema = typeof schema === 'function' ? schema() : schema

  // Add unknown(false) to reject unexpected fields strictly
  const { error, value } = validSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: false
  })

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ')
    return ApiResponse.error(res, {
      message: `Validation Error: ${errorMessage}`,
      statusCode: 400
    })
  }

  // Replace req.body with sanitized/validated value
  Object.assign(req.body, value)
  return next()
}

module.exports = validate
