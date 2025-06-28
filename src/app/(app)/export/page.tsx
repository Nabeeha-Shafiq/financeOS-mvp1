'use client';
import { useMemo } from 'react';
import { useFinancialData } from '@/context/financial-data-context';
import type { UnifiedExpense } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FbrComplianceReport } from '@/components/reports/fbr-compliance-report';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

export default function ExportPage() {
    const { files, transactions } = useFinancialData();

    const acceptedFiles = useMemo(() => files.filter(f => f.status === 'accepted'), [files]);

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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Export Center</CardTitle>
                <CardDescription>
                    Generate and download reports for tax filing and analysis.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {unifiedExpenses.length > 0 ? (
                    <FbrComplianceReport expenses={unifiedExpenses} />
                ) : (
                    <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertTitle>No Data to Export</AlertTitle>
                        <AlertDescription>
                            Please go to the Data Entry page to upload receipts or bank statements. Once you have data, your export options will appear here.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
