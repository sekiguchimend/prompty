import React from 'react';
import Head from 'next/head';
import { generateSiteUrl, getDefaultOgImageUrl } from '../utils/seo-helpers';

export default function PromptyProfile() {
  return (
    <>
      <Head>
        <title>Promptyについて｜AIプロンプトマーケットプレイス</title>
        <meta name="description" content="Promptyは、AIプロンプトを投稿・販売・購入できる革新的なマーケットプレイスです。クリエイターとユーザーをつなぎ、AI時代の新しい価値創造を支援します。" />
        <meta name="keywords" content="Prompty,AIプロンプト,マーケットプレイス,プロンプト販売,AI活用,デジタルコンテンツ" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content={generateSiteUrl('/prompty-profile')} />
        <meta property="og:title" content="Promptyについて｜AIプロンプトマーケットプレイス" />
        <meta property="og:description" content="Promptyは、AIプロンプトを投稿・販売・購入できる革新的なマーケットプレイスです。" />
        <meta property="og:image" content={getDefaultOgImageUrl()} />
        
        <link rel="canonical" href={generateSiteUrl('/prompty-profile')} />
      </Head>

      <div className="min-h-screen bg-white text-black overflow-hidden">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center relative z-10">
              <div className="overflow-hidden mb-8">
                <h1 className="text-8xl md:text-9xl font-black tracking-tighter leading-none transform hover:scale-105 transition-transform duration-700">
                  <span className="block relative">
                    Prompty
                    <div className="absolute -bottom-2 left-0 w-full h-1 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  </span>
                </h1>
              </div>
              <div className="space-y-6">
                <div className="relative inline-block">
                  <span className="text-xl md:text-3xl font-light tracking-widest uppercase bg-black text-white px-8 py-3 rounded-none relative">
                    AI Era Marketplace
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-black"></div>
                  </span>
                </div>
                <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
                  プロンプトを投稿し、販売し、購入する<br />
                  クリエイターとユーザーをつなぐ革新的なプラットフォーム
                </p>
              </div>
            </div>
          </div>
          
          {/* Advanced geometric background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-10 w-64 h-64 border border-black/10 rotate-45 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-black/5 rotate-12 animate-bounce"></div>
            <div className="absolute top-1/2 left-1/3 w-24 h-24 border-2 border-black/20 rounded-full animate-spin-slow"></div>
            <div className="absolute bottom-20 left-20 w-2 h-2 bg-black animate-ping"></div>
            <div className="absolute top-20 right-1/4 w-1 h-1 bg-black animate-ping delay-1000"></div>
            
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
          </div>
        </section>

        {/* What is Prompty Section */}
        <section className="py-32 bg-black text-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-8">
                <div className="overflow-hidden">
                  <h2 className="text-6xl md:text-7xl font-black mb-4 tracking-tighter">
                    What is
                  </h2>
                  <h2 className="text-6xl md:text-7xl font-black tracking-tighter mb-12 relative">
                    Prompty
                    <span className="absolute -bottom-2 left-0 w-20 h-1 bg-white"></span>
                  </h2>
                </div>
                <div className="space-y-8 text-lg leading-relaxed font-light">
                  <p className="text-gray-300">
                    Promptyは、AIプロンプトに特化した革新的なマーケットプレイスです。
                    高品質なプロンプトを通じて、AIの可能性を最大限に引き出します。
                  </p>
                  <p className="text-gray-300">
                    クリエイターは独自のプロンプトを投稿・販売し、
                    ユーザーは目的に合った最適なプロンプトを見つけることができます。
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-white text-black p-12 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
                  <div className="absolute bottom-0 right-0 w-1 h-full bg-black"></div>
                  
                  <div className="space-y-8">
                    {[
                      { label: 'プロンプト投稿', number: '01' },
                      { label: '収益化', number: '02' },
                      { label: 'コミュニティ', number: '03' },
                      { label: 'AI活用支援', number: '04' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between group">
                        <span className="text-xl font-medium group-hover:translate-x-2 transition-transform duration-300">
                          {item.label}
                        </span>
                        <span className="text-3xl font-black text-gray-300 group-hover:text-black transition-colors duration-300">
                          {item.number}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-black"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 border border-white/10 rotate-45"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5"></div>
        </section>

        {/* Features Section */}
        <section className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-6xl md:text-7xl font-black tracking-tighter mb-8">
                Features
              </h2>
              <div className="w-32 h-1 bg-black mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-16">
              {[
                {
                  title: 'プロンプト投稿',
                  description: '独自のプロンプトを簡単に投稿し、多くのユーザーに届けることができます。',
                  icon: '01'
                },
                {
                  title: '収益化システム', 
                  description: '高品質なプロンプトを販売し、クリエイター活動を収益化できます。',
                  icon: '02'
                },
                {
                  title: 'コミュニティ',
                  description: 'クリエイター同士が交流し、知識やアイデアを共有できるコミュニティ。',
                  icon: '03'
                }
              ].map((feature, index) => (
                <div key={index} className="group cursor-pointer">
                  <div className="relative bg-black text-white p-8 h-64 flex flex-col justify-between transform group-hover:-translate-y-4 transition-all duration-500">
                    <div>
                      <div className="text-6xl font-black mb-4 text-white/20">
                        {feature.icon}
                      </div>
                      <h3 className="text-2xl font-bold mb-4 leading-tight">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed font-light">
                      {feature.description}
                    </p>
                    
                    {/* Accent elements */}
                    <div className="absolute top-0 right-0 w-16 h-1 bg-white"></div>
                    <div className="absolute bottom-0 left-0 w-1 h-16 bg-white"></div>
                  </div>
                  
                  {/* Shadow element */}
                  <div className="bg-black/10 h-64 transform translate-y-2 group-hover:translate-y-4 transition-transform duration-500 -mt-64 -z-10"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-32 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-20">
              {/* For Creators */}
              <div className="group">
                <div className="bg-white border-2 border-black p-12 relative overflow-hidden transform group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500">
                  <div className="absolute top-0 left-0 w-full h-2 bg-black"></div>
                  
                  <h3 className="text-4xl font-black mb-8 tracking-tight">
                    For Creators
                  </h3>
                  
                  <ul className="space-y-6">
                    {[
                      '独自のプロンプトで収益を得る',
                      'グローバルなユーザーベースにリーチ', 
                      'フィードバックを通じたスキル向上',
                      'ブランド構築とファン獲得'
                    ].map((item, index) => (
                      <li key={index} className="flex items-start space-x-4 group">
                        <div className="w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-bold mt-1 flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-lg font-medium leading-relaxed group-hover:translate-x-1 transition-transform duration-300">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Shadow */}
                <div className="bg-black/20 border-2 border-black h-full transform translate-x-1 translate-y-1 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-500 -mt-12 -z-10"></div>
              </div>

              {/* For Users */}
              <div className="group">
                <div className="bg-black text-white border-2 border-black p-12 relative overflow-hidden transform group-hover:-translate-x-2 group-hover:-translate-y-2 transition-transform duration-500">
                  <div className="absolute top-0 right-0 w-full h-2 bg-white"></div>
                  
                  <h3 className="text-4xl font-black mb-8 tracking-tight">
                    For Users  
                  </h3>
                  
                  <ul className="space-y-6">
                    {[
                      '高品質なプロンプトを簡単に発見',
                      '業務効率化とコスト削減',
                      'カテゴリ別の検索とフィルタリング', 
                      'レビューと評価による品質保証'
                    ].map((item, index) => (
                      <li key={index} className="flex items-start space-x-4 group">
                        <div className="w-6 h-6 bg-white text-black flex items-center justify-center text-xs font-bold mt-1 flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-lg font-medium leading-relaxed text-gray-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Shadow */}
                <div className="bg-gray-400 border-2 border-black h-full transform -translate-x-1 translate-y-1 group-hover:-translate-x-4 group-hover:translate-y-4 transition-transform duration-500 -mt-12 -z-10"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-32 bg-black text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center relative z-10">
              <h2 className="text-6xl md:text-7xl font-black tracking-tighter mb-12">
                Our Vision
              </h2>
              
              <div className="max-w-4xl mx-auto mb-20">
                <p className="text-xl md:text-2xl font-light leading-relaxed text-gray-300">
                  AIとクリエイティビティが融合する新しい時代において、<br />
                  誰もが自分の知識とアイデアを価値に変えられる世界を創造します。
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-12">
                {[
                  { number: '10,000+', label: 'プロンプト' },
                  { number: '5,000+', label: 'クリエイター' },
                  { number: '50,000+', label: 'ユーザー' }
                ].map((stat, index) => (
                  <div key={index} className="group">
                    <div className="border border-white/20 p-8 relative overflow-hidden transform group-hover:scale-105 transition-transform duration-500">
                      <div className="text-5xl md:text-6xl font-black mb-4 tracking-tighter">
                        {stat.number}
                      </div>
                      <div className="text-lg font-light text-gray-400 uppercase tracking-widest">
                        {stat.label}
                      </div>
                      
                      {/* Accent line */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Background pattern */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-0 w-96 h-96 border border-white/5 rotate-45"></div>
            <div className="absolute bottom-1/4 right-0 w-64 h-64 border border-white/5 -rotate-12"></div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-white relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-6xl md:text-7xl font-black tracking-tighter mb-8">
              Get Started
            </h2>
            <div className="w-32 h-1 bg-black mx-auto mb-12"></div>
            
            <p className="text-xl text-gray-600 mb-16 font-light leading-relaxed">
              Promptyでプロンプトの世界を探索し、新しい価値を創造しましょう
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="group relative bg-black text-white px-12 py-6 text-lg font-semibold overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <span className="relative z-10">プロンプトを投稿する</span>
                <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                <div className="absolute inset-0 border-2 border-black group-hover:text-black transition-colors duration-500 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  プロンプトを投稿する
                </div>
              </button>
              
              <button className="group relative border-2 border-black text-black px-12 py-6 text-lg font-semibold overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <span className="relative z-10 group-hover:text-white transition-colors duration-500">プロンプトを探す</span>
                <div className="absolute inset-0 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right"></div>
              </button>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-24 h-24 border border-black/10 rotate-45"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-black/5 rotate-12"></div>
        </section>

        {/* Footer */}
        <footer className="py-16 bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-4xl font-black mb-4 tracking-tighter">Prompty</h3>
            <div className="w-16 h-1 bg-white mx-auto mb-6"></div>
            <p className="text-gray-400 font-light tracking-wide uppercase text-sm">
              AI Era Marketplace
            </p>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </>
  );
}