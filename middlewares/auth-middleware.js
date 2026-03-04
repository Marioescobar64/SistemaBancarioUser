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

    const user = await User.findById(decoded.uid);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autorizado',
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

// ============================
// AUTORIZACIÓN POR ROL
// ============================

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
      });
    }

    next();
  };
};