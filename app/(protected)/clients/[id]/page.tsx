import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

type ClientDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailsPage({
  params,
}: ClientDetailsPageProps) {
  const session = await auth();

if (!session?.user?.email) {
  redirect("/login");
}

  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: {
      id,
      profile: {
        type: "BUSINESS",
        user:{
          email: session.user.email,
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const details = [
    { label: "Client Name", value: client.name },
    { label: "Company", value: client.company },
    { label: "Email Address", value: client.email },
    { label: "Phone Number", value: client.phone },
    { label: "Address", value: client.address },
    { label: "Notes", value: client.notes },
    {
      label: "Date Registered",
      value: client.createdAt.toLocaleDateString("en-KE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
  ];

  return (
    <main className="p-4 lg:p-6">
      <div className="mb-6">
        <Link
          href="/clients"
          className="text-sm text-gray-500 hover:underline dark:text-neutral-400"
        >
          ← Back to Clients
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {client.name}
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
              {client.company || "Individual Client"}
            </p>
          </div>

          <Link
            href={`/clients/${client.id}/edit`}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          >
            Edit Client
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#090909]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Client Information
          </h2>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              client.isActive
                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                : "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400"
            }`}
          >
            {client.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {details.map((detail) => (
            <div key={detail.label}>
              <p className="text-xs font-medium text-gray-500 dark:text-neutral-400">
                {detail.label}
              </p>

              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {detail.value || "Not provided"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}