import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Poem } from "@shared/schema";

interface PoemFavoriteButtonProps {
  poem: Poem;
}

export function PoemFavoriteButton({ poem }: PoemFavoriteButtonProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Check if poem is favorited
  const { data: poemFavorites } = useQuery({
    queryKey: ["/api/favorites/poems"],
    enabled: isAuthenticated,
  });

  const isFavorited = Array.isArray(poemFavorites) ? poemFavorites.some((fav: any) => fav.poemId === poem.id) : false;

  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/favorites/poems/${poem.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites/poems"] });
      toast({
        title: "Added to favorites",
        description: "Poem saved to your favorites.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add to favorites.",
        variant: "destructive",
      });
    },
  });

  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/favorites/poems/${poem.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites/poems"] });
      toast({
        title: "Removed from favorites",
        description: "Poem removed from your favorites.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to remove from favorites.",
        variant: "destructive",
      });
    },
  });

  const handleFavoriteToggle = () => {
    if (isFavorited) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleFavoriteToggle}
      disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
      className={`text-muted-foreground hover:text-primary ${
        isFavorited ? 'text-red-500 hover:text-red-600' : ''
      }`}
    >
      <Heart 
        className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} 
      />
      <span className="sr-only">
        {isFavorited ? 'Remove poem from favorites' : 'Add poem to favorites'}
      </span>
    </Button>
  );
}