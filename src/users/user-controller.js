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
