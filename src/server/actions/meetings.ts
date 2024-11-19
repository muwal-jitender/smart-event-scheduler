"use server";

import "use-server";

import { createCalendarEvent } from "@/server/actions/googleCalendar";
import { db } from "@/drizzle/db";
import { fromZonedTime } from "date-fns-tz";
import { getValidTimesFromSchedule } from "@/lib/getValidTimesFromSchedule";
import { meetingActionSchema } from "@/schema/meetings";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function createMeeting(
  unsafeData: z.infer<typeof meetingActionSchema>
) {
  const { success, data } = meetingActionSchema.safeParse(unsafeData);

  if (!success) return { error: true };

  const event = await db.query.EventTable.findFirst({
    where: ({ clerkUserId, isActive, id }, { eq, and }) =>
      and(
        eq(isActive, true),
        eq(clerkUserId, data.clerkUserId),
        eq(id, data.eventId)
      ),
  });

  if (event == null) return { error: true };
  const startInTimezone = fromZonedTime(data.startTime, data.timezone);

  const validTimes = await getValidTimesFromSchedule([startInTimezone], event);
  if (validTimes.length === 0) return { error: true };

  await createCalendarEvent({
    ...data,
    startTime: startInTimezone,
    durationInMinutes: event.durationInMinutes,
    eventName: event.name,
  });

  redirect(
    `/book/${data.clerkUserId}/${
      data.eventId
    }/success?startTime=${data.startTime.toISOString()}`
  );
}