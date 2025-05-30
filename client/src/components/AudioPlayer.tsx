import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Recording } from "@shared/schema";

interface AudioPlayerProps {
  recording: Recording;
}

export function AudioPlayer({ recording }: AudioPlayerProps) {
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Listen to this reading`,
          text: `Check out this reading by ${recording.readerName}`,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "The link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Error",
        description: "Failed to share the recording.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="audio-player shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">{recording.readerName}</h3>
            <p className="text-sm text-muted-foreground">
              Uploaded {formatDate(recording.approvedAt)}
            </p>
            {recording.location && (
              <p className="text-sm text-muted-foreground">📍 {recording.location}</p>
            )}
            {recording.background && (
              <p className="text-sm text-muted-foreground">👤 {recording.background}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="text-muted-foreground hover:text-primary"
          >
            <Share2 className="w-4 h-4" />
            <span className="sr-only">Share recording</span>
          </Button>
        </div>
        
        {/* HTML5 Audio Player */}
        <audio 
          controls 
          className="w-full mb-4"
          preload="metadata"
        >
          <source src={`/uploads/${recording.fileName}`} type={recording.mimeType} />
          Your browser does not support the audio element.
        </audio>
        
        {recording.interpretationNote && (
          <div className="text-sm text-muted-foreground italic bg-muted p-3 rounded-md">
            "{recording.interpretationNote}"
          </div>
        )}
      </CardContent>
    </Card>
  );
}
