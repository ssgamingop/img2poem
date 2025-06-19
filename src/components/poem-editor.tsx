
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Save, XCircle } from 'lucide-react';

interface PoemEditorProps {
  currentPoem: string;
  onPoemChange: (newPoem: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function PoemEditor({ currentPoem, onPoemChange, onSave, onCancel }: PoemEditorProps) {
  return (
    <Card className="bg-background/50 border-border shadow-inner">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">Edit Your Poem</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={currentPoem}
          onChange={(e) => onPoemChange(e.target.value)}
          placeholder="Edit your poem here..."
          className="min-h-[200px] text-base font-body leading-relaxed focus:ring-accent"
          aria-label="Poem editor"
        />
      </CardContent>
      <CardFooter className="justify-end space-x-2">
        <Button onClick={onCancel} variant="outline" className="hover:bg-muted/50">
          <XCircle className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button onClick={onSave} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}
