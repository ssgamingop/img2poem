
// src/ai/flows/generate-poem.ts
'use server';
/**
 * @fileOverview A flow that generates a poem based on an image and a specified language.
 *
 * - generatePoem - A function that generates a poem from an image in a given language.
 * - GeneratePoemInput - The input type for the generatePoem function.
 * - GeneratePoemOutput - The return type for the generatePoem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePoemInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language for the poem (e.g., "en" for English, "hi" for Hindi).'),
});
export type GeneratePoemInput = z.infer<typeof GeneratePoemInputSchema>;

const GeneratePoemOutputSchema = z.object({
  poem: z.string().describe('A poem inspired by the image, in the specified language.'),
});
export type GeneratePoemOutput = z.infer<typeof GeneratePoemOutputSchema>;

export async function generatePoem(input: GeneratePoemInput): Promise<GeneratePoemOutput> {
  return generatePoemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePoemPrompt',
  input: {schema: GeneratePoemInputSchema},
  output: {schema: GeneratePoemOutputSchema},
  prompt: `You are a poet, skilled at creating evocative and beautiful poems based on visual input.

  Write a poem in the language specified: {{language}}.
  If 'hi', write in Hindi (Devanagari script).
  If 'en', write in English.

  The poem should be inspired by the following image. Consider the colors, objects, and overall themes present in the image.
  The poem should be at least 10 lines long.

  Image: {{media url=photoDataUri}}`,
});

const generatePoemFlow = ai.defineFlow(
  {
    name: 'generatePoemFlow',
    inputSchema: GeneratePoemInputSchema,
    outputSchema: GeneratePoemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

