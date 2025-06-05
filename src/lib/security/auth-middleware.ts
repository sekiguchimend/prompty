import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../supabaseAdminClient';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  allowedRoles?: string[];
}

// Extract and verify JWT token
const verifyToken = async (token: string) => {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid token');
    }

    return user;
  } catch (error) {
    throw new Error('Token verification failed');
  }
};

// Get user role from database
const getUserRole = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.role;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
};

// Main authentication middleware
export const withAuth = (
  options: AuthMiddlewareOptions = {},
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const { requireAuth = true, requireAdmin = false, allowedRoles = [] } = options;

      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token && requireAuth) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication token is required'
        });
      }

      if (token) {
        try {
          // Verify token and get user
          const user = await verifyToken(token);
          
          // Get user role if needed
          let userRole = null;
          if (requireAdmin || allowedRoles.length > 0) {
            userRole = await getUserRole(user.id);
          }

          // Check admin requirement
          if (requireAdmin && userRole !== 'admin') {
            return res.status(403).json({
              error: 'Forbidden',
              message: 'Admin access required'
            });
          }

          // Check role requirements
          if (allowedRoles.length > 0 && (!userRole || !allowedRoles.includes(userRole))) {
            return res.status(403).json({
              error: 'Forbidden',
              message: 'Insufficient permissions'
            });
          }

          // Attach user to request
          req.user = {
            id: user.id,
            email: user.email || '',
            role: userRole || undefined
          };

        } catch (error) {
          if (requireAuth) {
            return res.status(401).json({
              error: 'Unauthorized',
              message: 'Invalid authentication token'
            });
          }
        }
      }

      // Call the actual handler
      await handler(req, res);

    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authentication processing failed'
      });
    }
  };
};

// Convenience middleware for admin-only routes
export const withAdminAuth = (
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return withAuth({ requireAuth: true, requireAdmin: true }, handler);
};

// Convenience middleware for optional auth
export const withOptionalAuth = (
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return withAuth({ requireAuth: false }, handler);
};

// User ownership verification
export const verifyOwnership = async (
  userId: string,
  resourceType: 'prompt' | 'comment' | 'profile',
  resourceId: string
): Promise<boolean> => {
  try {
    let query;
    
    switch (resourceType) {
      case 'prompt':
        query = supabaseAdmin
          .from('prompts')
          .select('user_id')
          .eq('id', resourceId)
          .single();
        break;
      case 'comment':
        query = supabaseAdmin
          .from('comments')
          .select('user_id')
          .eq('id', resourceId)
          .single();
        break;
      case 'profile':
        query = supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('id', resourceId)
          .single();
        break;
      default:
        return false;
    }

    const { data, error } = await query;
    
    if (error || !data) {
      return false;
    }

    if (resourceType === 'profile') {
      return (data as { id: string }).id === userId;
    } else {
      return (data as { user_id: string }).user_id === userId;
    }
    
  } catch (error) {
    console.error('Ownership verification error:', error);
    return false;
  }
};

// Middleware to check resource ownership
export const withOwnership = (
  resourceType: 'prompt' | 'comment' | 'profile',
  getResourceId: (req: AuthenticatedRequest) => string,
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return withAuth({ requireAuth: true }, async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const resourceId = getResourceId(req);
      const userId = req.user!.id;

      const isOwner = await verifyOwnership(userId, resourceType, resourceId);
      const isAdmin = req.user!.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access this resource'
        });
      }

      await handler(req, res);
    } catch (error) {
      console.error('Ownership middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Permission verification failed'
      });
    }
  });
};

export default withAuth;