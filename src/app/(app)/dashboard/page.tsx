'use client';

import { useMemo } from 'react';
import { SessionSummary } from '@/components/session-summary';
import { useFinancialData } from '@/context/financial-data-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const { files, transactions } = useFinancialData();
  
  const acceptedFiles = useMemo(() => files.filter(f => f.status === 'accepted'), [files]);

  return (
    <div>
      {(acceptedFiles.length > 0 || transactions.length > 0) ? (
        <SessionSummary acceptedFiles={acceptedFiles} transactions={transactions} />
      ) : (
        <Card>
            <CardHeader>
                <CardTitle>Welcome to your Executive Dashboard</CardTitle>
                <CardDescription>
                    This is where your financial insights will appear once you add some data.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-16 px-4 text-muted-foreground border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold text-foreground">Ready to begin?</h2>
                    <p className="mt-2 text-base">Start by adding receipts or a bank statement.</p>
                    <div className="mt-6">
                        <Button asChild size="lg">
                            <Link href="/data-entry">Go to Data Entry</Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
