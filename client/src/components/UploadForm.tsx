import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CloudUpload, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const uploadFormSchema = z.object({
  readerName: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  location: z.string().optional(),
  background: z.string().optional(),
  interpretationNote: z.string().optional(),
  anonymous: z.boolean().default(false),
  termsAgreement: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

type UploadFormData = z.infer<typeof uploadFormSchema>;

interface UploadFormProps {
  poemSlug: string;
}

export function UploadForm({ poemSlug }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      readerName: "",
      email: "",
      location: "",
      background: "",
      interpretationNote: "",
      anonymous: false,
      termsAgreement: false,
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      if (!selectedFile) {
        throw new Error("No file selected");
      }

      const formData = new FormData();
      formData.append("audioFile", selectedFile);
      formData.append("poemSlug", poemSlug);
      
      console.log("Form data being sent:", data);
      console.log("Selected file:", selectedFile);
      console.log("Poem slug:", poemSlug);
      
      Object.entries(data).forEach(([key, value]) => {
        console.log(`Adding to FormData: ${key} = ${value}`);
        formData.append(key, value.toString());
      });

      // Log what's in the FormData
      console.log("FormData contents:");
      formData.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });

      const response = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        console.log("Full error response:", error);
        if (error.errors) {
          console.log("Validation errors:", error.errors);
          error.errors.forEach((err: any, index: number) => {
            console.log(`Error ${index + 1}:`, err);
          });
        }
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Recording Submitted!",
        description: "Thank you! Your recording has been submitted for review and will appear on the site once approved.",
      });
      form.reset();
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: [`/api/poems/${poemSlug}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    console.log("File selected:", file.name, file.type, file.size);
    
    // Clear previous errors
    setFileError(null);
    
    // Validate file type - support MP3, WAV, M4A with comprehensive MIME type detection
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/mp3'];
    const allowedExtensions = ['.mp3', '.wav', '.m4a'];
    const fileExtension = file.name.toLowerCase().split('.').pop() || '';
    
    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(`.${fileExtension}`);
    
    if (!isValidType) {
      const errorMsg = `File type "${file.type}" not supported. Please upload an MP3, WAV, or M4A file.`;
      setFileError(errorMsg);
      return;
    }

    // Validate file size (15MB max)
    if (file.size > 15 * 1024 * 1024) {
      const errorMsg = "File size must be less than 15MB.";
      setFileError(errorMsg);
      return;
    }

    setSelectedFile(file);
    toast({
      title: "File Ready!",
      description: `${file.name} is ready to upload.`,
    });
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // Only set dragOver to false if we're leaving the drop zone completely
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setDragOver(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    
    console.log("Drop event triggered");
    console.log("Files:", event.dataTransfer.files);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      console.log("Processing dropped file:", file.name);
      handleFileSelect(file);
    } else {
      console.log("No file found in drop event");
    }
  };

  const onSubmit = (data: UploadFormData) => {
    if (!selectedFile) {
      setFileError("Please select an audio file to upload.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (fileError) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    uploadMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* File Upload Zone */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div
              className={`upload-zone rounded-xl p-8 text-center transition-all duration-300 ${
                dragOver 
                  ? 'bg-primary/10 border-primary border-2 border-dashed scale-[1.02]' 
                  : fileError 
                    ? 'bg-destructive/5 border-destructive/20 border-2 border-dashed'
                    : selectedFile
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 border-2 border-dashed'
                      : 'bg-gradient-to-br from-primary/5 to-blue-50 dark:to-blue-950/20 border-primary/20 border-2 border-dashed hover:border-primary/40 hover:bg-primary/10'
              }`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CloudUpload className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                dragOver ? 'text-primary' : fileError ? 'text-destructive' : selectedFile ? 'text-green-600 dark:text-green-400' : 'text-primary/70'
              }`} />
              
              <h3 className="text-xl font-bold text-foreground mb-2">
                {dragOver ? "Drop it like it's hot!" : "Join the Conversation"}
              </h3>
              
              <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                {dragOver 
                  ? "Release to add your voice to Frank O'Hara's legacy"
                  : selectedFile 
                    ? `✓ Ready to upload: ${selectedFile.name}`
                    : "Share your unique interpretation and become part of this poetic community"
                }
              </p>

              {fileError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4 text-sm text-destructive">
                  {fileError}
                </div>
              )}
              
              <input
                type="file"
                id="audioFile"
                accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4,audio/x-m4a"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Label htmlFor="audioFile">
                <Button 
                  type="button" 
                  size="lg"
                  className={`cursor-pointer px-8 py-3 text-base font-semibold transition-all ${
                    selectedFile ? 'bg-green-600 hover:bg-green-700' : ''
                  }`} 
                  asChild
                >
                  <span>
                    <Upload className="w-5 h-5 mr-2" />
                    {selectedFile ? "Choose Different File" : "Choose Your Recording"}
                  </span>
                </Button>
              </Label>
              
              <div className="mt-4 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Drop your file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  MP3, WAV, or M4A • Max 15MB • Perfect length: 2-5 minutes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reader Information */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Tell Us About Yourself</h3>
            <p className="text-sm text-muted-foreground">Help our community connect with your reading</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="readerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="How should we credit you?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">Private - only used for moderation updates</p>
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="anonymous"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 bg-muted/30 p-4 rounded-lg">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Keep my identity private</FormLabel>
                <p className="text-xs text-muted-foreground">Your reading will be shared without your name or details</p>
              </div>
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Where are you reading from? (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Brooklyn, NY or Tokyo, Japan" {...field} />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">Share your corner of the world with fellow poetry lovers</p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="background"
            render={({ field }) => (
              <FormItem>
                <FormLabel>A bit about you (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Teacher, age 30" {...field} />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">Help listeners understand your perspective</p>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="interpretationNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Share your perspective (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What drew you to this poem? How did you decide to read it? What emotions or memories does it evoke for you? Your unique perspective adds richness to our community..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">Help others understand your connection to Frank O'Hara's words</p>
            </FormItem>
          )}
        />

        {/* Terms Agreement */}
        <FormField
          control={form.control}
          name="termsAgreement"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <a 
                    href="/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline transition-colors"
                  >
                    terms and conditions
                  </a>{" "}
                  and give permission for my recording to be shared on this website. I understand that all submissions are subject to moderation before publication.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="text-center space-y-3">
          <Button
            type="submit"
            size="lg"
            disabled={uploadMutation.isPending || !selectedFile}
            className="px-12 py-3 text-lg font-semibold"
          >
            {uploadMutation.isPending ? (
              <>
                <CloudUpload className="w-5 h-5 mr-2 animate-pulse" />
                Uploading Your Voice...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Share Your Reading
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your recording will be reviewed and published within 24-48 hours
          </p>
        </div>
      </form>
    </Form>
  );
}
