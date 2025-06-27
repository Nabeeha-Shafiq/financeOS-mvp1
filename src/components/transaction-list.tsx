'use client';

import { useState } from 'react';
import type { ProcessedBankTransaction, FileWrapper } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, Check, AlertCircle, CircleDashed } from 'lucide-react';


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

interface TransactionListProps {
  transactions: ProcessedBankTransaction[];
  receipts: FileWrapper[];
  onUpdateTransaction: (updatedTransaction: ProcessedBankTransaction) => void;
  onManualMatch: (transactionId: string, receiptId: string) => void;
}

export function TransactionList({ transactions, receipts, onUpdateTransaction, onManualMatch }: TransactionListProps) {
  const [activeTab, setActiveTab] = useState('unmatched');
  const [bulkUpdateAlert, setBulkUpdateAlert] = useState<{ open: boolean; newCategory: string; similarTransactions: ProcessedBankTransaction[] }>({ open: false, newCategory: '', similarTransactions: [] });

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const unmatchedTransactions = sortedTransactions.filter(tx => tx.matchStatus === 'unmatched');
  const matchedTransactions = sortedTransactions.filter(tx => tx.matchStatus === 'matched' || tx.matchStatus === 'manual');
  const availableReceiptsForMatching = receipts.filter(r => !r.matchedTransactionId);

  const handleCategoryChange = (tx: ProcessedBankTransaction, newCategory: string) => {
    // Find other transactions with a similar description to suggest a bulk update
    const txTerm = tx.description.split(' ')[0].toLowerCase();
    const similarTransactions = unmatchedTransactions.filter(
      otherTx => otherTx.id !== tx.id && otherTx.description.toLowerCase().includes(txTerm)
    );

    if (similarTransactions.length > 0) {
      setBulkUpdateAlert({ open: true, newCategory, similarTransactions: [tx, ...similarTransactions] });
    } else {
      onUpdateTransaction({ ...tx, category: newCategory });
    }
  };

  const handleBulkUpdate = () => {
    bulkUpdateAlert.similarTransactions.forEach(tx => {
        onUpdateTransaction({ ...tx, category: bulkUpdateAlert.newCategory });
    });
    setBulkUpdateAlert({ open: false, newCategory: '', similarTransactions: [] });
  };
  
  const handleSingleUpdate = () => {
     const [originalTx] = bulkUpdateAlert.similarTransactions;
     onUpdateTransaction({ ...originalTx, category: bulkUpdateAlert.newCategory });
     setBulkUpdateAlert({ open: false, newCategory: '', similarTransactions: [] });
  }

  const renderRow = (tx: ProcessedBankTransaction) => (
    <TableRow key={tx.id}>
      <TableCell className="font-medium">{tx.date}</TableCell>
      <TableCell>{tx.description}</TableCell>
      <TableCell className="text-right text-destructive">{tx.debit?.toLocaleString() ?? '—'}</TableCell>
      <TableCell className="text-right text-green-600">{tx.credit?.toLocaleString() ?? '—'}</TableCell>
      <TableCell>
        {tx.matchStatus === 'unmatched' ? (
          <Select value={tx.category} onValueChange={(newCategory) => handleCategoryChange(tx, newCategory)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          tx.category
        )}
      </TableCell>
      <TableCell className="text-center">
        {tx.matchStatus === 'matched' && <Badge variant="secondary" className='bg-green-100 text-green-800'><Check className="mr-1 h-3 w-3" />Auto-Matched</Badge>}
        {tx.matchStatus === 'manual' && <Badge variant="secondary"><Check className="mr-1 h-3 w-3" />Matched</Badge>}
        {tx.matchStatus === 'unmatched' && (
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={availableReceiptsForMatching.length === 0}>
                        <Link className="mr-2 h-4 w-4"/>Match
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manually Match Transaction</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[300px] overflow-y-auto my-4">
                        <p className="mb-2 text-sm">Select a receipt to link to this transaction:</p>
                        <div className="space-y-2">
                        {availableReceiptsForMatching.map(receipt => (
                            <DialogClose asChild key={receipt.id}>
                                <button className="w-full text-left p-2 border rounded-md hover:bg-muted" onClick={() => onManualMatch(tx.id, receipt.id)}>
                                    <p className="font-medium">{receipt.extractedData?.merchant_name}</p>
                                    <p className="text-sm text-muted-foreground">{receipt.extractedData?.date} - {receipt.extractedData?.amount.toLocaleString()} PKR</p>
                                </button>
                            </DialogClose>
                        ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Extracted Transactions</CardTitle>
        <CardDescription>Review, categorize, and match transactions from your statement.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="unmatched">
              <AlertCircle className="mr-2 h-4 w-4"/>Unmatched ({unmatchedTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="matched">
              <Check className="mr-2 h-4 w-4"/>Matched ({matchedTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              <CircleDashed className="mr-2 h-4 w-4"/>All ({transactions.length})
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4 max-h-[600px] overflow-y-auto">
            <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit (PKR)</TableHead>
                    <TableHead className="text-right">Credit (PKR)</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Action/Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTab === 'unmatched' && unmatchedTransactions.map(renderRow)}
                  {activeTab === 'matched' && matchedTransactions.map(renderRow)}
                  {activeTab === 'all' && sortedTransactions.map(renderRow)}
                </TableBody>
            </Table>
          </div>
        </Tabs>

        <AlertDialog open={bulkUpdateAlert.open} onOpenChange={(open) => !open && setBulkUpdateAlert({ ...bulkUpdateAlert, open })}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Bulk Category Update?</AlertDialogTitle>
                    <AlertDialogDescription>
                        We found {bulkUpdateAlert.similarTransactions.length - 1} other similar transaction(s). Would you like to update them all to '{bulkUpdateAlert.newCategory}'?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setBulkUpdateAlert({ open: false, newCategory: '', similarTransactions: [] })}>Cancel</AlertDialogCancel>
                    <Button variant="outline" onClick={handleSingleUpdate}>Just This One</Button>
                    <AlertDialogAction onClick={handleBulkUpdate}>Yes, Update All</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </CardContent>
    </Card>
  );
}
