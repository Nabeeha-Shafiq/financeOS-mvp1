'use client';

import { useState, useMemo, useEffect } from 'react';
import type { FileWrapper, ProcessedBankTransaction, UnifiedExpense } from '@/types';
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
import type { DateRange } from 'react-day-picker';
import { format, subDays, startOfWeek, parseISO, startOfMonth, isValid } from 'date-fns';
import { cn } from '@/lib/utils';


const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface SessionSummaryProps {
  acceptedFiles: FileWrapper[];
  transactions: ProcessedBankTransaction[];
}

export function SessionSummary({ acceptedFiles, transactions }: SessionSummaryProps) {
  const unifiedExpenses = useMemo<UnifiedExpense[]>(() => {
    const receiptExpenses: UnifiedExpense[] = acceptedFiles.map(f => ({
      id: f.id,
      source: f.extractedData!.isManual ? 'manual' : 'receipt',
      ...f.extractedData!,
    }));

    const bankExpenses: UnifiedExpense[] = transactions
      .filter(tx => tx.matchStatus === 'unmatched' && tx.debit && tx.debit > 0)
      .map(tx => ({
        id: tx.id,
        source: 'bank',
        merchant_name: tx.description,
        amount: tx.debit!,
        date: tx.date,
        items: [tx.description],
        location: 'Bank Transaction',
        category: tx.category || 'Other',
        confidence_score: 1, // Bank data is considered confident
        detected_language: 'N/A',
        isManual: false,
      }));

    return [...receiptExpenses, ...bankExpenses];
  }, [acceptedFiles, transactions]);

  const allCategories = useMemo(() => {
    const categories = new Set(unifiedExpenses.map(f => f.category));
    return Array.from(categories).sort();
  }, [unifiedExpenses]);

  const maxAmount = useMemo(() => {
    return Math.ceil(Math.max(...unifiedExpenses.map(f => f.amount), 0));
  }, [unifiedExpenses]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 0]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [timelinePeriod, setTimelinePeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');


  useEffect(() => {
    setSelectedCategories(allCategories);
  }, [allCategories]);

  useEffect(() => {
    setAmountRange([0, maxAmount]);
  }, [maxAmount]);
  
  const filteredExpenses = useMemo(() => {
    return unifiedExpenses.filter(f => {
      const expenseDate = new Date(f.date);
      if (!isValid(expenseDate)) {
        return false;
      }
      const inCategory = selectedCategories.length === 0 || selectedCategories.length === allCategories.length || selectedCategories.includes(f.category);
      const inAmountRange = f.amount >= amountRange[0] && f.amount <= amountRange[1];
      const inDateRange = !dateRange || ((!dateRange.from || expenseDate >= dateRange.from) && (!dateRange.to || expenseDate <= dateRange.to));
      return inCategory && inAmountRange && inDateRange;
    });
  }, [unifiedExpenses, selectedCategories, allCategories, amountRange, dateRange]);

  const filteredReceipts = useMemo(() => {
    const filteredIds = new Set(filteredExpenses.map(e => e.id));
    return acceptedFiles.filter(f => filteredIds.has(f.id));
  }, [acceptedFiles, filteredExpenses]);


  const summary = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce((sum, f) => sum + f.amount, 0);
    
    const categorySummary = filteredExpenses.reduce((acc, f) => {
        const category = f.category;
        const amount = f.amount;
        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += amount;
        return acc;
    }, {} as Record<string, number>);

    const { businessExpenses, personalExpenses } = filteredExpenses.reduce((acc, f) => {
        if (f.category === 'Business Expenses') {
            acc.businessExpenses += f.amount;
        } else {
            acc.personalExpenses += f.amount;
        }
        return acc;
    }, { businessExpenses: 0, personalExpenses: 0 });
    
    const totalIncome = transactions
        .filter(tx => {
            const txDate = new Date(tx.date);
            if (!isValid(txDate) || !tx.credit) return false;

            if (!dateRange) return true;
            return (!dateRange.from || txDate >= dateRange.from) && (!dateRange.to || txDate <= dateRange.to);
        })
        .reduce((sum, tx) => sum + (tx.credit || 0), 0);

    return {
      totalExpenses,
      categorySummary,
      businessExpenses,
      personalExpenses,
      totalIncome,
    };
  }, [filteredExpenses, transactions, dateRange]);

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
    
    const validFilteredExpenses = filteredExpenses.filter(f => isValid(parseISO(f.date)));

    if (timelinePeriod === 'daily') {
        validFilteredExpenses.forEach(f => {
            const day = format(parseISO(f.date), 'yyyy-MM-dd');
            groupedData[day] = (groupedData[day] || 0) + f.amount;
        });
    } else if (timelinePeriod === 'weekly') {
        validFilteredExpenses.forEach(f => {
            const weekStart = format(startOfWeek(parseISO(f.date)), 'yyyy-MM-dd');
            groupedData[weekStart] = (groupedData[weekStart] || 0) + f.amount;
        });
    } else { // monthly
        validFilteredExpenses.forEach(f => {
            const monthStart = format(startOfMonth(parseISO(f.date)), 'yyyy-MM-dd');
            groupedData[monthStart] = (groupedData[monthStart] || 0) + f.amount;
        });
    }

    return Object.entries(groupedData)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(item => ({
            ...item, 
            date: format(new Date(item.date), timelinePeriod === 'daily' ? 'MMM d' : (timelinePeriod === 'weekly' ? 'MMM d' : 'MMM yyyy'))
        }));

  }, [filteredExpenses, timelinePeriod]);

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
                                {selectedCategories.length === 0
                                ? "No categories selected"
                                : selectedCategories.length === allCategories.length
                                ? "All categories"
                                : `${selectedCategories.length} selected`}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
                            <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={selectedCategories.length === allCategories.length}
                                onCheckedChange={() => setSelectedCategories(allCategories)}
                                onSelect={(e) => e.preventDefault()}
                            >
                                All Categories
                            </DropdownMenuCheckboxItem>
                             <DropdownMenuCheckboxItem
                                checked={selectedCategories.length === 0}
                                onCheckedChange={() => setSelectedCategories([])}
                                onSelect={(e) => e.preventDefault()}
                            >
                                None
                            </DropdownMenuCheckboxItem>
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
                            <span>All Time</span>
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
            <CardTitle>Total Income</CardTitle>
             <CardDescription>from filtered credits</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.totalIncome.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">PKR</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
            <CardDescription>from filtered debits</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.totalExpenses.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">PKR</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Personal Expenses</CardTitle>
            <CardDescription>non-business spending</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.personalExpenses.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">PKR</span></p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Business Expenses</CardTitle>
             <CardDescription>for business use</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.businessExpenses.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">PKR</span></p>
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
            <ExpenseListView expenses={filteredReceipts} transactions={transactions} />
        </div>

        {/* FBR Report Generator */}
        <div className="md:col-span-4">
            <FbrReportGenerator expenses={unifiedExpenses} />
        </div>

      </div>
    </section>
  );
}
