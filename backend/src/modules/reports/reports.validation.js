const Joi = require('joi')

const createReportSchema = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(10).max(1000).optional(),
  desc: Joi.string().min(10).max(1000).optional(),
  category: Joi.string().valid('Infrastructure', 'Traffic', 'Crime', 'Pollution', 'Other').required(),
  locationName: Joi.string().required(),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).optional()
  }).optional()
}).or('description', 'desc')

const updateReportStatusSchema = Joi.object({
  status: Joi.string().valid('Active', 'Under Review', 'Resolved').required()
})

module.exports = {
  createReportSchema,
  updateReportStatusSchema
}
