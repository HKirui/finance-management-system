import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import OpeningBalanceForm from "@/components/OpeningBalanceForm";
import AddAccountForm from "@/components/AddAccountForm";
import TransferForm from "@/components/TransferForm";

export default async function AccountsPage() {
  const session = await auth();

if (!session?.user?.email) {
  redirect("/login");
}
  const profiles = await prisma.financialProfile.findMany({
    where:{
      user:{
        email: session.user.email,
      },
    },
    include: {
      accounts: {
        include: {
          transactions: true,
          transfersSent: true,
          transfersReceived: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      type: "asc",
    },
  });

  return (
    <main className="p-8">
      <div className="mx-auto max-w-6xl">
  <div className="mb-8 flex items-start justify-between">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">
      Accounts
    </h1>

    <p className="mt-2 text-gray-600">
      Manage where your personal and K-Link money is held.
    </p>
  </div>

   <div className="flex gap-3">
  <TransferForm
    profiles={profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      accounts: profile.accounts
        .filter((account) => account.isActive)
        .map((account) => ({
          id: account.id,
          name: account.name,
        })),
    }))}
  />

  <AddAccountForm
    profiles={profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
    }))}
  />
  </div>
</div>

        <div className="space-y-8">
          {profiles.map((profile) => (
            <section key={profile.id}>
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {profile.type}
                </p>

                <h2 className="text-xl font-semibold text-gray-900">
                  {profile.name}
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {profile.accounts.map((account) => {
                  const income = account.transactions
                    .filter(
                      (transaction) => transaction.type === "INCOME"
                    )
                    .reduce(
                      (total, transaction) =>
                        total + Number(transaction.amount),
                      0
                    );

                  const expenses = account.transactions
                    .filter(
                      (transaction) => transaction.type === "EXPENSE"
                    )
                    .reduce(
                      (total, transaction) =>
                        total + Number(transaction.amount),
                      0
                    );

                    const transfersSent = account.transfersSent.reduce(
                         (total, transfer) => total + Number(transfer.amount),
                                0
                              );

                     const transfersReceived = account.transfersReceived.reduce(
                          (total, transfer) => total + Number(transfer.amount),
                                0
                                 );

                  const currentBalance =
                    Number(account.openingBalance) +
                    income -
                    expenses +
                    transfersReceived -
                    transfersSent;

                  return (
                    <div
                      key={account.id}
                      className="rounded-xl border border-gray-200 bg-white p-5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {account.name}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            {account.type}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            account.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {account.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="mt-6">
                        <p className="text-sm text-gray-500">
                          Current Balance
                        </p>

                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          KES{" "}
                          {currentBalance.toLocaleString("en-KE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <p className="text-sm text-gray-500">
                          Opening Balance
                        </p>

                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          KES{" "}
                          {Number(
                            account.openingBalance
                          ).toLocaleString("en-KE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>

                        <OpeningBalanceForm
                          accountId={account.id}
                          currentBalance={Number(
                            account.openingBalance
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}