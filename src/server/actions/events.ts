"use server";

import "use-server";

import { and, eq } from "drizzle-orm";

import { EventTable } from "@/drizzle/schema";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/drizzle/db";
import { eventFormSchema } from "@/schema/events";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function createEvent(
  unsafeData: z.infer<typeof eventFormSchema>
): Promise<{ error: boolean } | undefined> {
  const { userId } = await auth();
  console.log("Creating event with unsafe-data:", unsafeData);

  const { success, data } = eventFormSchema.safeParse(unsafeData);
  if (!success || userId == null) {
    return { error: true };
  }
  console.log("Creating event with data:", unsafeData);
  await db.insert(EventTable).values({ ...data, clerkUserId: userId });

  redirect("/events");
}
export async function updateEvent(
  id: string,
  unsafeData: z.infer<typeof eventFormSchema>
): Promise<{ error: boolean } | undefined> {
  const { userId } = await auth();

  const { success, data } = eventFormSchema.safeParse(unsafeData);
  if (!success || userId == null) {
    return { error: true };
  }
  const { rowCount } = await db
    .update(EventTable)
    .set({ ...data })
    .where(and(eq(EventTable.id, id), eq(EventTable.clerkUserId, userId)));

  if (rowCount === 0) {
    return { error: true };
  }
  redirect("/events");
}

export async function deleteEvent(
  id: string
): Promise<{ error: boolean } | undefined> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: true };
  }
  const { rowCount } = await db
    .delete(EventTable)
    .where(and(eq(EventTable.id, id), eq(EventTable.clerkUserId, userId)));

  if (rowCount === 0) {
    return { error: true };
  }
  redirect("/events");
}
