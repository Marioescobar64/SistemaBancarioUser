'use strict';

import Account from './account-model.js';
import User from '../users/user-model.js';

const generateAccountNumber = async () => {

  const lastAccount = await Account.findOne()
    .sort({ createdAt: -1 });

  let nextNumber = 1;

  if (lastAccount && lastAccount.accountNumber) {
    const lastNumber = parseInt(lastAccount.accountNumber.split('-').pop());
    nextNumber = lastNumber + 1;
  }

  return `4010-0000-0000-${String(nextNumber).padStart(4, '0')}`;
};

export const createAccount = async (req, res) => {
  try {

    const { user, type } = req.body;

    let userId;

    // 🔹 Si es ADMIN puede elegir el usuario
    if (req.user.role === 'ADMIN') {

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Debe especificar el usuario'
        });
      }

      const userExists = await User.findById(user);

      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'El usuario no existe'
        });
      }

      userId = user;

    } else {
      // 🔹 Si es USER solo puede crear para sí mismo
      userId = req.user._id;
    }

    const accountNumber = await generateAccountNumber();

    const account = new Account({
      user: userId,
      type,
      balance: 0,
      accountNumber
    });

    await account.save();

    res.status(201).json({
      success: true,
      message: 'Cuenta creada exitosamente',
      data: account
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Error al crear cuenta',
      error: error.message
    });
  }
};

export const getAccounts = async (req, res) => {
  try {

    const { page = 1, limit = 10, isActive = true } = req.query;

    const filter = { isActive };

    // Si es USER, solo puede ver sus cuentas
    if (req.user.role === 'USER') {
      filter.user = req.user._id;
    }

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

    // Si es USER y no es su cuenta → prohibido
    if (
      req.user.role === 'USER' &&
      account.user._id.toString() !== req.user._id.toString()
    ) {
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

export const updateAccount = async (req, res) => {
  try {

    const { id } = req.params;
    const data = req.body;

    // Eliminar balance si intentan enviarlo
    delete data.balance;

    const account = await Account.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('user', '-password');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cuenta actualizada correctamente',
      data: account
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Error al actualizar cuenta',
      error: error.message
    });
  }
};
export const changeAccountStatus = async (req, res) => {
  try {

    const { id } = req.params;

    const account = await Account.findById(id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    account.isActive = !account.isActive;
    await account.save();

    res.status(200).json({
      success: true,
      message: `Cuenta ${account.isActive ? 'activada' : 'desactivada'} correctamente`,
      data: account
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de la cuenta',
      error: error.message
    });
  }
};

export const depositMoney = async (req, res) => {
  try {

    const { id } = req.params;
    const { amount } = req.body;

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    const account = await Account.findOne({ accountNumber: id });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    // 🔒 Si es USER solo puede depositar a su cuenta
    if (
      req.user.role === 'USER' &&
      account.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'No puedes depositar en esta cuenta'
      });
    }

    account.balance += amount;
    await account.save();

    res.status(200).json({
      success: true,
      message: 'Depósito realizado correctamente',
      data: account
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Error al depositar',
      error: error.message
    });
  }
};

export const withdrawMoney = async (req, res) => {
  try {

    const { id } = req.params;
    const { amount } = req.body;

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    const account = await Account.findOne({ accountNumber: id });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    if (account.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Fondos insuficientes'
      });
    }

    if (
      req.user.role === 'USER' &&
      account.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'No puedes retirar de esta cuenta'
      });
    }

    account.balance -= amount;
    await account.save();

    res.status(200).json({
      success: true,
      message: 'Retiro realizado correctamente',
      data: account
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Error al retirar',
      error: error.message
    });
  }
};