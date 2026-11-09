import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Plus, Search } from "lucide-react";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import prisma from "@/lib/prisma";
import { createClient, toggleClientStatus } from "./actions";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

const display = "font-[family-name:var(--font-fraunces)]";
const muted = "text-slate-500 dark:text-neutral-400";
const card =
  "rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950";
const label = "mb-1 block text-xs font-medium text-slate-600 dark:text-neutral-400";
const field =
  "min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-400 dark:focus:ring-neutral-100/10";
const ghost =
  "inline-flex min-h-8 items-center rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900";

const newClientFields = [
  { id: "name", label: "Client name *", type: "text", placeholder: "Enter client name", required: true },
  { id: "company", label: "Company", type: "text", placeholder: "Company or organization" },
  { id: "email", label: "Email", type: "email", placeholder: "client@example.com" },
  { id: "phone", label: "Phone number", type: "tel", placeholder: "+254..." },
  { id: "address", label: "Address", type: "text", placeholder: "Client location" },
  { id: "notes", label: "Notes", type: "text", placeholder: "Additional information" },
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "?";

type ClientsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

export default async function ClientsPage({
  searchParams,
}: ClientsPageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }
  const { q, status } = await searchParams;
  const search = q?.trim() ?? "";

  const clients = await prisma.client.findMany({
    where: {
      profile: {
        type: "BUSINESS",
        user: {
          email: session.user.email,
        },
      },

      ...(status === "active"
        ? { isActive: true }
        : status === "inactive"
          ? { isActive: false }
          : {}),

      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                company: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                phone: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const filter = status === "active" || status === "inactive" ? status : "all";

  const filterHref = (value: string) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (value !== "all") params.set("status", value);
    const query = params.toString();
    return query ? `/clients?${query}` : "/clients";
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
  ];

  return (
    <main
      className={`${fraunces.variable} ${hanken.variable} mx-auto w-full max-w-6xl space-y-4 px-4 py-5 font-[family-name:var(--font-hanken)] text-slate-900 dark:text-neutral-100 sm:px-6`}
    >
      <header>
        <p className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] ${muted}`}>
          <span className="size-1.5 rounded-full bg-indigo-400" />
          K-Link Solutions
        </p>
        <h1 className={`${display} mt-1.5 text-2xl font-normal tracking-tight sm:text-3xl`}>
          Clients
        </h1>
        <p className={`mt-1 text-xs ${muted}`}>Manage K-Link Solutions clients.</p>
      </header>

      {/* Add new client (dropdown) */}
      <details key={`add-${clients.length}`} className={`${card} group`}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 text-[13px] font-medium marker:hidden hover:bg-slate-50 dark:hover:bg-neutral-900/60 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
              <Plus size={15} strokeWidth={2} />
            </span>
            Add new client
          </span>
          <ChevronDown
            size={16}
            className="text-slate-400 transition-transform group-open:rotate-180"
          />
        </summary>

        <form
          action={createClient}
          className="border-t border-slate-200 px-4 py-4 dark:border-neutral-800"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {newClientFields.map((item) => (
              <div key={item.id} className={item.id === "notes" ? "sm:col-span-2" : ""}>
                <label htmlFor={item.id} className={label}>
                  {item.label}
                </label>
                <input
                  id={item.id}
                  name={item.id}
                  type={item.type}
                  required={item.required}
                  placeholder={item.placeholder}
                  className={field}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="min-h-9 rounded-lg bg-slate-900 px-5 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              Save client
            </button>
          </div>
        </form>
      </details>

      {/* Search and filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form action="/clients" method="GET" className="flex min-w-0 flex-1 basis-72 items-center gap-2">
          <input type="hidden" name="status" value={filter === "all" ? "" : filter} />

          <div className="relative min-w-0 flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500"
            />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search name, company, phone or email"
              aria-label="Search clients"
              className={`${field} min-h-10 pl-9`}
            />
          </div>

          <button
            type="submit"
            className="min-h-10 rounded-lg border border-slate-300 px-4 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
          >
            Search
          </button>

          {(search || filter !== "all") && (
            <Link href="/clients" className={`text-xs underline-offset-2 hover:underline ${muted}`}>
              Clear
            </Link>
          )}
        </form>

        <nav
          aria-label="Filter clients by status"
          className="flex gap-0.5 rounded-full bg-slate-100 p-1 dark:bg-neutral-900"
        >
          {filters.map((item) => (
            <Link
              key={item.id}
              href={filterHref(item.id)}
              aria-current={filter === item.id ? "page" : undefined}
              className={`flex min-h-9 items-center rounded-full px-4 text-[13px] font-medium transition-colors ${
                filter === item.id
                  ? "bg-indigo-300 text-neutral-950"
                  : "text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Client list */}
      <section className={`${card} overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 dark:border-neutral-800 sm:px-5">
          <h2 className={`${display} text-base`}>Client list</h2>
          <span className={`text-xs ${muted}`}>
            {clients.length} {clients.length === 1 ? "client" : "clients"}
          </span>
        </div>

        {clients.length === 0 ? (
          <p className={`px-6 py-14 text-center text-xs ${muted}`}>
            {search || filter !== "all"
              ? "No clients match your search."
              : "No clients registered yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className={`border-b border-slate-100 text-[11px] uppercase tracking-wider dark:border-neutral-800 ${muted}`}>
                  <th className="px-4 py-3 font-medium sm:px-5">Client</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium sm:px-5">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-neutral-900/60"
                  >
                    <td className="px-4 py-3 sm:px-5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
                          {initials(client.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium">{client.name}</p>
                          <p className={`truncate text-[11px] ${muted}`}>
                            {client.company || "Individual"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className={`px-4 py-3 text-[13px] ${muted}`}>
                      {client.email || "—"}
                    </td>

                    <td className={`whitespace-nowrap px-4 py-3 text-[13px] tabular-nums ${muted}`}>
                      {client.phone || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-xs">
                        <span
                          className={`size-1.5 rounded-full ${client.isActive ? "bg-emerald-400" : "bg-slate-400 dark:bg-neutral-600"}`}
                        />
                        <span className={client.isActive ? "" : muted}>
                          {client.isActive ? "Active" : "Inactive"}
                        </span>
                      </span>
                    </td>

                    <td className="px-4 py-3 sm:px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/clients/${client.id}`} className={ghost}>
                          View
                        </Link>

                        <Link href={`/clients/${client.id}/edit`} className={ghost}>
                          Edit
                        </Link>

                        <form action={toggleClientStatus}>
                          <input type="hidden" name="id" value={client.id} />

                          <button
                            type="submit"
                            className={`min-h-8 rounded-lg px-2.5 text-xs font-medium transition-colors ${
                              client.isActive
                                ? "text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-neutral-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                : "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                            }`}
                          >
                            {client.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}