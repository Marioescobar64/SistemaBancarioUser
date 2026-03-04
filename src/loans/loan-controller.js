'use strict';

import Loan from './loan-model.js';
import User from '../users/user-model.js';

export const createLoan = async (req, res) => {
  try {

    const { user, amount, interestRate } = req.body;

    const userExists = await User.findById(user);

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'El usuario no existe'
      });
    }

    const loan = new Loan({
      user,
      amount,
      interestRate,
      status: 'PENDING'
    });

    await loan.save();

    res.status(201).json({
      success: true,
      message: 'Préstamo creado correctamente',
      data: loan
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Error al crear préstamo',
      error: error.message
    });
  }
};

export const getLoans = async (req, res) => {
  try {

    const { page = 1, limit = 10, status } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    // Si es USER, solo ve sus préstamos
    if (req.user.role === 'USER') {
      filter.user = req.user._id;
    }

    const loans = await Loan.find(filter)
      .populate('user', '-password')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Loan.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: loans,
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
      message: 'Error al obtener préstamos',
      error: error.message,
    });
  }
};

export const getLoanById = async (req, res) => {
  try {

    const { id } = req.params;

    const loan = await Loan.findById(id)
      .populate('user', '-password');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }

    // 🔥 USER no puede ver préstamos ajenos
    if (
      req.user.role === 'USER' &&
      loan.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este préstamo'
      });
    }

    res.status(200).json({
      success: true,
      data: loan
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Error al obtener préstamo',
      error: error.message
    });
  }
};

export const updateLoan = async (req, res) => {
  try {

    const { id } = req.params;
    const data = req.body;

    // 🔒 Evitar modificar status desde aquí
    delete data.status;

    const loan = await Loan.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('user', '-password');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Préstamo actualizado correctamente',
      data: loan
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Error al actualizar préstamo',
      error: error.message
    });
  }
};

export const changeLoanStatus = async (req, res) => {
  try {

    const { id } = req.params;
    const { status } = req.body;

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }

    loan.status = status;
    await loan.save();

    res.status(200).json({
      success: true,
      message: 'Estado del préstamo actualizado',
      data: loan
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del préstamo',
      error: error.message
    });
  }
};