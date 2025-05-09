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
      content: "Hello! I'm your specialized nutrition assistant. I can help you with meal suggestions, recipes, and information about nutritional values of foods. What would you like to know?",
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
        chatType: "meals" // Indicate that this is a specialized request for meals
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
  
  // Example suggested messages for meals and nutrition
  const suggestedQueries = [
    "What are the nutritional values of avocado?",
    "Can you suggest a protein-rich salad for lunch?",
    "What alternatives can I use instead of sugar?",
    "What breakfast do you recommend if I follow a low-carb diet?",
    "Which foods are richest in iron?",
    "How can I prepare a quick and healthy meal for dinner?",
  ];
  
  return (
    <Card className="w-full h-full min-h-[500px] flex flex-col shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          <span>Nutrition Consultant</span>
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
                      <Utensils className="h-3 w-3 mr-1" />
                      <span>Nutrition Consultant</span>
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
                  <Utensils className="h-3 w-3 mr-1" />
                  <span>Nutrition Consultant</span>
                </div>
                
                <div className="rounded-xl px-4 py-3 bg-muted rounded-tl-none">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm">Processing response...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {messages.length === 1 && (
          <div className="mt-4 mb-1">
            <p className="text-sm font-medium mb-2">Example questions:</p>
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
            placeholder="Ask a question about meals and foods..."
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