'use strict';

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { corsOptions } from './cors-configuration.js';
import { dbConnection } from './db.js';
import cardsRoutes from '../src/cards/card-routes.js';
import transferRoutes from '../src/transfers/transfer-routes.js';
import accountRoutes from '../src/accounts/account-routes.js';
import loanRoutes from '../src/loans/loan-routes.js';
import authRoutes from '../src/auth/auth-routes.js';

const BASE_URL = '/veraff/v1';

const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false, limit: '10mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(cors(corsOptions));
    app.use(morgan('dev'));
};

const routes = (app) => {

    // Health Check
    app.get(`${BASE_URL}/health`, (req, res) => {
        res.status(200).json({
            status: 'ok',
            service: 'veraff Admin',
            version: '1.0.0'
        });
    });

    // Módulos del sistema
    app.use(`${BASE_URL}/auth`, authRoutes);
    app.use(`${BASE_URL}/accounts`, accountRoutes);
    app.use(`${BASE_URL}/cards`, cardsRoutes);
    app.use(`${BASE_URL}/transfers`, transferRoutes);
    app.use(`${BASE_URL}/loans`, loanRoutes);
};

const initServer = async () => {

    const app = express();
    const PORT = process.env.PORT || 3000;

    try {

        await dbConnection();

        middlewares(app);
        routes(app);

        app.listen(PORT, () => {
            console.log('=================================');
            console.log(`Servidor corriendo en puerto ${PORT}`);
            console.log(`Base URL: http://localhost:${PORT}${BASE_URL}`);
            console.log('=================================');
        });

    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
    }
};

export { initServer };