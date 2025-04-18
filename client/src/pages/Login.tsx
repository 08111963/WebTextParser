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
import { signIn, signUp, signInWithGoogle, resetPassword } from '@/lib/firebase';
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

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
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

            <div className="relative flex items-center justify-center my-4">
              <div className="absolute border-t border-gray-300 w-full"></div>
              <div className="relative bg-white px-4 text-sm text-gray-500">or</div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-md py-2 px-4 hover:bg-gray-50 transition-colors"
              onClick={handleGoogleSignIn}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" fill="#4285F4" />
                <path d="M12.545,10.239l9.426,0.013c0.823,3.898-1.03,11.748-9.426,11.748c-3.018,0-5.878-1.197-7.989-3.308C6.269,20.408,9.23,22,12.545,22c5.524,0,10.002-4.477,10.002-10C22.547,7.477,18.069,3,12.545,3c-3.018,0-5.878,1.197-7.989,3.308C6.269,4.592,9.23,3,12.545,3c2.594,0,4.958,0.988,6.735,2.617l-2.814,2.814C15.411,7.526,14.043,6.977,12.545,6.977c-3.332,0-6.033,2.701-6.033,6.032s2.701,6.032,6.033,6.032c2.798,0,4.733-1.657,5.445-3.972h-5.445V10.239z" fill="#34A853" />
                <path d="M4.555,14.836c0-0.387,0.033-0.776,0.098-1.154C4.982,9.139,8.388,6,12.545,6c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C6.312,2,1.25,6.453,0.259,12.341C0.087,13.141,0,13.567,0,14.836c0,0.387,0.033,0.776,0.098,1.154C0.768,20.501,5.83,24.953,12.063,25c3.113,0,5.957-1.173,8.079-3.308C17.929,23.408,15.139,25,12.063,25C6.312,25,1.25,20.547,0.259,14.659C0.087,13.859,0,13.433,0,12.164C0,8.374,1.897,4.968,4.896,2.892C1.897,4.968,0,8.374,0,12.164C0,13.433,0.087,13.859,0.259,14.659C1.25,20.547,6.312,25,12.063,25c3.076,0,5.866-1.592,7.581-4.308C17.522,22.827,14.677,24,11.564,24C5.331,24,0.768,19.548,0.098,13.99C0.033,13.612,0,13.223,0,12.836C0,12.449,0.033,12.06,0.098,11.682C0.768,6.124,5.331,1.672,11.564,2C15.139,2,18.503,3.672,20.28,6.303l-2.814,2.814C16.411,7.526,15.043,6.977,12.545,6.977C8.388,6.977,4.982,10.116,4.653,14.659C4.588,14.06,4.555,13.449,4.555,12.836C4.555,12.223,4.588,11.612,4.653,11.013C4.982,15.556,8.388,18.695,12.545,18.695c2.798,0,4.733-1.657,5.445-3.972h-5.445V10.239h9.426c0.823,3.898-1.03,11.748-9.426,11.748C7.63,21.987,4.555,18.626,4.555,14.836z" fill="#FBBC05" />
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-4.157,0-7.563-3.139-7.892-7.682c-0.065,0.599-0.098,1.21-0.098,1.823c0,3.79,3.075,7.151,7.99,7.151c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
