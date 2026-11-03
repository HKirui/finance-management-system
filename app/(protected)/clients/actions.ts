"use server";

import {auth} from "@/auth"
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createClient(formData: FormData) {
  const session = await auth();

if (!session?.user?.email) {
  throw new Error("You must be logged in to create a client.");
}
  // Get the client's name
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Client name is required.");
  }

  // Find the K-Link Solutions business profile
  const businessProfile = await prisma.financialProfile.findFirst({
    where: {
      type: "BUSINESS",
      user:{
        email: session.user.email,
      }
    },
  });

  if (!businessProfile) {
    throw new Error("Business financial profile not found.");
  }

  // Read optional client details
  const getOptionalField = (field: string) => {
    return String(formData.get(field) ?? "").trim() || null;
  };

  // Save the client in PostgreSQL
  await prisma.client.create({
    data: {
      name,
      email: getOptionalField("email"),
      phone: getOptionalField("phone"),
      company: getOptionalField("company"),
      address: getOptionalField("address"),
      notes: getOptionalField("notes"),
      profileId: businessProfile.id
    },
  });

  // Refresh the Clients page after saving
  revalidatePath("/clients");
}

export async function updateClient(formData: FormData) {
  const session = await auth();

if (!session?.user?.email) {
  throw new Error("You must be logged in to update a client.");
}

  // Get the client ID and updated name
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  // Validate required information
  if (!id) {
    throw new Error("Client ID is required.");
  }

  if (!name) {
    throw new Error("Client name is required.");
  }

  // Read optional fields
  const getOptionalField = (field: string) => {
    return String(formData.get(field) ?? "").trim() || null;
  };

  // Update the existing client in PostgreSQL
  const result = await prisma.client.updateMany({
    where: {
      id,
      profile: {
        type: "BUSINESS",
        user:{
          email: session.user.email,
        },
      },
    },
    data: {
      name,
      email: getOptionalField("email"),
      phone: getOptionalField("phone"),
      company: getOptionalField("company"),
      address: getOptionalField("address"),
      notes: getOptionalField("notes"),
    },
  });

  if (result.count !==1) {
    throw new Error("Client not found or access denied.");
  }

  // Refresh the Clients page
  revalidatePath("/clients");

  //Return to the clients directory
  redirect("/clients");
}

//client status management
export async function toggleClientStatus(formData: FormData) {

  const session = await auth();

if (!session?.user?.email) {
  throw new Error("You must be logged in to change client status.");
}

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Client ID is required.");
  }

  // Find the client in the business profile
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
    throw new Error("Business client not found.");
  }

  // Switch the client's current status
  const result = await prisma.client.updateMany({
    where: {
      id,
      profileId: client.profileId,
      isActive: client.isActive,
      profile:{
        type:"BUSINESS",
        user:{
          email:session.user.email,
        },
      },
    },
    data: {
      isActive: !client.isActive,
    },
  });

  if (result.count === 0) {
    throw new Error("Client status changed. Please refresh and try again.");
  }

  // Refresh the Clients directory
  revalidatePath("/clients");
}