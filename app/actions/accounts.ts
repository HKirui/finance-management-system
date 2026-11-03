"use server";

import {auth} from "@/auth"
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";

function isValidOpeningBalance(value: string): boolean {
  const trimmed = value.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return false;
  }

  const [wholePart] = trimmed.split(".");
  const normalizedWholePart = wholePart.replace(/^0+/, "") || "0";

  return normalizedWholePart.length <= 13;
}


export type OpeningBalanceActionState = {
  success: boolean;
  message: string;
};




export async function updateOpeningBalance(
  _previousState: OpeningBalanceActionState,
  formData: FormData
): Promise<OpeningBalanceActionState> {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        message: "You must be logged in to update an opening balance.",
      };
    }

    const accountId = formData.get("accountId")?.toString();
    const openingBalance = formData.get("openingBalance")?.toString();

    if (!accountId || openingBalance === undefined) {
      return {
        success: false,
        message: "Account and opening balance are required.",
      };
    }

    if (!isValidOpeningBalance(openingBalance)) {
      return {
        success: false,
        message:
          "Enter a valid non-negative opening balance with up to 2 decimal places.",
      };
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // Lock the account row for this transaction.
        const lockedAccounts = await tx.$queryRaw<
          Array<{ id: string }>
        >`
          SELECT "id"
          FROM "Account"
          WHERE "id" = ${accountId}
          FOR UPDATE
        `;

        if (lockedAccounts.length !== 1) {
          return {
            success: false,
            message: "Account not found or access denied.",
          };
        }

        // Verify ownership after obtaining the lock.
        const account = await tx.account.findFirst({
          where: {
            id: accountId,
            profile: {
              user: {
                email: session.user!.email!,
              },
            },
          },
        });

        if (!account) {
          return {
            success: false,
            message: "Account not found or access denied.",
          };
        }

        const [transactionCount, sentTransferCount, receivedTransferCount] =
          await Promise.all([
            tx.transaction.count({
              where: { accountId },
            }),
            tx.transfer.count({
              where: { fromAccountId: accountId },
            }),
            tx.transfer.count({
              where: { toAccountId: accountId },
            }),
          ]);

        if (
          transactionCount > 0 ||
          sentTransferCount > 0 ||
          receivedTransferCount > 0
        ) {
          return {
            success: false,
            message:
              "Opening balance cannot be changed after transactions or transfers have been recorded.",
          };
        }

        const updated = await tx.account.updateMany({
          where: {
            id: accountId,
            profile: {
              user: {
                email: session.user!.email!,
              },
            },
          },
          data: {
            openingBalance,
          },
        });

        if (updated.count !== 1) {
          return {
            success: false,
            message: "Account not found or access denied.",
          };
        }

        return {
          success: true,
          message: "Opening balance updated successfully.",
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        timeout: 10000,
      }
    );

    if (result.success) {
      revalidatePath("/accounts");
      revalidatePath("/");
    }

    return result;
  } catch (error) {
    console.error("Update opening balance error:", error);

    return {
      success: false,
      message: "Something went wrong while updating the opening balance.",
    };
  }
}


export type AccountActionState = {
  success: boolean;
  message: string;
};

export async function createAccount(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    const session = await auth();

if (!session?.user?.email) {
  return {
    success: false,
    message: "You must be logged in to create an account.",
  };
}
    const profileId = formData.get("profileId")?.toString();
    const name = formData.get("name")?.toString().trim();
    const type = formData.get("type")?.toString();
    const openingBalance = formData.get("openingBalance")?.toString();

    if (!profileId || !name || !type || openingBalance === undefined) {
      return {
        success: false,
        message: "Please complete all required fields.",
      };
    }

    const validAccountTypes = [
      "CASH",
      "MPESA",
      "BANK",
      "SAVINGS",
      "INVESTMENT",
      "OTHER",
    ] as const;

    if (!validAccountTypes.includes(type as (typeof validAccountTypes)[number])) {
      return {
        success: false,
        message: "Invalid account type.",
      };
    }

    if (!isValidOpeningBalance(openingBalance)) {
      return {
        success: false,
        message: "Enter a valid non-negative opening balance with up to 2 decimal places.",
      };
    }

    const profile = await prisma.financialProfile.findUnique({
      where: {
        id: profileId,
        user:{
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

    await prisma.account.create({
      data: {
        name,
        type: type as
          | "CASH"
          | "MPESA"
          | "BANK"
          | "SAVINGS"
          | "INVESTMENT"
          | "OTHER",
        openingBalance,
        profileId,
      },
    });

    revalidatePath("/accounts");
    revalidatePath("/");

    return {
      success: true,
      message: "Account created successfully.",
    };
  } catch (error) {
    console.error("Create account error:", error);

    return {
      success: false,
      message: "Something went wrong while creating the account.",
    };
  }
}