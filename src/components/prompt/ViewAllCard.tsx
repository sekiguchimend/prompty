import React, { memo } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, GridIcon } from '../ui/icons';

interface ViewAllCardProps {
  categoryPath: string;
  sectionPrefix?: string;
  className?: string;
}

export const ViewAllCard: React.FC<ViewAllCardProps> = memo(({
  categoryPath,
  sectionPrefix = '',
  className,
}) => {
  const linkPath = categoryPath || '/prompts';
  
  return (
    <Link 
      href={linkPath}
      className={`block group/view-all ${className}`}
    >
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-full flex flex-col items-center justify-center p-6 transition-all duration-200 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 group-hover/view-all:shadow-md">
        {/* アイコン */}
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover/view-all:shadow-md transition-shadow duration-200">
          <GridIcon className="w-8 h-8 text-gray-400 group-hover/view-all:text-blue-500 transition-colors duration-200" />
        </div>
        
        {/* テキスト */}
        <div className="text-center">
          <h3 className="font-medium text-gray-700 group-hover/view-all:text-blue-700 mb-2 transition-colors duration-200">
            すべて見る
          </h3>
          <p className="text-sm text-gray-500 group-hover/view-all:text-blue-600 mb-4 transition-colors duration-200">
            {sectionPrefix && `${sectionPrefix}の`}全ての記事を表示
          </p>
          
          {/* 矢印アイコン */}
          <div className="flex items-center justify-center text-gray-400 group-hover/view-all:text-blue-500 transition-all duration-200 group-hover/view-all:translate-x-1">
            <span className="text-sm mr-1">詳細を見る</span>
            <ArrowRightIcon className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
});

ViewAllCard.displayName = 'ViewAllCard'; 