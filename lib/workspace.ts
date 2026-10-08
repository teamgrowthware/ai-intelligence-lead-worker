import { AuthorizationError } from "./errors";

export interface CurrentUser {
  id: string;
  email: string;
  workspaceId: string;
  role: string;
}

export function getCurrentUser(session: { user?: CurrentUser } | null): CurrentUser {
  if (!session?.user) {
    throw new AuthorizationError("Not authenticated");
  }
  return session.user;
}

export function getCurrentWorkspace(session: { user?: CurrentUser } | null): string {
  const user = getCurrentUser(session);
  if (!user.workspaceId) {
    throw new AuthorizationError("User does not belong to a workspace");
  }
  return user.workspaceId;
}

export function requireWorkspaceAccess(session: { user?: CurrentUser } | null, resourceWorkspaceId: string): void {
  const currentWorkspaceId = getCurrentWorkspace(session);
  if (currentWorkspaceId !== resourceWorkspaceId) {
    throw new AuthorizationError("You do not have access to this workspace resource");
  }
}
