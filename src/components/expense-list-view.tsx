'use client';

import { useState } from 'react';
import type { FileWrapper, ProcessedBankTransaction } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ExpenseDetails } from './expense-details';
import { Input } from './ui/input';

interface ExpenseListViewProps {
  expenses: FileWrapper[];
  transactions: ProcessedBankTransaction[];
}

export function ExpenseListView({ expenses, transactions }: ExpenseListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<FileWrapper | null>(null);

  if (expenses.length === 0) {
    return null;
  }

  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateA = new Date(a.extractedData?.date || 0);
    const dateB = new Date(b.extractedData?.date || 0);
    return dateB.getTime() - dateA.getTime();
  });

  const filteredAndSortedExpenses = sortedExpenses.filter(expense => {
    const data = expense.extractedData;
    if (!data) return false;
    const query = searchQuery.toLowerCase();
    return (
        data.merchant_name?.toLowerCase().includes(query) ||
        data.items.join(', ').toLowerCase().includes(query) ||
        data.category?.toLowerCase().includes(query)
    );
  });
  
  const findTransaction = (expense: FileWrapper) => {
    if (!expense.matchedTransactionId) return undefined;
    return transactions.find(t => t.id === expense.matchedTransactionId);
  }

  return (
    <>
      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>Expense Log</CardTitle>
          <CardDescription>A detailed list of all accepted expenses in this session. Click a row for details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input 
              placeholder="Search by merchant, item, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto">
              <Table>
                  {filteredAndSortedExpenses.length > 10 && <TableCaption>A list of your recent expenses.</TableCaption>}
                  <TableHeader className="sticky top-0 bg-card">
                      <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount (PKR)</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredAndSortedExpenses.map((expense) => (
                      <TableRow key={expense.id} onClick={() => setSelectedExpense(expense)} className="cursor-pointer">
                          <TableCell className="font-medium">{expense.extractedData?.date}</TableCell>
                          <TableCell>{expense.extractedData?.isManual ? expense.extractedData.items.join(', ') : expense.extractedData?.merchant_name}</TableCell>
                          <TableCell>{expense.extractedData?.category}</TableCell>
                          <TableCell>
                              <Badge variant={expense.extractedData?.isManual ? "secondary" : "outline"}>
                                  {expense.extractedData?.isManual ? 'Manual' : 'Receipt'}
                              </Badge>
                          </TableCell>
                          <TableCell className="text-right">{expense.extractedData?.amount.toLocaleString()}</TableCell>
                      </TableRow>
                      ))}
                  </TableBody>
              </Table>
              {filteredAndSortedExpenses.length === 0 && (
                <p className="text-center text-muted-foreground p-4">No expenses match your search.</p>
              )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedExpense} onOpenChange={(isOpen) => !isOpen && setSelectedExpense(null)}>
        <DialogContent className="max-w-4xl p-0">
            {selectedExpense && (
                <ExpenseDetails expense={selectedExpense} transaction={findTransaction(selectedExpense)} />
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
