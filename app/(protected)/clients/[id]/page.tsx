import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import prisma from "@/lib/prisma";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

const muted = "text-slate-500 dark:text-neutral-400";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "?";

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
        user: {
          email: session.user.email,
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const details = [
    { label: "Client name", value: client.name },
    { label: "Company", value: client.company },
    { label: "Email address", value: client.email, href: client.email ? `mailto:${client.email}` : undefined },
    { label: "Phone number", value: client.phone, href: client.phone ? `tel:${client.phone}` : undefined },
    { label: "Address", value: client.address },
    {
      label: "Date registered",
      value: client.createdAt.toLocaleDateString("en-KE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
    { label: "Notes", value: client.notes, wide: true },
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
              {initials(client.name)}
            </span>

            <div className="min-w-0">
              <h1 className="truncate font-[family-name:var(--font-fraunces)] text-2xl font-normal tracking-tight sm:text-3xl">
                {client.name}
              </h1>

              <p className={`mt-0.5 flex items-center gap-2 text-xs ${muted}`}>
                <span className="truncate">{client.company || "Individual client"}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`size-1.5 rounded-full ${client.isActive ? "bg-emerald-400" : "bg-slate-400 dark:bg-neutral-600"}`}
                  />
                  {client.isActive ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
          </div>

          <Link
            href={`/clients/${client.id}/edit`}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            <Pencil size={14} strokeWidth={1.8} />
            Edit client
          </Link>
        </div>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="border-b border-slate-200 px-4 py-3.5 dark:border-neutral-800 sm:px-5">
          <h2 className="font-[family-name:var(--font-fraunces)] text-base">
            Client information
          </h2>
        </div>

        <dl className="grid gap-x-6 gap-y-5 p-4 sm:grid-cols-2 sm:p-5">
          {details.map((detail) => (
            <div key={detail.label} className={detail.wide ? "sm:col-span-2" : ""}>
              <dt className={`text-[11px] font-medium uppercase tracking-wider ${muted}`}>
                {detail.label}
              </dt>

              <dd className="mt-1 break-words text-[13px] font-medium">
                {detail.value ? (
                  detail.href ? (
                    <a
                      href={detail.href}
                      className="underline-offset-2 hover:underline"
                    >
                      {detail.value}
                    </a>
                  ) : (
                    detail.value
                  )
                ) : (
                  <span className={`font-normal ${muted}`}>Not provided</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}