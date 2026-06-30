'use strict';

import Loan from './loan-model.js';

export const createLoan = async (req, res) => {
  try {
    // El usuario solo puede crear préstamos a su propio nombre
    const { amount, interestRate } = req.body;
    const userId = req.user._id;

    const loan = new Loan({
      user: userId,
      amount,
      interestRate,
      status: 'PENDING'
    });

    await loan.save();

    res.status(201).json({
      success: true,
      message: 'Préstamo solicitado correctamente',
      data: loan
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al solicitar préstamo',
      error: error.message
    });
  }
};

export const getLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = {
      user: req.user._id
    };

    if (status) {
      filter.status = status;
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

    if (loan.user._id.toString() !== req.user._id.toString()) {
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