import React from 'react';
import { Card, CardContent } from '../ui/card';

interface HelpCategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const HelpCategoryCard: React.FC<HelpCategoryCardProps> = ({
  title,
  description,
  icon,
  onClick
}) => {
  return (
    <Card 
      className="h-full transition-all duration-200 hover:shadow-md hover:border-prompty-primary/50 cursor-pointer" 
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">{icon}</div>
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-bold">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HelpCategoryCard;
