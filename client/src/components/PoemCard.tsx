import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import type { Poem } from "@shared/schema";

interface PoemCardProps {
  poem: Poem;
  recordingCount: number;
}

export function PoemCard({ poem, recordingCount }: PoemCardProps) {
  return (
    <Link href={`/poems/${poem.slug}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
              {poem.title}
            </h3>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-muted-foreground mb-4">Written in {poem.year}</p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            "{poem.context}"
          </p>
          <div className="flex items-center justify-between">
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
        </CardContent>
      </Card>
    </Link>
  );
}
