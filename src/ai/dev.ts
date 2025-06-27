import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-extracted-data.ts';
import '@/ai/flows/extract-receipt-data.ts';
import '@/ai/flows/extract-bank-statement-data.ts';
