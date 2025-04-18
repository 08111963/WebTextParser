import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { signIn, signUp, resetPassword } from '@/lib/firebase';
import { Bolt } from 'lucide-react';

const authFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormValues = z.infer<typeof authFormSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSignIn = async (values: AuthFormValues) => {
    try {
      setIsSigningIn(true);
      await signIn(values.email, values.password);
      navigate('/');
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async (values: AuthFormValues) => {
    try {
      setIsSigningUp(true);
      await signUp(values.email, values.password);
      toast({
        title: "Registration Complete",
        description: "Please check your email to verify your account.",
      });
    } catch (error) {
      let message = "Failed to create account. Please try again.";
      if (error instanceof Error && error.message.includes("email-already-in-use")) {
        message = "Email already in use. Try signing in instead.";
      }
      toast({
        title: "Registration Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSigningUp(false);
    }
  };



  const handleResetPassword = async () => {
    const email = form.getValues("email");
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsResettingPassword(true);
      await resetPassword(email);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center">
            <Bolt className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-primary mt-2">Welcome to NutriFacile</h2>
          <p className="text-neutral-medium">Track your nutrition easily</p>
        </div>

        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder="Email" 
                      {...field} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Password" 
                      {...field} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
              <Button
                type="button"
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors"
                onClick={form.handleSubmit(handleSignIn)}
                disabled={isSigningIn}
              >
                {isSigningIn ? 'Signing In...' : 'Sign In'}
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                className="flex-1 bg-secondary hover:bg-secondary-dark text-white font-medium py-2 px-4 rounded-md transition-colors"
                onClick={form.handleSubmit(handleSignUp)}
                disabled={isSigningUp}
              >
                {isSigningUp ? 'Signing Up...' : 'Sign Up'}
              </Button>
            </div>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-secondary hover:text-secondary-dark text-sm"
                onClick={handleResetPassword}
                disabled={isResettingPassword}
              >
                {isResettingPassword ? 'Sending...' : 'Forgot Password?'}
              </Button>
            </div>


          </form>
        </Form>
      </div>
    </div>
  );
}
