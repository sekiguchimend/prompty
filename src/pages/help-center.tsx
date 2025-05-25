import React from 'react';
import Footer from '../components/footer';
import HelpHero from '../components/help/HelpHero';
import HelpCategoryGrid from '../components/help/HelpCategoryGrid';
import Head from 'next/head';
import { ChevronLeft, Search, MessageCircle, Book, Settings, Shield, CreditCard } from 'lucide-react';

const HelpCenter: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Head>
        <title>ヘルプセンター | prompty</title>
        <meta name="description" content="Promptyのヘルプセンターへようこそ。よくある質問、ガイド、サポート情報をご覧いただけます。" />
      </Head>
      <main className="flex-1">
        <HelpHero />
        <HelpCategoryGrid />
      </main>
      <Footer />
    </div>
  );
};

export default HelpCenter;
