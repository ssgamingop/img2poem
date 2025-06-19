
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageInput } from '@/components/image-input';
import { PoemDisplay } from '@/components/poem-display';
import { PoemEditor } from '@/components/poem-editor';
import { useToast } from "@/hooks/use-toast";
import { generatePoem } from '@/ai/flows/generate-poem';
import { Save, Edit3, Feather } from 'lucide-react';

// Helper function to convert File to Data URI
const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper function to convert URL to Data URI
async function urlToDataUri(url: string): Promise<string> {
  // Basic client-side check before fetching
  if (!url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg)/i)) {
      throw new Error("URL does not appear to be a direct image link.");
  }
  // Note: This fetch can be blocked by CORS. A backend proxy would be more robust.
  const response = await fetch(url); 
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${response.status} ${response.statusText}`);
  }
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('URL did not return an image content type.');
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


export default function PhotoPoetPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null); // For display
  const [poem, setPoem] = useState<string | null>(null);
  const [editedPoem, setEditedPoem] = useState<string>("");
  const [isLoadingPoem, setIsLoadingPoem] = useState<boolean>(false);
  const [isEditingPoem, setIsEditingPoem] = useState<boolean>(false);
  const { toast } = useToast();

  // Effect for cleaning up Object URLs
  useEffect(() => {
    let objectUrlToRevoke: string | null = null;
    if (imageUrl && imageUrl.startsWith('blob:')) {
      objectUrlToRevoke = imageUrl;
    }
    return () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [imageUrl]);

  const handleImageSubmit = useCallback(async (input: { type: 'file', value: File } | { type: 'url', value: string }) => {
    setIsLoadingPoem(true);
    setPoem(null);
    setEditedPoem("");
    setIsEditingPoem(false);
    
    // Revoke previous object URL if imageUrl is already set and is a blob URL
    if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(null);


    let dataUri: string | null = null;
    let displayUrl: string | null = null;

    try {
      if (input.type === 'file') {
        displayUrl = URL.createObjectURL(input.value);
        dataUri = await fileToDataUri(input.value);
      } else { // type === 'url'
        try {
          new URL(input.value); // Basic validation
        } catch (e) {
          toast({ title: "Invalid URL", description: "Please enter a valid image URL.", variant: "destructive" });
          setIsLoadingPoem(false);
          return;
        }
        displayUrl = input.value;
        try {
            dataUri = await urlToDataUri(input.value);
        } catch (fetchError: any) {
            toast({
                title: "Could not process image URL",
                description: `${fetchError.message}. You might try downloading the image and uploading it manually.`,
                variant: "destructive",
                duration: 7000,
            });
            setImageUrl(displayUrl); // Show the image even if AI part fails
            setIsLoadingPoem(false);
            return;
        }
      }

      setImageUrl(displayUrl);
      
      if (!dataUri) {
          toast({ title: "Image Error", description: "Could not prepare image data for AI.", variant: "destructive" });
          setIsLoadingPoem(false);
          return;
      }

      const result = await generatePoem({ photoDataUri: dataUri });
      setPoem(result.poem);
      setEditedPoem(result.poem);
      toast({ title: "Poem Generated!", description: "Your poetic masterpiece is ready.", className: "bg-primary text-primary-foreground" });

    } catch (error: any) {
      console.error("Error generating poem:", error);
      toast({
        title: "AI Error",
        description: error.message || "Failed to generate poem. Please try again.",
        variant: "destructive",
      });
      // If image processing failed, but we have a display URL, show it.
      if (displayUrl && !imageUrl) setImageUrl(displayUrl);
    } finally {
      setIsLoadingPoem(false);
    }
  }, [toast, imageUrl]); // Include imageUrl in dependencies because of its use in cleanup logic

  const handleSaveEditedPoem = () => {
    setPoem(editedPoem); // Commit edited changes to the main poem state
    setIsEditingPoem(false);
    toast({ title: "Changes Saved", description: "Your poem has been updated.", className: "bg-accent text-accent-foreground" });
  };

  const handleCancelEdit = () => {
    setEditedPoem(poem || ""); // Revert to original poem
    setIsEditingPoem(false);
  };

  const handleStartEdit = () => {
    if (poem) {
      setEditedPoem(poem);
      setIsEditingPoem(true);
    }
  };
  
  const handleSavePoemToDevice = () => {
    if (!poem || !imageUrl) return;
    
    // Create content to save (e.g., simple text file with poem and image source)
    const content = `Photo Poet Creation\n\nImage Source: ${imageUrl}\n\nPoem:\n${editedPoem || poem}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'photo_poem.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast({ title: "Poem Saved!", description: "Your poem has been saved as a .txt file (simulated).", className: "bg-primary text-primary-foreground" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-8 font-body">
      <header className="mb-10 text-center">
        <h1 className="text-5xl sm:text-6xl font-headline text-primary-foreground bg-primary py-3 px-6 rounded-lg shadow-xl inline-flex items-center">
          <Feather className="mr-3 h-10 w-10" /> Photo Poet
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">Transform your photos into beautiful poetry.</p>
      </header>

      <main className="w-full max-w-5xl space-y-8">
        <ImageInput onImageSubmit={handleImageSubmit} isLoading={isLoadingPoem} />

        {/* Display area for image and poem/editor */}
        {(imageUrl || isLoadingPoem) && (
          <Card className="shadow-xl animate-in fade-in duration-700">
            <CardContent className="p-6 grid md:grid-cols-2 gap-8 items-start">
              {/* Image Display */}
              <div className="relative aspect-[4/3] w-full max-w-lg mx-auto md:mx-0 rounded-lg overflow-hidden shadow-lg border-2 border-primary/50">
                {isLoadingPoem && !imageUrl && <Skeleton className="h-full w-full" />}
                {imageUrl && <Image src={imageUrl} alt="Uploaded visual inspiration" layout="fill" objectFit="cover" data-ai-hint="inspiration abstract" />}
              </div>
              
              {/* Poem Display/Editor/Skeleton */}
              <div className="space-y-4 min-h-[200px] flex flex-col justify-center">
                {isLoadingPoem ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-8 w-3/4 rounded-md" />
                    <Skeleton className="h-6 w-full rounded-md" />
                    <Skeleton className="h-6 w-full rounded-md" />
                    <Skeleton className="h-6 w-5/6 rounded-md" />
                  </div>
                ) : poem ? (
                  isEditingPoem ? (
                    <PoemEditor
                      currentPoem={editedPoem}
                      onPoemChange={setEditedPoem}
                      onSave={handleSaveEditedPoem}
                      onCancel={handleCancelEdit}
                    />
                  ) : (
                    <PoemDisplay
                      poem={poem}
                      onEdit={handleStartEdit}
                    />
                  )
                ) : imageUrl && !isLoadingPoem ? (
                  // Case where image is loaded, not loading poem, but no poem (e.g. AI error)
                  <p className="text-muted-foreground text-center p-4">Could not generate a poem for this image. Please try another one.</p>
                ) : null}
              </div>
            </CardContent>
            
            {poem && !isLoadingPoem && (
              <CardFooter className="p-6 justify-end border-t border-border">
                <Button onClick={handleSavePoemToDevice} variant="default" size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base">
                  <Save className="mr-2 h-5 w-5" /> Save Poem to Device
                </Button>
              </CardFooter>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
