import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { UploadForm } from "@/components/UploadForm";
import { PoemFavoriteButton } from "@/components/PoemFavoriteButton";
import type { Poem, Recording } from "@shared/schema";

interface PoemData {
  poem: Poem;
  recordings: Recording[];
}

export default function PoemPage() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data, isLoading, error } = useQuery<PoemData>({
    queryKey: [`/api/poems/${slug}`],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Skeleton className="h-6 w-32 mb-6 bg-white/20" />
            <Skeleton className="h-10 w-96 mb-4 bg-white/20" />
            <Skeleton className="h-5 w-64 bg-white/20" />
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Poem Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The poem you're looking for doesn't exist.
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { poem, recordings } = data;

  return (
    <div className="min-h-screen">
      {/* Poem Header */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/">
            <Button variant="ghost" className="mb-6 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Poems
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="text-primary">WeRead</span> <span className="text-primary-foreground">"{poem.title}"</span>
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-primary-foreground/90">
                <span>Written in {poem.year}</span>
              </div>
            </div>
            <PoemFavoriteButton poem={poem} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Text Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-8">Text</h2>
          <div className="text-center">
            <a href={poem.externalLink} target="_blank" rel="noopener noreferrer">
              <Button className="inline-flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Read Full Text
              </Button>
            </a>
          </div>
        </section>

        {/* Audio Recordings Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-8">Recordings</h2>
          
          {recordings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground text-lg mb-4">No recordings yet</p>
                <p className="text-muted-foreground">Be the first to share your reading of this poem!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {recordings.map((recording) => (
                <AudioPlayer key={recording.id} recording={recording} />
              ))}
            </div>
          )}
        </section>

        {/* Upload Section */}
        <section className="bg-muted rounded-xl p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Share Your Reading</h2>
          <UploadForm poemSlug={poem.slug} />
        </section>
      </div>
    </div>
  );
}
