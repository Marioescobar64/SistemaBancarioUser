import PDFDocument from 'pdfkit';
import Account from './account-model.js';
import Transfer from '../transfers/transfer-model.js';
import ServicePayment from '../services/servicePayment-model.js';

/**
 * GET /accounts/:accountId/statement
 * Query params: from (ISO date), to (ISO date)
 * Returns: application/pdf — Estilo Banco Industrial Guatemala
 */
export const generateStatement = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { from, to } = req.query;

    const startDate = from ? new Date(from) : new Date(new Date().setDate(1));
    const endDate = to ? new Date(to) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const account = await Account.findById(accountId).populate('user', 'name email DPI phone address');
    if (!account) {
      return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
    }

    if (account.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para ver el estado de esta cuenta' });
    }

    // Obtener transferencias del período
    const transfers = await Transfer.find({
      $or: [{ fromAccount: accountId }, { toAccount: accountId }],
      createdAt: { $gte: startDate, $lte: endDate }
    })
      .populate('fromAccount', 'accountNumber')
      .populate('toAccount', 'accountNumber')
      .sort({ createdAt: 1 });

    // Obtener pagos de servicios del período
    const servicePayments = await ServicePayment.find({
      account: accountId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: 1 });

    // Unificar movimientos
    const movements = [];
    for (const t of transfers) {
      const isDebit = t.fromAccount?._id?.toString() === accountId;
      movements.push({
        date: t.createdAt,
        doc: t.referenceNumber?.slice(-6) || '—',
        description: isDebit
          ? `TRANSF A CTA ${t.toAccount?.accountNumber || 'EXTERNA'}`
          : `TRANSF DE CTA ${t.fromAccount?.accountNumber || 'N/A'}`,
        debit: isDebit ? t.amount : 0,
        credit: isDebit ? 0 : (t.convertedAmount || t.amount),
      });
    }
    for (const sp of servicePayments) {
      movements.push({
        date: sp.createdAt,
        doc: sp.receiptNumber?.slice(-6) || '—',
        description: `PAGO ${sp.serviceProvider} REF ${sp.referenceNumber}`,
        debit: sp.amount,
        credit: 0,
      });
    }
    movements.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calcular totales y saldo corrido
    let totalDebit = 0;
    let totalCredit = 0;
    let runningBalance = account.balance; // saldo actual
    // Calcular saldo inicial retroactivamente
    for (const m of movements) {
      totalDebit += m.debit;
      totalCredit += m.credit;
    }
    const startingBalance = runningBalance - totalCredit + totalDebit;
    let currentBalance = startingBalance;

    // Asignar saldo corrido a cada movimiento
    for (const m of movements) {
      currentBalance = currentBalance + m.credit - m.debit;
      m.balance = currentBalance;
    }

    // =================== GENERAR PDF ===================
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 40,
      bufferPages: true,
      autoFirstPage: true
    });

    const filename = `Estado_Cuenta_${account.accountNumber}_${startDate.toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // ── COLORES (estilo BI) ──
    const teal = '#00696E';       // Verde-azulado principal
    const tealLight = '#008B8B';  // Más claro
    const tealBg = '#E0F2F1';    // Fondo suave
    const dark = '#1A1A1A';
    const gray = '#666666';
    const white = '#FFFFFF';
    const tableHeaderBg = '#004D50';
    const rowAlt = '#F5FAFA';

    const pageW = doc.page.width;
    const marginL = 40;
    const marginR = 40;
    const contentW = pageW - marginL - marginR;
    const sym = account.currency === 'USD' ? '$' : 'Q';

    // Nombre del mes para el encabezado
    const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const periodMonth = monthNames[startDate.getMonth()];
    const periodYear = startDate.getFullYear();

    // ═══════════════════════════════════════════
    // ENCABEZADO SUPERIOR
    // ═══════════════════════════════════════════
    const headerH = 90;
    doc.rect(0, 0, pageW, headerH).fill(teal);

    // Logo / Nombre del banco
    doc.fontSize(24).fill(white).font('Helvetica-Bold').text('VERAFF', marginL, 18);
    doc.fontSize(10).fill(white).font('Helvetica').text('BANK', marginL + 100, 24);
    doc.fontSize(7).fill('#A0D6D6').text('Banca Digital — Guatemala, C.A.', marginL, 48);
    doc.fontSize(7).fill('#A0D6D6').text('Superintendencia de Bancos — Entidad Regulada', marginL, 60);

    // Teléfono y período (lado derecho)
    doc.fontSize(20).fill(white).font('Helvetica-Bold')
      .text('2200-1000', pageW - marginR - 180, 18, { width: 180, align: 'right' });
    doc.fontSize(7).fill('#A0D6D6').font('Helvetica')
      .text('WhatsApp Veraff', pageW - marginR - 180, 42, { width: 180, align: 'right' });
    doc.fontSize(9).fill(white).font('Helvetica-Bold')
      .text(`${periodMonth}/${periodYear}`, pageW - marginR - 180, 58, { width: 180, align: 'right' });

    // ═══════════════════════════════════════════
    // INFORMACIÓN DE CUENTA
    // ═══════════════════════════════════════════
    let y = headerH + 15;

    doc.rect(marginL, y, contentW, 55).lineWidth(0.5).stroke('#CCCCCC');

    // Columna izquierda — info cuenta
    doc.fontSize(8).fill(teal).font('Helvetica-Bold').text('INFORMACIÓN DE CUENTA', marginL + 10, y + 8);
    doc.fontSize(7).fill(gray).font('Helvetica');
    doc.text(`Tipo`, marginL + 10, y + 22);
    doc.text(`Número`, marginL + 10, y + 33);
    doc.text(`Cta. Estandarizada`, marginL + 10, y + 44);

    doc.fontSize(7).fill(dark).font('Helvetica-Bold');
    doc.text(`${account.type}  ${account.currency}`, marginL + 100, y + 22);
    doc.text(account.accountNumber, marginL + 100, y + 33);
    doc.text(`GT88 VERF ${account.accountNumber.replace(/-/g, ' ')}`, marginL + 100, y + 44);

    // Columna derecha — nombre titular
    const rightCol = pageW / 2 + 20;
    doc.fontSize(8).fill(teal).font('Helvetica-Bold').text('TITULAR', rightCol, y + 8);
    doc.fontSize(9).fill(dark).font('Helvetica-Bold')
      .text((account.user?.name || 'N/A').toUpperCase(), rightCol, y + 22);
    if (account.user?.DPI) {
      doc.fontSize(7).fill(gray).font('Helvetica').text(`DPI: ${account.user.DPI}`, rightCol, y + 36);
    }
    doc.fontSize(7).fill(gray).font('Helvetica')
      .text(account.user?.email || '', rightCol, y + 46);

    // ═══════════════════════════════════════════
    // BALANCE DE CUENTA
    // ═══════════════════════════════════════════
    y += 70;
    doc.rect(marginL, y, contentW, 70).fill(tealBg);
    doc.rect(marginL, y, contentW, 18).fill(teal);
    doc.fontSize(8).fill(white).font('Helvetica-Bold')
      .text('BALANCE DE CUENTA', marginL + 10, y + 5);

    const balCol1 = marginL + 10;
    const balCol2 = marginL + 200;
    const balCol3 = marginL + 240;
    const balY = y + 24;

    doc.fontSize(7).fill(dark).font('Helvetica');
    doc.text('Saldo inicio de mes', balCol1, balY);
    doc.text('Débitos', balCol1, balY + 12);
    doc.text('Créditos', balCol1, balY + 24);
    doc.text('Saldo fin de mes', balCol1, balY + 36);

    doc.fontSize(7).fill(dark).font('Helvetica-Bold');
    doc.text(sym, balCol2, balY, { width: 15, align: 'right' });
    doc.text(`-${sym}`, balCol2, balY + 12, { width: 15, align: 'right' });
    doc.text(sym, balCol2, balY + 24, { width: 15, align: 'right' });
    doc.text(sym, balCol2, balY + 36, { width: 15, align: 'right' });

    const fmtNum = (n) => n.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    doc.text(fmtNum(startingBalance), balCol3, balY, { width: 80, align: 'right' });
    doc.text(fmtNum(totalDebit), balCol3, balY + 12, { width: 80, align: 'right' });
    doc.text(fmtNum(totalCredit), balCol3, balY + 24, { width: 80, align: 'right' });
    doc.text(fmtNum(account.balance), balCol3, balY + 36, { width: 80, align: 'right' });

    // ═══════════════════════════════════════════
    // TABLA DE MOVIMIENTOS
    // ═══════════════════════════════════════════
    y += 85;

    // Línea separadora decorativa
    doc.rect(marginL, y, contentW, 2).fill(teal);
    y += 10;

    // Definir columnas de la tabla
    const cols = {
      dia: { x: marginL, w: 30 },
      docu: { x: marginL + 30, w: 45 },
      desc: { x: marginL + 75, w: 230 },
      debito: { x: marginL + 305, w: 70 },
      credito: { x: marginL + 375, w: 70 },
      saldo: { x: marginL + 445, w: 87 }
    };

    const ROW_H = 14;

    const drawTableHeader = (yPos) => {
      doc.rect(marginL, yPos, contentW, 16).fill(tableHeaderBg);
      doc.fontSize(7).fill(white).font('Helvetica-Bold');
      doc.text('Día', cols.dia.x + 3, yPos + 4, { width: cols.dia.w });
      doc.text('Doc.', cols.docu.x + 3, yPos + 4, { width: cols.docu.w });
      doc.text('Descripción', cols.desc.x + 3, yPos + 4, { width: cols.desc.w });
      doc.text('Débito', cols.debito.x, yPos + 4, { width: cols.debito.w, align: 'right' });
      doc.text('Crédito', cols.credito.x, yPos + 4, { width: cols.credito.w, align: 'right' });
      doc.text('Saldo', cols.saldo.x, yPos + 4, { width: cols.saldo.w, align: 'right' });
      return yPos + 18;
    };

    y = drawTableHeader(y);

    // Fila de saldo anterior
    doc.fontSize(7).fill(gray).font('Helvetica-Oblique');
    doc.text('****SALDO ANTERIOR****', cols.desc.x + 3, y + 2, { width: cols.desc.w });
    doc.fontSize(7).fill(dark).font('Helvetica-Bold');
    doc.text(fmtNum(startingBalance), cols.saldo.x, y + 2, { width: cols.saldo.w, align: 'right' });
    y += ROW_H;

    // Línea separadora
    doc.moveTo(marginL, y).lineTo(marginL + contentW, y).lineWidth(0.3).stroke('#CCCCCC');

    // Filas de movimientos
    if (movements.length === 0) {
      doc.fontSize(8).fill(gray).font('Helvetica-Oblique')
        .text('No se encontraron movimientos en el período seleccionado.', marginL + 10, y + 8, { width: contentW - 20, align: 'center' });
      y += 30;
    } else {
      for (let i = 0; i < movements.length; i++) {
        const m = movements[i];

        // ¿Necesitamos nueva página?
        if (y > 680) {
          doc.addPage();
          y = 40;
          // Re-dibujar header de tabla
          y = drawTableHeader(y);
        }

        // Fondo alterno
        if (i % 2 === 0) {
          doc.rect(marginL, y - 1, contentW, ROW_H).fill(rowAlt);
        }

        const dayStr = new Date(m.date).getDate().toString().padStart(2, '0');

        doc.fontSize(7).fill(dark).font('Helvetica');
        doc.text(dayStr, cols.dia.x + 3, y + 2, { width: cols.dia.w });
        doc.text(m.doc, cols.docu.x + 3, y + 2, { width: cols.docu.w });
        doc.text(m.description.substring(0, 45), cols.desc.x + 3, y + 2, { width: cols.desc.w });

        if (m.debit > 0) {
          doc.text(fmtNum(m.debit), cols.debito.x, y + 2, { width: cols.debito.w, align: 'right' });
        }
        if (m.credit > 0) {
          doc.text(fmtNum(m.credit), cols.credito.x, y + 2, { width: cols.credito.w, align: 'right' });
        }
        doc.font('Helvetica-Bold')
          .text(fmtNum(m.balance), cols.saldo.x, y + 2, { width: cols.saldo.w, align: 'right' });

        y += ROW_H;
      }
    }

    // ── LÍNEA ÚLTIMA ──
    doc.moveTo(marginL, y).lineTo(marginL + contentW, y).lineWidth(0.5).stroke(teal);
    y += 3;
    doc.fontSize(7).fill(gray).font('Helvetica-Oblique')
      .text('****ULTIMA LINEA****', cols.desc.x + 3, y, { width: cols.desc.w });
    y += ROW_H;

    // ── TOTALES ──
    doc.rect(marginL, y, contentW, 16).fill(tealBg);
    doc.fontSize(8).fill(dark).font('Helvetica-Bold');
    doc.text('Totales', cols.desc.x + 3, y + 4, { width: cols.desc.w });
    doc.text(fmtNum(totalDebit), cols.debito.x, y + 4, { width: cols.debito.w, align: 'right' });
    doc.text(fmtNum(totalCredit), cols.credito.x, y + 4, { width: cols.credito.w, align: 'right' });
    doc.text(fmtNum(account.balance), cols.saldo.x, y + 4, { width: cols.saldo.w, align: 'right' });
    y += 25;

    // ═══════════════════════════════════════════
    // PIE DE PÁGINA
    // ═══════════════════════════════════════════
    // Solo si cabe en la misma página
    if (y < 700) {
      // Tip de seguridad
      const tipY = Math.max(y + 10, 670);
      doc.rect(marginL, tipY, contentW, 40).fill(teal);
      doc.fontSize(9).fill('#FFD54F').font('Helvetica-Bold')
        .text('Protección contra Fraude', marginL + 15, tipY + 6);
      doc.fontSize(7).fill(white).font('Helvetica')
        .text('Jamás reveles tus datos de acceso a la banca electrónica por cualquier medio, evita ser víctima de phishing.', marginL + 15, tipY + 20, { width: contentW - 30 });
    }

    // Número de página
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(7).fill(gray).font('Helvetica')
        .text(`Pag ${i + 1}/${pages.count}`, pageW - marginR - 60, doc.page.height - 30, { width: 60, align: 'right' });
    }

    doc.end();

  } catch (error) {
    console.error('Error generando estado de cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el estado de cuenta',
      error: error.message
    });
  }
};
