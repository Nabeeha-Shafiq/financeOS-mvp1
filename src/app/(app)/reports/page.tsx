'use client';
import { useMemo } from 'react';
import { useFinancialData } from '@/context/financial-data-context';
import type { UnifiedExpense } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FbrComplianceReport } from '@/components/reports/fbr-compliance-report';
import { ExpenseSummaryReport } from '@/components/reports/expense-summary-report';
import { VendorAnalysisReport } from '@/components/reports/vendor-analysis-report';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

export default function ReportsPage() {
    const { acceptedFiles, transactions } = useFinancialData();

    const unifiedExpenses = useMemo<UnifiedExpense[]>(() => {
        const receiptExpenses: UnifiedExpense[] = acceptedFiles.map(f => ({
          id: f.id,
          source: f.extractedData!.isManual ? 'manual' : 'receipt',
          ...f.extractedData!,
        }));
    
        const bankExpenses: UnifiedExpense[] = transactions
          .filter(tx => tx.matchStatus !== 'matched' && tx.debit && tx.debit > 0)
          .map(tx => ({
            id: tx.id,
            source: 'bank',
            merchant_name: tx.description,
            amount: tx.debit!,
            date: tx.date,
            items: [tx.description],
            location: 'Bank Transaction',
            category: tx.category || 'Other',
            confidence_score: 1,
            detected_language: 'N/A',
            isManual: false,
          }));
    
        return [...receiptExpenses, ...bankExpenses];
    }, [acceptedFiles, transactions]);

    if (unifiedExpenses.length === 0) {
        return (
            <div className="max-w-3xl mx-auto">
                 <Card>
                    <CardHeader>
                        <CardTitle>Financial Reports</CardTitle>
                        <CardDescription>
                            Generate detailed financial reports based on your uploaded data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Alert>
                            <Lightbulb className="h-4 w-4" />
                            <AlertTitle>No Data Yet</AlertTitle>
                            <AlertDescription>
                            Please go to the dashboard to upload receipts or bank statements. Once you have data, your reports will appear here.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Financial Reports</CardTitle>
                    <CardDescription>
                        Analyze your financial data with detailed reports. All reports are generated based on the current session's data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="expense-summary">
                        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
                            <TabsTrigger value="expense-summary">Expense Summary</TabsTrigger>
                            <TabsTrigger value="vendor-analysis">Vendor Analysis</TabsTrigger>
                            <TabsTrigger value="fbr-compliance">FBR Compliance</TabsTrigger>
                            <TabsTrigger value="pnl" disabled>Profit & Loss</TabsTrigger>
                            <TabsTrigger value="cash-flow" disabled>Cash Flow</TabsTrigger>
                        </TabsList>
                        <TabsContent value="expense-summary">
                           <ExpenseSummaryReport expenses={unifiedExpenses} />
                        </TabsContent>
                        <TabsContent value="vendor-analysis">
                            <VendorAnalysisReport expenses={unifiedExpenses} />
                        </TabsContent>
                        <TabsContent value="fbr-compliance">
                            <FbrComplianceReport expenses={unifiedExpenses} />
                        </TabsContent>
                        <TabsContent value="pnl">
                            <p className="text-muted-foreground text-center p-8">Profit & Loss report coming soon.</p>
                        </TabsContent>
                        <TabsContent value="cash-flow">
                             <p className="text-muted-foreground text-center p-8">Cash flow analysis coming soon.</p>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
