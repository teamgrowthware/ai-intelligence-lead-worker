"use server";

import { auth } from "@/auth";
import { getCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/auth";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";

export async function createPortfolioItemAction(formData: FormData) {
  const session = await auth();
  if (!session || !session.user) throw new Error("Unauthorized");
  requireRole(session.user as unknown as Parameters<typeof requireRole>[0], 'MANAGER');
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const industry = formData.get("industry") as string;
  const url = formData.get("url") as string;
  
  // Basic parsing for arrays
  const services = (formData.get("services") as string || "").split(",").map(s => s.trim()).filter(Boolean);
  const technologies = (formData.get("technologies") as string || "").split(",").map(s => s.trim()).filter(Boolean);
  const positioningCompatibility = (formData.get("positioningCompatibility") as string || "").split(",").map(s => s.trim()).filter(Boolean);

  await prisma.portfolioItem.create({
    data: {
      workspaceId,
      title,
      description,
      industry,
      url,
      services,
      technologies,
      positioningCompatibility,
      isActive: true,
    }
  });

  revalidatePath("/portfolio");
}

export async function togglePortfolioItemAction(itemId: string, isActive: boolean) {
  const session = await auth();
  if (!session || !session.user) throw new Error("Unauthorized");
  requireRole(session.user as unknown as Parameters<typeof requireRole>[0], 'MANAGER');
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);

  await prisma.portfolioItem.update({
    where: { id: itemId, workspaceId },
    data: { isActive: !isActive }
  });

  revalidatePath("/portfolio");
}
