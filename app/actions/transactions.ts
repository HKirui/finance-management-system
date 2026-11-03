"use server";

import {auth} from "@/auth"
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";


function parseTransactionAmount(value: string): string | null {
  const trimmed = value.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }

  const [wholePart] = trimmed.split(".");
  const normalizedWholePart = wholePart.replace(/^0+/, "") || "0";

  if (normalizedWholePart.length > 13) {
    return null;
  }

  if (Number(trimmed) <= 0) {
    return null;
  }

  return trimmed;
}

function parseTransactionDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T12:00:00.000Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return parsed;
}

export type TransactionActionState = {
  success: boolean;
  message: string;
};

export async function createTransaction(
  _previousState: TransactionActionState,
  formData: FormData
): Promise<TransactionActionState> {
  try {
    const session = await auth();

if (!session?.user?.email) {
  return {
    success: false,
    message: "You must be logged in to create a transaction.",
  };
}
    const profileId = formData.get("profileId")?.toString();
    const type = formData.get("type")?.toString();
    const amount = formData.get("amount")?.toString();
    const accountId = formData.get("accountId")?.toString();
    const categoryId = formData.get("categoryId")?.toString();
    const date = formData.get("date")?.toString();
    const description = formData.get("description")?.toString();

    if (!profileId || !type || !amount || !accountId || !date) {
      return {
        success: false,
        message: "Please complete all required fields.",
      };
    }

    const profile = await prisma.financialProfile.findFirst({
  where: {
    id: profileId,
    user: {
      email: session.user.email,
    },
  },
});

if (!profile) {
  return {
    success: false,
    message: "Financial profile not found or access denied.",
  };
}

    if (type !== "INCOME" && type !== "EXPENSE") {
      return {
        success: false,
        message: "Invalid transaction type.",
      };
    }

    const validatedAmount = parseTransactionAmount(amount);
    if (!validatedAmount) {
      return {
        success: false,
        message: "Amount must be a valid positive number.",
      };
    }

    const validatedDate = parseTransactionDate(date);

if (!validatedDate) {
  return {
    success: false,
    message: "Enter a valid transaction date.",
  };
}

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        profileId,
        isActive: true,
      },
    });

    if (!account) {
      return {
        success: false,
        message: "Invalid account for the selected profile.",
      };
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          profileId,
          type,
        },
      });

      if (!category) {
        return {
          success: false,
          message: "Invalid category for this transaction.",
        };
      }
    }


await prisma.$transaction(async (tx) => {
  // Lock the account until this financial transaction is saved.
  const lockedAccounts = await tx.$queryRaw<
    Array<{ id: string }>
  >`
    SELECT "id"
    FROM "Account"
    WHERE "id" = ${accountId}
    FOR UPDATE
  `;

  if (lockedAccounts.length !== 1) {
    throw new Error("ACCOUNT_NOT_AVAILABLE");
  }

  // Revalidate the account after acquiring the lock.
  const lockedAccount = await tx.account.findFirst({
    where: {
      id: accountId,
      profileId,
      isActive: true,
      profile: {
        user: {
          email: session.user!.email!,
        },
      },
    },
  });

  if (!lockedAccount) {
    throw new Error("ACCOUNT_NOT_AVAILABLE");
  }

  await tx.transaction.create({
    data: {
      profileId,
      type,
      amount: validatedAmount,
      accountId,
      categoryId: categoryId || null,
      date: validatedDate,
      description: description?.trim() || null,
    },
  });
});


    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/transactions");

    return {
      success: true,
      message: "Transaction saved successfully.",
    };
  }  catch (error) {
  if (
    error instanceof Error &&
    error.message === "ACCOUNT_NOT_AVAILABLE"
  ) {
    return {
      success: false,
      message:
        "This account is no longer available. Refresh and try again.",
    };
  }

  console.error("Create transaction error:", error);

  return {
    success: false,
    message: "Something went wrong while saving the transaction.",
  };
}
}

//edit transaction//
export async function updateTransaction(
  _previousState: TransactionActionState,
  formData: FormData
): Promise<TransactionActionState> {
  try {
// 1. Verify authentication first
     const session = await auth();
if (!session?.user?.email) {
  return {
    success: false,
    message: "You must be logged in to update a transaction.",
  };
}

 // 2. Read submitted form data
    const transactionId = formData.get("transactionId")?.toString();
    const type = formData.get("type")?.toString();
    const amount = formData.get("amount")?.toString();
    const accountId = formData.get("accountId")?.toString();
    const categoryId = formData.get("categoryId")?.toString();
    const date = formData.get("date")?.toString();
    const description = formData.get("description")?.toString();

    if (!transactionId || !type || !amount || !accountId || !date) {
      return {
        success: false,
        message: "Please complete all required fields.",
      };
    }

    if (type !== "INCOME" && type !== "EXPENSE") {
      return {
        success: false,
        message: "Invalid transaction type.",
      };
    }

   const validatedAmount = parseTransactionAmount(amount);
    if (!validatedAmount) {
      return {
        success: false,
        message: "Amount must be greater than zero.",
      };
    }

    const validatedDate = parseTransactionDate(date);
if (!validatedDate) {
  return {
    success: false,
    message: "Enter a valid transaction date.",
  };
}


const existingTransaction = await prisma.transaction.findFirst({
  where: {
    id: transactionId,
    profile: {
      user: {
        email: session.user.email,
      },
    },
  },
  include: {
    InvoicePayment: true,
    reversedInvoicePayment: true,
  },
});

    if (!existingTransaction) {
      return {
        success: false,
        message: "Transaction not found.",
      };
    }

    if (
  existingTransaction.InvoicePayment ||
  existingTransaction.reversedInvoicePayment
) {
  return {
    success: false,
    message:
      "Invoice-linked transactions cannot be edited directly. Manage them through the invoice payment workflow.",
  };
}

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        profileId: existingTransaction.profileId,
        isActive: true,
      },
    });

    if (!account) {
      return {
        success: false,
        message: "Invalid account.",
      };
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          profileId: existingTransaction.profileId,
          type,
        },
      });

      if (!category) {
        return {
          success: false,
          message: "Invalid category.",
        };
      }
    }


await prisma.$transaction(async (tx) => {
  // Lock the original and destination accounts in a consistent order.
  const lockedAccounts = await tx.$queryRaw<
    Array<{ id: string }>
  >`
    SELECT "id"
    FROM "Account"
    WHERE "id" IN (
      ${existingTransaction.accountId},
      ${accountId}
    )
    ORDER BY "id"
    FOR UPDATE
  `;

  const expectedAccountCount =
    existingTransaction.accountId === accountId ? 1 : 2;

  if (lockedAccounts.length !== expectedAccountCount) {
    throw new Error("ACCOUNT_NOT_AVAILABLE");
  }

  // Confirm the destination account is still active and owned
  // by the correct financial profile.
  const destinationAccount = await tx.account.findFirst({
    where: {
      id: accountId,
      profileId: existingTransaction.profileId,
      isActive: true,
      profile: {
        user: {
          email: session.user!.email!,
        },
      },
    },
  });

  if (!destinationAccount) {
    throw new Error("ACCOUNT_NOT_AVAILABLE");
  }

  // Recheck the transaction inside the lock-protected operation.
  const currentTransaction = await tx.transaction.findFirst({
    where: {
      id: transactionId,
      profile: {
        user: {
          email: session.user!.email!,
        },
      },
      InvoicePayment: {
        is: null,
      },
      reversedInvoicePayment: {
        is: null,
      },
    },
  });

  if (!currentTransaction) {
    throw new Error("TRANSACTION_NOT_EDITABLE");
  }

  // If another request moved the transaction, retry from
  // the latest page state rather than using stale account IDs.
  if (currentTransaction.accountId !== existingTransaction.accountId) {
    throw new Error("TRANSACTION_CHANGED");
  }

  await tx.transaction.update({
    where: {
      id: transactionId,
      profile: {
        user: {
          email: session.user!.email!,
        },
      },
      InvoicePayment: {
        is: null,
      },
      reversedInvoicePayment: {
        is: null,
      },
    },
    data: {
      type,
      amount: validatedAmount,
      accountId,
      categoryId: categoryId || null,
      date: validatedDate,
      description: description?.trim() || null,
    },
  });
});


    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/budgets");

    return {
      success: true,
      message: "Transaction updated successfully.",
    };
  } catch (error) {
    if (
  error instanceof Error &&
  [
    "ACCOUNT_NOT_AVAILABLE",
    "TRANSACTION_NOT_EDITABLE",
    "TRANSACTION_CHANGED",
  ].includes(error.message)
) {
  return {
    success: false,
    message:
      "The account or transaction has changed. Refresh and try again.",
  };
}
    console.error("Update transaction error:", error);

    return {
      success: false,
      message: "Something went wrong while updating the transaction.",
    };
  }
}

//delete transaction//
export async function deleteTransaction(
  transactionId: string
): Promise<TransactionActionState> {
  try {

    const session = await auth();

if (!session?.user?.email) {
  return {
    success: false,
    message: "You must be logged in to delete a transaction.",
  };
}

    if (!transactionId) {
      return {
        success: false,
        message: "Transaction ID is missing.",
      };
    }

    const transaction = await prisma.transaction.findFirst({
  where: {
    id: transactionId,
    profile: {
      user: {
        email: session.user.email,
      },
    },
  },
  include: {
    InvoicePayment: true,
    reversedInvoicePayment: true,
  },
});

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found.",
      };
    }

    if (
  transaction.InvoicePayment ||
  transaction.reversedInvoicePayment
) {
  return {
    success: false,
    message:
      "Invoice-linked transactions cannot be deleted directly. Manage them through the invoice payment workflow.",
  };
}


const result = await prisma.$transaction(async (tx) => {
  // Lock the affected account before deleting its transaction.
  const lockedAccounts = await tx.$queryRaw<
    Array<{ id: string }>
  >`
    SELECT "id"
    FROM "Account"
    WHERE "id" = ${transaction.accountId}
    FOR UPDATE
  `;

  if (lockedAccounts.length !== 1) {
    throw new Error("ACCOUNT_NOT_AVAILABLE");
  }

  // Confirm that the transaction still belongs to this account.
  // It may have been moved or deleted by another request.
  const currentTransaction = await tx.transaction.findFirst({
    where: {
      id: transactionId,
      accountId: transaction.accountId,
      profile: {
        user: {
          email: session.user!.email!,
        },
      },
      InvoicePayment: {
        is: null,
      },
      reversedInvoicePayment: {
        is: null,
      },
    },
  });

  if (!currentTransaction) {
    throw new Error("TRANSACTION_CHANGED");
  }

  return tx.transaction.deleteMany({
    where: {
      id: transactionId,
      accountId: transaction.accountId,
      profile: {
        user: {
          email: session.user!.email!,
        },
      },
      InvoicePayment: {
        is: null,
      },
      reversedInvoicePayment: {
        is: null,
      },
    },
  });
});


if (result.count !== 1) {
  return {
    success: false,
    message: "Transaction not found or deletion not permitted.",
  };
}

    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/budgets");

    return {
      success: true,
      message: "Transaction deleted successfully.",
    };
  } catch (error) {
    console.error("Delete transaction error:", error);

    return {
      success: false,
      message: "Something went wrong while deleting the transaction.",
    };
  }
}