'use client';
import { useMemo } from 'react';
import type { UnifiedExpense } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExpenseBarChart } from '../expense-bar-chart';

interface VendorAnalysisReportProps {
  expenses: UnifiedExpense[];
}

export function VendorAnalysisReport({ expenses }: VendorAnalysisReportProps) {
  const { topVendors, chartData } = useMemo(() => {
    const vendorSummary = expenses
      .filter(e => e.source !== 'bank') // Filter out generic bank descriptions
      .reduce((acc, f) => {
        const merchant = f.merchant_name === 'Manual Entry' ? f.items.join(', ') : f.merchant_name;
        if (!acc[merchant]) {
            acc[merchant] = { total: 0, count: 0 };
        }
        acc[merchant].total += f.amount;
        acc[merchant].count++;
        return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const sortedVendors = Object.entries(vendorSummary)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    const topVendorsForChart = sortedVendors.slice(0, 10);
    const chartData = topVendorsForChart.map(v => ({ category: v.name, total: v.total }));

    return { topVendors: sortedVendors, chartData };
  }, [expenses]);

  return (
    <Card className="mt-6 border-0 shadow-none">
      <CardHeader>
        <CardTitle>Vendor & Merchant Analysis</CardTitle>
        <CardDescription>A breakdown of spending by vendor from receipts and manual entries.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Vendor/Merchant Name</TableHead>
                    <TableHead className="text-right">Total Spent (PKR)</TableHead>
                    <TableHead className="text-center"># of Transactions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {topVendors.map(vendor => (
                    <TableRow key={vendor.name}>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell className="text-right">{vendor.total.toLocaleString()}</TableCell>
                        <TableCell className="text-center">{vendor.count}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
            {topVendors.length === 0 && <p className="text-muted-foreground text-center p-4">No vendor data from receipts or manual entries in this session.</p>}
        </div>
        <div className="lg:col-span-2">
            <ExpenseBarChart data={chartData} />
        </div>
      </CardContent>
    </Card>
  );
}
