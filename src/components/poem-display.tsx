
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Edit3, Play, Pause, Sparkles } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface PoemDisplayProps {
  poem: string;
  language: string; // e.g., "en", "hi"
  onEdit: () => void;
  onRefine: () => Promise<void>;
  isRefining: boolean;
}

export function PoemDisplay({ poem, language, onEdit, onRefine, isRefining }: PoemDisplayProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      }
    };

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setCanSpeak(true);
      loadVoices(); // Initial load
      window.speechSynthesis.onvoiceschanged = loadVoices; // Update when voices change
    } else {
      setCanSpeak(false);
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null; // Clean up listener
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel(); // Stop any ongoing speech when component unmounts
        }
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

    if (!poem) {
        toast({
            title: "No Poem",
            description: "There's no poem to read.",
            variant: "destructive",
        });
        return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(poem);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      
      // Attempt to improve sound quality
      utterance.rate = 0.9;  // Slightly slower pace (0.1 to 10, default is 1)
      utterance.pitch = 1;   // Normal pitch (0 to 2, default is 1)
      utterance.volume = 1;  // Max volume (0 to 1, default is 1)

      const suitableVoices = availableVoices.filter(voice => voice.lang === utterance.lang);
      if (suitableVoices.length > 0) {
        utterance.voice = suitableVoices[0]; // Use the first available suitable voice
        console.log(`Available voices for ${utterance.lang}:`, suitableVoices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
        console.log(`Using voice: ${suitableVoices[0].name} (Lang: ${suitableVoices[0].lang})`);
      } else {
        if (availableVoices.length > 0) { // Voices loaded but none match
             console.warn(`No specific voices found for ${utterance.lang} from available voices. Using browser default for the language.`);
             console.log('All available voices:', availableVoices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
        } else { // Voices might not have loaded yet or none exist
            console.warn(`Voice list might be empty or no voices loaded yet for ${utterance.lang}. Using browser default for the language.`);
        }
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        console.error("Speech synthesis error", event);
        let errorMessage = "Could not read the poem.";
        if (event.error) {
            errorMessage = `Speech error: ${event.error}. Ensure a voice for the selected language (${utterance.lang}) is available and enabled in your browser/OS settings.`;
        }
        toast({
          title: "Speech Error",
          description: errorMessage,
          variant: "destructive",
          duration: 7000,
        });
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  }, [poem, language, isSpeaking, canSpeak, toast, availableVoices]);

  // Effect to stop speech if poem or language changes while speaking
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
      <CardFooter className="justify-end space-x-2 flex-wrap gap-2">
        <Button 
          onClick={handleToggleSpeech} 
          variant="outline" 
          className="text-primary border-primary hover:bg-primary/10"
          disabled={!canSpeak || !poem || isRefining}
          aria-label={isSpeaking ? "Stop reading poem" : "Read poem aloud"}
        >
          {isSpeaking ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {isSpeaking ? "Stop Reading" : "Read Poem"}
        </Button>
        <Button 
          onClick={onRefine} 
          variant="outline" 
          className="text-primary border-primary hover:bg-primary/10" 
          disabled={!poem || isRefining}
        >
          {isRefining ? (
            <svg className="animate-spin mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isRefining ? "Refining..." : "Refine with AI"}
        </Button>
        <Button 
          onClick={onEdit} 
          variant="outline" 
          className="text-accent-foreground border-accent hover:bg-accent/20" 
          disabled={!poem || isRefining}
        >
          <Edit3 className="mr-2 h-4 w-4" /> Edit Poem
        </Button>
      </CardFooter>
    </Card>
  );
}
