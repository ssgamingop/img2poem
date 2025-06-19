
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Edit3 } from 'lucide-react';

interface PoemDisplayProps {
  poem: string;
  onEdit: () => void;
}

export function PoemDisplay({ poem, onEdit }: PoemDisplayProps) {
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
      <CardFooter className="justify-end">
        <Button onClick={onEdit} variant="outline" className="text-accent-foreground border-accent hover:bg-accent/20">
          <Edit3 className="mr-2 h-4 w-4" /> Edit Poem
        </Button>
      </CardFooter>
    </Card>
  );
}
