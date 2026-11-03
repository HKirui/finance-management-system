import "dotenv/config";
import prisma from "../lib/prisma";

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "admin@finance.local",
    },
    update: {},
    create: {
      name: "Finance Admin",
      email: "admin@finance.local",
    },
  });

  const personalProfile = await prisma.financialProfile.findFirst({
    where: {
      userId: user.id,
      type: "PERSONAL",
    },
  });

  if (!personalProfile) {
    await prisma.financialProfile.create({
      data: {
        name: "Personal",
        type: "PERSONAL",
        userId: user.id,
      },
    });
  }

  const businessProfile = await prisma.financialProfile.findFirst({
    where: {
      userId: user.id,
      type: "BUSINESS",
    },
  });

  if (!businessProfile) {
    await prisma.financialProfile.create({
      data: {
        name: "K-Link Solutions",
        type: "BUSINESS",
        userId: user.id,
      },
    });
  }


const personal = await prisma.financialProfile.findFirstOrThrow({
  where: {
    userId: user.id,
    type: "PERSONAL",
  },
});

const business = await prisma.financialProfile.findFirstOrThrow({
  where: {
    userId: user.id,
    type: "BUSINESS",
  },
});

const personalAccounts = [
  { name: "M-Pesa", type: "MPESA" as const },
  { name: "Cash", type: "CASH" as const },
  { name: "Personal Bank", type: "BANK" as const },
];

for (const account of personalAccounts) {
  const existing = await prisma.account.findFirst({
    where: {
      profileId: personal.id,
      name: account.name,
    },
  });

  if (!existing) {
    await prisma.account.create({
      data: {
        name: account.name,
        type: account.type,
        profileId: personal.id,
      },
    });
  }
}

const businessAccounts = [
  { name: "Business Bank", type: "BANK" as const },
  { name: "Business M-Pesa", type: "MPESA" as const },
  { name: "Business Cash", type: "CASH" as const },
];

for (const account of businessAccounts) {
  const existing = await prisma.account.findFirst({
    where: {
      profileId: business.id,
      name: account.name,
    },
  });

  if (!existing) {
    await prisma.account.create({
      data: {
        name: account.name,
        type: account.type,
        profileId: business.id,
      },
    });
  }
}

const personalCategories = [
  { name: "Salary", type: "INCOME" as const },
  { name: "Freelance", type: "INCOME" as const },
  { name: "Other Income", type: "INCOME" as const },

  { name: "Food", type: "EXPENSE" as const },
  { name: "Transport", type: "EXPENSE" as const },
  { name: "Housing", type: "EXPENSE" as const },
  { name: "Utilities", type: "EXPENSE" as const },
  { name: "Internet & Airtime", type: "EXPENSE" as const },
  { name: "Giving", type: "EXPENSE" as const },
  { name: "Tithe", type: "EXPENSE" as const },
  { name: "Offering", type: "EXPENSE" as const },
  { name: "Altar Sacrifice", type: "EXPENSE" as const },
  { name: "Prophet's Honor", type: "EXPENSE" as const },
  { name: "Entertainment", type: "EXPENSE" as const },
  { name: "Other Expense", type: "EXPENSE" as const },
];

for (const category of personalCategories) {
  await prisma.category.upsert({
    where: {
      profileId_name_type: {
        profileId: personal.id,
        name: category.name,
        type: category.type,
      },
    },
    update: {},
    create: {
      name: category.name,
      type: category.type,
      profileId: personal.id,
    },
  });
}

const businessCategories = [
  { name: "IT Services", type: "INCOME" as const },
  { name: "Software Development", type: "INCOME" as const },
  { name: "Maintenance & Support", type: "INCOME" as const },
  { name: "Subscriptions", type: "INCOME" as const },
  { name: "Other Business Income", type: "INCOME" as const },

  { name: "Equipment & Hardware", type: "EXPENSE" as const },
  { name: "Software & Subscriptions", type: "EXPENSE" as const },
  { name: "Internet & Communication", type: "EXPENSE" as const },
  { name: "Transport", type: "EXPENSE" as const },
  { name: "Marketing", type: "EXPENSE" as const },
  { name: "Office Expenses", type: "EXPENSE" as const },
  { name: "Other Business Expense", type: "EXPENSE" as const },
  { name: "Tithe", type: "EXPENSE" as const },
  { name: "Offering", type: "EXPENSE" as const },
  { name: "Altar Sacrifice", type: "EXPENSE" as const },
  { name: "Prophet's Honor", type: "EXPENSE" as const },
];

for (const category of businessCategories) {
  await prisma.category.upsert({
    where: {
      profileId_name_type: {
        profileId: business.id,
        name: category.name,
        type: category.type,
      },
    },
    update: {},
    create: {
      name: category.name,
      type: category.type,
      profileId: business.id,
    },
  });
}

  console.log("Finance system seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });