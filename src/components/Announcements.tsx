"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format, formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Announcement {
  id: string;
  title: string;
  content: string;
  icon: string | null;
  icon_color: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .order('start_date', { ascending: false })
          .limit(5);

        if (error) throw error;
        setAnnouncements(data as unknown as Announcement[]);
      } catch (error) {
        console.error('お知らせの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-3 w-1/3"></div>
        <div className="h-3 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return null;
  }

  const getIconComponent = (icon: string | null, color: string | null) => {
    const bgColorClass = 
      color === 'red' ? 'bg-red-100' : 
      color === 'green' ? 'bg-green-100' : 
      color === 'blue' ? 'bg-blue-100' : 
      color === 'purple' ? 'bg-purple-100' : 'bg-gray-100';

    const textColorClass = 
      color === 'red' ? 'text-red-500' : 
      color === 'green' ? 'text-green-500' : 
      color === 'blue' ? 'text-blue-500' : 
      color === 'purple' ? 'text-purple-500' : 'text-gray-500';

    switch (icon) {
      case 'new_feature':
        return (
          <div className={`p-2 rounded-full ${bgColorClass}`}>
            <svg className={`w-5 h-5 ${textColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
        );
      case 'maintenance':
        return (
          <div className={`p-2 rounded-full ${bgColorClass}`}>
            <svg className={`w-5 h-5 ${textColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        );
      case 'campaign':
        return (
          <div className={`p-2 rounded-full ${bgColorClass}`}>
            <svg className={`w-5 h-5 ${textColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`p-2 rounded-full ${bgColorClass}`}>
            <svg className={`w-5 h-5 ${textColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ja });
    } catch (error) {
      return '日時不明';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-medium">お知らせ</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors">
            {getIconComponent(announcement.icon, announcement.icon_color)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
              <p className="text-sm text-gray-500">{announcement.content}</p>
              <p className="text-xs text-gray-400 mt-1">{getTimeAgo(announcement.start_date)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements; 