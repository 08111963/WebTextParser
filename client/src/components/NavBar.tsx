import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bolt, Menu, X, User, Book, Home, LogOut, Settings, HelpCircle, DollarSign, Download, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useConditionalNavigation } from "@/lib/conditional-route";

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isPremium, plan } = useSubscription();
  const { navigateTo } = useConditionalNavigation();

  const closeMenu = () => setIsMenuOpen(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
    closeMenu();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and name */}
          <Link href="/" className="flex items-center space-x-2">
            <Bolt className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-green-600">NutriEasy</span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/guide">
              <Button variant={isActive("/guide") ? "default" : "ghost"} size="sm">
                <Book className="h-4 w-4 mr-1" />
                Guide
              </Button>
            </Link>
            
            <Link href="/pricing">
              <Button variant={isActive("/pricing") ? "default" : "ghost"} size="sm">
                <DollarSign className="h-4 w-4 mr-1" />
                Pricing
              </Button>
            </Link>
            
            <Link href="/install">
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Install App
              </Button>
            </Link>

            <Link href="/contatti">
              <Button variant={isActive("/contatti") ? "default" : "ghost"} size="sm">
                <MessageCircle className="h-4 w-4 mr-1" />
                Contact
              </Button>
            </Link>
            
            {user ? (
              <>
                <Link href="/home">
                  <Button variant={isActive("/home") ? "default" : "ghost"} size="sm">
                    <Home className="h-4 w-4 mr-1" />
                    Dashboard
                  </Button>
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {user.username}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <Link href="/profile">
                      <DropdownMenuItem onClick={closeMenu}>
                        <User className="h-4 w-4 mr-2" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    

                    
                    {plan === "trial" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Link href="/pricing" className="flex items-center w-full">
                            <DollarSign className="h-4 w-4 mr-2" />
                            <span>Upgrade Plan</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/auth">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  Login / Register
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? 
              <X className="h-6 w-6" /> : 
              <Menu className="h-6 w-6" />
            }
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div className="md:hidden py-3 px-4 border-t">
          <div className="flex flex-col space-y-2">
            <Link href="/guide" onClick={closeMenu}>
              <Button variant={isActive("/guide") ? "default" : "outline"} size="sm" className="w-full justify-start">
                <Book className="h-4 w-4 mr-2" />
                Guide
              </Button>
            </Link>
            
            <Link href="/pricing" onClick={closeMenu}>
              <Button variant={isActive("/pricing") ? "default" : "outline"} size="sm" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Pricing
              </Button>
            </Link>
            
            <Link href="/install" onClick={closeMenu} className="w-full">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
            </Link>

            <Link href="/contatti" onClick={closeMenu} className="w-full">
              <Button 
                variant={isActive("/contatti") ? "default" : "outline"} 
                size="sm" 
                className="w-full justify-start"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact
              </Button>
            </Link>
            
            {user ? (
              <>
                <Link href="/home" onClick={closeMenu}>
                  <Button variant={isActive("/home") ? "default" : "outline"} size="sm" className="w-full justify-start">
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={closeMenu}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                

                
                {plan === "trial" && (
                  <Link href="/pricing" onClick={closeMenu}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  </Link>
                )}
                
                <Button variant="outline" size="sm" className="w-full justify-start text-red-500" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/auth" onClick={closeMenu}>
                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Login / Register
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}