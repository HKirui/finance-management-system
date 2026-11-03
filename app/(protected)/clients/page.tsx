import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { createClient, toggleClientStatus } from "./actions";
import Link from "next/link";

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
  const { q, status} = await searchParams;
  const search = q?.trim() ?? "";

  const clients = await prisma.client.findMany({
    where: {
      profile: {
        type: "BUSINESS",
        user:{
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

  return (
    <main className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Clients
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
          Manage K-Link Solutions clients.
        </p>
      </div>

{/* Client Search Bar */}
<form
  action="/clients"
  method="GET"
  className="mb-4 flex flex-wrap items-center gap-3"
>
  <input
    type="search"
    name="q"
    defaultValue={search}
    placeholder="Search by name, company, phone or email..."
    className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
  />

<select
  name="status"
  aria-label="Filter clients by status"
  defaultValue={
    status === "active" || status === "inactive"
      ? status
      : "all"
  }
  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
>
  <option value="all">All Clients</option>
  <option value="active">Active Clients</option>
  <option value="inactive">Inactive Clients</option>
</select>

  <button
    type="submit"
    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
  >
    Search
  </button>

  <a
    href="/clients"
    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
  >
    Clear
  </a>
</form>

<form
  action={createClient}
  className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#090909]"
>
  <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
    Add New Client
  </h2>

  <div className="grid gap-4 md:grid-cols-2">

    <div>
      <label htmlFor="name" className="mb-1 block text-sm text-gray-700 dark:text-neutral-300">
        Client Name *
      </label>
      <input
        id="name"
        name="name"
        type="text"
        required
        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
        placeholder="Enter client name"
      />
    </div>

    <div>
      <label htmlFor="company" className="mb-1 block text-sm text-gray-700 dark:text-neutral-300">
        Company
      </label>
      <input
        id="company"
        name="company"
        type="text"
        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
        placeholder="Company or organization"
      />
    </div>

    <div>
      <label htmlFor="email" className="mb-1 block text-sm text-gray-700 dark:text-neutral-300">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
        placeholder="client@example.com"
      />
    </div>

    <div>
      <label htmlFor="phone" className="mb-1 block text-sm text-gray-700 dark:text-neutral-300">
        Phone Number
      </label>
      <input
        id="phone"
        name="phone"
        type="tel"
        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
        placeholder="+254..."
      />
    </div>

    <div>
      <label htmlFor="address" className="mb-1 block text-sm text-gray-700 dark:text-neutral-300">
        Address
      </label>
      <input
        id="address"
        name="address"
        type="text"
        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
        placeholder="Client location"
      />
    </div>

    <div>
      <label htmlFor="notes" className="mb-1 block text-sm text-gray-700 dark:text-neutral-300">
        Notes
      </label>
      <input
        id="notes"
        name="notes"
        type="text"
        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
        placeholder="Additional information"
      />
    </div>

  </div>

  <button
    type="submit"
    className="mt-5 rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
  >
    Save Client
  </button>
</form>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#090909]">
        {clients.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            No clients registered yet.
          </p>
        ) : (
         <div className="overflow-x-auto">
  <table className="w-full text-left text-sm">
    <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-neutral-800 dark:bg-[#111111] dark:text-neutral-400">
      <tr>
        <th className="px-4 py-3 font-semibold">Client Name</th>
        <th className="px-4 py-3 font-semibold">Company</th>
        <th className="px-4 py-3 font-semibold">Email</th>
        <th className="px-4 py-3 font-semibold">Phone</th>
        <th className="px-4 py-3 font-semibold">Status</th>
        <th className="px-4 py-3 font-semibold">Actions</th>
      </tr>
    </thead>

    <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
      {clients.map((client) => (
        <tr
          key={client.id}
          className="transition hover:bg-gray-50 dark:hover:bg-[#111111]"
        >
          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
            {client.name}
          </td>

          <td className="px-4 py-3 text-gray-600 dark:text-neutral-300">
            {client.company || "Individual"}
          </td>

          <td className="px-4 py-3 text-gray-600 dark:text-neutral-300">
            {client.email || "—"}
          </td>

          <td className="px-4 py-3 text-gray-600 dark:text-neutral-300">
            {client.phone || "—"}
          </td>

          <td className="px-4 py-3">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                client.isActive
                  ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                  : "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400"
              }`}
            >
              {client.isActive ? "Active" : "Inactive"}
            </span>
          </td>

           <td className="px-4 py-3">
       <div className="flex items-center gap-2">
       <Link
  href={`/clients/${client.id}`}
  className="inline-block rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
           View
         </Link>
    <Link
      href={`/clients/${client.id}/edit`}
      className="inline-block rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      Edit
    </Link>

    <form action={toggleClientStatus}>
      <input
        type="hidden"
        name="id"
        value={client.id}
      />

      <button
        type="submit"
        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
          client.isActive
            ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            : "border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950"
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
      </div>
    </main>
  );
}