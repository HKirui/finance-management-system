
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import GivingForm from "@/components/GivingForm";

const givingCategories = [
  "Tithe",
  "Offering",
  "Altar Sacrifice",
  "Prophet's Honor",
];

export default async function GivingPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const profiles = await prisma.financialProfile.findMany({
    where: {
      user: {
        email: session.user.email,
      },
    },
    include: {
      accounts: {
        where: { isActive: true },
      },
      categories: {
        where: {
          type: "EXPENSE",
          name: { in: givingCategories },
        },
      },
    },
    orderBy: { type: "asc" },
  });

  const transactions = await prisma.transaction.findMany({
    where: {
      type: "EXPENSE",
      profile: {
        user: {
          email: session.user.email,
        },
      },
      category: {
        name: { in: givingCategories },
        type: "EXPENSE",
      },
    },
    include: {
      profile: true,
      account: true,
      category: true,
    },
    orderBy: [
      { date: "desc" },
      { createdAt: "desc" },
    ],
  });

  const total = (category: string) =>
    transactions
      .filter((t) => t.category?.name === category)
      .reduce((sum, t) => sum + Number(t.amount), 0);

  const formatMoney = (amount: number) =>
    `KES ${amount.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <main className="p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tithe, Offering, Altar Sacrifice &amp; Prophet&apos;s Honor
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your personal and business giving.
            </p>
          </div>

          <GivingForm
            profiles={profiles.map((profile) => ({
              id: profile.id,
              name: profile.name,
              type: profile.type,
              accounts: profile.accounts.map((account) => ({
                id: account.id,
                name: account.name,
              })),
              categories: profile.categories.map((category) => ({
                id: category.id,
                name: category.name,
              })),
            }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {givingCategories.map((category) => (
            <div
              key={category}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <p className="text-sm text-gray-500">
                {category}
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatMoney(total(category))}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="font-semibold text-gray-900">
              Giving History
            </h2>
          </div>

          {transactions.length === 0 ? (
            <p className="px-6 py-12 text-center text-gray-500">
              No giving records yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Profile</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Account</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4">
                        {transaction.date.toLocaleDateString("en-KE")}
                      </td>
                      <td className="px-6 py-4">
                        {transaction.profile.name}
                      </td>
                      <td className="px-6 py-4">
                        {transaction.category?.name}
                      </td>
                      <td className="px-6 py-4">
                        {transaction.account.name}
                      </td>
                      <td className="px-6 py-4">
                        {transaction.description || "—"}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatMoney(Number(transaction.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
