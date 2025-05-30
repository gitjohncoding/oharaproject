import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Users, ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AdminStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface PendingSubmission {
  id: number;
  readerName: string;
  email: string;
  location?: string;
  background?: string;
  interpretationNote?: string;
  fileName: string;
  poemTitle: string;
  submittedAt: string;
  anonymous: boolean;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  
  // Move hooks before any conditional returns
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "johntclinkscales@gmail.com") {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Unauthorized access");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: pendingSubmissions, isLoading: submissionsLoading } = useQuery<PendingSubmission[]>({
    queryKey: ["/api/admin/submissions/pending"],
  });

  const approveMutation = useMutation({
    mutationFn: (submissionId: number) => 
      apiRequest("POST", `/api/admin/submissions/${submissionId}/approve`),
    onSuccess: () => {
      toast({
        title: "Submission Approved",
        description: "The recording has been approved and is now live.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions/pending"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve submission. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (submissionId: number) => 
      apiRequest("POST", `/api/admin/submissions/${submissionId}/reject`),
    onSuccess: () => {
      toast({
        title: "Submission Rejected",
        description: "The recording has been rejected and removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions/pending"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject submission. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage poetry recording submissions</p>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              {statsLoading ? (
                <>
                  <Skeleton className="h-8 w-12 mx-auto mb-2" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
                    <Clock className="w-6 h-6" />
                    {stats?.pending || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Review</div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              {statsLoading ? (
                <>
                  <Skeleton className="h-8 w-12 mx-auto mb-2" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-2">
                    <CheckCircle className="w-6 h-6" />
                    {stats?.approved || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              {statsLoading ? (
                <>
                  <Skeleton className="h-8 w-12 mx-auto mb-2" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-red-500 flex items-center justify-center gap-2">
                    <XCircle className="w-6 h-6" />
                    {stats?.rejected || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Rejected</div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              {statsLoading ? (
                <>
                  <Skeleton className="h-8 w-12 mx-auto mb-2" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                    <Users className="w-6 h-6" />
                    {stats?.total || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Submissions</div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-12 w-full mb-2" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              </div>
            ) : pendingSubmissions?.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">All caught up!</p>
                <p className="text-muted-foreground">No pending submissions to review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingSubmissions?.map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground">
                            {submission.anonymous ? "Anonymous Reader" : submission.readerName}
                          </h3>
                          {submission.anonymous && (
                            <Badge variant="secondary" className="text-xs">Anonymous</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{submission.poemTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                        </p>
                        {submission.location && (
                          <p className="text-xs text-muted-foreground">📍 {submission.location}</p>
                        )}
                        {submission.background && (
                          <p className="text-xs text-muted-foreground">👤 {submission.background}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => approveMutation.mutate(submission.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectMutation.mutate(submission.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                    
                    {/* Audio Player */}
                    <audio 
                      controls 
                      className="w-full mb-2"
                      preload="metadata"
                    >
                      <source src={`/uploads/${submission.fileName}`} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                    
                    {submission.interpretationNote && (
                      <div className="text-sm text-muted-foreground italic bg-muted p-3 rounded-md">
                        "{submission.interpretationNote}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
