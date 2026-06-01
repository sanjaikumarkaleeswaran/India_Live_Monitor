const Joi = require('joi')

const submitSOSSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required().messages({
    'number.base': 'Latitude must be a number',
    'any.required': 'Latitude is required for SOS'
  }),
  lng: Joi.number().min(-180).max(180).required().messages({
    'number.base': 'Longitude must be a number',
    'any.required': 'Longitude is required for SOS'
  }),
  message: Joi.string().max(500).optional().allow('')
})

module.exports = {
  submitSOSSchema
}
