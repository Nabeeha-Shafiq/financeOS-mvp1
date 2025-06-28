
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';

import { useFinancialData } from '@/context/financial-data-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ReceiptDropzone } from '@/components/receipt-dropzone';
import { FilePreviewGrid } from '@/components/file-preview-grid';
import { StatementProcessor } from '@/components/statement-processor';
import { Sparkles, Save, Calendar as CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ExtractReceiptDataOutput } from '@/types';


const EXPENSE_CATEGORIES = [
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

const manualExpenseSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0.'),
  description: z.string().min(1, 'Description is required.'),
  category: z.string().min(1, 'Please select a category.'),
  date: z.date({ required_error: 'A date is required.' }),
  paymentMethod: z.enum(['Cash', 'Card', 'Bank Transfer'], {
    required_error: 'You need to select a payment method.',
  }),
});

type ManualExpenseFormValues = z.infer<typeof manualExpenseSchema>;

function ManualEntryTab() {
    const { files, handleAddManualExpense } = useFinancialData();
    const manualEntries = files.filter(f => f.extractedData?.isManual).sort((a,b) => new Date(b.extractedData!.date).getTime() - new Date(a.extractedData!.date).getTime()).slice(0, 10);
    
    const form = useForm<ManualExpenseFormValues>({
        resolver: zodResolver(manualExpenseSchema),
        defaultValues: {
            description: '',
            category: '',
            date: new Date(),
            paymentMethod: 'Card',
        },
    });

    const onSubmit = (values: ManualExpenseFormValues) => {
        const newExpense: ExtractReceiptDataOutput = {
          merchant_name: 'Manual Entry',
          amount: values.amount,
          date: format(values.date, 'yyyy-MM-dd'),
          items: [values.description],
          location: values.paymentMethod,
          category: values.category,
          confidence_score: 1,
          detected_language: 'manual',
          isManual: true,
        };
        handleAddManualExpense(newExpense);
        form.reset({
            description: '',
            amount: undefined,
            category: '',
            date: new Date(),
            paymentMethod: 'Card',
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">Quick Entry Form</h3>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Lunch with client" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Amount (PKR)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="1500" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date</FormLabel>
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button
                                            variant={'outline'}
                                            className={cn(
                                            'pl-3 text-left font-normal',
                                            !field.value && 'text-muted-foreground'
                                            )}
                                        >
                                            {field.value ? (
                                            format(field.value, 'PPP')
                                            ) : (
                                            <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date('1900-01-01')
                                        }
                                        initialFocus
                                        />
                                    </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {EXPENSE_CATEGORIES.map((category) => (
                                        <SelectItem key={category} value={category}>
                                        {category}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Payment Method</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex space-x-4 pt-2"
                                    >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="Card" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Card</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="Cash" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Cash</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="Bank Transfer" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Bank Transfer</FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <Button type="submit" className="w-full"><Save className="mr-2 h-4 w-4" /> Save & Add Another</Button>
                    </form>
                </Form>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-4">Recent Manual Entries</h3>
                 <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {manualEntries.length > 0 ? manualEntries.map(entry => (
                                    <TableRow key={entry.id}>
                                        <TableCell>{entry.extractedData!.date}</TableCell>
                                        <TableCell>{entry.extractedData!.items.join(', ')}</TableCell>
                                        <TableCell className="text-right">{entry.extractedData!.amount.toLocaleString()} PKR</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground h-24">No manual entries yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function DataEntryPage() {
  const {
    files,
    isProcessing,
    processingProgress,
    transactions,
    handleFilesAdded,
    handleRemoveFile,
    handleAcceptFile,
    handleProcessReceipts,
    handleTransactionsExtracted,
    handleUpdateTransaction,
    handleManualMatch,
  } = useFinancialData();
  
  const queuedFilesCount = files.filter(f => f.status === 'queued').length;
  const needsVerificationCount = files.filter(f => f.status === 'success').length;
  const receiptFiles = files.filter(f => !f.extractedData?.isManual);

  return (
    <Tabs defaultValue="receipts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="receipts">Receipt Scanner</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="bank">Bank Import</TabsTrigger>
        </TabsList>

        <TabsContent value="receipts" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Receipt Scanner & Bulk Upload</CardTitle>
                    <CardDescription>Drag and drop multiple receipts (JPG, PNG, PDF), or a ZIP file for bulk processing. The AI will scan and extract the data automatically.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <ReceiptDropzone onFilesAdded={handleFilesAdded} disabled={isProcessing} />
                    
                    {receiptFiles.length > 0 && (
                        <section aria-labelledby="processing-queue-heading">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 my-4">
                                <h2 id="processing-queue-heading" className="text-xl font-semibold">Processing Queue ({receiptFiles.length})</h2>
                                <Button onClick={handleProcessReceipts} disabled={isProcessing || queuedFilesCount === 0}>
                                    <Sparkles className="mr-2" />
                                    {isProcessing 
                                        ? `Processing ${processingProgress.processed}/${processingProgress.total}...` 
                                        : `Process ${queuedFilesCount} New Receipt${queuedFilesCount !== 1 ? 's' : ''}`}
                                </Button>
                            </div>

                            {isProcessing && (
                                <div className="my-4 space-y-2">
                                    <Progress value={(processingProgress.total > 0 ? (processingProgress.processed / processingProgress.total) : 0) * 100} />
                                    <p className="text-sm text-muted-foreground text-center">Please keep this tab open until processing is complete.</p>
                                </div>
                            )}

                            <FilePreviewGrid files={receiptFiles} onRemoveFile={handleRemoveFile} onAcceptFile={handleAcceptFile} />
                            
                            {needsVerificationCount > 0 && !isProcessing && (
                                <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                                    <p className="text-primary font-medium">{needsVerificationCount} receipt{needsVerificationCount !== 1 ? 's' : ''} ready for your review.</p>
                                </div>
                            )}
                        </section>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
             <Card>
                <CardHeader>
                    <CardTitle>Manual Expense Entry</CardTitle>
                    <CardDescription>Quickly log expenses when you don't have a digital receipt. Use this form for cash payments, reimbursements, or other untracked spending.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ManualEntryTab />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Bank Statement Import</CardTitle>
                    <CardDescription>Import a bank statement (PDF, CSV, XLS, HTML) to extract transactions. The system intelligently handles various formats from major Pakistani banks and attempts to auto-match transactions to your receipts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <StatementProcessor 
                        onTransactionsExtracted={handleTransactionsExtracted}
                        transactions={transactions}
                        receipts={files.filter(f => f.status === 'accepted')}
                        onUpdateTransaction={handleUpdateTransaction}
                        onManualMatch={handleManualMatch}
                    />
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  );
}
