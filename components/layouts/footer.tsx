"use client";

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-sm leading-loose text-center text-muted-foreground md:text-left">
            &copy; 2025 Prompty. All rights reserved.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/terms"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            利用規約
          </Link>
          <Link
            href="/privacy"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            プライバシーポリシー
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            お問い合わせ
          </Link>
        </div>
      </div>
    </footer>
  );
} 