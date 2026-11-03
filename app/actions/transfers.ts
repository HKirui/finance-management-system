"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";

function parseTransferAmount(value: string): string | null {
  const trimmed = value.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }

  const [wholePart] = trimmed.split(".");
  const normalizedWholePart = wholePart.replace(/^0+/, "") || "0";

  if (normalizedWholePart.length > 13 || Number(trimmed) <= 0) {
    return null;
  }

  return trimmed;
}

function parseTransferDate(value: string): Date | null {
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

export type TransferActionState = {
  success: boolean;
  message: string;
};


export async function createTransfer(
  _previousState: TransferActionState,
  formData: FormData
): Promise<TransferActionState> {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        message: "You must be logged in to transfer money.",
      };
    }

    const fromAccountId = formData.get("fromAccountId")?.toString();
    const toAccountId = formData.get("toAccountId")?.toString();
    const amount = formData.get("amount")?.toString();
    const date = formData.get("date")?.toString();
    const description = formData.get("description")?.toString();

    if (!fromAccountId || !toAccountId || !amount || !date) {
      return {
        success: false,
        message: "Please complete all required fields.",
      };
    }

    if (fromAccountId === toAccountId) {
      return {
        success: false,
        message: "You cannot transfer money to the same account.",
      };
    }

    const validatedAmount = parseTransferAmount(amount);

    if (!validatedAmount) {
      return {
        success: false,
        message: "Enter a valid positive amount with up to 2 decimal places.",
      };
    }

    const validatedDate = parseTransferDate(date);

    if (!validatedDate) {
      return {
        success: false,
        message: "Enter a valid transfer date.",
      };
    }

    const transferAmount = new Prisma.Decimal(validatedAmount);

    // Retry transactions that PostgreSQL rejects due to
    // concurrent modifications or serialization conflicts.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await prisma.$transaction(

async (tx): Promise<TransferActionState> => {
  // Lock both accounts in a consistent order to reduce deadlocks.
  const lockedAccounts = await tx.$queryRaw<
    Array<{ id: string }>
  >`
    SELECT "id"
    FROM "Account"
    WHERE "id" IN (${fromAccountId}, ${toAccountId})
    ORDER BY "id"
    FOR UPDATE
  `;

  if (lockedAccounts.length !== 2) {
    return {
      success: false,
      message: "One or both accounts are invalid.",
    };
  }
            const accounts = await tx.account.findMany({
              where: {
                id: {
                  in: [fromAccountId, toAccountId],
                },
                isActive: true,
                profile: {
                  user: {
                    email: session.user!.email!,
                  },
                },
              },
            });

            if (accounts.length !== 2) {
              return {
                success: false,
                message: "One or both accounts are invalid.",
              };
            }

            const fromAccount = accounts.find(
              (account) => account.id === fromAccountId
            );

            const toAccount = accounts.find(
              (account) => account.id === toAccountId
            );

            if (!fromAccount || !toAccount) {
              return {
                success: false,
                message: "Invalid transfer accounts.",
              };
            }

            if (fromAccount.profileId !== toAccount.profileId) {
              return {
                success: false,
                message:
                  "Transfers between Personal and K-Link accounts are not allowed.",
              };
            }

            // Calculate the actual source-account balance.
            const [
              income,
              expenses,
              transfersReceived,
              transfersSent,
            ] = await Promise.all([
              tx.transaction.aggregate({
                where: {
                  accountId: fromAccountId,
                  type: "INCOME",
                },
                _sum: { amount: true },
              }),
              tx.transaction.aggregate({
                where: {
                  accountId: fromAccountId,
                  type: "EXPENSE",
                },
                _sum: { amount: true },
              }),
              tx.transfer.aggregate({
                where: {
                  toAccountId: fromAccountId,
                },
                _sum: { amount: true },
              }),
              tx.transfer.aggregate({
                where: {
                  fromAccountId,
                },
                _sum: { amount: true },
              }),
            ]);

            const zero = new Prisma.Decimal(0);

            const availableBalance = fromAccount.openingBalance
              .plus(income._sum.amount ?? zero)
              .minus(expenses._sum.amount ?? zero)
              .plus(transfersReceived._sum.amount ?? zero)
              .minus(transfersSent._sum.amount ?? zero);

            if (availableBalance.lessThan(transferAmount)) {
              return {
                success: false,
                message:
                  `Insufficient funds. Available balance: KES ${availableBalance.toFixed(2)}.`,
              };
            }

            await tx.transfer.create({
              data: {
                amount: validatedAmount,
                fromAccountId,
                toAccountId,
                date: validatedDate,
                description: description?.trim() || null,
              },
            });

            return {
              success: true,
              message: "Transfer completed successfully.",
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5000,
            timeout: 10000,
          }
        );

        if (result.success) {
          revalidatePath("/");
          revalidatePath("/accounts");
          revalidatePath("/transactions");
        }

        return result;
      } catch (error) {
        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034";

        if (retryable && attempt < 2) {
          continue;
        }

        throw error;
      }
    }

    return {
      success: false,
      message: "Transfer could not be completed. Please try again.",
    };
  } catch (error) {
    console.error("Create transfer error:", error);

    return {
      success: false,
      message: "Something went wrong while completing the transfer.",
    };
  }
}
