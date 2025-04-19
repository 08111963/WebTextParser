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
import { Loader2, Send, Target, User, Utensils } from "lucide-react";

type Message = {
  type: "user" | "bot";
  content: string;
  timestamp: Date;
};

type ChatbotProps = {
  userId: string;
  type: "goals" | "meals";
};

export default function NewChatbot({ userId, type }: ChatbotProps) {
  const { toast } = useToast();
  
  // Determine the chatbot type and appropriate settings
  const isGoalsChatbot = type === "goals";
  const chatTitle = isGoalsChatbot ? "Goals Consultant" : "Meals Consultant";
  const botIcon = isGoalsChatbot ? <Target className="h-4 w-4" /> : <Utensils className="h-4 w-4" />;
  
  const initialMessage = isGoalsChatbot
    ? "Hello! I'm the specialist assistant for nutritional goals. I can help you define and better understand your nutritional goals. What would you like to know?"
    : "Hello! I'm your specialized nutrition assistant. I can help you with meal suggestions, recipes, and information about nutritional values of foods. What would you like to know?";
  
  const [messages, setMessages] = useState<Message[]>([
    { type: "bot", content: initialMessage, timestamp: new Date() }
  ]);
  
  const [query, setQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Examples of suggested queries based on chatbot type
  const suggestedQueries = isGoalsChatbot
    ? [
        "How can I set a goal to lose weight?",
        "What's a good protein target for muscle gain?",
        "Which macronutrients are suitable for my profile?"
      ]
    : [
        "What are the nutritional values of avocado?",
        "Suggest a protein-rich salad for lunch",
        "Alternatives to sugar for sweetening?"
      ];
  
  // Query AI mutation
  const aiChatMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await apiRequest("POST", "/api/ai-chat", {
        userId,
        query,
        chatType: type // Pass the chatbot type to the API
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
    <Card className="w-full min-h-[500px] flex flex-col shadow-md">
      <CardHeader className="py-3 border-b bg-card">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          {botIcon}
          <span>{chatTitle}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-hidden p-0">
        <div 
          className="h-[340px] p-4 overflow-y-auto flex flex-col space-y-6"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,0,0,0.2) transparent'
          }}
        >
          {messages.map((message, i) => (
            <div 
              key={i} 
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} px-2`}
            >
              <div className={`${message.type === "user" ? "items-end" : "items-start"} flex flex-col max-w-[85%]`}>
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {message.type === "user" ? (
                    <>
                      <span className="font-medium">You</span>
                      <User className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      {botIcon}
                      <span className="font-medium">{chatTitle}</span>
                    </>
                  )}
                </div>
                
                <div 
                  className={`rounded-2xl px-3.5 py-2.5 ${
                    message.type === "user" 
                      ? "bg-primary text-primary-foreground ml-4 rounded-tr-none" 
                      : "bg-muted mr-4 rounded-tl-none"
                  }`}
                >
                  <p 
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ wordBreak: "break-word" }}
                  >
                    {message.content}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground/70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {aiChatMutation.isPending && (
            <div className="flex justify-start px-2">
              <div className="items-start flex flex-col max-w-[85%]">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {botIcon}
                  <span className="font-medium">{chatTitle}</span>
                </div>
                
                <div className="rounded-2xl px-3.5 py-2.5 bg-muted rounded-tl-none mr-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <p className="text-sm">Sto elaborando la risposta...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {messages.length === 1 && (
          <div className="px-4 py-3 border-t border-b border-border/40 bg-muted/30">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Prova a chiedere:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs py-1 h-auto"
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
            placeholder={`Chiedi al ${chatTitle.toLowerCase()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={aiChatMutation.isPending}
            className="flex-1 py-5 px-4"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!query.trim() || aiChatMutation.isPending}
            className="h-10 w-10 rounded-full flex-shrink-0"
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