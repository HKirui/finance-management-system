import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { updateClient } from "../../actions";

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
        user:{
          email:session.user.email,
        },
      },
    },
  });

  // Show 404 if client does not exist
  if (!client) {
    notFound();
  }

  return (
    <main className="p-4 lg:p-6">
      <div className="mb-6">
        <Link
          href="/clients"
          className="text-sm text-gray-500 hover:underline dark:text-neutral-400"
        >
          ← Back to Clients
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">
          Edit Client
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
          Update information for {client.name}
        </p>
      </div>

      <form
        action={updateClient}
        className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#090909]"
      >
        <input type="hidden" name="id" value={client.id} />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm text-gray-700 dark:text-neutral-300"
            >
              Client Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={client.name}
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="mb-1 block text-sm text-gray-700 dark:text-neutral-300"
            >
              Company
            </label>
            <input
              id="company"
              name="company"
              type="text"
              defaultValue={client.company ?? ""}
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm text-gray-700 dark:text-neutral-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={client.email ?? ""}
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-1 block text-sm text-gray-700 dark:text-neutral-300"
            >
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={client.phone ?? ""}
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="address"
              className="mb-1 block text-sm text-gray-700 dark:text-neutral-300"
            >
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              defaultValue={client.address ?? ""}
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="mb-1 block text-sm text-gray-700 dark:text-neutral-300"
            >
              Notes
            </label>
            <input
              id="notes"
              name="notes"
              type="text"
              defaultValue={client.notes ?? ""}
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          >
            Save Changes
          </button>

          <Link
            href="/clients"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}