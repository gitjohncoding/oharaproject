import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { PoemFavoriteButton } from "@/components/PoemFavoriteButton";
import type { Poem } from "@shared/schema";

interface EnhancedPoemCardProps {
  poem: Poem;
  recordingCount: number;
  showFavorite?: boolean;
  className?: string;
}

export function EnhancedPoemCard({ 
  poem, 
  recordingCount, 
  showFavorite = true,
  className = ""
}: EnhancedPoemCardProps) {
  return (
    <Card className={`poem-card-enhanced ${className}`}>
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <Link href={`/poems/${poem.slug}`} className="flex-1 cursor-pointer group">
              <h3 className="poem-title group-hover:text-primary transition-colors">
                {poem.title}
              </h3>
            </Link>
            {showFavorite && (
              <div className="ml-3">
                <PoemFavoriteButton poem={poem} />
              </div>
            )}
          </div>
          
          <div className="poem-meta">
            Written in {poem.year}
          </div>
          
          <p className="poem-description">
            {poem.context}
          </p>
          
          <div className="poem-actions">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-primary font-medium">
                {recordingCount} recording{recordingCount !== 1 ? 's' : ''}
              </span>
              
              <a 
                href={poem.externalLink}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                Read full text <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <Link href={`/poems/${poem.slug}`}>
              <div className="text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer font-medium">
                View Details →
              </div>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}