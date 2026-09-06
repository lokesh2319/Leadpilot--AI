import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { Request, Response, NextFunction } from 'express';
import { getOrCreateUserWorkspace, UserDoc, CompanyDoc } from './workspaces.js';

export const authAdminApp =
  getApps().find((app) => app.name === 'authVerifier') ||
  initializeApp({ projectId: 'webhook-4dd1d' }, 'authVerifier');

export const authAdmin = getAuth(authAdminApp);

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    email_verified?: boolean;
    [key: string]: any;
  };
  workspace?: {
    id: string;
    role: 'owner' | 'admin' | 'manager' | 'agent';
    user: UserDoc;
    company: CompanyDoc;
  };
}

/**
 * Verifies Firebase ID tokens against project `webhook-4dd1d`.
 * Enforces email_verified === true on backend.
 * Resolves user workspace server-side to guarantee multi-tenant authorization.
 */
export async function verifyFirebaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Bearer token is missing or malformed.',
      });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Bearer token is empty.',
      });
    }

    const decodedToken = await authAdmin.verifyIdToken(token);

    // Enforce email verification on backend
    if (!decodedToken.email_verified) {
      return res.status(403).json({
        success: false,
        error: 'Email verification required. Please verify your email before accessing LeadPilot.',
      });
    }

    req.user = decodedToken;

    // Resolve workspace server-side (and auto-onboard if first visit)
    const userWorkspace = await getOrCreateUserWorkspace(
      decodedToken.uid,
      decodedToken.email || 'user@leadpilot.ai'
    );

    req.workspace = {
      id: userWorkspace.company.id,
      role: userWorkspace.user.role,
      user: userWorkspace.user,
      company: userWorkspace.company,
    };

    next();
  } catch (error: any) {
    console.error('Firebase auth error:', error?.message || error);
    return res.status(401).json({
      success: false,
      error: 'Invalid, expired, or revoked authentication token.',
    });
  }
}

/**
 * Role-Based Access Control (RBAC) middleware:
 * Validates whether the authenticated user has one of the required roles.
 */
export function requireRole(allowedRoles: ('owner' | 'admin' | 'manager' | 'agent')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.workspace) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No active workspace found.',
      });
    }

    if (!allowedRoles.includes(req.workspace.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Action requires one of the following roles: ${allowedRoles.join(', ')}.`,
      });
    }

    next();
  };
}
