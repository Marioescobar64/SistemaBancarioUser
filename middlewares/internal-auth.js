'use strict';

export const internalAuth = (req, res, next) => {
  const apiKey = req.headers['x-internal-api-key'];
  const expectedKey = process.env.INTERNAL_API_KEY || 'my_super_secret_internal_key_123';

  if (!apiKey || apiKey !== expectedKey) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid internal API key',
    });
  }

  next();
};
