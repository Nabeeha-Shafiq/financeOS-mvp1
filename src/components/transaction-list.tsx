'use client';

import type { BankTransaction } from '@/types';
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

interface TransactionListProps {
  transactions: BankTransaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return null;
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracted Transactions</CardTitle>
        <CardDescription>A list of all transactions found in the statement.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[500px] overflow-y-auto">
          <Table>
            <TableCaption>A list of transactions from your statement.</TableCaption>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit (PKR)</TableHead>
                <TableHead className="text-right">Credit (PKR)</TableHead>
                <TableHead className="text-right">Balance (PKR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((tx, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{tx.date}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell className="text-right text-destructive">
                    {tx.debit?.toLocaleString() ?? '—'}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {tx.credit?.toLocaleString() ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {tx.balance?.toLocaleString() ?? 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
