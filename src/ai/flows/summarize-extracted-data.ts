'use server';

/**
 * @fileOverview Summarizes extracted financial data from receipts.
 *
 * - summarizeExtractedData - A function that summarizes extracted financial data.
 * - SummarizeExtractedDataInput - The input type for the summarizeExtractedData function.
 * - SummarizeExtractedDataOutput - The return type for the summarizeExtractedData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractedItemSchema = z.object({
  description: z.string(),
  amount: z.number(),
  category: z.string().optional(),
});

const SummarizeExtractedDataInputSchema = z.object({
  extractedData: z.array(ExtractedItemSchema).describe('Array of extracted financial data from receipts.'),
});
export type SummarizeExtractedDataInput = z.infer<typeof SummarizeExtractedDataInputSchema>;

const SummarizeExtractedDataOutputSchema = z.object({
  totalExpenses: z.number().describe('The total expenses from all receipts.'),
  categorySummary: z.record(z.string(), z.number()).describe('A summary of expenses by category.'),
});
export type SummarizeExtractedDataOutput = z.infer<typeof SummarizeExtractedDataOutputSchema>;

export async function summarizeExtractedData(input: SummarizeExtractedDataInput): Promise<SummarizeExtractedDataOutput> {
  return summarizeExtractedDataFlow(input);
}

const summarizeExtractedDataPrompt = ai.definePrompt({
  name: 'summarizeExtractedDataPrompt',
  input: {schema: SummarizeExtractedDataInputSchema},
  output: {schema: SummarizeExtractedDataOutputSchema},
  prompt: `You are an expert financial summarizer. You will receive extracted data from multiple receipts and provide a summary of the total expenses and categorization of spending.

  The extracted data is as follows:
  {{#each extractedData}}
  - Description: {{this.description}}, Amount: {{this.amount}}, Category: {{this.category}}
  {{/each}}
  
  Please provide a summary including:
  - Total expenses from all receipts.
  - A summary of expenses by category.
  
  Ensure that the output is well-formatted and easy to understand.
  `,
});

const summarizeExtractedDataFlow = ai.defineFlow(
  {
    name: 'summarizeExtractedDataFlow',
    inputSchema: SummarizeExtractedDataInputSchema,
    outputSchema: SummarizeExtractedDataOutputSchema,
  },
  async input => {
    const {output} = await summarizeExtractedDataPrompt(input);
    return output!;
  }
);
