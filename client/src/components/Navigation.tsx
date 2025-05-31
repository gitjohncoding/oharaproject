import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/admin", label: "Admin" },
  ];

  if (isAuthenticated && user) {
    navItems.splice(1, 0, { href: "/profile", label: "My Favorites" });
  }

  return (
    <nav className="bg-card shadow-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-xl font-semibold cursor-pointer">
                <span className="text-primary">Voices</span> <span className="text-foreground">for Frank O'Hara</span>
              </h1>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span className={`text-foreground hover:text-primary transition-colors font-medium cursor-pointer ${
                  location === item.href ? 'text-primary' : ''
                }`}>
                  {item.label}
                </span>
              </Link>
            ))}
            
            {/* Auth Controls */}
            <div className="flex items-center space-x-4">
              {isLoading ? (
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              ) : isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {user.firstName || user.email || 'User'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = '/api/logout'}
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.location.href = '/api/login'}
                  className="flex items-center space-x-1"
                >
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={location === item.href ? "default" : "ghost"}
                        className="w-full justify-start text-left"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                  
                  {/* Mobile Auth Controls */}
                  <div className="border-t pt-4 mt-6">
                    {isLoading ? (
                      <div className="w-full h-10 bg-muted rounded animate-pulse" />
                    ) : isAuthenticated && user ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 px-3 py-2 bg-muted rounded">
                          <User className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {user.firstName || user.email || 'User'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            window.location.href = '/api/logout';
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="default"
                        className="w-full justify-start"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          window.location.href = '/api/login';
                        }}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Login
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
