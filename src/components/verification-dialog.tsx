'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Save, Ban } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { FileWrapper, ExtractReceiptDataOutput } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

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

const verificationSchema = z.object({
  merchant_name: z.string().min(1, 'Merchant name is required.'),
  amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
  date: z.date({ required_error: 'A date is required.' }),
  category: z.string().min(1, 'Please select a category.'),
  description: z.string().optional(),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

interface VerificationDialogProps {
  fileWrapper: FileWrapper;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (id: string, data: ExtractReceiptDataOutput) => void;
}

export function VerificationDialog({ fileWrapper, isOpen, onOpenChange, onSave }: VerificationDialogProps) {
  const { extractedData } = fileWrapper;

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      merchant_name: '',
      amount: 0,
      date: new Date(),
      category: '',
      description: '',
    },
  });
  
  useEffect(() => {
    if (extractedData) {
      form.reset({
        merchant_name: extractedData.merchant_name || '',
        amount: extractedData.amount || 0,
        date: extractedData.date ? new Date(extractedData.date) : new Date(),
        category: extractedData.category || '',
        description: extractedData.items.join(', ') || '',
      })
    }
  }, [extractedData, form]);

  const onSubmit = (values: VerificationFormValues) => {
    if (!extractedData) return;

    const updatedData: ExtractReceiptDataOutput = {
      ...extractedData,
      merchant_name: values.merchant_name,
      amount: values.amount,
      date: format(values.date, 'yyyy-MM-dd'),
      category: values.category,
      items: values.description ? values.description.split(',').map(s => s.trim()) : [],
    };
    onSave(fileWrapper.id, updatedData);
    onOpenChange(false);
  };
  
  if (!extractedData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl grid-cols-1 md:grid-cols-2 gap-8 p-0">
        <div className="p-6 md:p-8 flex flex-col">
            <DialogHeader>
            <DialogTitle>Verify Receipt Data</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-4 -mr-4 mt-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="merchant_name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Merchant Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
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
                                        <Input type="number" {...field} />
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Description (Items)</FormLabel>
                                <FormControl>
                                    <Textarea
                                    placeholder="e.g., Milk, Bread, Eggs"
                                    className="resize-none"
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>
            </div>
            <DialogFooter className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground mr-auto">
                    AI Confidence: <span className="font-bold text-foreground">{(extractedData.confidence_score * 100).toFixed(0)}%</span>
                </p>
                <DialogClose asChild>
                    <Button type="button" variant="outline"><Ban />Discard</Button>
                </DialogClose>
                <Button type="submit" onClick={form.handleSubmit(onSubmit)}><Save />Accept & Add</Button>
            </DialogFooter>
        </div>
        <div className="bg-muted hidden md:flex items-center justify-center p-4">
            <Image
                src={fileWrapper.previewUrl}
                alt={`Receipt for ${extractedData.merchant_name}`}
                width={500}
                height={700}
                className="object-contain max-h-full max-w-full rounded-md shadow-lg"
                data-ai-hint="receipt document"
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
