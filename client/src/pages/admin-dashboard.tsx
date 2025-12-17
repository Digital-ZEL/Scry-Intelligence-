import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, LockIcon, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Message, ResearchArea } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { motion } from "framer-motion";

// Form schema for creating a new research area
const researchAreaSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  isRestricted: z.boolean().default(false),
  order: z.number().int().positive("Order must be a positive integer")
});

type ResearchAreaFormValues = z.infer<typeof researchAreaSchema>;

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("messages");
  const [, navigate] = useLocation();
  const deniedHeadingRef = useRef<HTMLHeadingElement>(null);
  
  // Focus management for accessibility when access is denied
  useEffect(() => {
    if (user?.role !== "admin" && deniedHeadingRef.current) {
      deniedHeadingRef.current.focus();
    }
  }, [user?.role]);
  
  // Redirect to home if user is not admin (this is a fallback, API is also protected)
  if (user?.role !== "admin") {
    return (
      <div className="container py-10" role="alert" aria-live="assertive">
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 ref={deniedHeadingRef} tabIndex={-1}>Access Denied</h1>
            </CardTitle>
            <CardDescription>
              You do not have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="research">Research Areas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="messages">
            <MessagesTab />
          </TabsContent>
          
          <TabsContent value="research">
            <ResearchAreasTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

function MessagesTab() {
  const { toast } = useToast();
  
  const { data: messages, isLoading, error } = useQuery<Message[]>({
    queryKey: ["/api/admin/messages"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/admin/messages/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      toast({
        title: "Message updated",
        description: "Message marked as read successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark message as read",
        variant: "destructive",
      });
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load messages</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error.message}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Messages</CardTitle>
        <CardDescription>
          Manage and respond to messages from the contact form
        </CardDescription>
      </CardHeader>
      <CardContent>
        {messages && messages.length > 0 ? (
          <Table>
            <TableCaption>List of all contact form messages</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    {message.createdAt && format(new Date(message.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>{message.name}</TableCell>
                  <TableCell>{message.email}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {message.message}
                  </TableCell>
                  <TableCell>
                    {message.read ? (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        Read
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                        New
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={message.read || markAsReadMutation.isPending}
                      onClick={() => markAsReadMutation.mutate(message.id)}
                    >
                      {markAsReadMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Mark as Read
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No messages found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResearchAreasTab() {
  const { toast } = useToast();
  const form = useForm<ResearchAreaFormValues>({
    resolver: zodResolver(researchAreaSchema),
    defaultValues: {
      title: "",
      description: "",
      isRestricted: false,
      order: 1
    }
  });
  
  const { data: researchAreas, isLoading, error } = useQuery<ResearchArea[]>({
    queryKey: ["/api/research-areas"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  const createResearchAreaMutation = useMutation({
    mutationFn: async (data: ResearchAreaFormValues) => {
      const res = await apiRequest("POST", "/api/admin/research-areas", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research-areas"] });
      toast({
        title: "Research area created",
        description: "New research area added successfully",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create research area",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: ResearchAreaFormValues) => {
    createResearchAreaMutation.mutate(data);
  };
  
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Research Area</CardTitle>
          <CardDescription>
            Create a new research area that will appear on the research page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="AI Ethics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Exploring ethical implications of AI systems..."
                        className="min-h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isRestricted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Restricted Access</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Only authorized users can access this research
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit"
                className="w-full"
                disabled={createResearchAreaMutation.isPending}
              >
                {createResearchAreaMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Research Area"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Research Areas</CardTitle>
          <CardDescription>
            Current research areas in the lab
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-500">
              Failed to load research areas: {error.message}
            </div>
          ) : researchAreas && researchAreas.length > 0 ? (
            <div className="space-y-4">
              {researchAreas.map((area) => (
                <div key={area.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">
                      {area.title}
                    </h3>
                    {area.isRestricted ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                        <LockIcon className="h-3 w-3 mr-1" /> Restricted
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        <Globe className="h-3 w-3 mr-1" /> Public
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {area.description}
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    Order: {area.order}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No research areas found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}