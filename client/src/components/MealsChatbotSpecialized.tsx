import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, User, Utensils, Coffee, UtensilsCrossed } from "lucide-react";

type Message = {
  type: "user" | "bot";
  content: string;
  timestamp: Date;
};

type MealsChatbotProps = {
  userId: string;
};

export default function MealsChatbotSpecialized({ userId }: MealsChatbotProps) {
  const { toast } = useToast();
  
  const initialMessage = "Ciao! Sono l'assistente specializzato in alimentazione. Posso aiutarti con ricette personalizzate, valori nutrizionali degli alimenti, suggerimenti per pasti equilibrati e rispondere a domande specifiche sui cibi. Come posso aiutarti oggi?";
  
  const [messages, setMessages] = useState<Message[]>([
    { type: "bot", content: initialMessage, timestamp: new Date() }
  ]);
  
  const [query, setQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Esempi di domande specifiche per pasti e alimentazione
  const suggestedQueries = [
    "Suggeriscimi un'alternativa al riso bianco",
    "Quali sono i valori nutrizionali dell'avocado?",
    "Come posso preparare un pranzo veloce e proteico?"
  ];
  
  // Query AI mutation
  const aiChatMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await apiRequest("POST", "/api/ai-chat", {
        userId,
        query,
        chatType: "meals" // Specifichiamo che è una richiesta per pasti
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
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Handle form submission
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
  
  // Handle suggested query click
  const handleSuggestedQuery = (q: string) => {
    setQuery(q);
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
  };
  
  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="py-3 border-b bg-primary/5">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          <span>Consulente Alimentare</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="chat-container">
          {messages.map((message, i) => (
            <div key={i} className="w-full flex">
              <div 
                className={`chat-bubble ${
                  message.type === "user" ? "chat-bubble-user" : "chat-bubble-bot"
                }`}
              >
                <div>{message.content}</div>
                <div className="text-[10px] opacity-60 mt-1 text-right">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {aiChatMutation.isPending && (
            <div className="w-full flex">
              <div className="chat-bubble chat-bubble-bot">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sto elaborando la risposta sugli alimenti...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {messages.length === 1 && (
          <div className="px-4 py-3 border-t border-b">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Domande sulla nutrizione e i pasti:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSuggestedQuery(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t p-3">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder="Chiedi informazioni su alimenti e ricette..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={aiChatMutation.isPending}
            className="chat-input"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!query.trim() || aiChatMutation.isPending}
            className="chat-send-button"
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