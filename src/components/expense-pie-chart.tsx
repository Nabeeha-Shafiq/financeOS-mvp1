'use client';

import { TrendingUp } from 'lucide-react';
import { Pie, PieChart, Cell } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface ExpensePieChartProps {
  data: {
    category: string;
    total: number;
    fill: string;
  }[];
}

const chartConfig = {
  expenses: {
    label: 'Expenses',
  },
} satisfies ChartConfig;

// Dynamically generate chartConfig for each category
const generateChartConfig = (data: ExpensePieChartProps['data']): ChartConfig => {
  const config: ChartConfig = { ...chartConfig };
  data.forEach(item => {
    config[item.category] = {
      label: item.category,
      color: item.fill,
    };
  });
  return config;
};

export function ExpensePieChart({ data }: ExpensePieChartProps) {
    if (data.length === 0) {
        return (
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Category Breakdown</CardTitle>
                    <CardDescription>Pie chart showing spending by category.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center min-h-[300px]">
                    <p className="text-muted-foreground">No data to display for the selected filters.</p>
                </CardContent>
            </Card>
        )
    }

  const dynamicChartConfig = generateChartConfig(data);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
        <CardDescription>
          Showing spending by category for the selected period.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={dynamicChartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              innerRadius={60}
              strokeWidth={5}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-4">
        <div className="flex items-center gap-2 font-medium leading-none">
          Track your spending to stay on budget <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Categories with the highest spending are shown.
        </div>
      </CardFooter>
    </Card>
  );
}
