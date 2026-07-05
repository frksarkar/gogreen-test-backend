import PDFDocument from "pdfkit";

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface CompanyInfo {
  name: string;
  address: string;
  city: string; // e.g. "Hollywood, CA 45678"
  phone: string;
  email: string;
}

export interface OrderMeta {
  orderNumber: string | number;
  customerNumber: string | number;
  date: string; // e.g. "3/1/2017"
}

export interface LineItem {
  itemNumber: string;
  description: string;
  price: number; // unit price in dollars
  quantity: number;
}

export interface OrderInvoicePayload {
  company: CompanyInfo;
  recipient: CompanyInfo; // "bill-to" address shown top-left
  order: OrderMeta;
  items: LineItem[];
  tax: number; // e.g. 0.0725 for 7.25%
  shippingFee: number; // e.g. 10.00
  subtotal: number;
  total: number;
}

// ─── Generator ─────────────────────────────────────────────────────────────────

export function generateOrderConfirmation(
  payload: OrderInvoicePayload,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const {
      company,
      recipient,
      order,
      items,
      tax,
      shippingFee,
      subtotal,
      total,
    } = payload;

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // ── Collect chunks in memory ───────────────────────────────────────────
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PAGE_WIDTH = doc.page.width;
    const LEFT = 50;
    const RIGHT = PAGE_WIDTH - 50;

    // ── Company name (bold, top-left) ──────────────────────────────────────
    doc.font("Helvetica-Bold").fontSize(16).text(company.name, LEFT, 50);

    // ── Recipient address (top-left, underlined) ───────────────────────────
    doc
      .font("Helvetica")
      .fontSize(9)
      .text(`${recipient.name} - ${recipient.address}`, LEFT, 90, {
        underline: true,
      })
      .text(recipient.city, LEFT, 103, { underline: true });

    // ── Company address block (top-right) ──────────────────────────────────
    const rightBlock = [
      company.name,
      company.address,
      company.city,
      "",
      `Phone ${company.phone}`,
      "",
      `E-Mail: ${company.email}`,
    ];
    let ry = 50;
    rightBlock.forEach((line) => {
      doc
        .font(line === company.name ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9)
        .text(line, LEFT, ry, { align: "right", width: RIGHT - LEFT });
      ry += line === "" ? 6 : 13;
    });

    // ── Section heading ────────────────────────────────────────────────────
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("Order confirmation", LEFT, 165);

    // ── FIX 1: Improved spacing for Order #, Customer #, Date ─────────────
    const metaY = 215;
    doc.font("Helvetica-Bold").fontSize(9).text("Order #:", LEFT, metaY);
    doc.font("Helvetica").text(String(order.orderNumber), LEFT + 52, metaY);
    doc.font("Helvetica-Bold").text("Customer #:", 240, metaY);
    doc.font("Helvetica").text(String(order.customerNumber), 310, metaY);
    doc.font("Helvetica-Bold").text("Date:", 450, metaY);
    doc.font("Helvetica").text(order.date, 478, metaY);

    // ── Salutation ─────────────────────────────────────────────────────────
    doc
      .font("Helvetica")
      .fontSize(9)
      .text("Dear valued customer,", LEFT, 245)
      .moveDown(0.5)
      .text(
        "Thank you for your order! This is confirmation that we have received your order as shown below:",
        { width: RIGHT - LEFT },
      );

    // ── FIX 2: Wider item # column to handle long UUIDs ───────────────────
    // ── Table columns ──────────────────────────────────────────────────────────
    const tableTop = 290;
    const colX = {
      item: LEFT, // 50  — item # col starts here
      desc: LEFT + 155, // 205 — widened so item text (width 145) doesn't bleed in
      price: LEFT + 330, // 380
      qty: LEFT + 400, // 450
      total: LEFT + 455, // 505 — pulled back so width 80 fits within RIGHT (545)
    };

    // Header row
    doc.rect(LEFT, tableTop, RIGHT - LEFT, 18).stroke();
    doc.font("Helvetica-Bold").fontSize(9);
    doc.text("Item #", colX.item + 4, tableTop + 4, { width: 145 }); // matches gap to desc
    doc.text("Description", colX.desc + 4, tableTop + 4, { width: 120 }); // fits between desc→price
    doc.text("Price", colX.price + 4, tableTop + 4, { width: 65 });
    doc.text("Quantity", colX.qty + 4, tableTop + 4, { width: 50 });
    doc.text("Total", colX.total + 4, tableTop + 4, { width: 36 }); // RIGHT(545) - 505 - 4 = 36

    [colX.desc, colX.price, colX.qty, colX.total].forEach((x) => {
      doc
        .moveTo(x, tableTop)
        .lineTo(x, tableTop + 18)
        .stroke();
    });

    // Data rows
    let rowY = tableTop + 18;
    const ROW_H = 28;
    doc.font("Helvetica").fontSize(8);

    for (const item of items) {
      const lineTotal = item.price * item.quantity;

      doc.rect(LEFT, rowY, RIGHT - LEFT, ROW_H).stroke();
      [colX.desc, colX.price, colX.qty, colX.total].forEach((x) => {
        doc
          .moveTo(x, rowY)
          .lineTo(x, rowY + ROW_H)
          .stroke();
      });

      doc.text(item.itemNumber, colX.item + 4, rowY + 4, {
        width: 145,
        lineBreak: true,
      });
      doc.text(item.description, colX.desc + 4, rowY + 4, {
        width: 120,
        lineBreak: true,
      });
      doc.text(`TK ${item.price.toFixed(2)}`, colX.price + 4, rowY + 4, {
        width: 65,
      });
      doc.text(String(item.quantity), colX.qty + 4, rowY + 4, { width: 50 }); // was 20 — too narrow
      doc.text(`TK ${lineTotal.toFixed(2)}`, colX.total + 4, rowY + 4, {
        width: 36,
      }); // was 155 — off page

      rowY += ROW_H;
    }

    // ── Totals block ─────────────────────────────────────────────────────────────
    const summaryLeft = 370;
    let sy = rowY + 20;

    doc.font("Helvetica").fontSize(9);
    doc.text("Subtotal", summaryLeft, sy);
    doc.text(`TK ${subtotal.toFixed(2)}`, 0, sy, {
      align: "right",
      width: RIGHT,
    });
    sy += 16; // ✓ already correct

    doc.font("Helvetica-Bold").fontSize(9);
    doc.text(`Sales tax`, summaryLeft, sy);
    doc.text(`TK ${tax.toFixed(2)}`, 0, sy, {
      align: "right",
      width: RIGHT,
    });
    sy += 16; // was 4 — too cramped

    doc.text("Shipping fee", summaryLeft, sy);
    doc.text(`TK ${shippingFee.toFixed(2)}`, 0, sy, {
      align: "right",
      width: RIGHT,
    });
    sy += 20; // was 4 — too cramped

    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("Total", summaryLeft, sy);
    doc.text(`TK ${total.toFixed(2)}`, 0, sy, { align: "right", width: RIGHT });

    // ── Contact footer ─────────────────────────────────────────────────────
    sy += 40;
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .text(
        `Questions about your order? Don't hesitate to contact us at ${company.email}, or call us at ${company.phone}.`,
        LEFT,
        sy,
        { width: RIGHT - LEFT },
      );

    // ── Footer address block ───────────────────────────────────────────────
    const footerY = doc.page.height - 160;
    [
      company.name,
      company.address,
      company.city,
      company.phone,
      company.email,
    ].forEach((line, i) => {
      doc
        .font(i === 0 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(8)
        .text(line, LEFT, footerY + i * 13);
    });

    // ── Disclaimer ─────────────────────────────────────────────────────────
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .text(
        "NOTE: This is not an invoice. The prices and products contained in this order confirmation are for reference only and are subject to change.",
        LEFT,
        doc.page.height - 60,
        { width: RIGHT - LEFT },
      );

    doc.end();
  });
}
