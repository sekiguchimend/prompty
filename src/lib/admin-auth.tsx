import React from 'react';
import { supabase } from './supabaseClient';

// 管理者権限をチェックする関数
export const checkAdminStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.status === 'admin';
  } catch (error) {
    console.error('管理者権限チェックエラー:', error);
    return false;
  }
};

// 現在のユーザーが管理者かどうかをチェックする関数
export const checkCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return false;
    }

    return await checkAdminStatus(session.user.id);
  } catch (error) {
    console.error('現在のユーザーの管理者権限チェックエラー:', error);
    return false;
  }
}; 