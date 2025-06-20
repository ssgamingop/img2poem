
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
import { refineGeneratedPoem } from '@/ai/flows/improve-poem'; // Import the refine flow
import { Save, Feather } from 'lucide-react';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

async function urlToDataUri(url: string): Promise<string> {
  if (!url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg)/i)) {
      throw new Error("URL does not appear to be a direct image link.");
  }
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [poem, setPoem] = useState<string | null>(null);
  const [editedPoem, setEditedPoem] = useState<string>("");
  const [isLoadingPoem, setIsLoadingPoem] = useState<boolean>(false);
  const [isRefiningPoem, setIsRefiningPoem] = useState<boolean>(false); // New state for refinement
  const [isEditingPoem, setIsEditingPoem] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const { toast } = useToast();

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
      } else {
        try {
          new URL(input.value);
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
            setImageUrl(displayUrl);
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

      const result = await generatePoem({ photoDataUri: dataUri, language: selectedLanguage });
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
      if (displayUrl && !imageUrl) setImageUrl(displayUrl);
    } finally {
      setIsLoadingPoem(false);
    }
  }, [toast, imageUrl, selectedLanguage]); 

  const handleRefinePoem = async () => {
    if (!poem && !editedPoem) {
      toast({ title: "No Poem to Refine", description: "Please generate or write a poem first.", variant: "destructive" });
      return;
    }
    setIsRefiningPoem(true);
    try {
      // Use the editedPoem if it exists and is different from the original poem, otherwise use the original poem.
      // Or, more simply, always use editedPoem as it's the source of truth if editing has started.
      const poemToRefine = isEditingPoem ? editedPoem : poem || "";
      if (!poemToRefine) {
         toast({ title: "Error", description: "Cannot refine an empty poem.", variant: "destructive" });
         setIsRefiningPoem(false);
         return;
      }

      const result = await refineGeneratedPoem({ 
        poem: poemToRefine, 
        feedback: "Make this poem more vivid, emotional, and imaginative. Ensure it flows well and has a strong impact." 
      });
      setPoem(result.refinedPoem);
      setEditedPoem(result.refinedPoem); // Update editedPoem as well
      setIsEditingPoem(false); // Exit editing mode if it was active
      toast({ title: "Poem Refined!", description: "The AI has enhanced your poem.", className: "bg-primary text-primary-foreground" });
    } catch (error: any) {
      console.error("Error refining poem:", error);
      toast({
        title: "AI Refinement Error",
        description: error.message || "Failed to refine poem. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefiningPoem(false);
    }
  };

  const handleSaveEditedPoem = () => {
    setPoem(editedPoem); 
    setIsEditingPoem(false);
    toast({ title: "Changes Saved", description: "Your poem has been updated.", className: "bg-accent text-accent-foreground" });
  };

  const handleCancelEdit = () => {
    setEditedPoem(poem || ""); 
    setIsEditingPoem(false);
  };

  const handleStartEdit = () => {
    if (poem) {
      setEditedPoem(poem); // Ensure editor starts with the current poem
      setIsEditingPoem(true);
    }
  };
  
  const handleSavePoemToDevice = () => {
    if (!poem && !editedPoem) return;
    
    const poemToSave = isEditingPoem ? editedPoem : poem;
    if (!poemToSave) return;

    const content = `Photo Poet Creation\n\nImage Source: ${imageUrl || 'N/A'}\n\nLanguage: ${selectedLanguage === 'en' ? 'English' : 'Hindi'}\n\nPoem:\n${poemToSave}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'photo_poem.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast({ title: "Poem Saved!", description: "Your poem has been saved as a .txt file.", className: "bg-primary text-primary-foreground" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-8 font-body">
      <header className="mb-10 w-full max-w-5xl relative">
        <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-headline text-primary-foreground bg-primary py-3 px-6 rounded-lg shadow-xl inline-flex items-center">
            <Feather className="mr-3 h-10 w-10" /> Photo Poet
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">Transform your photos into beautiful poetry.</p>
        </div>
        <div className="absolute top-0 right-0 pt-2 pr-2 sm:pt-0 sm:pr-0">
            <ThemeToggleButton />
        </div>
      </header>

      <main className="w-full max-w-5xl space-y-8">
        <ImageInput onImageSubmit={handleImageSubmit} isLoading={isLoadingPoem || isRefiningPoem} />

        <div className="w-full max-w-md mx-auto p-6 bg-card rounded-lg shadow-lg border border-border">
          <Label htmlFor="language-select" className="text-lg font-medium text-foreground mb-2 block">
            Choose Poem Language
          </Label>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isLoadingPoem || isRefiningPoem}>
            <SelectTrigger id="language-select" className="w-full text-base">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(imageUrl || isLoadingPoem || isRefiningPoem) && (
          <Card className="shadow-xl animate-in fade-in duration-700">
            <CardContent className="p-6 grid md:grid-cols-2 gap-8 items-start">
              <div className="relative aspect-[4/3] w-full max-w-lg mx-auto md:mx-0 rounded-lg overflow-hidden shadow-lg border-2 border-primary/50">
                {isLoadingPoem && !imageUrl && <Skeleton className="h-full w-full" />}
                {imageUrl && <Image src={imageUrl} alt="Uploaded visual inspiration" layout="fill" objectFit="cover" data-ai-hint="inspiration abstract" />}
              </div>
              
              <div className="space-y-4 min-h-[200px] flex flex-col justify-center">
                {isLoadingPoem ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-8 w-3/4 rounded-md" />
                    <Skeleton className="h-6 w-full rounded-md" />
                    <Skeleton className="h-6 w-full rounded-md" />
                    <Skeleton className="h-6 w-5/6 rounded-md" />
                  </div>
                ) : isRefiningPoem && poem ? ( // Show skeleton or current poem while refining
                  <div className="space-y-3 p-4">
                     <p className="text-center text-muted-foreground">Refining your poem...</p>
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
                      language={selectedLanguage}
                      onEdit={handleStartEdit}
                      onRefine={handleRefinePoem}
                      isRefining={isRefiningPoem}
                    />
                  )
                ) : imageUrl && !isLoadingPoem && !isRefiningPoem ? (
                  <p className="text-muted-foreground text-center p-4">Could not generate a poem for this image. Please try another one.</p>
                ) : null}
              </div>
            </CardContent>
            
            {(poem || editedPoem) && !isLoadingPoem && !isRefiningPoem && (
              <CardFooter className="p-6 justify-end border-t border-border">
                <Button 
                  onClick={handleSavePoemToDevice} 
                  variant="default" 
                  size="lg" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-base"
                  disabled={isEditingPoem} // Disable if actively editing, encourage save first
                >
                  <Save className="mr-2 h-5 w-5" /> Save Poem to Device
                </Button>
              </CardFooter>
            )}
          </Card>
        )}
      </main>
      <footer className="w-full max-w-5xl mt-12 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Created by Somyajeet Singh , Bhola Is Noob
        </p>
      </footer>
    </div>
  );
}
