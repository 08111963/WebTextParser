import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UserProfile as UserProfileType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

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
import { UserRound, Edit, Save, Loader2 } from "lucide-react";

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
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very active"], {
    required_error: "Please select an activity level",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Get user profile
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
    isError
  } = useQuery<UserProfileType>({
    queryKey: ["/api/user-profile", user?.id.toString()],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/user-profile?userId=${user?.id}`);
        return await res.json();
      } catch (err) {
        // If the error is "User profile not found", return null instead of throwing an error
        if (err instanceof Error && err.message.includes("User profile not found")) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!user,
    retry: false,
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
  const mapActivityLevel = (level: string): "sedentary" | "light" | "moderate" | "active" | "very active" => {
    const levelMap: Record<string, "sedentary" | "light" | "moderate" | "active" | "very active"> = {
      "sedentaria": "sedentary",
      "leggera": "light",
      "moderata": "moderate",
      "attiva": "active",
      "molto attiva": "very active",
      "sedentary": "sedentary",
      "light": "light",
      "moderate": "moderate",
      "active": "active",
      "very active": "very active"
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
      queryClient.invalidateQueries({ queryKey: ["/api/user-profile", user?.id.toString()] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/user-profile", user?.id.toString()] });
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
        ) : profileError && profileError.message !== "User profile not found" ? (
          <div className="text-center py-4 text-destructive">
            <p>An error occurred while loading the profile</p>
            <p className="text-sm">{profileError.message}</p>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <PremiumFeature
                feature="bmi-calculator"
                title="BMI Calculator"
                description="Calculate and track your Body Mass Index based on your height and weight"
              >
                <BMICard weight={profile.weight} height={profile.height} />
              </PremiumFeature>
              
              <PremiumFeature
                feature="metabolism-calculator"
                title="Metabolism Calculator"
                description="Get personalized metabolic rate calculations based on your physical profile"
              >
                <MetabolismCard 
                  weight={profile.weight} 
                  height={profile.height} 
                  age={profile.age}
                  gender={profile.gender} 
                  activityLevel={profile.activityLevel} 
                />
              </PremiumFeature>
            </div>
            
            <div className="pt-2">
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
                          control={form.control}
                          name="weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight (kg)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" {...field} />
                              </FormControl>
                              <FormDescription>
                                Enter your weight in kilograms
                              </FormDescription>
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
                              <FormDescription>
                                Enter your height in centimeters
                              </FormDescription>
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
                                    <SelectValue placeholder="Select a level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="sedentary">Sedentary</SelectItem>
                                  <SelectItem value="light">Light</SelectItem>
                                  <SelectItem value="moderate">Moderate</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="very active">Very Active</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                How active you are during the day
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <SheetFooter className="pt-4">
                          <SheetClose asChild>
                            <Button variant="outline" type="button">Cancel</Button>
                          </SheetClose>
                          <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="ml-2"
                          >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </Button>
                        </SheetFooter>
                      </form>
                    </Form>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-muted-foreground mb-4">You haven't created a profile yet. Create a profile for a personalized experience.</p>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button>
                  <UserRound className="mr-2 h-4 w-4" />
                  Create Profile
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>Create Profile</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-10rem)] py-4">
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
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (kg)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormDescription>
                              Enter your weight in kilograms
                            </FormDescription>
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
                            <FormDescription>
                              Enter your height in centimeters
                            </FormDescription>
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
                                  <SelectValue placeholder="Select a level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="sedentary">Sedentary</SelectItem>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="very active">Very Active</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              How active you are during the day
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <SheetFooter className="pt-4">
                        <SheetClose asChild>
                          <Button variant="outline" type="button">Cancel</Button>
                        </SheetClose>
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="ml-2"
                        >
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                      </SheetFooter>
                    </form>
                  </Form>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </CardContent>
    </Card>
  );
}