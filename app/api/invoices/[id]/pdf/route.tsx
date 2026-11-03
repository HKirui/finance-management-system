import {auth} from "@/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import InvoicePDF from "@/components/invoices/InvoicePDF";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function formatMoney(amount: Prisma.Decimal): string {
  return `KES ${Number(amount.toFixed(2)).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date: Date | null): string | null {
  return date ? date.toLocaleDateString("en-KE") : null;
}

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
    const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userEmail = session.user.email;
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      profile: {
        type: "BUSINESS",
        user: {
          email: userEmail,
        },
      },
    },
    include: {
      client: true,
      items: true,
      payments: true,
    },
  });

  if (!invoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }

  const totalPaid = invoice.payments
    .filter((payment) => !payment.isReversed)
    .reduce(
      (sum, payment) => sum.plus(payment.amount),
      new Prisma.Decimal(0)
    );

  const balanceDue = invoice.total.minus(totalPaid);

  const pdf = await renderToBuffer(
    <InvoicePDF
      invoiceNumber={invoice.invoiceNumber}
      status={invoice.status}
      clientName={invoice.client.name}
      clientCompany={invoice.client.company}
      issueDate={formatDate(invoice.issueDate) ?? ""}
      dueDate={formatDate(invoice.dueDate)}
      items={invoice.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: formatMoney(item.unitPrice),
        lineTotal: formatMoney(item.lineTotal),
      }))}
      subtotal={formatMoney(invoice.subtotal)}
      taxAmount={formatMoney(invoice.taxAmount)}
      total={formatMoney(invoice.total)}
      totalPaid={formatMoney(totalPaid)}
      balanceDue={formatMoney(balanceDue)}
    />
  );

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
