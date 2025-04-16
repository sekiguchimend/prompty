import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HelpHero from '../components/help/HelpHero';
import HelpCategoryGrid from '../components/help/HelpCategoryGrid';
import Head from 'next/head';

const HelpCenter: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Head>
        <title>ヘルプセンター | prompty</title>
        <meta name="description" content="Promptyのヘルプセンターへようこそ。よくある質問、ガイド、サポート情報をご覧いただけます。" />
      </Head>
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
