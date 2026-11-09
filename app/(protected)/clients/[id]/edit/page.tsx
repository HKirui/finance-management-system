import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import prisma from "@/lib/prisma";
import { updateClient } from "../../actions";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

const label = "mb-1 block text-xs font-medium text-slate-600 dark:text-neutral-400";
const field =
  "min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-400 dark:focus:ring-neutral-100/10";

type EditClientPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditClientPage({
  params,
}: EditClientPageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;

  // Find the client in PostgreSQL
  const client = await prisma.client.findFirst({
    where: {
      id,
      profile: {
        type: "BUSINESS",
        user: {
          email: session.user.email,
        },
      },
    },
  });

  // Show 404 if client does not exist
  if (!client) {
    notFound();
  }

  const fields = [
    { id: "name", label: "Client name *", type: "text", value: client.name, required: true },
    { id: "company", label: "Company", type: "text", value: client.company ?? "" },
    { id: "email", label: "Email", type: "email", value: client.email ?? "" },
    { id: "phone", label: "Phone number", type: "tel", value: client.phone ?? "" },
    { id: "address", label: "Address", type: "text", value: client.address ?? "" },
    { id: "notes", label: "Notes", type: "text", value: client.notes ?? "" },
  ];

  return (
    <main
      className={`${fraunces.variable} ${hanken.variable} mx-auto w-full max-w-3xl space-y-4 px-4 py-5 font-[family-name:var(--font-hanken)] text-slate-900 dark:text-neutral-100 sm:px-6`}
    >
      <header>
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft size={14} />
          Back to clients
        </Link>

        <h1 className="mt-3 font-[family-name:var(--font-fraunces)] text-2xl font-normal tracking-tight sm:text-3xl">
          Edit client
        </h1>

        <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
          Update information for {client.name}
        </p>
      </header>

      <form
        action={updateClient}
        className="rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
      >
        <input type="hidden" name="id" value={client.id} />

        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
          {fields.map((item) => (
            <div key={item.id} className={item.id === "notes" ? "sm:col-span-2" : ""}>
              <label htmlFor={item.id} className={label}>
                {item.label}
              </label>
              <input
                id={item.id}
                name={item.id}
                type={item.type}
                required={item.required}
                defaultValue={item.value}
                className={field}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-neutral-800 sm:px-5">
          <Link
            href="/clients"
            className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 px-4 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="min-h-9 rounded-lg bg-slate-900 px-5 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            Save changes
          </button>
        </div>
      </form>
    </main>
  );
}