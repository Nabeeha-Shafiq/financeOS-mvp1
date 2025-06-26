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

const CATEGORIES = [
  'Medical',
  'Education',
  'Fuel & Transportation',
  'Food & Groceries',
  'Utilities',
  'Rent & Housing',
  'Business Expenses',
  'Personal Care',
  'Entertainment',
  'Charitable Donations',
  'Other',
];

const ExtractReceiptDataInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A receipt image or PDF, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractReceiptDataInput = z.infer<typeof ExtractReceiptDataInputSchema>;

const ExtractReceiptDataOutputSchema = z.object({
  merchant_name: z.string().describe('The name of the merchant or vendor.'),
  amount: z.number().describe('The total amount on the receipt, in PKR.'),
  date: z.string().describe('The date on the receipt in YYYY-MM-DD format.'),
  items: z.array(z.string()).describe('The list of individual items purchased.'),
  location: z.string().optional().describe('The address of the merchant, if available.'),
  category: z.string().describe(`The suggested expense category. Choose one of the following: ${CATEGORIES.join(', ')}.`),
  confidence_score: z.number().describe('A score from 0 to 1 indicating the confidence in the extracted data.'),
  detected_language: z.string().describe('The detected language of the receipt (e.g., "English", "Urdu").'),
});
export type ExtractReceiptDataOutput = z.infer<typeof ExtractReceiptDataOutputSchema>;

export async function extractReceiptData(input: ExtractReceiptDataInput): Promise<ExtractReceiptDataOutput> {
  return extractReceiptDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractReceiptDataPrompt',
  input: {schema: ExtractReceiptDataInputSchema},
  output: {schema: ExtractReceiptDataOutputSchema},
  prompt: `You are an expert OCR and data extraction agent specializing in financial documents. Analyze the provided receipt image, which may contain text in English or Urdu.
  Extract the following information and return it as a structured JSON object.

  - merchant_name: The name of the business or store.
  - amount: The total amount of the transaction. The currency is Pakistani Rupee (PKR).
  - date: The date of the transaction in YYYY-MM-DD format.
  - items: An array of strings, where each string is an individual item purchased. If an item is in Urdu, transliterate it to Roman Urdu (e.g., "دال" should become "Daal", not "Pulses"). Do not translate it to English.
  - location: The physical address of the merchant, if it is present on the receipt. If not available, return an empty string.
  - category: Based on the merchant and items, suggest the most relevant expense category. You must choose one from this list: ${CATEGORIES.join(', ')}.
  - confidence_score: Your confidence in the accuracy of the extracted data, as a number between 0 and 1.
  - detected_language: The primary language detected on the receipt (e.g., "English", "Urdu", "Mixed").

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
