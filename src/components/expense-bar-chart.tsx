'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';

interface ExpenseBarChartProps {
  data: {
    category: string;
    total: number;
  }[];
}

const chartConfig = {
  total: {
    label: 'Total Expenses',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function ExpenseBarChart({ data }: ExpenseBarChartProps) {
    if (data.length === 0) {
        return (
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Spending Trends</CardTitle>
                    <CardDescription>Bar chart showing spending by category.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center min-h-[300px]">
                    <p className="text-muted-foreground">No data to display for the selected filters.</p>
                </CardContent>
            </Card>
        )
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Trends</CardTitle>
        <CardDescription>
          A breakdown of spending per category.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 15)}
              width={100}
            />
            <XAxis dataKey="total" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="total" fill="var(--color-total)" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
