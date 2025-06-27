'use client';

import { useMemo } from 'react';
import type { ProcessedBankTransaction } from '@/types';
import { format, parseISO } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';

interface CashFlowReportProps {
  transactions: ProcessedBankTransaction[];
}

const chartConfig = {
  inflow: {
    label: 'Inflow',
    color: 'hsl(var(--chart-2))',
  },
  outflow: {
    label: 'Outflow',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;


export function CashFlowReport({ transactions }: CashFlowReportProps) {

  const monthlyData = useMemo(() => {
    const dataByMonth: Record<string, { inflow: number; outflow: number; net: number }> = {};

    transactions.forEach(tx => {
       try {
        if(!tx.date) return;
        const month = format(parseISO(tx.date), 'yyyy-MM');
        if (!dataByMonth[month]) {
            dataByMonth[month] = { inflow: 0, outflow: 0, net: 0 };
        }
        dataByMonth[month].inflow += tx.credit || 0;
        dataByMonth[month].outflow += tx.debit || 0;
      } catch (e) {
        // Ignore invalid dates
      }
    });

    return Object.entries(dataByMonth)
      .map(([month, data]) => {
        const net = data.inflow - data.outflow;
        return {
          month,
          monthFormatted: format(parseISO(`${month}-01`), 'MMM yy'),
          ...data,
          net,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  return (
    <Card className="mt-6 border-0 shadow-none">
      <CardHeader>
        <CardTitle>Cash Flow Analysis</CardTitle>
        <CardDescription>
          A summary of your cash inflows and outflows over time, based on bank transaction data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h3 className="text-lg font-semibold mb-4">Monthly Cash Flow</h3>
            {monthlyData.length > 0 ? (
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                        <XAxis dataKey="monthFormatted" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `Rs. ${Number(value/1000).toFixed(0)}k`} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="inflow" fill="var(--color-inflow)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="outflow" fill="var(--color-outflow)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
            ) : (
                <div className="flex items-center justify-center min-h-[300px] bg-muted rounded-lg">
                    <p className="text-muted-foreground">No transaction data for chart.</p>
                </div>
            )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Cash Flow Details</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Inflow (PKR)</TableHead>
                    <TableHead className="text-right">Outflow (PKR)</TableHead>
                    <TableHead className="text-right">Net Cash Flow (PKR)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {monthlyData.map(data => (
                        <TableRow key={data.month}>
                            <TableCell className="font-medium">{format(parseISO(`${data.month}-01`), 'MMMM yyyy')}</TableCell>
                            <TableCell className="text-right text-green-600">{data.inflow.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-destructive">{data.outflow.toLocaleString()}</TableCell>
                            <TableCell className={`text-right font-bold ${data.net >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                {data.net.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    ))}
                    {monthlyData.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                No bank transaction data to display. Please upload a statement on the dashboard.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
