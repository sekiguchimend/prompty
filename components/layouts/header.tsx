"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Prompty</span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            <Link
              href="/prompts"
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              プロンプト一覧
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              ダッシュボード
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              ログイン
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm">アカウント作成</Button>
          </Link>
        </div>
      </div>
    </header>
  );
} 