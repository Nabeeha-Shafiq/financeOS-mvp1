'use client';

import { useState, useMemo } from 'react';
import type { UnifiedExpense, ProcessedBankTransaction, FileWrapper } from '@/types';
import { useFinancialData } from '@/context/financial-data-context';
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
  expenses: UnifiedExpense[];
  transactions: ProcessedBankTransaction[];
}

export function ExpenseListView({ expenses, transactions }: ExpenseListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<UnifiedExpense | null>(null);
  const { files } = useFinancialData();

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [expenses]);
  
  const filteredExpenses = useMemo(() => {
    return sortedExpenses.filter(expense => {
      const query = searchQuery.toLowerCase();
      return (
          expense.merchant_name?.toLowerCase().includes(query) ||
          expense.items.join(', ').toLowerCase().includes(query) ||
          expense.category?.toLowerCase().includes(query)
      );
    });
  }, [sortedExpenses, searchQuery]);
  
  const findTransaction = (expense: UnifiedExpense | null): ProcessedBankTransaction | undefined => {
    if (!expense || expense.source === 'bank') return undefined;
    const file = files.find(f => f.id === expense.id);
    if (!file || !file.matchedTransactionId) return undefined;
    return transactions.find(t => t.id === file.matchedTransactionId);
  }

  const findFileWrapper = (expense: UnifiedExpense | null): FileWrapper | undefined => {
     if (!expense || expense.source === 'bank') return undefined;
     return files.find(f => f.id === expense.id);
  }

  const handleRowClick = (expense: UnifiedExpense) => {
    // Only allow details view for receipts/manual entries
    if (expense.source !== 'bank') {
        setSelectedExpense(expense);
    }
  }

  const getBadgeVariant = (source: UnifiedExpense['source']) => {
    switch(source) {
      case 'receipt': return "outline";
      case 'manual': return "secondary";
      case 'bank': return "default";
      default: return "secondary";
    }
  }

  return (
    <>
      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>Expense Log</CardTitle>
          <CardDescription>A detailed list of all expenses in this session. Click a receipt or manual entry for details.</CardDescription>
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
                  {filteredExpenses.length > 10 && <TableCaption>A list of your recent expenses.</TableCaption>}
                  <TableHeader className="sticky top-0 bg-card">
                      <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Amount (PKR)</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredExpenses.map((expense) => (
                      <TableRow 
                        key={expense.id} 
                        onClick={() => handleRowClick(expense)} 
                        className={expense.source !== 'bank' ? "cursor-pointer" : ""}
                      >
                          <TableCell className="font-medium">{expense.date}</TableCell>
                          <TableCell>{expense.merchant_name}</TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell>
                              <Badge variant={getBadgeVariant(expense.source)}>
                                  {expense.source.charAt(0).toUpperCase() + expense.source.slice(1)}
                              </Badge>
                          </TableCell>
                          <TableCell className="text-right">{expense.amount.toLocaleString()}</TableCell>
                      </TableRow>
                      ))}
                  </TableBody>
              </Table>
              {filteredExpenses.length === 0 && (
                <p className="text-center text-muted-foreground p-4">No expenses match your search.</p>
              )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedExpense} onOpenChange={(isOpen) => !isOpen && setSelectedExpense(null)}>
        <DialogContent className="max-w-4xl p-0">
            {selectedExpense && findFileWrapper(selectedExpense) && (
                <ExpenseDetails 
                    expense={findFileWrapper(selectedExpense)!} 
                    transaction={findTransaction(selectedExpense)} 
                />
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
