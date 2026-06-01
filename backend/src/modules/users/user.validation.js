const Joi = require('joi')

const updateUserProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().optional(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
    'string.pattern.base': 'Phone number must be exactly 10 digits'
  }),
  state: Joi.string().trim().optional(),
  city: Joi.string().trim().optional(),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark').optional(),
    notifications: Joi.boolean().optional()
  }).optional()
})

const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('user', 'moderator', 'admin').required()
})

module.exports = {
  updateUserProfileSchema,
  updateUserRoleSchema
}
