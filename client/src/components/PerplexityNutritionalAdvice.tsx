import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Banana, MessageSquare, UserCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PerplexityNutritionalAdviceProps = {
  userId: string;
};

export default function PerplexityNutritionalAdvice({ userId }: PerplexityNutritionalAdviceProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [advice, setAdvice] = useState<string | null>(null);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(userId !== "0");

  // Mutation per ottenere consigli personalizzati
  const adviceMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await apiRequest("POST", "/api/perplexity/nutritional-advice", {
        userId,
        query,
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      setAdvice(data.advice);
      setQuery("");
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile generare i consigli nutrizionali. Riprova più tardi.",
        variant: "destructive",
      });
    },
  });

  // Gestisce l'invio della richiesta
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast({
        title: "Attenzione",
        description: "Inserisci una domanda prima di inviare.",
        variant: "default",
      });
      return;
    }
    
    adviceMutation.mutate(query);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banana className="h-5 w-5 text-primary" />
          <span>Consigli Nutrizionali con Perplexity AI</span>
        </CardTitle>
        <CardDescription>
          Ricevi consigli personalizzati da un esperto nutrizionista AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isUserAuthenticated ? (
          <div className="text-center py-10 border rounded-lg">
            <UserCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Accedi per Consulti Personalizzati</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Accedi o registrati per ricevere consigli nutrizionali personalizzati in base al tuo profilo.
            </p>
            <Button onClick={() => {
              toast({
                title: "Autenticazione richiesta",
                description: "Per utilizzare i consigli nutrizionali personalizzati è necessario accedere o registrarsi.",
                duration: 5000
              });
            }}>
              Accedi per Sbloccare
            </Button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="query" className="text-sm font-medium">
                    La tua domanda sul tema nutrizionale
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Powered by Perplexity AI
                  </span>
                </div>
                <Textarea
                  id="query"
                  placeholder="Ad esempio: Come posso aumentare l'apporto proteico nella mia dieta? Quali alimenti contengono più ferro? Cosa mangiare prima dell'allenamento?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={3}
                  className="w-full"
                />
              </div>
              <Button
                type="submit"
                disabled={adviceMutation.isPending || !query.trim()}
                className="w-full sm:w-auto"
              >
                {adviceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Consultazione in corso...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chiedi Consiglio
                  </>
                )}
              </Button>
            </form>

            {adviceMutation.isPending ? (
              <div className="flex justify-center py-12 mt-6">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Il nutrizionista AI sta elaborando la tua richiesta...
                  </p>
                </div>
              </div>
            ) : advice ? (
              <div className="mt-8 border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Banana className="h-5 w-5 text-primary" />
                  <span>Consulto Nutrizionale</span>
                </h3>
                <ScrollArea className="max-h-[400px]">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {advice.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : null}

            {!advice && !adviceMutation.isPending && (
              <div className="text-center py-8 space-y-4 mt-8 border rounded-lg">
                <div className="rounded-full w-16 h-16 mx-auto bg-muted flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">
                    Chiedi al nutrizionista AI
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Inserisci la tua domanda sopra e riceverai consigli nutrizionali
                    personalizzati in base al tuo profilo.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}