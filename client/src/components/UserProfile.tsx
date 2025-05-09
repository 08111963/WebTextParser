import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UserProfile as UserProfileType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";
import { Link } from "wouter";

// Import componenti per i calcoli fitness
import BMICard from "@/components/BMICard";
import MetabolismCard from "@/components/MetabolismCard";
import PremiumFeature from "@/components/PremiumFeature";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sheet, 
  SheetTrigger, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserRound, Edit, Save, Loader2, Download } from "lucide-react";

// Form validation schema
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must contain at least 2 characters",
  }),
  age: z.coerce.number().min(1, {
    message: "Age must be at least 1",
  }).max(120, {
    message: "Age must be at most 120",
  }),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
  }),
  weight: z.coerce.number().min(20, {
    message: "Weight must be at least 20 kg",
  }).max(300, {
    message: "Weight must be at most 300 kg",
  }),
  height: z.coerce.number().min(50, {
    message: "Height must be at least 50 cm",
  }).max(250, {
    message: "Height must be at most 250 cm",
  }),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"], {
    required_error: "Please select an activity level",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { plan, isPremium, trialActive, trialDaysLeft, trialEndDate } = useSubscription();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Function to export user data
  const exportUserData = async () => {
    if (!user) return;
    
    try {
      setIsExporting(true);
      
      // Fetch user data export
      const response = await fetch('/api/export-data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const data = await response.json();
      
      // Create a JSON file for download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'nutrieasy-data-export.json';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Data exported",
        description: "Your data has been successfully exported.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export your data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Get user profile
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
    isError,
    refetch: refetchProfile
  } = useQuery<UserProfileType | null>({
    queryKey: ["/api/user-profile", user?.id], // Aggiunto l'ID utente come parte della chiave di query
    queryFn: async () => {
      try {
        // Special case for admin user with ID 999999
        if (user?.id === 999999) {
          console.log("Admin user detected, returning hardcoded profile");
          return {
            id: 999,
            userId: "999999",
            name: "Administrator",
            age: 35,
            gender: "other",
            height: 180,
            weight: 75,
            activityLevel: "moderate",
            createdAt: new Date(),
            updatedAt: new Date()
          } as UserProfileType;
        }
        
        // The API will get the user ID from the authenticated user
        console.log("User ID for profile request:", user?.id);
        
        const res = await apiRequest("GET", "/api/user-profile");
        
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Authentication required");
          }
          if (res.status === 404) {
            console.log("No user profile found, will show create profile form");
            return null;
          }
          const errorText = await res.text();
          throw new Error(`Failed to fetch profile: ${errorText}`);
        }
        
        const profileData = await res.json();
        console.log("Profilo utente ricevuto:", profileData);
        return profileData;
      } catch (err) {
        console.error("Error fetching user profile:", err);
        if (err instanceof Error && 
            (err.message.includes("User profile not found") || 
             err.message.includes("404"))) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!user,
    retry: (failureCount, error) => {
      // Don't retry if it's a 404 error (profile not found)
      if (error instanceof Error && 
          (error.message.includes("User profile not found") || 
           error.message.includes("404"))) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 0, // Forza un refresh ogni volta che il componente viene montato
    refetchOnWindowFocus: true, // Ricarica quando la finestra ottiene il focus
  });

  // Profile edit form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      age: 30,
      gender: "male",
      weight: 70,
      height: 170,
      activityLevel: "moderate",
    },
  });

  // Function to map old Italian gender values to new English values
  const mapGender = (gender: string): "male" | "female" | "other" => {
    const genderMap: Record<string, "male" | "female" | "other"> = {
      "maschio": "male",
      "femmina": "female",
      "altro": "other",
      "male": "male",
      "female": "female",
      "other": "other"
    };
    return genderMap[gender] || "male";
  };

  // Function to map old Italian activity level values to new English values
  const mapActivityLevel = (level: string): "sedentary" | "light" | "moderate" | "active" | "very_active" => {
    const levelMap: Record<string, "sedentary" | "light" | "moderate" | "active" | "very_active"> = {
      "sedentaria": "sedentary",
      "leggera": "light",
      "moderata": "moderate",
      "attiva": "active",
      "molto attiva": "very_active",
      "sedentary": "sedentary",
      "light": "light",
      "moderate": "moderate",
      "active": "active",
      "very active": "very_active",
      "very_active": "very_active"
    };
    return levelMap[level] || "moderate";
  };

  // When profile is loaded, populate the form
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        age: profile.age,
        gender: mapGender(profile.gender),
        weight: profile.weight,
        height: profile.height,
        activityLevel: mapActivityLevel(profile.activityLevel),
      });
    }
  }, [profile, form]);

  // Create new profile
  const createProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("POST", "/api/user-profile", {
        ...data,
        userId: user?.id.toString(),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-profile", user?.id] });
      toast({
        title: "Profile created",
        description: "Your profile has been created successfully!",
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `An error occurred: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update existing profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", `/api/user-profile/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-profile", user?.id] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully!",
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `An error occurred: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const isSubmitting = createProfileMutation.isPending || updateProfileMutation.isPending;

  function onSubmit(data: ProfileFormValues) {
    if (profile) {
      updateProfileMutation.mutate(data);
    } else {
      createProfileMutation.mutate(data);
    }
  }

  if (!user) {
    return null;
  }

  // Render the common form for editing or creating profile
  const ProfileForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
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
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (kg)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="height"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Height (cm)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="activityLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="very_active">Very Active</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <SheetFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {profile ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {profile ? "Update Profile" : "Create Profile"}
              </>
            )}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );

  // User profile display
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserRound className="h-5 w-5" />
          <span>User Profile</span>
        </CardTitle>
        <CardDescription>
          View and manage your personal information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isProfileLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : profileError ? (
          <div className="text-center py-4">
            {profileError.message === "User profile not found" ? (
              <>
                <p className="mb-4">You don't have a profile yet. Please create one to continue.</p>
                <Button 
                  onClick={() => setIsOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Profile
                </Button>
              </>
            ) : (
              <>
                <p>An error occurred while loading the profile</p>
                <p className="text-sm text-destructive">{profileError.message}</p>
              </>
            )}
          </div>
        ) : !profile ? (
          <div className="text-center py-4">
            <p className="mb-4">You don't have a profile yet. Please create one to continue.</p>
            <Button 
              onClick={() => setIsOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Create Profile
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-card">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{profile.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Age</p>
                <p className="text-lg font-medium">{profile.age} years</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gender</p>
                <p className="text-lg font-medium capitalize">{mapGender(profile.gender)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weight</p>
                <p className="text-lg font-medium">{profile.weight} kg</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Height</p>
                <p className="text-lg font-medium">{profile.height} cm</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Activity Level</p>
                <p className="text-lg font-medium capitalize">{mapActivityLevel(profile.activityLevel)}</p>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="text-lg font-semibold mb-2">Subscription Status</h3>
              <div className="flex items-center space-x-2 mb-4">
                <div className={`h-3 w-3 rounded-full ${plan === 'trial' && !trialActive ? 'bg-red-500' : plan.includes('premium') ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="font-medium">
                  {plan === 'trial' && !trialActive ? 'Trial Expired' : 
                   plan === 'trial' && trialActive ? 'Free Trial' :
                   plan === 'premium-monthly' ? 'Premium Monthly' :
                   plan === 'premium-yearly' ? 'Premium Yearly' : 'Premium'}
                </span>
              </div>
              
              {trialActive && trialEndDate && (
                <p className="text-sm text-muted-foreground">
                  Your free trial ends in {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} on{' '}
                  {new Date(trialEndDate).toLocaleDateString()}
                </p>
              )}
              
              {plan === 'trial' && !trialActive && (
                <div className="mt-2">
                  <Link href="/pricing">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Upgrade to Premium
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            
            <div className="pt-2 flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={exportUserData} 
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export Data
              </Button>
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Edit Profile</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-10rem)] py-4">
                    <ProfileForm />
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        )}
        
        {/* Sheet for creating/editing profile */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="right" className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>{profile ? "Edit Profile" : "Create Profile"}</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-10rem)] py-4">
              <ProfileForm />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}