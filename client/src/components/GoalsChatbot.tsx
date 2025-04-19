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
  Target
} from "lucide-react";

type Message = {
  type: "user" | "bot";
  content: string;
  timestamp: Date;
};

type GoalsChatbotProps = {
  userId: string;
};

export default function GoalsChatbot({ userId }: GoalsChatbotProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      content: "Hello! I'm the specialist assistant for nutritional goals. I can help you define and better understand your nutritional goals. What would you like to know?",
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
        chatType: "goals" // Indichiamo che è una richiesta specializzata per obiettivi
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
        title: "Error",
        description: "Unable to generate a response. Please try again later.",
        variant: "destructive",
      });
      
      setMessages(prev => [...prev, {
        type: "bot",
        content: "I'm sorry, an error occurred while generating the response. Please try again later.",
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
  
  // Example suggested messages for nutritional goals
  const suggestedQueries = [
    "How can I set a goal to lose weight in a healthy way?",
    "What is a good protein target for muscle gain?",
    "What are the recommended macronutrients for my profile?",
    "How do I balance carbs and fats for an energy goal?",
    "Can I have a personalized calorie goal based on my activity level?",
    "What are the nutritional goals for an athlete?",
  ];
  
  return (
    <Card className="w-full h-full min-h-[500px] flex flex-col shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <span>Nutritional Goals Consultant</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-hidden p-3 pt-4">
        <div className="h-[320px] overflow-y-auto pr-1 pl-1 space-y-5">
          {messages.map((message, i) => (
            <div key={i} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div 
                className={`max-w-[85%] flex flex-col ${message.type === "user" ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center mb-1 text-xs text-muted-foreground">
                  {message.type === "user" ? (
                    <>
                      <span>You</span>
                      <User className="h-3 w-3 ml-1" />
                    </>
                  ) : (
                    <>
                      <Target className="h-3 w-3 mr-1" />
                      <span>Nutritional Consultant</span>
                    </>
                  )}
                </div>
                
                <div 
                  className={`rounded-xl px-4 py-3 ${
                    message.type === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted rounded-tl-none"
                  }`}
                >
                  <div 
                    className="text-sm leading-6 whitespace-pre-wrap" 
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "break-word"
                    }}
                  >
                    {message.content}
                  </div>
                </div>
                
                <div className="text-[10px] text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {aiChatMutation.isPending && (
            <div className="flex justify-start">
              <div className="max-w-[85%] flex flex-col items-start">
                <div className="flex items-center mb-1 text-xs text-muted-foreground">
                  <Target className="h-3 w-3 mr-1" />
                  <span>Consulente Nutrizionale</span>
                </div>
                
                <div className="rounded-xl px-4 py-3 bg-muted rounded-tl-none">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm">Sto elaborando la risposta...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {messages.length === 1 && (
          <div className="mt-4 mb-1">
            <p className="text-sm font-medium mb-2">Esempi di domande:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.slice(0, 3).map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs text-left justify-start h-auto py-2 px-3"
                  onClick={() => {
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
                  }}
                >
                  {q.length > 40 ? q.substring(0, 40) + "..." : q}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 pb-3 px-3 border-t">
        <form className="flex space-x-2 w-full" onSubmit={handleSubmit}>
          <Input
            placeholder="Fai una domanda sugli obiettivi nutrizionali..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={aiChatMutation.isPending}
            className="flex-grow text-base py-5 px-4"
          />
          <Button 
            type="submit" 
            size="icon"
            className="h-10 w-10"
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