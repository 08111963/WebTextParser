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

// Schema Zod for validation
const emailResponseSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  subject: z.string().min(3, { message: "Subject must contain at least 3 characters" }),
  message: z.string().min(10, { message: "Message must contain at least 10 characters" }),
});

type EmailResponseFormValues = z.infer<typeof emailResponseSchema>;

export function EmailResponseForm() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  // Initialize the form with react-hook-form
  const form = useForm<EmailResponseFormValues>({
    resolver: zodResolver(emailResponseSchema),
    defaultValues: {
      email: "",
      subject: "",
      message: "",
    },
  });

  // Mutation to send the response
  const emailResponseMutation = useMutation({
    mutationFn: async (data: EmailResponseFormValues) => {
      const response = await apiRequest("POST", "/api/email-response", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An error occurred while sending your message");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully. We will contact you soon.",
        variant: "default",
      });
      form.reset();
      setSubmitted(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while sending your message",
        variant: "destructive",
      });
    },
  });

  // Function to handle form submission
  function onSubmit(data: EmailResponseFormValues) {
    emailResponseMutation.mutate(data);
  }

  return (
    <div className="w-full max-w-md mx-auto bg-card rounded-lg border shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">Contact Support</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Do you have questions, comments, or feedback? Write to us and we'll respond as soon as possible.
        </p>
        {submitted ? (
          <div className="text-center p-4">
            <h3 className="text-lg font-medium text-green-600 mb-2">Thank you for contacting us!</h3>
            <p className="text-gray-600">
              We have received your message and will respond as soon as possible.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setSubmitted(false)}
              className="mt-4"
            >
              Send another message
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
                      <Input placeholder="your.email@example.com" {...field} />
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
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Message subject" {...field} />
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
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your message here..." 
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
                {emailResponseMutation.isPending ? "Sending..." : "Send message"}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}