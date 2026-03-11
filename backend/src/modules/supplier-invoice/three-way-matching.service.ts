import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface ThreeWayMatchResult {
  match_status: 'matched' | 'discrepancy' | 'pending';
  quantity_match: boolean;
  price_match: boolean;
  total_match: boolean;
  po_total: number;
  grn_total: number;
  invoice_total: number;
  discrepancies: string[];
}

@Injectable()
export class ThreeWayMatchingService {
  private readonly logger = new Logger(ThreeWayMatchingService.name);
  private readonly DEFAULT_TOLERANCE_PCT = 5; // 5% tolerance

  constructor(private prisma: PrismaService) {}

  /**
   * Perform 3-way matching between PO, GRN, and Invoice
   */
  async performMatch(
    companyId: string,
    invoiceId: string,
    tolerancePct?: number,
  ): Promise<ThreeWayMatchResult> {
    const tolerance = tolerancePct || this.DEFAULT_TOLERANCE_PCT;

    // Get invoice with lines
    const invoice = await this.prisma.supplier_invoices.findUnique({
      where: { id: invoiceId },
      include: {
        invoice_lines: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (!invoice.po_id || !invoice.grn_id) {
      return {
        match_status: 'pending',
        quantity_match: false,
        price_match: false,
        total_match: false,
        po_total: 0,
        grn_total: 0,
        invoice_total: Number(invoice.total),
        discrepancies: ['Missing PO or GRN reference'],
      };
    }

    // Get PO with lines
    const po = await this.prisma.purchase_orders.findUnique({
      where: { id: invoice.po_id },
      include: {
        po_lines: true,
      },
    });

    // Get GRN with lines
    const grn = await this.prisma.goods_receipts.findUnique({
      where: { id: invoice.grn_id },
      include: {
        grn_lines: true,
      },
    });

    if (!po || !grn) {
      return {
        match_status: 'discrepancy',
        quantity_match: false,
        price_match: false,
        total_match: false,
        po_total: Number(po?.total || 0),
        grn_total: 0,
        invoice_total: Number(invoice.total),
        discrepancies: ['PO or GRN not found'],
      };
    }

    const discrepancies: string[] = [];

    // 1. CHECK QUANTITY MATCHING (Invoice vs GRN)
    const quantityMatch = this.checkQuantityMatch(
      invoice.invoice_lines,
      grn.grn_lines,
      discrepancies,
    );

    // 2. CHECK PRICE MATCHING (Invoice vs PO)
    const priceMatch = this.checkPriceMatch(
      invoice.invoice_lines,
      po.po_lines,
      tolerance,
      discrepancies,
    );

    // 3. CHECK TOTAL MATCHING (Invoice total vs PO total)
    const poTotal = Number(po.total);
    const grnTotal = this.calculateGRNTotal(grn.grn_lines, po.po_lines);
    const invoiceTotal = Number(invoice.total);

    const totalMatch = this.checkTotalMatch(
      invoiceTotal,
      poTotal,
      grnTotal,
      tolerance,
      discrepancies,
    );

    // Determine overall match status
    const match_status =
      quantityMatch && priceMatch && totalMatch
        ? 'matched'
        : 'discrepancy';

    return {
      match_status,
      quantity_match: quantityMatch,
      price_match: priceMatch,
      total_match: totalMatch,
      po_total: poTotal,
      grn_total: grnTotal,
      invoice_total: invoiceTotal,
      discrepancies,
    };
  }

  /**
   * Check if invoice quantities match GRN quantities
   */
  private checkQuantityMatch(
    invoiceLines: any[],
    grnLines: any[],
    discrepancies: string[],
  ): boolean {
    let allMatch = true;

    for (const invLine of invoiceLines) {
      const grnLine = grnLines.find(
        (gl) => gl.item_id === invLine.item_id || gl.id === invLine.grn_line_id,
      );

      if (!grnLine) {
        discrepancies.push(
          `Invoice line ${invLine.line_number}: No matching GRN line found`,
        );
        allMatch = false;
        continue;
      }

      const invQty = Number(invLine.quantity);
      const grnQty = Number(grnLine.received_qty);

      if (invQty !== grnQty) {
        discrepancies.push(
          `Invoice line ${invLine.line_number}: Quantity mismatch (Invoice: ${invQty}, GRN: ${grnQty})`,
        );
        allMatch = false;
      }
    }

    return allMatch;
  }

  /**
   * Check if invoice prices match PO prices (within tolerance)
   */
  private checkPriceMatch(
    invoiceLines: any[],
    poLines: any[],
    tolerance: number,
    discrepancies: string[],
  ): boolean {
    let allMatch = true;

    for (const invLine of invoiceLines) {
      const poLine = poLines.find(
        (pl) => pl.item_id === invLine.item_id || pl.id === invLine.po_line_id,
      );

      if (!poLine) {
        discrepancies.push(
          `Invoice line ${invLine.line_number}: No matching PO line found`,
        );
        allMatch = false;
        continue;
      }

      const invPrice = Number(invLine.unit_price);
      const poPrice = Number(poLine.unit_price);

      const priceDiff = Math.abs(invPrice - poPrice);
      const toleranceAmount = (poPrice * tolerance) / 100;

      if (priceDiff > toleranceAmount) {
        const diffPct = ((priceDiff / poPrice) * 100).toFixed(2);
        discrepancies.push(
          `Invoice line ${invLine.line_number}: Price difference ${diffPct}% exceeds tolerance (Invoice: ${invPrice}, PO: ${poPrice})`,
        );
        allMatch = false;
      }
    }

    return allMatch;
  }

  /**
   * Check if invoice total matches within tolerance
   */
  private checkTotalMatch(
    invoiceTotal: number,
    poTotal: number,
    grnTotal: number,
    tolerance: number,
    discrepancies: string[],
  ): boolean {
    const totalDiff = Math.abs(invoiceTotal - poTotal);
    const toleranceAmount = (poTotal * tolerance) / 100;

    if (totalDiff > toleranceAmount) {
      const diffPct = ((totalDiff / poTotal) * 100).toFixed(2);
      discrepancies.push(
        `Total amount difference ${diffPct}% exceeds tolerance (Invoice: ${invoiceTotal}, PO: ${poTotal})`,
      );
      return false;
    }

    return true;
  }

  /**
   * Calculate GRN total based on received quantities and PO prices
   */
  private calculateGRNTotal(grnLines: any[], poLines: any[]): number {
    let total = 0;

    for (const grnLine of grnLines) {
      const poLine = poLines.find((pl) => pl.item_id === grnLine.item_id);
      if (poLine) {
        const receivedQty = Number(grnLine.received_qty);
        const unitPrice = Number(poLine.unit_price);
        total += receivedQty * unitPrice;
      }
    }

    return total;
  }

  /**
   * Create or update 3-way match record
   */
  async saveMatchResult(
    companyId: string,
    invoiceId: string,
    matchedBy: string,
    result: ThreeWayMatchResult,
  ) {
    const invoice = await this.prisma.supplier_invoices.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (!invoice.po_id || !invoice.grn_id) {
      throw new Error('Invoice must have both PO and GRN references');
    }

    const matchData = {
      company_id: companyId,
      po_id: invoice.po_id,
      grn_id: invoice.grn_id,
      invoice_id: invoiceId,
      match_status: result.match_status,
      po_total: result.po_total,
      grn_total: result.grn_total,
      invoice_total: result.invoice_total,
      quantity_match: result.quantity_match,
      price_match: result.price_match,
      total_match: result.total_match,
      discrepancy_notes: result.discrepancies.join('; '),
      matched_by: matchedBy,
      matched_at: new Date(),
    };

    return this.prisma.three_way_matches.upsert({
      where: { invoice_id: invoiceId },
      update: matchData,
      create: matchData,
    });
  }

  /**
   * Get matching results for an invoice
   */
  async getMatchResult(invoiceId: string) {
    return this.prisma.three_way_matches.findUnique({
      where: { invoice_id: invoiceId },
      include: {
        purchase_orders: true,
        goods_receipts: true,
        supplier_invoices: true,
      },
    });
  }

  /**
   * Get all invoices with discrepancies
   */
  async getDiscrepancies(companyId: string) {
    return this.prisma.three_way_matches.findMany({
      where: {
        company_id: companyId,
        match_status: 'discrepancy',
      },
      include: {
        supplier_invoices: {
          include: {
            vendors: true,
          },
        },
        purchase_orders: true,
        goods_receipts: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }
}
