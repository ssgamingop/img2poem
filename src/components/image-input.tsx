
"use client";

import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, Link, Image as ImageIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ImageInputProps {
  onImageSubmit: (data: { type: 'file', value: File } | { type: 'url', value: string }) => void;
  isLoading: boolean;
}

export function ImageInput({ onImageSubmit, isLoading }: ImageInputProps) {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("upload");
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file (e.g., PNG, JPG, GIF).",
          variant: "destructive",
        });
        setFile(null);
        event.target.value = ""; // Reset file input
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeTab === "upload" && file) {
      onImageSubmit({ type: 'file', value: file });
    } else if (activeTab === "url" && imageUrl) {
      try {
        new URL(imageUrl); // Basic URL validation
        onImageSubmit({ type: 'url', value: imageUrl });
      } catch (e) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid image URL.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "No Image Provided",
        description: "Please upload an image or provide a URL.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full p-6 bg-card rounded-lg shadow-lg border border-border">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" aria-label="Upload an image file">
              <UploadCloud className="mr-2 h-5 w-5" /> Upload File
            </TabsTrigger>
            <TabsTrigger value="url" aria-label="Provide an image URL">
              <Link className="mr-2 h-5 w-5" /> Image URL
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-4">
            <div className="space-y-2">
              <label htmlFor="file-upload" className="sr-only">Choose file</label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file:mr-3 file:px-4 file:py-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 focus-visible:file:ring-2 focus-visible:file:ring-ring focus-visible:file:ring-offset-2"
                aria-describedby="file-upload-description"
                disabled={isLoading}
              />
              <p id="file-upload-description" className="text-sm text-muted-foreground">
                {file ? `Selected: ${file.name}` : "PNG, JPG, GIF up to 10MB."}
              </p>
            </div>
          </TabsContent>
          <TabsContent value="url" className="mt-4">
            <div className="space-y-2">
              <label htmlFor="image-url" className="sr-only">Image URL</label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="text-base"
                aria-describedby="url-input-description"
                disabled={isLoading}
              />
              <p id="url-input-description" className="text-sm text-muted-foreground">
                Enter the full URL of an image.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        <Button type="submit" className="w-full text-lg py-3" disabled={isLoading} size="lg">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Poem...
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-5 w-5" /> Generate Poem
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
