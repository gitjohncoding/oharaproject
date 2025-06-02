import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { PoemFavoriteButton } from "@/components/PoemFavoriteButton";
import type { Poem } from "@shared/schema";

interface PoemCardProps {
  poem: Poem;
  recordingCount: number;
}

export function PoemCard({ poem, recordingCount }: PoemCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow group relative">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Link href={`/poems/${poem.slug}`} className="flex-1 cursor-pointer">
            <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
              {poem.title}
            </h3>
          </Link>
          <div className="flex items-center space-x-2 relative z-10">
            <PoemFavoriteButton poem={poem} />
            <Link href={`/poems/${poem.slug}`}>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors cursor-pointer" />
            </Link>
          </div>
        </div>
        
        <Link href={`/poems/${poem.slug}`} className="block cursor-pointer group">
          <p className="text-muted-foreground mb-4 group-hover:text-primary transition-colors">Written in {poem.year}</p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 group-hover:text-foreground/80 transition-colors">
            {poem.context}
          </p>
        </Link>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-primary font-medium">
            {recordingCount} recording{recordingCount !== 1 ? 's' : ''}
          </span>
          <a 
            href={poem.externalLink}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            Read full text <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}