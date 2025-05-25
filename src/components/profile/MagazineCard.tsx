import React from 'react';
import Link from 'next/link';
import { BookOpen, Edit } from 'lucide-react';
import { MagazineData, getCoverUrl } from '../../types/content';

interface MagazineCardProps {
  magazine: MagazineData;
}

const MagazineCard: React.FC<MagazineCardProps> = ({ magazine }) => {
  // カバー画像URLを取得
  const coverUrl = getCoverUrl(magazine.cover_url);

  return (
    <Link href={`/magazines/${magazine.id}`} className="block">
      <div className="flex items-start mb-4">
        <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden mr-3 flex-shrink-0">
          <img 
            src={coverUrl} 
            alt={magazine.title} 
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{magazine.title}</h3>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <BookOpen className="h-3.5 w-3.5 mr-1" />
            <span>{magazine.articles_count} 本</span>
            <Link href={`/edit-magazine/${magazine.id}`} className="ml-3 text-blue-500 flex items-center">
              <Edit className="h-3 w-3 mr-1" />
              <span>編集</span>
            </Link>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MagazineCard; 