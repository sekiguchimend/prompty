
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
          <Route path="/terms" element={<Terms />} />
          <Route path="/payment-disclosure" element={<PaymentDisclosure />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/search" element={<Search />} /> {/* New route */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
