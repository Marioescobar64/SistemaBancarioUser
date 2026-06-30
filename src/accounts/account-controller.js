'use strict';

import Account from './account-model.js';

export const getAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive = true } = req.query;

    // Solo puede ver sus propias cuentas
    const filter = { 
      isActive,
      user: req.user._id 
    };

    const accounts = await Account.find(filter)
      .populate('user', '-password')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Account.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: accounts,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit: Number(limit),
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuentas',
      error: error.message,
    });
  }
};

export const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await Account.findById(id)
      .populate('user', '-password');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    // Solo si es su cuenta
    if (account.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta cuenta'
      });
    }

    res.status(200).json({
      success: true,
      data: account
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuenta',
      error: error.message
    });
  }
};