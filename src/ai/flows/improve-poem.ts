'use server';

/**
 * @fileOverview Refines a generated poem based on user feedback.
 *
 * - refineGeneratedPoem - A function that refines the poem.
 * - RefineGeneratedPoemInput - The input type for the refineGeneratedPoem function.
 * - RefineGeneratedPoemOutput - The return type for the refineGeneratedPoem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineGeneratedPoemInputSchema = z.object({
  poem: z.string().describe('The poem to refine.'),
  feedback: z.string().describe('The feedback to use to refine the poem.'),
});
export type RefineGeneratedPoemInput = z.infer<typeof RefineGeneratedPoemInputSchema>;

const RefineGeneratedPoemOutputSchema = z.object({
  refinedPoem: z.string().describe('The refined poem.'),
});
export type RefineGeneratedPoemOutput = z.infer<typeof RefineGeneratedPoemOutputSchema>;

export async function refineGeneratedPoem(input: RefineGeneratedPoemInput): Promise<RefineGeneratedPoemOutput> {
  return refineGeneratedPoemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineGeneratedPoemPrompt',
  input: {schema: RefineGeneratedPoemInputSchema},
  output: {schema: RefineGeneratedPoemOutputSchema},
  prompt: `You are a poet helping to refine an existing poem based on user feedback.

Original Poem:
{{{poem}}}

Feedback:
{{{feedback}}}

Please provide a refined version of the poem that incorporates the feedback.  The refined poem should keep the same general tone and style as the original poem, but should be improved based on the feedback. Do not make the refined poem significantly longer or shorter than the original.

Refined Poem:`,
});

const refineGeneratedPoemFlow = ai.defineFlow(
  {
    name: 'refineGeneratedPoemFlow',
    inputSchema: RefineGeneratedPoemInputSchema,
    outputSchema: RefineGeneratedPoemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      refinedPoem: output!,
    };
  }
);
