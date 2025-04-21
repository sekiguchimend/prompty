
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';

const HelpHero: React.FC = () => {
  return (
    <section className="w-full bg-gray-50 py-12 md:py-20">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            prompty ヘルプセンターです。
          </h1>
          <p className="text-xl text-gray-600 md:text-2xl">
            なにかお困りですか？
          </p>
          <div className="w-full max-w-md mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input 
                type="search" 
                placeholder="検索" 
                className="w-full pl-10 bg-white border-gray-200 focus:border-prompty-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HelpHero;
