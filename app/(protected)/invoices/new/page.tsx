import Link from "next/link";
import prisma from "@/lib/prisma";
import InvoiceItemsForm from "./InvoiceItemsForm";
import { createInvoice } from "../actions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Fraunces, Hanken_Grotesk } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

const display = "font-[family-name:var(--font-fraunces)]";
const muted = "text-slate-500 dark:text-neutral-400";
const card =
  "rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 sm:p-5";
const label = "mb-1 block text-xs font-medium text-slate-600 dark:text-neutral-400";
const field =
  "min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-400 dark:focus:ring-neutral-100/10 dark:[color-scheme:dark]";

export default async function NewInvoicePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const clients = await prisma.client.findMany({
    where: {
      profile: {
        type: "BUSINESS",
        user: {
          email: session.user.email,
        },
      },
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main
      className={`${fraunces.variable} ${hanken.variable} mx-auto w-full max-w-4xl space-y-4 px-4 py-5 font-[family-name:var(--font-hanken)] text-slate-900 dark:text-neutral-100 sm:px-6`}
    >
      <header>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft size={14} />
          Back to invoices
        </Link>

        <h1 className={`${display} mt-3 text-2xl font-normal tracking-tight sm:text-3xl`}>
          Create invoice
        </h1>

        <p className={`mt-1 text-xs ${muted}`}>
          Create a new invoice for your client.
        </p>
      </header>

      <form action={createInvoice} className="space-y-4">
        <section className={card}>
          <h2 className={`${display} mb-3 text-base`}>Client</h2>

          {clients.length === 0 ? (
            <p className={`text-[13px] ${muted}`}>
              No active business clients found.{" "}
              <Link href="/clients" className="font-medium underline underline-offset-2">
                Add a client
              </Link>{" "}
              first.
            </p>
          ) : (
            <div>
              <label htmlFor="clientId" className={label}>
                Client *
              </label>

              <select
                id="clientId"
                name="clientId"
                required
                defaultValue=""
                className={field}
              >
                <option value="" disabled>
                  Select a client
                </option>

                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                    {client.company ? ` — ${client.company}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        {/* Invoice Details */}
        <section className={card}>
          <h2 className={`${display} mb-3 text-base`}>Invoice details</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="issueDate" className={label}>
                Issue date *
              </label>

              <input
                id="issueDate"
                name="issueDate"
                type="date"
                required
                className={field}
              />
            </div>

            <div>
              <label htmlFor="dueDate" className={label}>
                Due date
              </label>

              <input id="dueDate" name="dueDate" type="date" className={field} />
            </div>
          </div>

          <p className={`mt-3 text-xs ${muted}`}>
            The invoice number is generated automatically when the invoice is saved.
          </p>
        </section>

        {/* Interactive Invoice Items */}
        <InvoiceItemsForm />

        <div className="flex justify-end">
          <button
            type="submit"
            className="min-h-10 rounded-lg bg-slate-900 px-6 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            Save invoice
          </button>
        </div>
      </form>
    </main>
  );
}