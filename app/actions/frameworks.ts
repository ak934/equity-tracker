"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createFramework(formData: FormData) {
  const { userId } = await auth.protect();
  const name = String(formData.get("name") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();

  if (!name || !instructions) {
    throw new Error("Name and instructions are required");
  }

  await prisma.analysisFramework.create({
    data: { clerkUserId: userId, name, instructions },
  });

  revalidatePath("/frameworks");
}

export async function deleteFramework(formData: FormData) {
  const { userId } = await auth.protect();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Framework id is required");
  }

  // Scoped to the owning user so one user can't delete another's framework
  // by guessing an id.
  await prisma.analysisFramework.deleteMany({ where: { id, clerkUserId: userId } });

  revalidatePath("/frameworks");
}
