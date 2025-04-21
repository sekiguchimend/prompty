
import React from 'react';

interface AvatarGroupProps {
  avatars: string[];
  count: number;
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({ avatars, count }) => {
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2 overflow-hidden">
        {avatars.slice(0, 5).map((avatar, i) => (
          <img 
            key={i}
            src={avatar} 
            alt={`User ${i + 1}`}
            className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
          />
        ))}
      </div>
      <span className="ml-2 text-sm font-medium text-gray-700">
        {count}人が高評価
      </span>
    </div>
  );
};

export default AvatarGroup;
