'use strict';

import User from './user-model.js';

export const updateMyProfile = async (req, res) => {
  try {
    // req.user viene del middleware auth-middleware.js
    const userId = req.user._id;
    const data = req.body;

    // Campos permitidos para actualizar por el usuario
    const allowedFields = [
      'name', 'lastName', 'dpi', 'nit', 'dateOfBirth', 'gender',
      'address', 'phone', 'occupation', 'monthlyIncome', 'incomeSource'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado correctamente',
      data: updatedUser
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar el perfil',
      error: error.message
    });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Perfil obtenido correctamente',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al obtener el perfil',
      error: error.message
    });
  }
};

export const syncInternalUser = async (req, res) => {
  try {
    const { authServiceId, email, name } = req.body;
    
    if (!authServiceId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios'
      });
    }

    // Campos de KYC permitidos
    const allowedFields = [
      'name', 'lastName', 'dpi', 'nit', 'dateOfBirth', 'gender',
      'nationality', 'address', 'phone', 'occupation', 'monthlyIncome', 'incomeSource'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Crear o actualizar usando upsert
    const user = await User.findOneAndUpdate(
      { authServiceId },
      { 
        $set: updateData,
        $setOnInsert: {
          email,
          isActive: true
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Usuario sincronizado correctamente',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al sincronizar el usuario interno',
      error: error.message
    });
  }
};
