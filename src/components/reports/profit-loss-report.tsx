'use client';

import { useMemo, useState } from 'react';
import type { UnifiedExpense, ProcessedBankTransaction } from '@/types';
import { format, parseISO } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfitLossReportProps {
  expenses: UnifiedExpense[];
  transactions: ProcessedBankTransaction[];
}

const getMonthYear = (date: string) => {
    try {
        if(!date) return 'invalid-date';
        return format(parseISO(date), 'yyyy-MM');
    } catch(e) {
        return 'invalid-date';
    }
}

export function ProfitLossReport({ expenses, transactions }: ProfitLossReportProps) {
  const allMonths = useMemo(() => {
    const dates = [...expenses.map(e => e.date), ...transactions.map(t => t.date)];
    const uniqueMonths = [...new Set(dates.map(d => getMonthYear(d)))].filter(d => d !== 'invalid-date');
    return uniqueMonths.sort().reverse();
  }, [expenses, transactions]);

  const [selectedMonth, setSelectedMonth] = useState<string>(allMonths[0] || 'all');

  const data = useMemo(() => {
    const filteredExpenses = selectedMonth === 'all'
      ? expenses
      : expenses.filter(e => getMonthYear(e.date) === selectedMonth);

    const filteredTransactions = selectedMonth === 'all'
      ? transactions
      : transactions.filter(t => getMonthYear(t.date) === selectedMonth);

    const income = filteredTransactions.reduce((sum, tx) => sum + (tx.credit || 0), 0);

    const expenseByCategory = filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalExpenses = Object.values(expenseByCategory).reduce((sum, amount) => sum + amount, 0);

    const netProfit = income - totalExpenses;

    return {
      income,
      expenseByCategory,
      totalExpenses,
      netProfit,
    };
  }, [expenses, transactions, selectedMonth]);

  return (
    <Card className="mt-6 border-0 shadow-none">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Profit &amp; Loss Statement</CardTitle>
            <CardDescription>
              An overview of your income and expenses for the selected period.
            </CardDescription>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              {allMonths.map(month => (
                <SelectItem key={month} value={month}>{format(parseISO(`${month}-01`), 'MMMM yyyy')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Total Income</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{data.income.toLocaleString(undefined, { style: 'currency', currency: 'PKR' })}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{data.totalExpenses.toLocaleString(undefined, { style: 'currency', currency: 'PKR' })}</p>
                </CardContent>
            </Card>
            <Card className={data.netProfit >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}>
                 <CardHeader>
                    <CardTitle className="text-lg">Net Profit / (Loss)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className={`text-2xl font-bold ${data.netProfit >= 0 ? "text-primary" : "text-destructive"}`}>{data.netProfit.toLocaleString(undefined, { style: 'currency', currency: 'PKR' })}</p>
                </CardContent>
            </Card>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount (PKR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="font-bold bg-muted/50">
              <TableCell>Income</TableCell>
              <TableCell className="text-right">{data.income.toLocaleString()}</TableCell>
            </TableRow>
            {data.income > 0 ? (
                <TableRow>
                    <TableCell className="pl-8 text-muted-foreground">Total Credits</TableCell>
                    <TableCell className="text-right text-muted-foreground">{data.income.toLocaleString()}</TableCell>
                </TableRow>
            ) : null}

            <TableRow className="font-bold bg-muted/50">
              <TableCell>Expenses</TableCell>
              <TableCell className="text-right">{data.totalExpenses.toLocaleString()}</TableCell>
            </TableRow>
            {Object.entries(data.expenseByCategory).sort(([,a], [,b]) => b - a).map(([category, amount]) => (
                <TableRow key={category}>
                    <TableCell className="pl-8 text-muted-foreground">{category}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{amount.toLocaleString()}</TableCell>
                </TableRow>
            ))}
             <TableRow className="font-bold border-t-2 border-foreground">
                <TableCell>Net Profit / (Loss)</TableCell>
                <TableCell className="text-right">{data.netProfit.toLocaleString()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        {data.income === 0 && data.totalExpenses === 0 && (
            <p className="text-center text-muted-foreground py-8">No data for the selected period.</p>
        )}
      </CardContent>
    </Card>
  );
}
