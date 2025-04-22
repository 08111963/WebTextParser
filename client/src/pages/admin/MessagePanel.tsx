import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface EmailResponse {
  id: number;
  userId: string;
  email: string;
  subject: string;
  message: string;
  originalEmailId: string;
  createdAt: string;
  status: 'new' | 'read' | 'replied' | 'closed';
}

export default function MessagePanel() {
  const [activeTab, setActiveTab] = useState<string>('new');
  
  const { data: responses, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/email-responses'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/email-responses/unread');
      if (!res.ok) {
        throw new Error('Failed to fetch messages');
      }
      return res.json();
    }
  });

  const handleUpdateStatus = async (id: number, status: 'read' | 'replied' | 'closed') => {
    try {
      const res = await apiRequest('PATCH', `/api/email-response/${id}/status`, { status });
      if (res.ok) {
        refetch();
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p>Error loading messages. You may not have admin privileges.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se non ci sono risposte, mostriamo un messaggio
  if (!responses || responses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Message Panel</CardTitle>
          <CardDescription>View and manage messages from users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <p className="text-gray-500">No messages found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filtrare le risposte in base allo stato attivo
  const filteredResponses = responses.filter(response => {
    if (activeTab === 'all') return true;
    return response.status === activeTab;
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Message Panel</CardTitle>
        <CardDescription>View and manage messages from users</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
            <TabsTrigger value="replied">Replied</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-4">
              {filteredResponses.map((response: EmailResponse) => (
                <Card key={response.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{response.subject}</h3>
                      <Badge variant={
                        response.status === 'new' ? 'default' : 
                        response.status === 'read' ? 'secondary' : 
                        response.status === 'replied' ? 'success' : 'outline'
                      }>
                        {response.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      From: {response.email} | 
                      Date: {new Date(response.createdAt).toLocaleString()}
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-3">
                      <p className="whitespace-pre-line">{response.message}</p>
                    </div>
                    <div className="flex space-x-2 justify-end">
                      {response.status === 'new' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateStatus(response.id, 'read')}
                        >
                          Mark as Read
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUpdateStatus(response.id, 'replied')}
                      >
                        Mark as Replied
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUpdateStatus(response.id, 'closed')}
                      >
                        Close
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}