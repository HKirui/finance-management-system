"use server";

import {auth} from "@/auth"
import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { unstable_rethrow } from "next/navigation";

function parseDecimal(value: string, field: string) {
  const trimmed = value.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(`${field} must be a valid number with up to 2 decimal places.`);
  }

  return new Prisma.Decimal(trimmed);
}

function parseDate(value: string, field: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} is invalid.`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`${field} is invalid.`);
  }

  return date;
}


export type PaymentActionState = {
  error: string | null;
};


export async function createInvoice(formData: FormData) {

    const session = await auth();

  if (!session?.user?.email) {
    throw new Error("You must be logged in to create an invoice.");
  }

  const userEmail = session.user.email;

  // 1. Get invoice information
  const clientId = String(formData.get("clientId") ?? "").trim();

  const issueDate = parseDate(
    String(formData.get("issueDate") ?? ""),
    "Issue date"
  );

  const dueDateValue = String(formData.get("dueDate") ?? "");

  const dueDate = dueDateValue
    ? parseDate(dueDateValue, "Due date")
    : null;

  if (!clientId) {
    throw new Error("Please select a client.");
  }

  if (dueDate && dueDate < issueDate) {
    throw new Error("Due date cannot be earlier than issue date.");
  }

  // 2. Get all invoice items
  const descriptions = formData
    .getAll("itemDescription")
    .map((value) => String(value).trim());

  const quantities = formData.getAll("itemQuantity");
  const prices = formData.getAll("itemUnitPrice");

  if (
    descriptions.length === 0 ||
    descriptions.length !== quantities.length ||
    descriptions.length !== prices.length
  ) {
    throw new Error("Invoice items are incomplete.");
  }

  // 3. Validate items and calculate line totals
  const items = descriptions.map((description, index) => {
    if (!description) {
      throw new Error("Every invoice item needs a description.");
    }

    const quantity = parseDecimal(
      String(quantities[index]),
      "Quantity"
    );

    const unitPrice = parseDecimal(
      String(prices[index]),
      "Unit price"
    );

    if (quantity.lte(0)) {
      throw new Error("Quantity must be greater than zero.");
    }

    if (unitPrice.gt("9999999999999.99")) {
      throw new Error("Unit price is too large.");
    }

    const lineTotal = quantity
      .mul(unitPrice)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    if (lineTotal.gt("9999999999999.99")) {
      throw new Error("Line total is too large.");
    }

    return {
      description,
      quantity,
      unitPrice,
      lineTotal,
    };
  });

  // 4. Calculate the subtotal
  const subtotal = items.reduce(
    (sum, item) => sum.plus(item.lineTotal),
    new Prisma.Decimal(0)
  );

  // 5. Calculate tax
  const taxRate = parseDecimal(
    String(formData.get("taxRate") ?? "0"),
    "Tax rate"
  );

  if (taxRate.lt(0) || taxRate.gt(100)) {
    throw new Error("Tax rate must be between 0 and 100.");
  }

  const taxAmount = subtotal
    .mul(taxRate)
    .div(100)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  const total = subtotal.plus(taxAmount);

  if (total.gt("9999999999999.99")) {
    throw new Error("Invoice total is too large.");
  }

  // 6. Save the invoice and items together
  await prisma.$transaction(async (tx) => {
    const client = await tx.client.findFirst({
      where: {
        id: clientId,
        isActive: true,
        profile: {
          type: "BUSINESS",
          user: {
            email: userEmail,
          },
        },
      },
      select: {
        profileId: true,
      },
    });

    if (!client) {
      throw new Error("Active business client not found.");
    }

    // Determine the invoice year
  const year = issueDate.getUTCFullYear();

 // Allocate the next invoice number atomically
 const sequence = await tx.$queryRaw<
  { lastNumber: number }[]
 >`
  INSERT INTO "InvoiceSequence"
    ("id", "year", "lastNumber", "profileId")
  VALUES
    (${randomUUID()}, ${year}, 1, ${client.profileId})
  ON CONFLICT ("profileId", "year")
  DO UPDATE SET
    "lastNumber" = "InvoiceSequence"."lastNumber" + 1
  RETURNING "lastNumber"
 `;

 // Get the allocated sequence number
 const nextNumber = sequence[0].lastNumber;

// Generate the professional invoice reference
const invoiceNumber =
  `KLS-${year}-${String(nextNumber).padStart(4, "0")}`;

// Create the invoice
await tx.invoice.create({
      data: {
        invoiceNumber,
        status: "DRAFT",
        issueDate,
        dueDate,
        subtotal,
        taxAmount,
        total,
        currency: "KES",
        clientId,
        profileId: client.profileId,

        items: {
          create: items,
        },
      },
    });
  });

  // 7. Refresh and return to the Invoice Directory
  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function recordInvoicePayment(formData: FormData) {
    const session = await auth();

  if (!session?.user?.email) {
    throw new Error("You must be logged in to record an invoice payment.");
  }

  const userEmail = session.user.email;

  // 1. Read payment information
  const invoiceId = String(formData.get("invoiceId") ?? "").trim();
  const accountId = String(formData.get("accountId") ?? "").trim();

  const idempotencyKey = String(
  formData.get("idempotencyKey") ?? ""
    ).trim();

   if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
  throw new Error("Invalid payment request. Refresh the page and try again.");
   }

  const amountValue = String(formData.get("amount") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!invoiceId || !accountId) {
    throw new Error("Invoice and receiving account are required.");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(amountValue)) {
    throw new Error("Enter a valid payment amount.");
  }

  const amount = new Prisma.Decimal(amountValue);

  if (amount.lte(0)) {
    throw new Error("Payment must be greater than zero.");
  }

  // 2. Save all financial records in one transaction
  await runPaymentWithRetry(() =>
  prisma.$transaction(
    async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: {
          id: invoiceId,
          profile: {
            type: "BUSINESS",
            user: {
              email: userEmail,
            },
          },
        },
        include: {
          payments: true,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found.");
      }

      // Check whether this payment request was already processed
const existingPayment = await tx.invoicePayment.findUnique({
  where: {
    idempotencyKey,
  },
});

if (existingPayment) {
  // Ensure the same key is not reused for different payment details
  if (
    existingPayment.invoiceId !== invoiceId ||
    existingPayment.accountId !== accountId ||
    !existingPayment.amount.eq(amount) ||
    existingPayment.reference !== (reference || null) ||
    existingPayment.notes !== (notes || null)
  ) {
    throw new Error(
      "This payment request ID was already used for different details."
    );
  }

  // Already recorded: do not create another payment
  return;
}

// Only issued invoices can receive payments.
      if (
        invoice.status !== "SENT" &&
        invoice.status !== "PARTIALLY_PAID"
      ) {
        throw new Error("This invoice is not available for payment.");
      }


      // 3. Verify the receiving account

const lockedAccounts = await tx.$queryRaw<
  Array<{ id: string }>
>`
  SELECT "id"
  FROM "Account"
  WHERE "id" = ${accountId}
  FOR UPDATE
`;

if (lockedAccounts.length !== 1) {
  throw new Error("Receiving account not found.");
}

      const account = await tx.account.findFirst({
        where: {
          id: accountId,
          profileId: invoice.profileId,
          isActive: true,
          type: {
            in: ["CASH", "MPESA", "BANK"],
          },
        },
      });

      if (!account) {
        throw new Error("Valid business receiving account not found.");
      }

      // 4. Calculate existing payments
      const totalPaid = invoice.payments
      .filter((payment) => !payment.isReversed)
      .reduce(
        (sum, payment) => sum.plus(payment.amount),
        new Prisma.Decimal(0)
      );

      const balanceDue = invoice.total.minus(totalPaid);

      if (amount.gt(balanceDue)) {
        throw new Error(
          `Payment exceeds the outstanding balance of KES ${balanceDue.toFixed(2)}.`
        );
      }

      // 5. Create the income transaction
      const transaction = await tx.transaction.create({
        data: {
          type: "INCOME",
          amount,
          description: `Payment for invoice ${invoice.invoiceNumber}`,
          profileId: invoice.profileId,
          accountId: account.id,
          date: new Date(),
        },
      });

      // 6. Record the invoice payment
      await tx.invoicePayment.create({
        data: {
          idempotencyKey,
          amount,
          date: transaction.date,
          method: account.type,
          reference: reference || null,
          notes: notes || null,
          invoiceId: invoice.id,
          accountId: account.id,
          transactionId: transaction.id,
        },
      });

      // 7. Update the invoice status
      const newBalance = balanceDue.minus(amount);

      await tx.invoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          status: newBalance.eq(0) ? "PAID" : "PARTIALLY_PAID",
        },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
   )
  );

  // 8. Refresh financial pages
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/");

  redirect(`/invoices/${invoiceId}`);
}

async function runPaymentWithRetry(
  operation: () => Promise<void>
) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await operation();
      return;
    } catch (error) {
      const isRetryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034";

      if (!isRetryable || attempt === maxAttempts) {
        throw error;
      }
    }
  }
}


export async function issueInvoice(formData: FormData) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("You must be logged in to issue an invoice.");
  }

  const invoiceId = String(
    formData.get("invoiceId") ?? ""
  ).trim();

  if (!invoiceId) {
    throw new Error("Invoice ID is required.");
  }

  // Only the owner can issue their own draft business invoice.
  const result = await prisma.invoice.updateMany({
    where: {
      id: invoiceId,
      status: "DRAFT",
      profile: {
        type: "BUSINESS",
        user: {
          email: session.user.email,
        },
      },
    },
    data: {
      status: "SENT",
    },
  });

  if (result.count !== 1) {
    throw new Error(
      "Draft invoice not found or you do not have permission to issue it."
    );
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
}


export async function recordInvoicePaymentWithState(
  _previousState: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  try {
    await recordInvoicePayment(formData);

    return { error: null };
  } catch (error) {
    // Preserve Next.js redirects and internal control-flow errors.
    unstable_rethrow(error);

    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to record payment. Please try again.",
    };
  }
}

export async function cancelInvoice(formData: FormData) {
    const session = await auth();

  if (!session?.user?.email) {
    throw new Error("You must be logged in to cancel an invoice.");
  }

  const userEmail = session.user.email;

  const invoiceId = String(formData.get("invoiceId") ?? "").trim();

  if (!invoiceId) {
    throw new Error("Invoice ID is required.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: {
        id: invoiceId,
        profile: {
          type: "BUSINESS",
          user: {
            email: userEmail,
          },
        },
      },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found.");
    }

    if (
      invoice.status !== "DRAFT" &&
      invoice.status !== "SENT"
    ) {
      throw new Error(
        "Only draft or unpaid issued invoices can be cancelled."
      );
    }

    if (invoice.payments.length > 0) {
      throw new Error(
        "Invoices with recorded payments cannot be cancelled."
      );
    }

    // Conditional update prevents cancellation if the status
    // changed before this operation completed.
    const updated = await tx.invoice.updateMany({
      where: {
        id: invoiceId,
        status: invoice.status,
        profile: {
          type: "BUSINESS",
          user: {
            email: userEmail,
          },
        },
        payments: {
          none: {},
        },
      },
      data: {
        status: "CANCELLED",
      },
    });

    if (updated.count !== 1) {
      throw new Error(
        "Invoice changed during cancellation. Please refresh."
      );
    }

    return updated;
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });

  if (result.count !== 1) {
    throw new Error("Invoice cancellation failed.");
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/");

  redirect(`/invoices/${invoiceId}`);
}


export type ReversalActionState = {
  error: string | null;
};

export async function reverseInvoicePaymentWithState(
  _previousState: ReversalActionState,
  formData: FormData
): Promise<ReversalActionState> {
  try {
    await reverseInvoicePayment(formData);

    return { error: null };
  } catch (error) {
    // Preserve Next.js redirects and internal control-flow errors.
    unstable_rethrow(error);

    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to reverse payment. Please try again.",
    };
  }
}

export async function reverseInvoicePayment(formData: FormData) {

    const session = await auth();

  if (!session?.user?.email) {
    throw new Error("You must be logged in to reverse an invoice payment.");
  }

  const userEmail = session.user.email;

  const paymentId = String(formData.get("paymentId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!paymentId) {
    throw new Error("Payment ID is required.");
  }

  if (reason.length < 10 || reason.length > 500) {
    throw new Error(
      "Reversal reason must contain between 10 and 500 characters."
    );
  }

  let invoiceId = "";

  await runPaymentWithRetry(async () => {
    await prisma.$transaction(
      async (tx) => {
        const payment = await tx.invoicePayment.findFirst({
          where: { id: paymentId,
          invoice:{
            profile:{
              type: "BUSINESS",
              user: {
                email: userEmail,
              },
            },
          },
        },
          include: {
            invoice: {
              include: {
                payments: true,
                profile: true,
              },
            },
            transaction: true,
          },
        });

        if (!payment || payment.invoice.profile.type !== "BUSINESS") {
          throw new Error("Business invoice payment not found.");
        }

        if (payment.isReversed || payment.reversalTransactionId) {
          throw new Error("This payment has already been reversed.");
        }

        if (
          payment.invoice.status === "DRAFT" ||
          payment.invoice.status === "CANCELLED"
        ) {
          throw new Error("This invoice cannot have payments reversed.");
        }

        if (
          payment.transaction.type !== "INCOME" ||
          payment.transaction.profileId !== payment.invoice.profileId ||
          payment.transaction.accountId !== payment.accountId ||
          !payment.transaction.amount.eq(payment.amount)
        ) {
          throw new Error("Original payment transaction is inconsistent.");
        }

// Lock the affected account before recording the reversal.
const lockedAccounts = await tx.$queryRaw<
  Array<{ id: string }>
>`
  SELECT "id"
  FROM "Account"
  WHERE "id" = ${payment.accountId}
  FOR UPDATE
`;

if (lockedAccounts.length !== 1) {
  throw new Error("Payment account not found.");
}

        const reversal = await tx.transaction.create({
          data: {
            type: "EXPENSE",
            amount: payment.amount,
            description: `Reversal of invoice payment ${payment.invoice.invoiceNumber}`,
            date: new Date(),
            profileId: payment.invoice.profileId,
            accountId: payment.accountId,
          },
        });

        const reversalUpdate = await tx.invoicePayment.updateMany({
  where: {
    id: payment.id,
    isReversed: false,
    reversalTransactionId: null,
  },
  data: {
    isReversed: true,
    reversedAt: new Date(),
    reversalReason: reason,
    reversalTransactionId: reversal.id,
  },
});

if (reversalUpdate.count !== 1) {
  throw new Error("This payment has already been reversed.");
}

        const activePaid = payment.invoice.payments
          .filter((item) => !item.isReversed && item.id !== payment.id)
          .reduce(
            (sum, item) => sum.plus(item.amount),
            new Prisma.Decimal(0)
          );

        const newStatus = activePaid.eq(0)
          ? "SENT"
          : activePaid.gte(payment.invoice.total)
            ? "PAID"
            : "PARTIALLY_PAID";

        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: { status: newStatus },
        });

        invoiceId = payment.invoiceId;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/");

  redirect(`/invoices/${invoiceId}`);
}


export async function updateInvoice(formData: FormData) {

  const session = await auth();
  if (!session?.user?.email){
    throw new Error("You must be logged in to update an invoice")
  }

  const userEmail = session.user.email;
  const invoiceId = String(formData.get("invoiceId") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "").trim();

  if (!invoiceId || !clientId) {
    throw new Error("Invoice and client are required.");
  }

  const issueDate = parseDate(
    String(formData.get("issueDate") ?? ""),
    "Issue date"
  );

  const dueDateValue = String(formData.get("dueDate") ?? "");
  const dueDate = dueDateValue
    ? parseDate(dueDateValue, "Due date")
    : null;

  if (dueDate && dueDate < issueDate) {
    throw new Error("Due date cannot be earlier than issue date.");
  }

  const descriptions = formData
    .getAll("itemDescription")
    .map((value) => String(value).trim());

  const quantities = formData.getAll("itemQuantity");
  const prices = formData.getAll("itemUnitPrice");

  if (
    descriptions.length === 0 ||
    descriptions.length !== quantities.length ||
    descriptions.length !== prices.length
  ) {
    throw new Error("Invoice items are incomplete.");
  }

  const items = descriptions.map((description, index) => {
    if (!description) {
      throw new Error("Every invoice item needs a description.");
    }

    const quantity = parseDecimal(
      String(quantities[index]),
      "Quantity"
    );

    const unitPrice = parseDecimal(
      String(prices[index]),
      "Unit price"
    );

    if (quantity.lte(0)) {
      throw new Error("Quantity must be greater than zero.");
    }

    if (unitPrice.gt("9999999999999.99")) {
      throw new Error("Unit price is too large.");
    }

    const lineTotal = quantity
      .mul(unitPrice)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    if (lineTotal.gt("9999999999999.99")) {
      throw new Error("Line total is too large.");
    }

    return {
      description,
      quantity,
      unitPrice,
      lineTotal,
    };
  });

  const subtotal = items.reduce(
    (sum, item) => sum.plus(item.lineTotal),
    new Prisma.Decimal(0)
  );

  const taxRate = parseDecimal(
    String(formData.get("taxRate") ?? "0"),
    "Tax rate"
  );

  if (taxRate.lt(0) || taxRate.gt(100)) {
    throw new Error("Tax rate must be between 0 and 100.");
  }

  const taxAmount = subtotal
    .mul(taxRate)
    .div(100)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  const total = subtotal.plus(taxAmount);

  if (total.gt("9999999999999.99")) {
    throw new Error("Invoice total is too large.");
  }

  await prisma.$transaction(async (tx) => {
    // Lock the invoice row while checking its status.
    // This prevents concurrent edits or issuing from
    // changing the invoice during this update.
    const lockedInvoices = await tx.$queryRaw<
      { id: string; clientId: string; profileId: string }[]
    >`
      SELECT i."id", i."clientId", i."profileId"
      FROM "Invoice" i
      JOIN "FinancialProfile" p
        ON p."id" = i."profileId"
        JOIN "User" u
         ON u."id" = p."userId"
      WHERE i."id" = ${invoiceId}
        AND i."status" = 'DRAFT'
        AND p."type" = 'BUSINESS'
        AND u."email" = ${userEmail}
      FOR UPDATE OF i
    `;

    const invoice = lockedInvoices[0];

    if (!invoice) {
      throw new Error("Only draft business invoices can be edited.");
    }

    const client = await tx.client.findFirst({
      where: {
        id: clientId,
        profileId: invoice.profileId,
        OR: [
          { isActive: true },
          { id: invoice.clientId },
        ],
      },
    });

    if (!client) {
      throw new Error("Invalid business client.");
    }

    await tx.invoiceItem.deleteMany({
      where: {
        invoiceId,
      },
    });

    await tx.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        clientId,
        issueDate,
        dueDate,
        subtotal,
        taxAmount,
        total,
        items: {
          create: items,
        },
      },
    });
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/invoices/${invoiceId}/edit`);

  redirect(`/invoices/${invoiceId}`);
}
