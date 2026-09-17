"use server";

import { revalidatePath } from "next/cache";
import { getNexusAuthContext } from "@/lib/nexus/nexus-rbac";
import { CancelMeetingHandler } from "@/lib/nexus/meeting-domain";

export async function cancelMeetingAction(meetingId: string) {
  try {
    const authCtx = await getNexusAuthContext(null, undefined); // Note: Server actions handle auth via cookies typically. Wait, getNexusAuthContext in Server Components requires `null, token` or `headers()`.
    
    // In Server Actions, we can just pass null for headers since we don't have them easily accessible as Request headers, or we can use next/headers
    const { headers } = await import("next/headers");
    const reqHeaders = await headers();
    const authCtxFromHeaders = await getNexusAuthContext(reqHeaders);

    const result = await CancelMeetingHandler.execute(meetingId, authCtxFromHeaders);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath("/nexus/agenda");
    return { success: true };
  } catch (error: any) {
    console.error("[CancelMeetingAction] Error:", error);
    return { success: false, error: "Internal Server Error" };
  }
}
