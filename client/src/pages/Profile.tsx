import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import UserProfile from '@/components/UserProfile';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { UserRound } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Reindirizza alla pagina di login se l'utente non è autenticato
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to view your profile",
        variant: "destructive",
      });
      navigate('/auth');
    }
  }, [user, navigate, toast]);

  if (!user) {
    return null; // Non mostrare nulla durante il reindirizzamento
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <UserRound className="mr-2 h-6 w-6" />
            My Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage your personal information and subscription details
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <UserProfile />
        </div>
      </main>
    </div>
  );
}