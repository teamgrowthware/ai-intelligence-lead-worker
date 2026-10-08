import { RoleType } from "@prisma/client";
import { AuthorizationError } from "./errors";

// Role Hierarchy definition: Admin > Manager > Sales > Viewer
const roleHierarchy: Record<RoleType, number> = {
  ADMIN: 40,
  MANAGER: 30,
  SALES: 20,
  VIEWER: 10,
};

export function hasRole(userRole: RoleType, requiredRole: RoleType): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function requireAuth(user: { id?: string } | null | undefined): void {
  if (!user || !user.id) {
    throw new AuthorizationError("User is not authenticated");
  }
}

export function requireRole(user: { id?: string; role?: RoleType } | null | undefined, requiredRole: RoleType): void {
  if (!user || !user.role) {
    throw new AuthorizationError("User is not authenticated or has no role");
  }
  if (!hasRole(user.role, requiredRole)) {
    throw new AuthorizationError(`Action requires ${requiredRole} role`);
  }
}

export function requirePermission(user: { id?: string; role?: RoleType } | null | undefined, resource: string, action: string): void {
  requireAuth(user);
  // TODO: Check against specific permissions in DB if needed. 
  // For now, relying on basic Admin role check as placeholder for granular permissions.
  if (user?.role !== "ADMIN") {
    throw new AuthorizationError(`Action requires explicit permission for ${action} on ${resource}`);
  }
}
