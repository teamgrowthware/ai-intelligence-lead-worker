"use server"
import { auth, prisma } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createCampaignAction(name: string, description: string) {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) throw new Error("Unauthorized");
  
  await prisma.campaign.create({
    data: { workspaceId, name, status: "DRAFT" }
  });
  revalidatePath('/campaigns');
}
