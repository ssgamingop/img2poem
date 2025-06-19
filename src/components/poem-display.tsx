
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Edit3, Play, Pause } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface PoemDisplayProps {
  poem: string;
  language: string; // e.g., "en", "hi"
  onEdit: () => void;
}

export function PoemDisplay({ poem, language, onEdit }: PoemDisplayProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setCanSpeak(true);
    } else {
      setCanSpeak(false);
    }

    // Cleanup speech synthesis on component unmount
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = useCallback(() => {
    if (!canSpeak) {
      toast({
        title: "Speech Synthesis Not Supported",
        description: "Your browser does not support text-to-speech.",
        variant: "destructive",
      });
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(poem);
      // Set the language for the utterance.
      // For Hindi, 'hi-IN' is a common BCP 47 language tag.
      // For English, 'en-US' is a common choice.
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        console.error("Speech synthesis error", event);
        let errorMessage = "Could not read the poem.";
        if (event.error) {
            // More specific error messages can sometimes be found here
            errorMessage = `Speech error: ${event.error}. Ensure a voice for the selected language is available in your browser/OS.`;
        }
        toast({
          title: "Speech Error",
          description: errorMessage,
          variant: "destructive",
        });
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  }, [poem, language, isSpeaking, canSpeak, toast]);

  // Ensure speaking stops if poem or language changes while active
  useEffect(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poem, language]);


  return (
    <Card className="bg-background/50 border-border shadow-inner">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">Your Generated Poem</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap break-words font-body text-foreground text-base leading-relaxed">
          {poem}
        </pre>
      </CardContent>
      <CardFooter className="justify-end space-x-2">
        <Button 
          onClick={handleToggleSpeech} 
          variant="outline" 
          className="text-primary border-primary hover:bg-primary/10"
          disabled={!canSpeak || !poem} // Disable if no poem
          aria-label={isSpeaking ? "Stop reading poem" : "Read poem aloud"}
        >
          {isSpeaking ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {isSpeaking ? "Stop Reading" : "Read Poem"}
        </Button>
        <Button onClick={onEdit} variant="outline" className="text-accent-foreground border-accent hover:bg-accent/20" disabled={!poem}>
          <Edit3 className="mr-2 h-4 w-4" /> Edit Poem
        </Button>
      </CardFooter>
    </Card>
  );
}
