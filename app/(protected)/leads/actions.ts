"use server";

import { auth } from "@/auth";
import { getCurrentWorkspace } from "@/lib/workspace";
import { LeadService } from "@/services/LeadService";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createLeadAction(formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);
  const userId = session.user.id!;

  const data = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    whatsapp: formData.get("whatsapp") as string,
    jobTitle: formData.get("jobTitle") as string,
    contactLinkedinUrl: formData.get("contactLinkedinUrl") as string,
    
    companyName: formData.get("companyName") as string,
    domain: formData.get("domain") as string,
    website: formData.get("website") as string,
    industry: formData.get("industry") as string,
    
    source: formData.get("source") as string,
    originalRequirement: formData.get("originalRequirement") as string,
    serviceRequired: formData.get("serviceRequired") as string,
    estimatedBudget: formData.get("estimatedBudget") as string,
    timeline: formData.get("timeline") as string,
    priority: formData.get("priority") as string,
  };

  const lead = await LeadService.createLead(workspaceId, data, userId);

  revalidatePath("/leads");
  revalidatePath("/");
  redirect(`/leads/${lead.id}`);
}

export async function updateLeadAction(leadId: string, formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);

  const data = {
    status: formData.get("status") as string,
    priority: formData.get("priority") as string,
    assignedTo: formData.get("assignedTo") as string,
  };

  // Filter out empty values
  const updateData = Object.fromEntries(Object.entries(data).filter((entry) => entry[1] != null && entry[1] !== ""));

  await LeadService.updateLead(workspaceId, leadId, updateData);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/");
}
