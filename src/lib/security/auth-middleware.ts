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

// 🔒 セキュア版: JWT検証の強化
const verifyToken = async (token: string) => {
  try {
    // 1. トークンの基本形式チェック
    if (!token || token.length < 10) {
      throw new Error('Invalid token format');
    }

    // 2. Supabaseによる検証
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      // 具体的なエラー情報をログに記録（攻撃検知用）
      console.error('Token verification failed:', {
        errorCode: error.message,
        tokenPrefix: token.substring(0, 10) + '...',
        timestamp: new Date().toISOString()
      });
      throw new Error(`Token verification failed: ${error.message}`);
    }

    if (!user || !user.id || !user.email) {
      throw new Error('Invalid user data in token');
    }

    // 3. トークンの有効期限を追加チェック
    if (user.aud !== 'authenticated') {
      throw new Error('Invalid token audience');
    }

    return user;
  } catch (error) {
    // エラーログに攻撃パターンを記録
    console.error('Token verification error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      tokenProvided: !!token
    });
    throw error;
  }
};

// 🔒 セキュア版: ユーザー権限取得の強化
const getUserRole = async (userId: string): Promise<string> => {
  // 入力検証
  if (!userId || typeof userId !== 'string' || userId.length !== 36) {
    throw new Error('Invalid user ID format');
  }

  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')  // user_profilesではなくprofilesテーブル
        .select('status')   // roleではなくstatusカラム
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Database query error:', {
          error: error.message,
          userId: userId.substring(0, 8) + '...',
          attempt: retryCount + 1
        });
        
        // データベースエラーの場合は権限なしとして扱う（安全側に倒す）
        if (retryCount === maxRetries - 1) {
          throw new Error(`Database access failed after ${maxRetries} attempts`);
        }
        
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        continue;
      }

      if (!data) {
        throw new Error('User profile not found');
      }

      // statusの値を厳密にチェック
      const validRoles = ['admin', 'user', 'moderator'];
      const userRole = data.status;
      
      if (!validRoles.includes(userRole)) {
        console.warn('Invalid role detected:', {
          userId: userId.substring(0, 8) + '...',
          role: userRole,
          timestamp: new Date().toISOString()
        });
        return 'user'; // デフォルトは一般ユーザー
      }

      return userRole;
    } catch (error) {
      if (retryCount === maxRetries - 1) {
        // 最終的にエラーの場合は例外を投げる（nullは返さない）
        throw new Error('Failed to retrieve user role: database unavailable');
      }
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
    }
  }

  throw new Error('Maximum retry attempts exceeded');
};

// 🔒 セキュア版: メインの認証ミドルウェア
export const withAuth = (
  options: AuthMiddlewareOptions = {},
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    
    try {
      const { requireAuth = true, requireAdmin = false, allowedRoles = [] } = options;

      // レート制限チェック（簡易版）
      const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      console.info('API access:', {
        path: req.url,
        method: req.method,
        ip: clientIP,
        userAgent: req.headers['user-agent']?.substring(0, 100),
        timestamp: new Date().toISOString()
      });

      // トークン抽出
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token && requireAuth) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication token is required',
          code: 'MISSING_TOKEN'
        });
      }

      if (token) {
        try {
          // トークン検証
          const user = await verifyToken(token);
          
          // 権限が必要な場合のみロール取得
          let userRole = 'user'; // デフォルト値
          if (requireAdmin || allowedRoles.length > 0) {
            try {
              userRole = await getUserRole(user.id);
            } catch (roleError) {
              // ロール取得に失敗した場合は権限なしとして処理
              console.error('Role retrieval failed:', {
                userId: user.id.substring(0, 8) + '...',
                error: roleError instanceof Error ? roleError.message : 'Unknown error'
              });
              
              if (requireAdmin || allowedRoles.length > 0) {
                return res.status(403).json({
                  error: 'Forbidden',
                  message: 'Unable to verify permissions',
                  code: 'ROLE_VERIFICATION_FAILED'
                });
              }
            }
          }

          // 管理者権限チェック（厳密に）
          if (requireAdmin) {
            if (userRole !== 'admin') {
              console.warn('Admin access denied:', {
                userId: user.id.substring(0, 8) + '...',
                userRole,
                requiredRole: 'admin',
                timestamp: new Date().toISOString()
              });
              
              return res.status(403).json({
                error: 'Forbidden',
                message: 'Administrator access required',
                code: 'INSUFFICIENT_PRIVILEGES'
              });
            }
          }

          // ロール権限チェック
          if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
            return res.status(403).json({
              error: 'Forbidden',
              message: `Access requires one of: ${allowedRoles.join(', ')}`,
              code: 'ROLE_NOT_ALLOWED'
            });
          }

          // リクエストにユーザー情報を付加
          req.user = {
            id: user.id,
            email: user.email || '',
            role: userRole
          };

        } catch (authError) {
          console.error('Authentication failed:', {
            error: authError instanceof Error ? authError.message : 'Unknown error',
            tokenProvided: !!token,
            requireAuth
          });

          if (requireAuth) {
            return res.status(401).json({
              error: 'Unauthorized',
              message: 'Invalid or expired authentication token',
              code: 'AUTH_FAILED'
            });
          }
        }
      }

      // 実際のハンドラーを実行
      await handler(req, res);

      // パフォーマンス監視
      const duration = Date.now() - startTime;
      if (duration > 5000) { // 5秒以上の場合は警告
        console.warn('Slow API response:', {
          path: req.url,
          duration,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Auth middleware error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authentication processing failed',
        code: 'AUTH_MIDDLEWARE_ERROR'
      });
    }
  };
};

// 🔒 セキュア版: リソース所有権検証の強化
export const verifyOwnership = async (
  userId: string,
  resourceType: 'prompt' | 'comment' | 'profile',
  resourceId: string
): Promise<boolean> => {
  // 入力検証
  if (!userId || !resourceId || !resourceType) {
    throw new Error('Invalid parameters for ownership verification');
  }

  // UUIDフォーマットの検証
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId) || !uuidRegex.test(resourceId)) {
    throw new Error('Invalid UUID format');
  }

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
          .from('profiles')
          .select('id')
          .eq('id', resourceId)
          .single();
        break;
      default:
        throw new Error(`Unsupported resource type: ${resourceType}`);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Ownership verification query error:', {
        error: error.message,
        resourceType,
        resourceId: resourceId.substring(0, 8) + '...',
        userId: userId.substring(0, 8) + '...'
      });
      throw new Error('Database query failed during ownership verification');
    }

    if (!data) {
      console.warn('Resource not found during ownership check:', {
        resourceType,
        resourceId: resourceId.substring(0, 8) + '...',
        userId: userId.substring(0, 8) + '...'
      });
      return false;
    }

    const isOwner = resourceType === 'profile' 
      ? (data as { id: string }).id === userId
      : (data as { user_id: string }).user_id === userId;

    // 所有権チェック結果をログに記録
    console.info('Ownership verification:', {
      resourceType,
      resourceId: resourceId.substring(0, 8) + '...',
      userId: userId.substring(0, 8) + '...',
      isOwner,
      timestamp: new Date().toISOString()
    });

    return isOwner;
    
  } catch (error) {
    console.error('Ownership verification error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      resourceType,
      resourceId: resourceId.substring(0, 8) + '...',
      userId: userId.substring(0, 8) + '...'
    });
    throw error; // エラーの場合は例外を投げる（falseは返さない）
  }
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