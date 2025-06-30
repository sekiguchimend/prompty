
import React, { useState } from 'react';
import HelpCategoryCard from './HelpCategoryCard';
import HelpDialog from './HelpDialog';
import { helpData } from '../../data/helpData';
import { Book, User, Newspaper, Users, HelpCircle, MoreHorizontal, Briefcase, Bot } from 'lucide-react';

// Define categories with icons for the UI
const helpCategories = [
  {
    id: 'getting-started',
    icon: <Book className="h-6 w-6 text-prompty-primary" />
  },
  {
    id: 'about',
    icon: <HelpCircle className="h-6 w-6 text-prompty-primary" />
  },
  {
    id: 'account',
    icon: <User className="h-6 w-6 text-prompty-primary" />
  },
  {
    id: 'articles',
    icon: <Newspaper className="h-6 w-6 text-prompty-primary" />
  },
  {
    id: 'magazine',
    icon: <Book className="h-6 w-6 text-prompty-primary" />
  },
  {
    id: 'membership',
    icon: <Users className="h-6 w-6 text-prompty-primary" />
  },
  {
    id: 'faq',
    icon: <HelpCircle className="h-6 w-6 text-prompty-primary" />
  },
  {
    id: 'other-help',
    icon: <MoreHorizontal className="h-6 w-6 text-prompty-primary" />
  },
  {
    id: 'business',
    icon: <Briefcase className="h-6 w-6 text-prompty-primary" />
  }
];

const HelpCategoryGrid: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCardClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedCategory(null);
  };

  return (
    <section className="w-full py-12">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {helpCategories.map((category) => {
            const categoryData = helpData[category.id];
            return (
              <HelpCategoryCard
                key={category.id}
                title={categoryData?.title || 'タイトル未設定'}
                description={categoryData?.description || ''}
                icon={category.icon}
                onClick={() => handleCardClick(category.id)}
              />
            );
          })}
        </div>
        
        {/* AI Support Section */}
        <div className="mt-12 flex justify-end">
          <div className="flex items-center space-x-2 text-prompty-primary">
            <Bot className="h-10 w-10" />
            <span className="text-lg font-medium">AIサポート</span>
          </div>
        </div>
      </div>

      {/* Help Dialog */}
      {selectedCategory && (
        <HelpDialog
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          title={helpData[selectedCategory]?.title || 'ヘルプ'}
          description={helpData[selectedCategory]?.description}
          icon={helpCategories.find(cat => cat.id === selectedCategory)?.icon}
          helpItems={helpData[selectedCategory]?.helpItems || []}
        />
      )}
    </section>
  );
};

export default HelpCategoryGrid;
