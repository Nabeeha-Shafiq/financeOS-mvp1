'use client';
import { useMemo } from 'react';
import type { UnifiedExpense } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ExpenseSummaryReportProps {
  expenses: UnifiedExpense[];
}

export function ExpenseSummaryReport({ expenses }: ExpenseSummaryReportProps) {
  const summary = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, f) => sum + f.amount, 0);
    const categorySummary = expenses.reduce((acc, f) => {
        const category = f.category;
        const amount = f.amount;
        if (!acc[category]) {
            acc[category] = { total: 0, count: 0, withReceipt: 0 };
        }
        acc[category].total += amount;
        acc[category].count++;
        if (f.source === 'receipt') {
          acc[category].withReceipt++;
        }
        return acc;
    }, {} as Record<string, { total: number; count: number; withReceipt: number }>);

    const sortedCategories = Object.entries(categorySummary)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    const deductibleExpenses = expenses
      .filter(f => ['Medical', 'Education', 'Charitable Donations'].includes(f.category))
      .reduce((sum, f) => sum + f.amount, 0);

    return { totalExpenses, sortedCategories, deductibleExpenses };
  }, [expenses]);

  return (
    <Card className="mt-6 border-0 shadow-none">
      <CardHeader>
        <CardTitle>Expense Summary</CardTitle>
        <CardDescription>A detailed breakdown of all expenses in this session by category.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{summary.totalExpenses.toLocaleString('en-IN', { style: 'currency', currency: 'PKR' })}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Potentially Deductible</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{summary.deductibleExpenses.toLocaleString('en-IN', { style: 'currency', currency: 'PKR' })}</p>
                    <p className="text-xs text-muted-foreground">From Medical, Education & Donations</p>
                </CardContent>
            </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Total Amount (PKR)</TableHead>
              <TableHead className="text-center">Transactions</TableHead>
              <TableHead className="text-center">With Receipt</TableHead>
              <TableHead className="text-right">% of Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.sortedCategories.map(cat => (
              <TableRow key={cat.name}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-right">{cat.total.toLocaleString()}</TableCell>
                <TableCell className="text-center">{cat.count}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={cat.withReceipt > 0 ? "default" : "secondary"}>
                    {cat.withReceipt} / {cat.count}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {((cat.total / summary.totalExpenses) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
