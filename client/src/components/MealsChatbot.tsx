import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Send, 
  User,
  Sparkles,
  Loader2,
  Utensils
} from "lucide-react";

type Message = {
  type: "user" | "bot";
  content: string;
  timestamp: Date;
};

type MealsChatbotProps = {
  userId: string;
};

export default function MealsChatbot({ userId }: MealsChatbotProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      content: "Ciao! Sono l'assistente specializzato in alimentazione. Posso aiutarti con suggerimenti per pasti, ricette, e informazioni su valori nutrizionali degli alimenti. Cosa vorresti sapere?",
      timestamp: new Date(),
    },
  ]);
  const [query, setQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const aiChatMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await apiRequest("POST", "/api/ai-chat", {
        userId,
        query,
        chatType: "meals" // Indichiamo che è una richiesta specializzata per pasti
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        type: "bot",
        content: data.answer,
        timestamp: new Date(data.timestamp)
      }]);
    },
    onError: (error: Error) => {
      console.error("Failed to get AI response:", error);
      toast({
        title: "Errore",
        description: "Non è stato possibile generare una risposta. Riprova più tardi.",
        variant: "destructive",
      });
      
      setMessages(prev => [...prev, {
        type: "bot",
        content: "Mi dispiace, si è verificato un errore durante la generazione della risposta. Riprova più tardi.",
        timestamp: new Date()
      }]);
    }
  });
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Submit message
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    // Add user message
    const newMessage: Message = {
      type: "user",
      content: query,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Call API
    aiChatMutation.mutate(query);
    
    // Reset input
    setQuery("");
  };
  
  // Esempio messaggi suggeriti per pasti e alimentazione
  const suggestedQueries = [
    "Quali sono i valori nutrizionali dell'avocado?",
    "Puoi suggerirmi un'insalata proteica per pranzo?",
    "Che alternative posso usare al posto dello zucchero?",
    "Che colazione mi consigli se seguo una dieta a basso contenuto di carboidrati?",
    "Quali sono i cibi più ricchi di ferro?",
    "Come posso preparare un pasto veloce e salutare per la cena?",
  ];
  
  return (
    <Card className="w-full h-[480px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2">
          <Utensils className="h-5 w-5 text-primary" />
          <span>Consulente Alimentare</span>
        </CardTitle>
        <CardDescription>
          Chiedi informazioni su pasti, alimenti e ricette
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-[300px] p-4">
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[80%] ${
                    message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <Avatar className={message.type === "user" ? "bg-primary" : "bg-muted"}>
                    {message.type === "user" ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Utensils className="h-5 w-5" />
                    )}
                    <AvatarFallback>
                      {message.type === "user" ? "TU" : "AI"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div
                    className={`rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                    style={{ maxWidth: "95%" }}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {aiChatMutation.isPending && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[80%]">
                  <Avatar className="bg-muted">
                    <Utensils className="h-5 w-5" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  
                  <div className="rounded-lg p-3 bg-muted">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm">Sto elaborando la risposta...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="text-sm text-muted-foreground mb-2">Esempi di domande:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.slice(0, 3).map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setQuery(q);
                    // Trigger submit after a brief delay to show the query in input
                    setTimeout(() => {
                      const newMessage: Message = {
                        type: "user",
                        content: q,
                        timestamp: new Date(),
                      };
                      setMessages(prev => [...prev, newMessage]);
                      aiChatMutation.mutate(q);
                      setQuery("");
                    }, 100);
                  }}
                >
                  {q.length > 30 ? q.substring(0, 30) + "..." : q}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-2">
        <form className="flex space-x-2 w-full" onSubmit={handleSubmit}>
          <Input
            placeholder="Fai una domanda su pasti e alimenti..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={aiChatMutation.isPending}
            className="flex-grow"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!query.trim() || aiChatMutation.isPending}
          >
            {aiChatMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}