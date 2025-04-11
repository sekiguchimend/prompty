
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HelpHero from '@/components/help/HelpHero';
import HelpCategoryGrid from '@/components/help/HelpCategoryGrid';
import { Helmet } from 'react-helmet';

const HelpCenter: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Helmet>
        <title>ヘルプセンター | prompty</title>
      </Helmet>
      <Header />
      <main className="flex-1">
        <HelpHero />
        <HelpCategoryGrid />
      </main>
      <Footer />
    </div>
  );
};

export default HelpCenter;
