'use client';

import { useState, useMemo } from 'react';
import type { FileWrapper } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExpensePieChart } from './expense-pie-chart';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { FbrReportGenerator } from './fbr-report-generator';
import { ExpenseListView } from './expense-list-view';

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

  // Update filters if the underlying data changes
  useMemo(() => {
    setSelectedCategories(allCategories);
  }, [allCategories]);

  useMemo(() => {
    setAmountRange([0, maxAmount]);
  }, [maxAmount]);
  
  const filteredReceipts = useMemo(() => {
    return acceptedFiles.filter(f => {
      const data = f.extractedData!;
      const inCategory = selectedCategories.length === 0 || selectedCategories.includes(data.category);
      const inAmountRange = data.amount >= amountRange[0] && data.amount <= amountRange[1];
      return inCategory && inAmountRange;
    });
  }, [acceptedFiles, selectedCategories, amountRange]);

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

    return {
      totalExpenses,
      totalDeductible,
      categorySummary,
      processedCount: filteredReceipts.length,
    };
  }, [filteredReceipts]);

  const pieChartData = useMemo(() => {
    return Object.entries(summary.categorySummary)
      .map(([category, total], index) => ({
        category,
        total,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.total - a.total);
  }, [summary.categorySummary]);

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
        <h2 id="summary-heading" className="text-2xl font-bold">Current Session Summary</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters */}
        <Card className="md:col-span-4">
            <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Refine the data shown in your summary.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                    <Label htmlFor="category-filter" className="mb-2 block">Category</Label>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                            <span>
                                {selectedCategories.length === 0 
                                ? "Select categories" 
                                : selectedCategories.length === allCategories.length
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
                <div>
                    <Label htmlFor="amount-range-slider" className="mb-2 block">
                        Amount Range: {amountRange[0].toFixed(0)} - {amountRange[1].toFixed(0)} PKR
                    </Label>
                    <Slider
                        id="amount-range-slider"
                        min={0}
                        max={maxAmount}
                        step={100}
                        value={amountRange}
                        onValueChange={(value) => setAmountRange(value as [number, number])}
                        disabled={maxAmount === 0}
                    />
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
            <CardTitle>FBR Tax Deductible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.totalDeductible.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">PKR</span></p>
            <p className="text-xs text-muted-foreground mt-1">From Medical & Education</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Receipts Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.processedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Category</CardTitle>
          </CardHeader>
          <CardContent>
             {pieChartData.length > 0 ? (
                <>
                <p className="text-xl font-bold">{pieChartData[0].category}</p>
                <p className="text-md text-muted-foreground">{pieChartData[0].total.toLocaleString()} PKR</p>
                </>
             ) : (
                <p className="text-md text-muted-foreground">No data</p>
             )}
          </CardContent>
        </Card>
        
        {/* Chart */}
        <div className="md:col-span-4">
            <ExpensePieChart data={pieChartData} />
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
