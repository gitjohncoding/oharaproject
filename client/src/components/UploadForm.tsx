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
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
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
    
    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: `File type "${file.type}" not supported. Please upload an MP3, WAV, or M4A file.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file size (15MB max)
    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 15MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    toast({
      title: "File Selected",
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
      toast({
        title: "No File Selected",
        description: "Please select an audio file to upload.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* File Upload Zone */}
        <Card>
          <CardContent className="p-0">
            <div
              className={`upload-zone rounded-xl p-8 text-center bg-card transition-colors ${
                dragOver ? 'drag-over' : ''
              }`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CloudUpload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Upload Your Recording</h3>
              <p className="text-muted-foreground mb-4">
                {selectedFile ? `Selected: ${selectedFile.name}` : "Choose an audio file or drag and drop here"}
              </p>
              <input
                type="file"
                id="audioFile"
                accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4,audio/x-m4a"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Label htmlFor="audioFile">
                <Button type="button" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </span>
                </Button>
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                MP3, WAV, or M4A • Max 15MB • Max 10 minutes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reader Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="readerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your name" {...field} />
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
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your@email.com" {...field} />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">For moderation only - not displayed publicly</p>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="anonymous"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Submit anonymously</FormLabel>
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
                <FormLabel>Location (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="City, Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="background"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Background/Age (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Student, age 25" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="interpretationNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tell us about your reading (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What does this poem mean to you? How did you approach reading it?"
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
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
                  I agree to the terms and conditions and give permission for my recording to be shared on this website. I understand that all submissions are subject to moderation before publication.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="text-center">
          <Button
            type="submit"
            size="lg"
            disabled={uploadMutation.isPending}
            className="px-8"
          >
            {uploadMutation.isPending ? "Uploading..." : "Submit Recording"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
