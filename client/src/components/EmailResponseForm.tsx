import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Schema Zod per la validazione
const emailResponseSchema = z.object({
  email: z.string().email({ message: "Inserisci un indirizzo email valido" }),
  subject: z.string().min(3, { message: "L'oggetto deve contenere almeno 3 caratteri" }),
  message: z.string().min(10, { message: "Il messaggio deve contenere almeno 10 caratteri" }),
});

type EmailResponseFormValues = z.infer<typeof emailResponseSchema>;

export function EmailResponseForm() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  // Inizializziamo il form con react-hook-form
  const form = useForm<EmailResponseFormValues>({
    resolver: zodResolver(emailResponseSchema),
    defaultValues: {
      email: "",
      subject: "",
      message: "",
    },
  });

  // Mutazione per inviare la risposta
  const emailResponseMutation = useMutation({
    mutationFn: async (data: EmailResponseFormValues) => {
      const response = await apiRequest("POST", "/api/email-response", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Si è verificato un errore nell'invio della risposta");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Risposta inviata",
        description: "La tua risposta è stata inviata con successo. Ti contatteremo presto.",
        variant: "success",
      });
      form.reset();
      setSubmitted(true);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore nell'invio della risposta",
        variant: "destructive",
      });
    },
  });

  // Funzione per gestire il submit del form
  function onSubmit(data: EmailResponseFormValues) {
    emailResponseMutation.mutate(data);
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Contatta il Supporto</CardTitle>
        <CardDescription>
          Hai domande, commenti o feedback? Scrivici e ti risponderemo il prima possibile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="text-center p-4">
            <h3 className="text-lg font-medium text-green-600 mb-2">Grazie per averci contattato!</h3>
            <p className="text-gray-600">
              Abbiamo ricevuto il tuo messaggio e ti risponderemo al più presto.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setSubmitted(false)}
              className="mt-4"
            >
              Invia un altro messaggio
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="tua.email@esempio.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oggetto</FormLabel>
                    <FormControl>
                      <Input placeholder="Oggetto del messaggio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Messaggio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Scrivi il tuo messaggio qui..." 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={emailResponseMutation.isPending}
              >
                {emailResponseMutation.isPending ? "Invio in corso..." : "Invia messaggio"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}