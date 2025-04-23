import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-muted/30 border-t py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">
              © {currentYear} NutriEasy. All rights reserved.
            </p>
          </div>
          
          <div className="flex space-x-6">
            <Link href="/guide" className="text-sm text-primary hover:text-primary/80 transition-colors">
              User Guide
            </Link>
            <Link href="/privacy-policy" className="text-sm text-primary hover:text-primary/80 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-sm text-primary hover:text-primary/80 transition-colors">
              Terms of Service
            </Link>
            <Link 
              href="/contatti"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}