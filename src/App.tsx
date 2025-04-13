import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import PromptDetail from "./pages/PromptDetail";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Business from "./pages/Business";
import ForgotPassword from "./pages/ForgotPassword";
import HelpCenter from "./pages/HelpCenter";
import CommercialTransaction from "./pages/CommercialTransaction"; 
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import PaymentDisclosure from "./pages/PaymentDisclosure";
import HowToUse from "./pages/HowToUse";
import CreatePost from "./pages/CreatePost";
import Search from "./pages/Search"; // New import
import MyArticles from "./pages/MyArticles";
import Premium from "./pages/Premium";
import Feedback from './pages/Feedback';
import ContestPage from './pages/ContestPage';
import HashtagPage from './pages/HashtagPage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';
const queryClient = new QueryClient();

// 画面サイズに応じて柔軟にレイアウトを調整するコンポーネント
const ResponsiveLayout = () => {
  useEffect(() => {
    // viewport関連のCSS変数を設定する関数
    const updateViewportDimensions = () => {
      // 実際のビューポート幅（スクロールバーを含む）
      const vw = window.innerWidth;
      
      // CSS変数として設定（単位ピクセル）
      document.documentElement.style.setProperty('--vw', `${vw}px`);
      document.documentElement.style.setProperty('--vh', `${window.innerHeight}px`);
      
      // ビューポート幅の1%を設定（可変単位としての活用）
      document.documentElement.style.setProperty('--vw-1p', `${vw / 100}px`);
      document.documentElement.style.setProperty('--vh-1p', `${window.innerHeight / 100}px`);
    };
    
    // 初期設定
    updateViewportDimensions();
    
    // リサイズイベントでの更新
    window.addEventListener('resize', updateViewportDimensions);
    
    // 画面回転時の更新（モバイル向け）
    window.addEventListener('orientationchange', updateViewportDimensions);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('resize', updateViewportDimensions);
      window.removeEventListener('orientationchange', updateViewportDimensions);
    };
  }, []);
  
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ResponsiveLayout />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/prompts/:id" element={<PromptDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/business" element={<Business />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/how-to-use" element={<HowToUse />} />
          <Route path="/commercial-transaction" element={<CommercialTransaction />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/my-articles" element={<MyArticles />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/payment-disclosure" element={<PaymentDisclosure />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/search" element={<Search />} /> {/* New route */}
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/contests" element={<ContestPage />} />
          <Route path="/hashtag/:tag" element={<HashtagPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
