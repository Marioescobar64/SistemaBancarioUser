'use strict';

import Loan from './loan-model.js';
import Account from '../accounts/account-model.js';
import User from '../users/user-model.js';
import mongoose from 'mongoose';

export const createLoan = async (req, res) => {
  try {
    // El usuario solo puede crear préstamos a su propio nombre
    const { amount, termMonths, loanType, account } = req.body;
    const userId = req.user._id;

    const interestRate = 10; // Tasa base 10%
    
    // Calcular cuota mensual (amortización francesa)
    const monthlyRate = (interestRate / 100) / 12;
    const monthlyPayment = monthlyRate > 0
      ? Math.round((amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1) * 100) / 100
      : Math.round((amount / termMonths) * 100) / 100;

    const loan = new Loan({
      user: userId,
      account,
      amount,
      termMonths,
      loanType: loanType || 'PERSONAL',
      loanNumber: `LOAN-${Date.now().toString().slice(-6)}`,
      interestRate,
      monthlyPayment,
      remainingBalance: amount, // Se inicializa con el monto
      status: 'SOLICITADO'
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

export const requestMicroLoan = async (req, res) => {
  try {
    const { amount, paymentFrequency, accountId } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    if (amount > user.microLoanLimit) {
      throw new Error(`El monto excede tu límite actual de Q${user.microLoanLimit}`);
    }

    // Verificar que no tenga otro micro-préstamo activo
    const activeLoan = await Loan.findOne({
      user: userId,
      loanType: 'MICRO_ADELANTO',
      status: { $in: ['SOLICITADO', 'DESEMBOLSADO', 'AL_DIA', 'EN_MORA'] },
      isActive: true
    });

    if (activeLoan) {
      throw new Error('Ya tienes un adelanto Veraff activo. Paga el actual para solicitar otro.');
    }

    // Calcular comisión por servicio
    let feePercentage = 0.05; // 5% mensual
    let termMonths = 1;
    if (paymentFrequency === 'DIARIO') {
      feePercentage = 0.01; // 1%
      termMonths = 1; // Equivale a plazo corto
    } else if (paymentFrequency === 'SEMANAL') {
      feePercentage = 0.03; // 3%
      termMonths = 1;
    }
    const serviceFee = Math.round(amount * feePercentage * 100) / 100;
    const totalToPay = amount + serviceFee;

    const account = await Account.findOne({ _id: accountId, user: userId });
    if (!account) throw new Error('Cuenta de desembolso no válida');

    // Desembolso inmediato
    account.balance += amount;
    await account.save();

    const loan = new Loan({
      user: userId,
      account: accountId,
      amount: amount,
      termMonths,
      paymentFrequency,
      serviceFee,
      interestRate: 0,
      loanType: 'MICRO_ADELANTO',
      loanNumber: `VRF-ADL-${Date.now().toString().slice(-6)}`,
      status: 'DESEMBOLSADO',
      remainingBalance: totalToPay,
      monthlyPayment: totalToPay, // La cuota mensual sugerida es el total
      disbursedAt: new Date()
    });

    await loan.save();

    res.status(201).json({
      success: true,
      message: `Adelanto de Q${amount} desembolsado exitosamente`,
      data: loan
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al solicitar el adelanto',
      error: error.message
    });
  }
};

export const payMicroLoan = async (req, res) => {
  try {
    const { id } = req.params; // ID del préstamo
    const { amount, fromAccount } = req.body;
    const userId = req.user._id;

    const loan = await Loan.findOne({ _id: id, user: userId });
    if (!loan) throw new Error('Préstamo no encontrado');
    if (loan.status === 'PAGADO') throw new Error('Este préstamo ya está liquidado');
    if (loan.loanType !== 'MICRO_ADELANTO') throw new Error('Use la ruta correspondiente para pagar este tipo de préstamo');

    const account = await Account.findOne({ _id: fromAccount, user: userId });
    if (!account) throw new Error('Cuenta de origen inválida');

    if (account.balance < amount) {
      throw new Error('Fondos insuficientes para realizar el abono');
    }

    if (amount > loan.remainingBalance) {
      throw new Error(`El monto supera el saldo pendiente de Q${loan.remainingBalance}`);
    }

    // Cobrar
    account.balance -= amount;
    await account.save();

    // Actualizar préstamo
    loan.totalPaid += amount;
    loan.remainingBalance -= amount;

    if (loan.remainingBalance <= 0) {
      loan.status = 'PAGADO';
      loan.remainingBalance = 0;
      
      // PREMIAR AL USUARIO: Aumentar su límite en Q100
      const user = await User.findById(userId);
      user.microLoanLimit += 100;
      user.microLoanScore += 1;
      await user.save();
    }

    await loan.save();

    res.status(200).json({
      success: true,
      message: loan.status === 'PAGADO' 
        ? '¡Adelanto liquidado con éxito! Tu límite de crédito ha aumentado.' 
        : `Abono de Q${amount} registrado exitosamente.`,
      data: loan
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al procesar el pago',
      error: error.message
    });
  }
};

export const getLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, loanType } = req.query;

    const filter = {
      user: req.user._id
    };

    if (status) filter.status = status;
    if (loanType) filter.loanType = loanType;

    const loans = await Loan.find(filter)
      .populate('user', '-password')
      .populate('account', 'accountNumber currency')
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
      .populate('user', '-password')
      .populate('account', 'accountNumber currency');

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

export const payLoanInstallment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, fromAccount } = req.body;
    const userId = req.user._id;

    const loan = await Loan.findOne({ _id: id, user: userId });
    if (!loan) throw new Error('Préstamo no encontrado');
    if (loan.status === 'PAGADO') throw new Error('Este préstamo ya está liquidado');
    if (!['DESEMBOLSADO', 'AL_DIA', 'EN_MORA'].includes(loan.status)) {
      throw new Error('El préstamo no está en un estado válido para recibir abonos');
    }

    const account = await Account.findOne({ _id: fromAccount, user: userId });
    if (!account) throw new Error('Cuenta de origen inválida');

    if (account.balance < amount) {
      throw new Error('Fondos insuficientes para realizar el abono');
    }

    if (amount > loan.remainingBalance) {
      throw new Error(`El abono supera el saldo pendiente de Q${loan.remainingBalance}`);
    }

    // Cobrar de la cuenta
    account.balance -= amount;
    await account.save();

    // Actualizar préstamo
    loan.totalPaid += amount;
    loan.remainingBalance -= amount;
    
    // Si la cuota cubre el pago mínimo mensual o si se abona
    loan.paidInstallments += 1;

    if (loan.remainingBalance <= 0) {
      loan.status = 'PAGADO';
      loan.remainingBalance = 0;
    } else if (loan.status === 'EN_MORA' || loan.status === 'DESEMBOLSADO') {
      loan.status = 'AL_DIA';
    }

    await loan.save();

    res.status(200).json({
      success: true,
      message: loan.status === 'PAGADO' 
        ? '¡Préstamo liquidado en su totalidad con éxito!' 
        : `Abono de Q${amount} registrado exitosamente.`,
      data: loan
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al procesar el pago de la cuota',
      error: error.message
    });
  }
};