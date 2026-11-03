
import { createHmac, randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;

const EMAIL_LIMIT = 5;
const IP_LIMIT = 30;

function hashIdentifier(value: string): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is missing.");
  }

  return createHmac("sha256", secret)
    .update(value)
    .digest("hex");
}

function emailKey(email: string): string {
  return `email:${hashIdentifier(email.trim().toLowerCase())}`;
}

function ipKey(ip: string): string {
  return `ip:${hashIdentifier(ip)}`;
}

async function isBlocked(identifier: string): Promise<boolean> {
  const record = await prisma.loginRateLimit.findUnique({
    where: { identifier },
    select: { blockedUntil: true },
  });

  return (
    record?.blockedUntil !== null &&
    record?.blockedUntil !== undefined &&
    record.blockedUntil.getTime() > Date.now()
  );
}

async function recordFailure(
  identifier: string,
  maxAttempts: number
): Promise<void> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - WINDOW_MS);
  const blockEnd = new Date(now.getTime() + BLOCK_MS);

  const id = randomUUID();

  await prisma.$executeRaw`
    INSERT INTO "LoginRateLimit" (
      "id",
      "identifier",
      "attempts",
      "windowStart",
      "blockedUntil",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${id},
      ${identifier},
      1,
      ${now}::timestamp,
      NULL,
      ${now}::timestamp,
      ${now}::timestamp
    )
    ON CONFLICT ("identifier")
    DO UPDATE SET
      "attempts" =
        CASE
          WHEN "LoginRateLimit"."blockedUntil" > ${now}::timestamp
            THEN "LoginRateLimit"."attempts"

          WHEN "LoginRateLimit"."blockedUntil" IS NOT NULL
            OR "LoginRateLimit"."windowStart" <= ${cutoff}::timestamp
            THEN 1

          ELSE "LoginRateLimit"."attempts" + 1
        END,

      "windowStart" =
        CASE
          WHEN "LoginRateLimit"."blockedUntil" IS NOT NULL
            AND "LoginRateLimit"."blockedUntil" <= ${now}::timestamp
            THEN ${now}::timestamp

          WHEN "LoginRateLimit"."windowStart" <= ${cutoff}::timestamp
            THEN ${now}::timestamp

          ELSE "LoginRateLimit"."windowStart"
        END,

      "blockedUntil" =
        CASE
          WHEN "LoginRateLimit"."blockedUntil" > ${now}::timestamp
            THEN "LoginRateLimit"."blockedUntil"

          WHEN "LoginRateLimit"."blockedUntil" IS NOT NULL
            OR "LoginRateLimit"."windowStart" <= ${cutoff}::timestamp
            THEN NULL

          WHEN "LoginRateLimit"."attempts" + 1 >= ${maxAttempts}
            THEN ${blockEnd}::timestamp

          ELSE NULL
        END,

      "updatedAt" = ${now}::timestamp;
  `;
}

export async function checkLoginRateLimit(
  email: string,
  ip: string | null
): Promise<boolean> {
  if (await isBlocked(emailKey(email))) {
    return false;
  }

  if (ip && (await isBlocked(ipKey(ip)))) {
    return false;
  }

  return true;
}

export async function recordFailedLogin(
  email: string,
  ip: string | null
): Promise<void> {
  await recordFailure(emailKey(email), EMAIL_LIMIT);

  if (ip) {
    await recordFailure(ipKey(ip), IP_LIMIT);
  }
}

export async function clearLoginRateLimit(
  email: string
): Promise<void> {
  await prisma.loginRateLimit.deleteMany({
    where: {
      identifier: emailKey(email),
    },
  });
}
