import axios from 'axios';

let currentExchangeRate = {
    compra: 7.80,
    venta: 7.80,
    fecha: new Date().toISOString()
};

/**
 * Servicio para obtener el tipo de cambio oficial de Banguat
 * Usa el WebService SOAP público
 */
export const syncExchangeRate = async () => {
    try {
        console.log('🔄 Sincronizando tipo de cambio con Banguat...');
        
        const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <TipoCambioDia xmlns="http://www.banguat.gob.gt/variables/ws/" />
          </soap:Body>
        </soap:Envelope>`;

        const response = await axios.post('https://banguat.gob.gt/variables/ws/TipoCambio.asmx', xmlBody, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://www.banguat.gob.gt/variables/ws/TipoCambioDia',
                'User-Agent': 'VeraffBank/1.0'
            },
            timeout: 10000 // 10s timeout
        });

        // Parseo manual usando regex simple para no añadir dependencias como xml2js
        const data = response.data;
        const compraMatch = data.match(/<compra>(.*?)<\/compra>/);
        const ventaMatch = data.match(/<venta>(.*?)<\/venta>/);

        if (compraMatch && ventaMatch) {
            currentExchangeRate = {
                compra: parseFloat(compraMatch[1]),
                venta: parseFloat(ventaMatch[1]),
                fecha: new Date().toISOString()
            };
            console.log(`✅ Tipo de Cambio Banguat actualizado: Compra Q${currentExchangeRate.compra} - Venta Q${currentExchangeRate.venta}`);
        } else {
            console.warn('⚠️ No se encontraron las etiquetas de compra/venta en la respuesta de Banguat. Usando fallback de 7.80.');
        }

    } catch (error) {
        console.error('❌ Error conectando a Banguat:', error.message);
        console.warn('⚠️ Usando fallback de tipo de cambio: 7.80');
        // No sobreescribimos si ya existe un valor de hoy, si falla Banguat mantenemos la tasa anterior
    }
};

/**
 * Retorna la tasa actual almacenada en caché
 * @returns {number} La tasa de compra oficial (para simplificar depósitos/retiros/transferencias)
 */
export const getExchangeRate = () => {
    return currentExchangeRate.compra; // Por simplificación usaremos 'compra' en las transacciones base
};
