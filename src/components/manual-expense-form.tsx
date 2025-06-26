'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Save } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
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
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
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

export type ManualExpenseFormValues = z.infer<typeof manualExpenseSchema>;

interface ManualExpenseFormProps {
  onAddExpense: (data: ExtractReceiptDataOutput) => void;
  children: React.ReactNode;
}

export function ManualExpenseForm({ onAddExpense, children }: ManualExpenseFormProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const form = useForm<ManualExpenseFormValues>({
    resolver: zodResolver(manualExpenseSchema),
    defaultValues: {
      amount: undefined,
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
      location: values.paymentMethod, // Using location to store payment method
      category: values.category,
      confidence_score: 1,
      detected_language: 'manual',
      isManual: true,
    };
    onAddExpense(newExpense);
    form.reset();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Manual Expense</SheetTitle>
          <SheetDescription>
            Enter the details for an expense that you don't have a receipt for.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 h-[calc(100vh-150px)] overflow-y-auto pr-4">
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
                </form>
            </Form>
        </div>
        <SheetFooter className="pt-4 border-t">
          <SheetClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </SheetClose>
          <Button onClick={form.handleSubmit(onSubmit)}><Save className="mr-2 h-4 w-4" /> Save Expense</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
