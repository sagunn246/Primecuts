import { getOrderDeliverySlot, getCleanOrderNotes } from "./orderUtils";

/**
 * Strips emojis and non-printable symbols so 80mm thermal printers
 * never print garbled characters or black boxes.
 */
function stripEmojis(text: string): string {
  return text
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{FE00}-\u{FE0F}\u{200D}]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Escapes HTML special characters to prevent broken markup from "&", "<", ">", etc.
 */
function escapeHtml(raw: unknown): string {
  const str = stripEmojis(String(raw ?? ""));
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Formats numbers as standard currency string (e.g. "1,450.00")
 */
function formatMoney(amount: unknown): string {
  const num = Number(amount);
  if (!Number.isFinite(num)) return "0.00";
  return num.toFixed(2);
}

/**
 * Formats date and time cleanly for 80mm receipt header
 */
function formatReceiptDate(dateInput: unknown): string {
  if (!dateInput) return "N/A";
  const d = new Date(String(dateInput));
  if (isNaN(d.getTime())) return escapeHtml(dateInput);

  const day = String(d.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hourStr = String(hours).padStart(2, "0");

  return `${day} ${month} ${year}, ${hourStr}:${minutes} ${ampm}`;
}

/**
 * Formats item weight/variant specification and rate for thermal slip
 */
function getItemSpecAndRate(item: any): { spec: string; rate: string } {
  const weightGrams = Number(item.selectedWeightInGrams || 0);
  const pricePerKg = Number(item.pricePerKgAtTimeOfOrder || 0);
  const unitPrice = Number(item.unitPriceAtTimeOfOrder || 0);
  const variantName = item.selectedVariantName ? escapeHtml(item.selectedVariantName) : "";

  if (weightGrams > 0) {
    const weightLabel =
      weightGrams >= 1000
        ? `${Number((weightGrams / 1000).toFixed(2))} kg`
        : `${weightGrams} g`;
    const rateLabel = pricePerKg > 0 ? `@ Rs. ${formatMoney(pricePerKg)}/kg` : "";
    return { spec: weightLabel, rate: rateLabel };
  }

  if (variantName) {
    const rateLabel = unitPrice > 0 ? `@ Rs. ${formatMoney(unitPrice)}` : "";
    return { spec: variantName, rate: rateLabel };
  }

  return { spec: "Standard", rate: "" };
}

/**
 * Prints an 80mm POS Thermal Receipt in-page via hidden iframe.
 * Designed strictly for 80mm thermal paper (72mm printable width),
 * pure high-contrast black ink (#000), zero emojis, and exact financial totals.
 */
export function printThermalReceipt(order: any) {
  if (typeof window === "undefined" || !document || !order) return;

  const existingFrame = document.getElementById("thermal-print-frame");
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "thermal-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const items: any[] = Array.isArray(order.items) ? order.items : [];

  let calculatedSubtotal = 0;
  let totalUnits = 0;

  const itemsRowsHtml = items
    .map((item: any, idx: number) => {
      const name = escapeHtml(item.productName || item.name || "Meat Cut");
      const qty = Math.max(1, Number(item.qty || 1));
      const lineAmount = Number(item.calculatedPrice ?? item.price ?? 0);
      calculatedSubtotal += lineAmount;
      totalUnits += qty;

      const { spec, rate } = getItemSpecAndRate(item);
      const subline = [spec, rate].filter(Boolean).join(" ");

      return `
        <tr class="item-row">
          <td class="col-sn">${idx + 1}.</td>
          <td class="col-item">
            <div class="item-name">${name}</div>
            ${subline ? `<div class="item-meta">${subline}</div>` : ""}
          </td>
          <td class="col-qty">${qty}</td>
          <td class="col-amt">${formatMoney(lineAmount)}</td>
        </tr>
      `;
    })
    .join("");

  const orderNumber = escapeHtml(order.orderNumber || order.order_number || "N/A");
  const createdAt = formatReceiptDate(order.createdAt || order.created_at);
  const customerName = escapeHtml(
    order.customerInfo?.name || order.customer_name || order.customerName || "Walk-in Customer"
  );
  const customerPhone = escapeHtml(
    order.customerInfo?.phone || order.customer_phone || order.customerPhone || "N/A"
  );
  const orderTypeRaw = String(order.orderType || order.order_type || "delivery").toLowerCase();
  const isDelivery = orderTypeRaw === "delivery";
  const orderTypeLabel = isDelivery ? "HOME DELIVERY" : "STORE PICKUP";
  const orderStatus = escapeHtml(String(order.status || "pending").toUpperCase());

  const address = escapeHtml(order.address || "");
  const deliverySlot = escapeHtml(getOrderDeliverySlot(order) || "");
  const cleanNotes = escapeHtml(getCleanOrderNotes(order) || "");

  const deliveryCharge = Number(order.deliveryCharge ?? order.delivery_charge ?? 0);
  const totalAmount = Number(order.totalAmount ?? order.total_amount ?? calculatedSubtotal + deliveryCharge);
  const subtotal =
    calculatedSubtotal > 0
      ? calculatedSubtotal
      : Math.max(0, totalAmount - (isDelivery ? deliveryCharge : 0));

  const rawPaymentMethod = String(order.paymentMethod || order.payment_method || "cod").toLowerCase();
  const paymentMethodLabel = rawPaymentMethod === "qr" ? "QR / ONLINE PAYMENT" : "CASH ON DELIVERY (COD)";
  const rawPaymentStatus = String(order.paymentStatus || order.payment_status || "pending").toLowerCase();
  const isPaid = rawPaymentStatus === "paid";
  const paymentStatusLabel = isPaid ? "PAID" : "PENDING";
  const transactionId = escapeHtml(order.transactionId || order.transaction_id || "");

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) return;

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt #${orderNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      color: #000000 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      width: 72mm;
      max-width: 72mm;
      margin: 0 auto;
      padding: 2mm 1mm 4mm 1mm;
      background: #ffffff;
      font-family: 'Courier New', Courier, 'Lucida Console', monospace;
      font-size: 11px;
      line-height: 1.3;
    }
    .header {
      text-align: center;
      padding-bottom: 5px;
      border-bottom: 2px solid #000;
    }
    .store-name {
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .store-subtitle {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-top: 1px;
    }
    .store-contact {
      font-size: 9.5px;
      font-weight: 600;
      margin-top: 2px;
    }
    .bill-badge {
      display: inline-block;
      margin-top: 4px;
      padding: 1px 8px;
      border: 1px solid #000;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .section {
      padding: 5px 0;
      border-bottom: 1px dashed #000;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    .meta-table td {
      padding: 1.5px 0;
      vertical-align: top;
    }
    .meta-label {
      font-weight: 700;
      width: 34%;
      white-space: nowrap;
      padding-right: 4px;
    }
    .meta-val {
      font-weight: 600;
      word-break: break-word;
    }
    .meta-val-strong {
      font-weight: 900;
      font-size: 11.5px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 2px;
    }
    .items-table thead tr {
      border-bottom: 1px solid #000;
    }
    .items-table th {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 3px 0;
    }
    .item-row td {
      padding: 4px 0;
      vertical-align: top;
      border-bottom: 1px dotted #000;
    }
    .item-row:last-child td {
      border-bottom: none;
    }
    .col-sn {
      width: 7%;
      text-align: left;
      font-weight: 700;
      font-size: 10.5px;
      padding-right: 2px;
    }
    .col-item {
      width: 57%;
      text-align: left;
      padding-right: 4px;
    }
    .col-qty {
      width: 12%;
      text-align: center;
      font-weight: 700;
      font-size: 10.5px;
    }
    .col-amt {
      width: 24%;
      text-align: right;
      font-weight: 700;
      font-size: 10.5px;
      white-space: nowrap;
    }
    .item-name {
      font-weight: 800;
      font-size: 11px;
      line-height: 1.2;
      word-break: break-word;
    }
    .item-meta {
      font-size: 9.5px;
      font-weight: 600;
      margin-top: 1px;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    .totals-table td {
      padding: 2px 0;
    }
    .totals-label {
      text-align: left;
      font-weight: 700;
    }
    .totals-val {
      text-align: right;
      font-weight: 700;
      white-space: nowrap;
    }
    .grand-total-row td {
      padding: 5px 0;
      border-top: 1.5px solid #000;
      border-bottom: 1.5px solid #000;
      font-size: 13px;
      font-weight: 900;
    }
    .settlement-box {
      margin-top: 5px;
      padding: 4px;
      border: 1.5px solid #000;
      text-align: center;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .footer {
      text-align: center;
      padding-top: 6px;
      font-size: 9.5px;
      font-weight: 600;
      line-height: 1.35;
    }
    .footer-bold {
      font-weight: 800;
      font-size: 10px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <!-- STORE HEADER -->
  <div class="header">
    <div class="store-name">PRIME CUTS</div>
    <div class="store-subtitle">Artisanal Butcher House</div>
    <div class="store-contact">Khudi Chowk, Pokhara-30, Nepal</div>
    <div class="store-contact">Tel: +977 9714324919 / 9747470470</div>
    <div class="bill-badge">ORDER RECEIPT</div>
  </div>

  <!-- ORDER METADATA -->
  <div class="section">
    <table class="meta-table">
      <tr>
        <td class="meta-label">Order No:</td>
        <td class="meta-val meta-val-strong">#${orderNumber}</td>
      </tr>
      <tr>
        <td class="meta-label">Date:</td>
        <td class="meta-val">${createdAt}</td>
      </tr>
      <tr>
        <td class="meta-label">Order Type:</td>
        <td class="meta-val"><strong>${orderTypeLabel}</strong> (${orderStatus})</td>
      </tr>
      ${
        deliverySlot
          ? `<tr>
              <td class="meta-label">Time Slot:</td>
              <td class="meta-val"><strong>${deliverySlot}</strong></td>
            </tr>`
          : ""
      }
    </table>
  </div>

  <!-- CUSTOMER & FULFILLMENT DETAILS -->
  <div class="section">
    <table class="meta-table">
      <tr>
        <td class="meta-label">Customer:</td>
        <td class="meta-val"><strong>${customerName}</strong></td>
      </tr>
      <tr>
        <td class="meta-label">Phone:</td>
        <td class="meta-val"><strong>${customerPhone}</strong></td>
      </tr>
      ${
        isDelivery && address
          ? `<tr>
              <td class="meta-label">Address:</td>
              <td class="meta-val">${address}</td>
            </tr>`
          : ""
      }
      ${
        cleanNotes
          ? `<tr>
              <td class="meta-label">Notes:</td>
              <td class="meta-val">${cleanNotes}</td>
            </tr>`
          : ""
      }
    </table>
  </div>

  <!-- LINE ITEMS -->
  <div class="section">
    <table class="items-table">
      <thead>
        <tr>
          <th class="col-sn">SN</th>
          <th class="col-item">ITEM DESCRIPTION</th>
          <th class="col-qty">QTY</th>
          <th class="col-amt">AMT (Rs)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- SUMMARY & TOTALS -->
  <div class="section">
    <table class="totals-table">
      <tr>
        <td class="totals-label">Items / Units:</td>
        <td class="totals-val">${items.length} / ${totalUnits}</td>
      </tr>
      <tr>
        <td class="totals-label">Subtotal:</td>
        <td class="totals-val">Rs. ${formatMoney(subtotal)}</td>
      </tr>
      ${
        isDelivery
          ? `<tr>
              <td class="totals-label">Delivery Charge:</td>
              <td class="totals-val">${
                deliveryCharge > 0 ? `Rs. ${formatMoney(deliveryCharge)}` : "FREE (0.00)"
              }</td>
            </tr>`
          : ""
      }
      <tr class="grand-total-row">
        <td class="totals-label">GRAND TOTAL:</td>
        <td class="totals-val">Rs. ${formatMoney(totalAmount)}</td>
      </tr>
    </table>
  </div>

  <!-- PAYMENT & SETTLEMENT -->
  <div class="section">
    <table class="meta-table">
      <tr>
        <td class="meta-label">Payment:</td>
        <td class="meta-val">${paymentMethodLabel}</td>
      </tr>
      <tr>
        <td class="meta-label">Status:</td>
        <td class="meta-val"><strong>${paymentStatusLabel}</strong></td>
      </tr>
      ${
        transactionId
          ? `<tr>
              <td class="meta-label">Txn Ref:</td>
              <td class="meta-val">${transactionId}</td>
            </tr>`
          : ""
      }
    </table>
    <div class="settlement-box">
      ${
        isPaid
          ? "PAID IN FULL - DO NOT COLLECT CASH"
          : `AMOUNT TO COLLECT: Rs. ${formatMoney(totalAmount)}`
      }
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-bold">Thank you for your order!</div>
    <div>Fresh, Hygienic &amp; Quality Meat Daily</div>
    <div>primecuts.rjflowers.com</div>
  </div>
</body>
</html>`);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error("Thermal print error:", err);
    }
  }, 250);
}
