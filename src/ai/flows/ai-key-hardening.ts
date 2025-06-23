
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
  prompt: `You are a senior cybersecurity expert specializing in creating memorable yet highly secure passphrases. Your goal is to take a user's base password and transform it into a significantly stronger, memorable passphrase.

**Instructions:**
1.  **Generate a Memorable Passphrase**: Create a passphrase using the diceware concept (e.g., 4-5 uncommon but real words joined together). Capitalize at least one word.
2.  **Add Complexity**: Append a two-digit number and one special character (e.g., !, @, #, $, %) to the end of the passphrase.
3.  **Create a Strength Report**: In markdown format, explain:
    *   **Length**: The benefit of the new passphrase's length.
    *   **Composition**: The strength added by the mix of uppercase/lowercase letters, words, numbers, and symbols.
    *   **Memorability**: Why using words makes it easier to remember.
    *   **Overall Assessment**: A concluding summary of its strength (e.g., "Excellent", "Very Strong").

**Your Task:**
Now, generate a new key and report for the user's password: {{{password}}}
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
