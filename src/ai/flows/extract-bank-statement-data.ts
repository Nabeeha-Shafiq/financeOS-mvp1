'use server';

/**
 * @fileOverview This file defines a Genkit flow for extracting transaction data from bank statements.
 *
 * - extractBankStatementData - A function that handles the bank statement data extraction process.
 * - ExtractBankStatementInput - The input type for the extractBankStatementData function.
 * - BankTransaction - The type for a single extracted transaction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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

const BankTransactionSchema = z.object({
  date: z.string().describe('The transaction date in YYYY-MM-DD format.'),
  description: z.string().describe('The detailed description of the transaction.'),
  debit: z.number().optional().describe('The transaction amount if it is a debit/withdrawal. Should be a positive number.'),
  credit: z.number().optional().describe('The transaction amount if it is a credit/deposit. Should be a positive number.'),
  balance: z.number().optional().describe('The remaining balance after the transaction.'),
  category: z.string().optional().describe(`The suggested expense category. Choose one from the list. For debits, a category must be assigned. For credits/deposits or ATM withdrawals, label it 'Other'.`),
});
export type BankTransaction = z.infer<typeof BankTransactionSchema>;

const ExtractBankStatementInputSchema = z.object({
  statementMedia: z.string().optional().describe("A bank statement image or PDF, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  statementText: z.string().optional().describe("A bank statement's content as a string, typically from a CSV or Excel file."),
});
export type ExtractBankStatementInput = z.infer<typeof ExtractBankStatementInputSchema>;

const ExtractBankStatementOutputSchema = z.object({
    transactions: z.array(BankTransactionSchema),
});

export async function extractBankStatementData(input: ExtractBankStatementInput): Promise<BankTransaction[]> {
  const result = await extractBankStatementDataFlow(input);
  return result.transactions;
}

const prompt = ai.definePrompt({
  name: 'extractBankStatementDataPrompt',
  input: { schema: ExtractBankStatementInputSchema },
  output: { schema: ExtractBankStatementOutputSchema },
  prompt: `You are a financial data extraction expert specializing in Pakistani bank statements. Your task is to analyze the provided bank statement document and extract all transaction details. The document could be an image, a PDF, or raw text from a CSV file.

  Prioritize parsing formats from the following Pakistani banks: HBL, UBL, MCB, NBP, Meezan Bank, Allied Bank.

  For each transaction, extract the following information:
  - date: The date of the transaction in YYYY-MM-DD format.
  - description: The full transaction description.
  - debit: The withdrawal amount. If not applicable, omit this field.
  - credit: The deposit amount. If not applicable, omit this field.
  - balance: The balance after the transaction. If not available, omit this field.
  - category: Based on the transaction description, suggest the most relevant expense category. You must choose one from this list: ${CATEGORIES.join(', ')}. If it's a debit/withdrawal, you MUST assign a category. Analyze the merchant name and transaction details carefully to find the best fit. Recognize common Pakistani merchants and services (e.g., 'PTCL', 'K-Electric', 'SNGPL' map to 'Utilities'; 'PSO', 'Total PARCO' to 'Fuel & Transportation'; 'Foodpanda', 'Cheetay' to 'Food & Groceries'; 'Daraz', 'Alkaram' to 'Personal Care' or 'Entertainment'). If the transaction is a credit/deposit, or if it is an ATM cash withdrawal, label it as 'Other'.

  Return the data as a JSON object with a single key "transactions" containing an array of the extracted transaction objects.

  {{#if statementMedia}}
  Statement Document:
  {{media url=statementMedia}}
  {{/if}}

  {{#if statementText}}
  Statement Text Data:
  {{{statementText}}}
  {{/if}}
  `,
});

const extractBankStatementDataFlow = ai.defineFlow(
  {
    name: 'extractBankStatementDataFlow',
    inputSchema: ExtractBankStatementInputSchema,
    outputSchema: ExtractBankStatementOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
