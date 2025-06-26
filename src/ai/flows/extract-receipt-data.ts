'use server';

/**
 * @fileOverview This file defines a Genkit flow for extracting financial data from receipts using the Gemini API.
 *
 * - extractReceiptData - A function that handles the receipt data extraction process.
 * - ExtractReceiptDataInput - The input type for the extractReceiptData function.
 * - ExtractReceiptDataOutput - The return type for the extractReceiptData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractReceiptDataInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A receipt image or PDF, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractReceiptDataInput = z.infer<typeof ExtractReceiptDataInputSchema>;

const ExtractReceiptDataOutputSchema = z.object({
  date: z.string().describe('The date on the receipt.'),
  amount: z.number().describe('The total amount on the receipt.'),
  vendor: z.string().describe('The name of the vendor.'),
  items: z.array(z.string()).describe('The list of items on the receipt.'),
});
export type ExtractReceiptDataOutput = z.infer<typeof ExtractReceiptDataOutputSchema>;

export async function extractReceiptData(input: ExtractReceiptDataInput): Promise<ExtractReceiptDataOutput> {
  return extractReceiptDataFlow(input);
}

const isFinanceRelated = ai.defineTool(
  {
    name: 'isFinanceRelated',
    description: 'Determines if an item on a receipt is finance related.',
    inputSchema: z.object({
      item: z.string().describe('The item to check.'),
    }),
    outputSchema: z.boolean(),
  },
  async (input) => {
    // TODO: Implement the logic to determine if the item is finance-related
    // For now, always return true
    return true;
  }
);

const prompt = ai.definePrompt({
  name: 'extractReceiptDataPrompt',
  input: {schema: ExtractReceiptDataInputSchema},
  output: {schema: ExtractReceiptDataOutputSchema},
  tools: [isFinanceRelated],
  prompt: `You are an expert financial data extractor. Extract the key financial data from the receipt provided.

  Date: The date on the receipt.
  Amount: The total amount on the receipt.
  Vendor: The name of the vendor.
  Items: A list of items on the receipt.

  Only include an item in the Items list after checking with the isFinanceRelated tool to see if it is finance related.

  Receipt: {{media url=receiptDataUri}}`,
});

const extractReceiptDataFlow = ai.defineFlow(
  {
    name: 'extractReceiptDataFlow',
    inputSchema: ExtractReceiptDataInputSchema,
    outputSchema: ExtractReceiptDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
