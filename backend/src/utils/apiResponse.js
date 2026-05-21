/**
 * Standardized API response format for consistency across all endpoints.
 *
 * Success: { success: true, message, data, meta }
 * Error:   { success: false, message, errors, stack (dev only) }
 */

class ApiResponse {
  /**
   * Send a successful response
   */
  static success(res, { message = 'Success', data = null, statusCode = 200, meta = null } = {}) {
    const response = { success: true, message }
    if (data !== null) response.data = data
    if (meta !== null) response.meta = meta
    return res.status(statusCode).json(response)
  }

  /**
   * Send a created response (201)
   */
  static created(res, { message = 'Created successfully', data = null } = {}) {
    return ApiResponse.success(res, { message, data, statusCode: 201 })
  }

  /**
   * Send a paginated list response
   */
  static paginated(res, { data, total, page, limit, message = 'Success' } = {}) {
    return res.status(200).json({
      success: true,
      message,
      data,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  }

  /**
   * Send an error response
   */
  static error(res, { message = 'Something went wrong', statusCode = 500, errors = null } = {}) {
    const response = { success: false, message }
    if (errors) response.errors = errors
    return res.status(statusCode).json(response)
  }
}

module.exports = ApiResponse
