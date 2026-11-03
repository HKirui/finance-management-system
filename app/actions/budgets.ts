"use server";

import {auth} from "@/auth"
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type BudgetActionState = {
  success: boolean;
  message: string;
};

//create new budget//
export async function createBudget(
  previousState: BudgetActionState,
  formData: FormData
): Promise<BudgetActionState> {
  try {
    const session = await auth();

if (!session?.user?.email) {
  return {
    success: false,
    message: "You must be logged in to create a budget.",
  };
}
    const profileId = formData.get("profileId")?.toString();
    const categoryId = formData.get("categoryId")?.toString();
    const amount = formData.get("amount")?.toString();
    const month = Number(formData.get("month"));
    const year = Number(formData.get("year"));

    if (!profileId || !categoryId || !amount || !month || !year) {
      return {
        success: false,
        message: "Please complete all required fields.",
      };
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return {
        success: false,
        message: "Budget amount must be greater than zero.",
      };
    }

    if (month < 1 || month > 12) {
      return {
        success: false,
        message: "Invalid month.",
      };
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        profileId,
        type: "EXPENSE",
        profile:{
          user:{
            email: session.user.email,
          },
        },
      },
    });

    if (!category) {
      return {
        success: false,
        message: "Invalid expense category.",
      };
    }

    const existingBudget = await prisma.budget.findUnique({
      where: {
        profileId_categoryId_month_year: {
          profileId,
          categoryId,
          month,
          year,
        },
      },
    });

    if (existingBudget) {
      return {
        success: false,
        message: "A budget already exists for this category and month.",
      };
    }

   await prisma.budget.create({
  data: {
    profileId,
    categoryId,
    amount,
    month,
    year,
  },
});


    revalidatePath("/budgets");
    revalidatePath("/");

    return {
      success: true,
      message: "Budget created successfully.",
    };
  } catch (error) {
    console.error("Create budget error:", error);

    return {
      success: false,
      message: "Something went wrong while creating the budget.",
    };
  }
}

//update/edit budget//
export async function updateBudget(
  previousState: BudgetActionState,
  formData: FormData
): Promise<BudgetActionState> {
  try {
    const session = await auth();

if (!session?.user?.email) {
  return {
    success: false,
    message: "You must be logged in to update a budget.",
  };
}
    const budgetId = formData.get("budgetId")?.toString();
    const amount = formData.get("amount")?.toString();

    if (!budgetId || !amount) {
      return {
        success: false,
        message: "Budget information is missing.",
      };
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return {
        success: false,
        message: "Budget amount must be greater than zero.",
      };
    }

    const budget = await prisma.budget.findUnique({
      where: {
        id: budgetId,
        profile:{
          user:{
            email: session.user.email,
          },
        },
      },
    });

    if (!budget) {
      return {
        success: false,
        message: "Budget not found.",
      };
    }

    const result=await prisma.budget.updateMany({
      where: {
        id: budgetId,
        profile:{
          user:{
            email: session.user.email,
          },
        },
      },
      data: {
        amount,
      },
    });

    if (result.count !==1){
      return{
        success: false,
        message: "Budget not found or access denied"
      }
    }

    revalidatePath("/budgets");
    revalidatePath("/");

    return {
      success: true,
      message: "Budget updated successfully.",
    };
  } catch (error) {
    console.error("Update budget error:", error);

    return {
      success: false,
      message: "Something went wrong while updating the budget.",
    };
  }
}

//delete budget//
export async function deleteBudget(
  budgetId: string
): Promise<BudgetActionState> {
  try {
    const session = await auth();

if (!session?.user?.email) {
  return {
    success: false,
    message: "You must be logged in to delete a budget.",
  };
}
    if (!budgetId) {
      return {
        success: false,
        message: "Budget ID is missing.",
      };
    }

    const budget = await prisma.budget.findUnique({
      where: {
        id: budgetId,
        profile:{
          user:{
            email: session.user.email,
          },
        },
      },
    });

    if (!budget) {
      return {
        success: false,
        message: "Budget not found.",
      };
    }

   const result= await prisma.budget.deleteMany({
      where: {
        id: budgetId,
        profile:{
          user:{
            email:session.user.email,
          },
        },
      },
    });

    if (result.count !==1){
      return{
        success:false,
        message: "Budhget not found or access denied."
      }
    }

    revalidatePath("/budgets");
    revalidatePath("/");

    return {
      success: true,
      message: "Budget deleted successfully.",
    };
  } catch (error) {
    console.error("Delete budget error:", error);

    return {
      success: false,
      message: "Something went wrong while deleting the budget.",
    };
  }
}