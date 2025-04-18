import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UserProfile as UserProfileType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
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

// Schema per la validazione del form
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Il nome deve contenere almeno 2 caratteri",
  }),
  age: z.coerce.number().min(1, {
    message: "L'età deve essere almeno 1",
  }).max(120, {
    message: "L'età deve essere al massimo 120",
  }),
  gender: z.enum(["maschio", "femmina", "altro"], {
    required_error: "Seleziona il genere",
  }),
  weight: z.coerce.number().min(20, {
    message: "Il peso deve essere almeno 20 kg",
  }).max(300, {
    message: "Il peso deve essere al massimo 300 kg",
  }),
  height: z.coerce.number().min(50, {
    message: "L'altezza deve essere almeno 50 cm",
  }).max(250, {
    message: "L'altezza deve essere al massimo 250 cm",
  }),
  activityLevel: z.enum(["sedentaria", "leggera", "moderata", "attiva", "molto attiva"], {
    required_error: "Seleziona il livello di attività",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Ottiene il profilo utente
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
        // Se l'errore è "User profile not found", restituisci null invece di generare un errore
        if (err instanceof Error && err.message.includes("User profile not found")) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!user,
    retry: false,
  });

  // Form per modifica del profilo
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      age: 30,
      gender: "maschio",
      weight: 70,
      height: 170,
      activityLevel: "moderata",
    },
  });

  // Quando viene caricato il profilo, popola il form
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        age: profile.age,
        gender: profile.gender as "maschio" | "femmina" | "altro",
        weight: profile.weight,
        height: profile.height,
        activityLevel: profile.activityLevel as "sedentaria" | "leggera" | "moderata" | "attiva" | "molto attiva",
      });
    }
  }, [profile, form]);

  // Creazione nuovo profilo
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
        title: "Profilo creato",
        description: "Il tuo profilo è stato creato con successo!",
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Aggiornamento del profilo esistente
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", `/api/user-profile/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-profile", user?.id.toString()] });
      toast({
        title: "Profilo aggiornato",
        description: "Il tuo profilo è stato aggiornato con successo!",
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
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

  // Visualizzazione del profilo dell'utente
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserRound className="h-5 w-5" />
          <span>Profilo Utente</span>
        </CardTitle>
        <CardDescription>
          Visualizza e gestisci le tue informazioni personali
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isProfileLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : profileError && profileError.message !== "User profile not found" ? (
          <div className="text-center py-4 text-destructive">
            <p>Si è verificato un errore nel caricamento del profilo</p>
            <p className="text-sm">{profileError.message}</p>
          </div>
        ) : profile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p className="text-lg font-medium">{profile.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Età</p>
                <p className="text-lg font-medium">{profile.age} anni</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Genere</p>
                <p className="text-lg font-medium capitalize">{profile.gender}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Peso</p>
                <p className="text-lg font-medium">{profile.weight} kg</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Altezza</p>
                <p className="text-lg font-medium">{profile.height} cm</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Livello di attività</p>
                <p className="text-lg font-medium capitalize">{profile.activityLevel}</p>
              </div>
            </div>
            <div className="pt-2">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Edit className="h-4 w-4 mr-2" />
                    Modifica
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Modifica profilo</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-10rem)] py-4">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome</FormLabel>
                              <FormControl>
                                <Input placeholder="Il tuo nome" {...field} />
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
                              <FormLabel>Età</FormLabel>
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
                              <FormLabel>Genere</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleziona un genere" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="maschio">Maschio</SelectItem>
                                  <SelectItem value="femmina">Femmina</SelectItem>
                                  <SelectItem value="altro">Altro</SelectItem>
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
                              <FormLabel>Peso (kg)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" {...field} />
                              </FormControl>
                              <FormDescription>
                                Inserisci il tuo peso in kilogrammi
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
                              <FormLabel>Altezza (cm)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormDescription>
                                Inserisci la tua altezza in centimetri
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
                              <FormLabel>Livello di attività</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleziona un livello" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="sedentaria">Sedentaria</SelectItem>
                                  <SelectItem value="leggera">Leggera</SelectItem>
                                  <SelectItem value="moderata">Moderata</SelectItem>
                                  <SelectItem value="attiva">Attiva</SelectItem>
                                  <SelectItem value="molto attiva">Molto attiva</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Quanto sei attivo durante la giornata
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <SheetFooter className="pt-4">
                          <SheetClose asChild>
                            <Button variant="outline" type="button">Annulla</Button>
                          </SheetClose>
                          <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="ml-2"
                          >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Salva
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
            <p className="text-muted-foreground mb-4">Non hai ancora creato un profilo. Crea un profilo per avere un'esperienza personalizzata.</p>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button>
                  <UserRound className="mr-2 h-4 w-4" />
                  Crea profilo
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>Crea profilo</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-10rem)] py-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Il tuo nome" {...field} />
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
                            <FormLabel>Età</FormLabel>
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
                            <FormLabel>Genere</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona un genere" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="maschio">Maschio</SelectItem>
                                <SelectItem value="femmina">Femmina</SelectItem>
                                <SelectItem value="altro">Altro</SelectItem>
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
                            <FormLabel>Peso (kg)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormDescription>
                              Inserisci il tuo peso in kilogrammi
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
                            <FormLabel>Altezza (cm)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Inserisci la tua altezza in centimetri
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
                            <FormLabel>Livello di attività</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona un livello" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="sedentaria">Sedentaria</SelectItem>
                                <SelectItem value="leggera">Leggera</SelectItem>
                                <SelectItem value="moderata">Moderata</SelectItem>
                                <SelectItem value="attiva">Attiva</SelectItem>
                                <SelectItem value="molto attiva">Molto attiva</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Quanto sei attivo durante la giornata
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <SheetFooter className="pt-4">
                        <SheetClose asChild>
                          <Button variant="outline" type="button">Annulla</Button>
                        </SheetClose>
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="ml-2"
                        >
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Save className="mr-2 h-4 w-4" />
                          Salva
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