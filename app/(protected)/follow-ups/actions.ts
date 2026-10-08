"use server"
import { auth } from "@/auth";
import { FollowupTaskService } from "@/services/FollowupTaskService";
import { revalidatePath } from "next/cache";

async function getWorkspace() {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) throw new Error("Unauthorized");
  return workspaceId;
}

export async function completeTaskAction(taskId: string) {
  const workspaceId = await getWorkspace();
  await FollowupTaskService.completeTask(workspaceId, taskId);
  revalidatePath("/follow-ups");
}

export async function cancelTaskAction(taskId: string) {
  const workspaceId = await getWorkspace();
  await FollowupTaskService.cancelTask(workspaceId, taskId);
  revalidatePath("/follow-ups");
}
