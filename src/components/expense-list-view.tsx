'use client';

import type { FileWrapper } from '@/types';
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

interface ExpenseListViewProps {
  expenses: FileWrapper[];
}

export function ExpenseListView({ expenses }: ExpenseListViewProps) {
  if (expenses.length === 0) {
    return null;
  }

  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateA = new Date(a.extractedData?.date || 0);
    const dateB = new Date(b.extractedData?.date || 0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <Card className="md:col-span-4">
      <CardHeader>
        <CardTitle>Expense Log</CardTitle>
        <CardDescription>A detailed list of all accepted expenses in this session.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto">
            <Table>
                {expenses.length > 10 && <TableCaption>A list of your recent expenses.</TableCaption>}
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
                    {sortedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
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
        </div>
      </CardContent>
    </Card>
  );
}
