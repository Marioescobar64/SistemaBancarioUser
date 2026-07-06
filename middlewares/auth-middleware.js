'use strict';

import jwt from 'jsonwebtoken';
import User from '../src/users/user-model.js';

// ============================
// VERIFICAR TOKEN
// ============================

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // authservice stores the user id in the 'sub' field
    let user = await User.findOne({ authServiceId: decoded.sub });

    if (!user) {
      // Auto-crear perfil local (lazy sync) ya que el usuario pasó la validación del authservice
      user = await User.create({
        authServiceId: decoded.sub,
        name: decoded.name || 'Usuario Nuevo',
        email: decoded.email || `user_${decoded.sub}@local.app`,
        isActive: true
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autorizado o perfil local desactivado',
      });
    }

    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
      error: error.message,
    });
  }
};