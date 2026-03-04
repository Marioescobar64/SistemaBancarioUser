// importaciones

import dotenv from 'dotenv';
import { initServer } from "./config/app.js";

// Configuracion de variables de entorno
dotenv.config();

// Errores no capturados
process.on('uncaughtException', (error) => {
    console.log(error);
    process.exit(1);
});

// Promesas rechazadas o no manejadas
process.on('uncaughtException', (reason, promise) => {
    console.log(reason, promise);
    process.exit(1);
});

// Inicializacion del servidor
console.log('Iniciando servidor...');
initServer();

