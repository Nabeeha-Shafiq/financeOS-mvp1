'use client';

import { useState, useMemo } from 'react';
import type { FileWrapper } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExpensePieChart } from './expense-pie-chart';
import { ExpenseBarChart } from './expense-bar-chart';
import { ExpenseLineChart } from './expense-line-chart';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from './ui/calendar';
import { ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import { FbrReportGenerator } from './fbr-report-generator';
import { ExpenseListView } from './expense-list-view';
import { DateRange } from 'react-day-picker';
import { format, subDays, startOfWeek, endOfWeek, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';


const FBR_DEDUCTIBLE_CATEGORIES = ['Medical', 'Education'];
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function SessionSummary({ acceptedFiles }: { acceptedFiles: FileWrapper[] }) {
  const allCategories = useMemo(() => {
    const categories = new Set(acceptedFiles.map(f => f.extractedData!.category));
    return Array.from(categories);
  }, [acceptedFiles]);

  const maxAmount = useMemo(() => {
    return Math.ceil(Math.max(...acceptedFiles.map(f => f.extractedData!.amount), 0));
  }, [acceptedFiles]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 0]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [timelinePeriod, setTimelinePeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');


  useMemo(() => {
    setSelectedCategories(allCategories);
  }, [allCategories]);

  useMemo(() => {
    setAmountRange([0, maxAmount]);
  }, [maxAmount]);
  
  const filteredReceipts = useMemo(() => {
    return acceptedFiles.filter(f => {
      const data = f.extractedData!;
      const inCategory = selectedCategories.length === 0 || selectedCategories.length === allCategories.length || selectedCategories.includes(data.category);
      const inAmountRange = data.amount >= amountRange[0] && data.amount <= amountRange[1];
      const receiptDate = new Date(data.date);
      const inDateRange = (!dateRange?.from || receiptDate >= dateRange.from) && (!dateRange?.to || receiptDate <= dateRange.to);
      return inCategory && inAmountRange && inDateRange;
    });
  }, [acceptedFiles, selectedCategories, allCategories, amountRange, dateRange]);

  const summary = useMemo(() => {
    const totalExpenses = filteredReceipts.reduce((sum, f) => sum + f.extractedData!.amount, 0);
    const totalDeductible = filteredReceipts.reduce((sum, f) => {
      if (FBR_DEDUCTIBLE_CATEGORIES.includes(f.extractedData!.category)) {
        return sum + f.extractedData!.amount;
      }
      return sum;
    }, 0);
    
    const categorySummary = filteredReceipts.reduce((acc, f) => {
        const category = f.extractedData!.category;
        const amount = f.extractedData!.amount;
        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += amount;
        return acc;
    }, {} as Record<string, number>);

    const { businessExpenses, personalExpenses } = filteredReceipts.reduce((acc, f) => {
        if (f.extractedData?.category === 'Business Expenses') {
            acc.businessExpenses += f.extractedData!.amount;
        } else {
            acc.personalExpenses += f.extractedData!.amount;
        }
        return acc;
    }, { businessExpenses: 0, personalExpenses: 0 });

    return {
      totalExpenses,
      totalDeductible,
      categorySummary,
      processedCount: filteredReceipts.length,
      businessExpenses,
      personalExpenses,
    };
  }, [filteredReceipts]);

  const chartData = useMemo(() => {
    return Object.entries(summary.categorySummary)
      .map(([category, total], index) => ({
        category,
        total,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.total - a.total);
  }, [summary.categorySummary]);

  const timelineData = useMemo(() => {
    let groupedData: { [key: string]: number } = {};

    if (timelinePeriod === 'daily') {
        filteredReceipts.forEach(f => {
            const day = format(parseISO(f.extractedData!.date), 'yyyy-MM-dd');
            groupedData[day] = (groupedData[day] || 0) + f.extractedData!.amount;
        });
    } else if (timelinePeriod === 'weekly') {
        filteredReceipts.forEach(f => {
            const weekStart = format(startOfWeek(parseISO(f.extractedData!.date)), 'yyyy-MM-dd');
            groupedData[weekStart] = (groupedData[weekStart] || 0) + f.extractedData!.amount;
        });
    } else { // monthly
        filteredReceipts.forEach(f => {
            const monthStart = format(startOfMonth(parseISO(f.extractedData!.date)), 'yyyy-MM');
            groupedData[monthStart] = (groupedData[monthStart] || 0) + f.extractedData!.amount;
        });
    }

    return Object.entries(groupedData)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(item => ({...item, date: format(new Date(item.date), timelinePeriod === 'daily' ? 'MMM d' : 'MMM')}));

  }, [filteredReceipts, timelinePeriod]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  return (
    <section className="mt-12" aria-labelledby="summary-heading">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
        <h2 id="summary-heading" className="text-2xl font-bold">Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters */}
        <Card className="md:col-span-4">
            <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Refine the data shown in your dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div>
                    <Label className="mb-2 block">Category</Label>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                            <span>
                                {selectedCategories.length === 0 || selectedCategories.length === allCategories.length
                                ? "All categories"
                                : `${selectedCategories.length} selected`}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                            <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {allCategories.map(category => (
                                <DropdownMenuCheckboxItem
                                    key={category}
                                    checked={selectedCategories.includes(category)}
                                    onCheckedChange={() => handleCategoryToggle(category)}
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    {category}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="md:col-span-1">
                    <Label className="mb-2 block">
                        Amount Range: {amountRange[0].toFixed(0)} - {amountRange[1].toFixed(0)} PKR
                    </Label>
                    <Slider
                        min={0}
                        max={maxAmount}
                        step={100}
                        value={amountRange}
                        onValueChange={(value) => setAmountRange(value as [number, number])}
                        disabled={maxAmount === 0}
                    />
                </div>
                <div>
                    <Label className="mb-2 block">Date Range</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                            ) : (
                            <span>Pick a date</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.totalExpenses.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">PKR</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Personal Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.personalExpenses.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">PKR</span></p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Business Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.businessExpenses.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">PKR</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Receipts Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.processedCount}</p>
             <p className="text-xs text-muted-foreground mt-1">in selected range</p>
          </CardContent>
        </Card>
        
        {/* Timeline Chart */}
        <div className="md:col-span-4">
            <div className="flex justify-end mb-4">
                <Tabs value={timelinePeriod} onValueChange={(value) => setTimelinePeriod(value as any)} className="w-auto">
                    <TabsList>
                        <TabsTrigger value="daily">Daily</TabsTrigger>
                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            <ExpenseLineChart data={timelineData} />
        </div>
        
        {/* Pie and Bar Charts */}
        <div className="md:col-span-2">
            <ExpensePieChart data={chartData} />
        </div>
        <div className="md:col-span-2">
            <ExpenseBarChart data={chartData} />
        </div>
        
        {/* Expense List View */}
        <div className="md:col-span-4">
            <ExpenseListView expenses={filteredReceipts} />
        </div>

        {/* FBR Report Generator */}
        <FbrReportGenerator acceptedFiles={acceptedFiles} />

      </div>
    </section>
  );
}
