import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bolt, User, LogOut, LogIn, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const handleSignOut = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Bolt className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-semibold">NutriEasy</h1>
            </div>
          </Link>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden rounded-md p-2 text-gray-500 hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-sm flex items-center">
                <Bolt className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="text-sm flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Pricing
              </Button>
            </Link>
            
            {user ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="text-sm px-4 py-2 rounded transition flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Link href="/auth">
                <Button 
                  variant="default" 
                  size="sm"
                  className="text-sm px-4 py-2 rounded transition flex items-center"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="bg-white shadow-lg absolute top-14 right-0 w-48 z-10 rounded-md overflow-hidden">
          <div className="py-1">
            <Link href="/">
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                <Bolt className="h-4 w-4 mr-2" />
                Home
              </button>
            </Link>
            <Link href="/pricing">
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Pricing
              </button>
            </Link>
            
            {user ? (
              <button 
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            ) : (
              <Link href="/auth">
                <button 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
