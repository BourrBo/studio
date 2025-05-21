
// Use server directive.
'use server';

/**
 * @fileOverview AI-powered key hardening flow that suggests stronger, AI-generated keys based on a user-provided password.
 *
 * - aiKeyHardening - A function that enhances the user's password using AI to make it stronger and more secure.
 * - AIKeyHardeningInput - The input type for the aiKeyHardening function.
 * - AIKeyHardeningOutput - The return type for the aiKeyHardening function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the AI key hardening flow
const AIKeyHardeningInputSchema = z.object({
  password: z
    .string()
    .describe('The user-provided password to be strengthened by AI.'),
});

export type AIKeyHardeningInput = z.infer<typeof AIKeyHardeningInputSchema>;

// Define the output schema for the AI key hardening flow
const AIKeyHardeningOutputSchema = z.object({
  enhancedKey: z
    .string()
    .describe(
      'An AI-generated, strong encryption key based on the user password.'
    ),
  strengthReport: z
    .string()
    .describe(
      'A report that explains the new password and the reasoning behind it.'
    ),
});

export type AIKeyHardeningOutput = z.infer<typeof AIKeyHardeningOutputSchema>;

// Exported function to trigger the AI key hardening flow
export async function aiKeyHardening(input: AIKeyHardeningInput): Promise<AIKeyHardeningOutput> {
  return aiKeyHardeningFlow(input);
}

// Define the prompt for the AI key hardening
const aiKeyHardeningPrompt = ai.definePrompt({
  name: 'aiKeyHardeningPrompt',
  input: {schema: AIKeyHardeningInputSchema},
  output: {schema: AIKeyHardeningOutputSchema},
  prompt: `You are an AI-powered password generator. You will take a user-provided password and generate a new, stronger password based on it. The password should be easy to remember but difficult to crack. Please provide a strength report of the generated password.

User-provided password: {{{password}}}
`,
});

// Define the AI key hardening flow
const aiKeyHardeningFlow = ai.defineFlow(
  {
    name: 'aiKeyHardeningFlow',
    inputSchema: AIKeyHardeningInputSchema,
    outputSchema: AIKeyHardeningOutputSchema,
  },
  async input => {
    const {output} = await aiKeyHardeningPrompt(input);
    return output!;
  }
);

