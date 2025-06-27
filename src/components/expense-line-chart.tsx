'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
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

interface ExpenseLineChartProps {
  data: {
    date: string;
    total: number;
  }[];
}

const chartConfig = {
  total: {
    label: 'Total',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function ExpenseLineChart({ data }: ExpenseLineChartProps) {
    if (data.length === 0) {
        return (
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Expense Timeline</CardTitle>
                    <CardDescription>Line chart showing spending over the selected period.</CardDescription>
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
        <CardTitle>Expense Timeline</CardTitle>
        <CardDescription>
          Total spending over the selected period.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="total"
              type="natural"
              fill="var(--color-total)"
              fillOpacity={0.4}
              stroke="var(--color-total)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
