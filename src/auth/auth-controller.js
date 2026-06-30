'use strict';

import User from '../users/user-model.js';

// SYNC PROFILE (Registra el perfil local asociado al authservice)
export const syncProfile = async (req, res) => {
  try {
    const { authServiceId, name, email } = req.body;

    // Verificar si ya existe por authServiceId o email
    const existingUser = await User.findOne({ 
      $or: [{ authServiceId }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El perfil de usuario ya existe'
      });
    }

    const user = new User({
      authServiceId,
      name,
      email
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Perfil de usuario creado y sincronizado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};