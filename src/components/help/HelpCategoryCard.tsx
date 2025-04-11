
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

interface HelpCategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  url: string;
}

const HelpCategoryCard: React.FC<HelpCategoryCardProps> = ({
  title,
  description,
  icon,
  url
}) => {
  return (
    <Link to={url}>
      <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-prompty-primary/50">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-bold">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default HelpCategoryCard;
