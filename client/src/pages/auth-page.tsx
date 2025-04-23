import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, Home, Eye, EyeOff, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
  }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the Terms of Service and Privacy Policy",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [loc] = useLocation();
  const [redirectPath, setRedirectPath] = useState<string>("/home");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isCheckingPreviousRegistration, setIsCheckingPreviousRegistration] = useState<boolean>(false);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
  
  // Mutation for checking if the email has already been used for registration
  const checkRegistrationMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      // Get client IP address (this will be more accurate when done on the server)
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip;
      
      const response = await apiRequest("POST", "/api/check-registration", {
        email: data.email,
        ipAddress
      });
      
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.hasPreviousRegistration) {
        setRegisterError(data.message);
      }
    },
    onError: (error) => {
      console.error("Error checking registration:", error);
    },
    onSettled: () => {
      setIsCheckingPreviousRegistration(false);
    }
  });
  
  useEffect(() => {
    // Check if there's a redirect parameter in the URL
    if (loc.includes('?')) {
      const params = new URLSearchParams(loc.split('?')[1]);
      const redirectParam = params.get('redirect');
      if (redirectParam) {
        setRedirectPath(redirectParam);
      }
    }
  }, [loc]);
  
  // Update error states when mutation state changes
  useEffect(() => {
    if (loginMutation.isError) {
      setLoginError(loginMutation.error?.message || "Authentication failed. Please check your credentials.");
    } else {
      setLoginError(null);
    }
  }, [loginMutation.isError, loginMutation.error]);
  
  useEffect(() => {
    if (registerMutation.isError) {
      setRegisterError(registerMutation.error?.message || "Registration failed. Please try again.");
    } else {
      setRegisterError(null);
    }
  }, [registerMutation.isError, registerMutation.error]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      gender: "other",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate({
      username: values.username,
      password: values.password,
    });
  };

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    // Reset any existing error
    setRegisterError(null);
    
    // First check if this email has already been used for a trial
    setIsCheckingPreviousRegistration(true);
    
    try {
      // Check for previous registrations with this email
      await checkRegistrationMutation.mutateAsync({ email: values.email });
      
      // If there's no error (duplicate registration), proceed with registration
      if (!registerError) {
        registerMutation.mutate({
          username: values.username,
          email: values.email,
          gender: values.gender,
          password: values.password,
        });
      }
    } catch (error) {
      // If check fails, continue with registration anyway
      console.error("Error checking previous registrations:", error);
      registerMutation.mutate({
        username: values.username,
        email: values.email,
        gender: values.gender,
        password: values.password,
      });
    }
  };

  // If the user is already authenticated, redirect to the specified path or protected home
  if (user) {
    return <Redirect to={redirectPath} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Log in to your account</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loginError && (
                    <div className="mb-4 p-3 bg-destructive/15 border border-destructive text-destructive rounded-md flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5 shrink-0">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" x2="12" y1="8" y2="12" />
                        <line x1="12" x2="12.01" y1="16" y2="16" />
                      </svg>
                      <span>{loginError}</span>
                    </div>
                  )}
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  type={showLoginPassword ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  {...field} 
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                              >
                                {showLoginPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
                          </>
                        ) : (
                          "Login"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Button variant="link" className="p-0" onClick={() => setActiveTab("register")}>
                      Register
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create a new account</CardTitle>
                  <CardDescription>
                    Enter your information to create a new account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {registerError && (
                    <div className="mb-4 p-3 bg-destructive/15 border border-destructive text-destructive rounded-md flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5 shrink-0">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" x2="12" y1="8" y2="12" />
                        <line x1="12" x2="12.01" y1="16" y2="16" />
                      </svg>
                      <span>{registerError}</span>
                    </div>
                  )}
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="name@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  type={showRegisterPassword ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  {...field} 
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                              >
                                {showRegisterPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  {...field} 
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="acceptTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="terms"
                                />
                              </div>
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                I agree to the <Link href="/terms-of-service" className="text-primary hover:underline" target="_blank">Terms of Service</Link> and <Link href="/privacy-policy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending || isCheckingPreviousRegistration}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...
                          </>
                        ) : isCheckingPreviousRegistration ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking registration...
                          </>
                        ) : (
                          "Register"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Button variant="link" className="p-0" onClick={() => setActiveTab("login")}>
                      Login
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 bg-primary p-6 flex flex-col justify-center items-center text-white md:p-10">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            Welcome to NutriEasy
          </h1>
          <p className="text-lg mb-8">
            The complete platform for monitoring your nutrition, managing your nutritional goals, and tracking your progress.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="mr-4 bg-white/10 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-utensils">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                  <path d="M7 2v20"></path>
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl">Track your meals</h3>
                <p className="text-white/80">Easily record all your meals and monitor your nutritional intake.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="mr-4 bg-white/10 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl">Set goals</h3>
                <p className="text-white/80">Define your nutritional goals and track your progress.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="mr-4 bg-white/10 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-line-chart">
                  <path d="M3 3v18h18"></path>
                  <path d="m19 9-5 5-4-4-3 3"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl">Analyze data</h3>
                <p className="text-white/80">View detailed statistics and personalized reports on your journey.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}