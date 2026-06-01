const Joi = require('joi')

const adminUpdateUserRoleSchema = Joi.object({
  role: Joi.string().valid('user', 'moderator', 'admin').required()
})

const updateSOSStatusSchema = Joi.object({
  status: Joi.string().valid('Pending', 'Dispatched', 'Resolved').required()
})

module.exports = {
  adminUpdateUserRoleSchema,
  updateSOSStatusSchema
}
