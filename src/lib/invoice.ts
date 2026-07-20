import { jsPDF } from 'jspdf';
import { Order } from './seed-data';

/**
 * Generates a professional PDF invoice for a given order using jsPDF.
 * This helper returns the jsPDF instance. It can be saved directly on the client 
 * using .save() or converted to a stream/buffer on the server using .output().
 */
export function generateInvoice(order: Order): jsPDF {
  // Use 'p' for portrait, 'pt' (points) for high-precision, and 'a4' size
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  // A4 dimensions: 595.28 x 841.89 points
  const margin = 40;
  const startX = margin;
  let currentY = 50;

  // --- Theme Colors ---
  const PRIMARY_COLOR = [10, 116, 111]; // Emerald Teal (0x0A746F)
  const TEXT_DARK = [44, 62, 80];      // Slate Navy
  const TEXT_MUTED = [120, 144, 156];  // Cool Grey
  const BG_LIGHT = [245, 247, 248];    // Light Grey
  const WHITE = [255, 255, 255];

  // Helper to set fill color from array
  const setFill = (rgb: number[]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setDraw = (rgb: number[]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const setText = (rgb: number[]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  // ==========================================
  // 1. HEADER & LOGO
  // ==========================================
  // Draw top teal accent bar
  setFill(PRIMARY_COLOR);
  doc.rect(0, 0, 595.28, 15, 'F');
  currentY += 10;

  // Simulated Medical Cross Logo
  setFill(PRIMARY_COLOR);
  // Vertical bar
  doc.rect(startX + 10, currentY + 5, 8, 24, 'F');
  // Horizontal bar
  doc.rect(startX + 2, currentY + 13, 24, 8, 'F');

  // Pharmacy Brand Name
  setText(PRIMARY_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PRIME PHARMACY', startX + 35, currentY + 22);

  // Pharmacy Contact Info (Top Right)
  setText(TEXT_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const contactLines = [
    'Prime Pharmacy Head Office',
    'King Fahd Rd, Riyadh, Saudi Arabia',
    'Tel: +966 55 123 4561',
    'Email: support@primepharmacy.com'
  ];
  let contactY = currentY + 5;
  contactLines.forEach(line => {
    doc.text(line, 555.28 - doc.getTextWidth(line), contactY);
    contactY += 11;
  });

  currentY += 45;

  // Horizontal divider
  setDraw(BG_LIGHT);
  doc.setLineWidth(1);
  doc.line(startX, currentY, 555.28, currentY);
  currentY += 25;

  // ==========================================
  // 2. INVOICE INFO & CUSTOMER BILL TO
  // ==========================================
  const infoColX = 330;

  // Bill To (Left Column)
  setText(TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BILL TO:', startX, currentY);

  setText(TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(order.customerName, startX, currentY + 16);

  setText(TEXT_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const addrLines = doc.splitTextToSize(order.shippingAddress || 'No shipping address provided', 240);
  let addrY = currentY + 28;
  addrLines.forEach((line: string) => {
    doc.text(line, startX, addrY);
    addrY += 12;
  });

  // Invoice Details (Right Column)
  setText(TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('INVOICE DETAILS:', infoColX, currentY);

  const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : new Date().toLocaleDateString();

  const details = [
    { label: 'Invoice No:', val: order.id.toUpperCase() },
    { label: 'Date Issued:', val: formattedDate },
    { label: 'Payment Method:', val: order.paymentMethod },
    { label: 'Payment Status:', val: order.paymentStatus.toUpperCase() }
  ];

  let detailsY = currentY + 16;
  details.forEach(item => {
    doc.setFont('helvetica', 'bold');
    setText(TEXT_DARK);
    doc.text(item.label, infoColX, detailsY);
    
    doc.setFont('helvetica', 'normal');
    setText(TEXT_MUTED);
    doc.text(item.val, infoColX + 95, detailsY);
    
    detailsY += 14;
  });

  // Adjust Y pointer based on height of sections
  currentY = Math.max(addrY, detailsY) + 30;

  // ==========================================
  // 3. TABLE OF MEDICINES (ITEMS)
  // ==========================================
  // Table Header Background
  setFill(PRIMARY_COLOR);
  doc.rect(startX, currentY, 515.28, 22, 'F');

  // Table Header Labels
  setText(WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Item Description', startX + 10, currentY + 14);
  doc.text('Price (PKR)', startX + 260, currentY + 14, { align: 'right' });
  doc.text('Qty', startX + 340, currentY + 14, { align: 'center' });
  doc.text('Total (PKR)', startX + 490, currentY + 14, { align: 'right' });

  currentY += 22;

  // Table Body Rows
  doc.setFont('helvetica', 'normal');
  setText(TEXT_DARK);

  order.items.forEach((item, idx) => {
    // Alternating row colors
    if (idx % 2 === 1) {
      setFill(BG_LIGHT);
      doc.rect(startX, currentY, 515.28, 22, 'F');
    }

    doc.text(item.name, startX + 10, currentY + 14);
    doc.text(item.priceAtOrder.toFixed(2), startX + 260, currentY + 14, { align: 'right' });
    doc.text(item.quantity.toString(), startX + 340, currentY + 14, { align: 'center' });
    
    const rowTotal = item.priceAtOrder * item.quantity;
    doc.text(rowTotal.toFixed(2), startX + 490, currentY + 14, { align: 'right' });

    currentY += 22;
  });

  currentY += 15;

  // Divider line after table
  setDraw(BG_LIGHT);
  doc.setLineWidth(1);
  doc.line(startX, currentY, 555.28, currentY);
  currentY += 15;

  // ==========================================
  // 4. TOTALS & VAT SECTION
  // ==========================================
  const totalLabelX = 350;
  const totalValueX = 490;

  const totalsData = [
    { label: 'Subtotal:', val: order.totalAmount.toFixed(2) },
    { label: 'VAT (15%):', val: order.vatAmount.toFixed(2) },
    { label: 'Grand Total:', val: `${order.grandTotal.toFixed(2)} PKR`, isGrand: true }
  ];

  totalsData.forEach(item => {
    if (item.isGrand) {
      // Highlight background for grand total
      setFill(BG_LIGHT);
      doc.rect(totalLabelX - 10, currentY - 2, 215.28, 22, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      setText(PRIMARY_COLOR);
      doc.text(item.label, totalLabelX, currentY + 13);
      doc.text(item.val, totalValueX, currentY + 13, { align: 'right' });
      currentY += 25;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      setText(TEXT_MUTED);
      doc.text(item.label, totalLabelX, currentY + 11);
      
      setText(TEXT_DARK);
      doc.text(item.val, totalValueX, currentY + 11, { align: 'right' });
      currentY += 16;
    }
  });

  currentY += 40;

  // ==========================================
  // 5. FOOTER & POLITE CLOSING
  // ==========================================
  // Bottom accent block
  setFill(BG_LIGHT);
  doc.rect(startX, currentY, 515.28, 65, 'F');

  setText(TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Important Notices & Return Policy:', startX + 15, currentY + 15);

  setText(TEXT_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const policyLines = [
    '1. Prescribed medications are not eligible for return or exchange under Saudi SFDA laws.',
    '2. For OTC items, returns are accepted within 7 days of invoice issue with original sealed packaging.',
    '3. For urgent enquiries or complaints, contact Prime Pharmacy customer support at 9200-PRIME.'
  ];
  let policyY = currentY + 27;
  policyLines.forEach(line => {
    doc.text(line, startX + 15, policyY);
    policyY += 10;
  });

  // Stamp / Watermark "PAID" if order is paid
  if (order.paymentStatus === 'paid') {
    doc.saveGraphicsState();
    doc.setGState(doc.GState({ opacity: 0.15 }));
    doc.setFontSize(54);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(46, 125, 50); // Muted Green
    doc.text('PAID & APPROVED', 100, currentY - 50, { angle: 25 });
    doc.restoreGraphicsState();
  }

  // Page Numbers
  setText(TEXT_MUTED);
  doc.setFontSize(8);
  doc.text('Page 1 of 1', 555.28 - doc.getTextWidth('Page 1 of 1'), 815);

  return doc;
}
export { jsPDF };
