'use client';

import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';

import type { FileWrapper } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from './ui/separator';

const FBR_DEDUCTIBLE_CATEGORIES = ['Medical', 'Education'];
const MEDICAL_DEDUCTION_RATE = 0.10;
const EDUCATION_DEDUCTION_INCOME_LIMIT = 1500000;

interface FbrReportGeneratorProps {
  acceptedFiles: FileWrapper[];
}

export function FbrReportGenerator({ acceptedFiles }: FbrReportGeneratorProps) {
  const [annualIncome, setAnnualIncome] = useState<number | ''>('');

  const { medicalExpenses, educationExpenses } = useMemo(() => {
    let med = 0;
    let edu = 0;
    acceptedFiles.forEach(f => {
      const category = f.extractedData?.category;
      const amount = f.extractedData?.amount || 0;
      if (category === 'Medical') med += amount;
      if (category === 'Education') edu += amount;
    });
    return { medicalExpenses: med, educationExpenses: edu };
  }, [acceptedFiles]);

  const medicalDeductionLimit = useMemo(() => {
    return typeof annualIncome === 'number' ? annualIncome * MEDICAL_DEDUCTION_RATE : 0;
  }, [annualIncome]);

  const isEligibleForEducationDeduction = useMemo(() => {
    return typeof annualIncome === 'number' && annualIncome > 0 && annualIncome <= EDUCATION_DEDUCTION_INCOME_LIMIT;
  }, [annualIncome]);

  const handleExportCSV = () => {
    if (typeof annualIncome !== 'number' || annualIncome <= 0) return;

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Deductible', 'Receipt Available'];
    
    const rows = acceptedFiles.map(f => {
        const data = f.extractedData!;
        const isDeductible = 
            (data.category === 'Medical' && data.amount <= medicalDeductionLimit) || 
            (data.category === 'Education' && isEligibleForEducationDeduction);

        return [
            data.date,
            `"${data.items.join(', ')}"`,
            data.category,
            data.amount,
            isDeductible ? 'Yes' : 'No',
            'Yes'
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `FBR_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (typeof annualIncome !== 'number' || annualIncome <= 0) return;
    
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('FBR Tax Report Summary', 14, 22);

    doc.setFontSize(11);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const summaryText = `
    Annual Income: ${annualIncome.toLocaleString()} PKR
    
    Medical Expense Deduction Limit (10%): ${medicalDeductionLimit.toLocaleString()} PKR
    Total Medical Expenses Claimed: ${medicalExpenses.toLocaleString()} PKR
    
    Education Expense Deduction: ${isEligibleForEducationDeduction ? 'Eligible (Income <= 1.5M PKR)' : 'Not Eligible (Income > 1.5M PKR)'}
    Total Education Expenses Claimed: ${educationExpenses.toLocaleString()} PKR
    `;
    doc.text(summaryText, 14, 40);

    const tableColumn = ['Date', 'Description', 'Category', 'Amount (PKR)', 'Deductible'];
    const tableRows: (string|number)[][] = [];

    acceptedFiles.forEach(f => {
        const data = f.extractedData!;
        const isDeductible = 
            (data.category === 'Medical' && data.amount <= medicalDeductionLimit) || 
            (data.category === 'Education' && isEligibleForEducationDeduction);
            
        const row = [
            data.date,
            data.items.join(', '),
            data.category,
            data.amount.toLocaleString(),
            isDeductible ? 'Yes' : 'No',
        ];
        tableRows.push(row);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 85,
    });

    doc.save(`FBR_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const isExportDisabled = typeof annualIncome !== 'number' || annualIncome <= 0;

  return (
    <Card className="mt-6 md:col-span-4">
      <CardHeader>
        <CardTitle>Export FBR Report</CardTitle>
        <CardDescription>Generate a CSV or PDF report for your tax filing based on this session's data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="annual-income" className="font-semibold">Estimated Annual Income (PKR)</Label>
          <Input 
            id="annual-income"
            type="number"
            placeholder="e.g., 1200000"
            value={annualIncome}
            onChange={(e) => setAnnualIncome(e.target.value === '' ? '' : Number(e.target.value))}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">This is required to calculate deduction limits.</p>
        </div>

        {annualIncome > 0 && (
          <div className="space-y-4">
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Medical Section */}
              <Alert variant={medicalExpenses > medicalDeductionLimit ? "destructive" : "default"}>
                {medicalExpenses > medicalDeductionLimit ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                <AlertTitle>Medical Expenses</AlertTitle>
                <AlertDescription>
                  <p>Limit (10% of income): {medicalDeductionLimit.toLocaleString()} PKR</p>
                  <p>Claimed this session: {medicalExpenses.toLocaleString()} PKR</p>
                  {medicalExpenses > medicalDeductionLimit && <p className="font-bold mt-1">Your claimed expenses exceed the allowable limit.</p>}
                </AlertDescription>
              </Alert>
              {/* Education Section */}
              <Alert variant={!isEligibleForEducationDeduction && educationExpenses > 0 ? "destructive" : "default"}>
                {isEligibleForEducationDeduction ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>Education Expenses</AlertTitle>
                <AlertDescription>
                  <p>Eligibility: {isEligibleForEducationDeduction ? 'Eligible' : 'Not Eligible (Income > 1.5M PKR)'}</p>
                  <p>Claimed this session: {educationExpenses.toLocaleString()} PKR</p>
                  {!isEligibleForEducationDeduction && educationExpenses > 0 && <p className="font-bold mt-1">You are not eligible for this deduction based on your income.</p>}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex gap-4">
            <Button onClick={handleExportCSV} disabled={isExportDisabled}>
                <Download />
                Export as CSV
            </Button>
            <Button onClick={handleExportPDF} disabled={isExportDisabled} variant="outline">
                <FileText />
                Export as PDF
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
