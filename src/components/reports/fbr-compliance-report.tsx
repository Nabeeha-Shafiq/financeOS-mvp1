'use client';

import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText, AlertCircle, CheckCircle, ListChecks } from 'lucide-react';

import type { UnifiedExpense } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const MEDICAL_DEDUCTION_RATE = 0.10;
const EDUCATION_DEDUCTION_INCOME_LIMIT = 1500000;

interface FbrComplianceReportProps {
  expenses: UnifiedExpense[];
}

export function FbrComplianceReport({ expenses }: FbrComplianceReportProps) {
  const [annualIncome, setAnnualIncome] = useState<number | ''>('');

  const { medicalExpenses, educationExpenses, charitableDonations } = useMemo(() => {
    let med = 0;
    let edu = 0;
    let charity = 0;
    expenses.forEach(f => {
      const category = f.category;
      const amount = f.amount || 0;
      if (category === 'Medical') med += amount;
      if (category === 'Education') edu += amount;
      if (category === 'Charitable Donations') charity += amount;
    });
    return { medicalExpenses: med, educationExpenses: edu, charitableDonations: charity };
  }, [expenses]);

  const medicalDeductionLimit = useMemo(() => {
    return typeof annualIncome === 'number' ? annualIncome * MEDICAL_DEDUCTION_RATE : 0;
  }, [annualIncome]);

  const isEligibleForEducationDeduction = useMemo(() => {
    return typeof annualIncome === 'number' && annualIncome > 0 && annualIncome <= EDUCATION_DEDUCTION_INCOME_LIMIT;
  }, [annualIncome]);

  const handleExportCSV = () => {
    if (typeof annualIncome !== 'number' || annualIncome <= 0) return;

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Deductible', 'Source', 'Confidence Score', 'Receipt Available'];
    
    const rows = expenses.map(expense => {
        const isDeductible = 
            (expense.category === 'Medical' && expense.amount <= medicalDeductionLimit) || 
            (expense.category === 'Education' && isEligibleForEducationDeduction) ||
            (expense.category === 'Charitable Donations');
        
        const sourceText = expense.source === 'bank' ? 'Bank Statement' : (expense.isManual ? 'Manual Entry' : 'Receipt Scan');
        const confidenceText = expense.source === 'receipt' ? `${(expense.confidence_score * 100).toFixed(0)}%` : '100%';
        const receiptAvailable = expense.source === 'receipt' ? 'Yes' : 'No';

        return [
            expense.date,
            `"${expense.merchant_name.replace(/"/g, '""')}"`,
            expense.category,
            expense.amount,
            isDeductible ? 'Yes' : 'No',
            sourceText,
            confidenceText,
            receiptAvailable,
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

    Total Charitable Donations Claimed: ${charitableDonations.toLocaleString()} PKR
    `;
    doc.text(summaryText, 14, 40);

    const tableColumn = ['Date', 'Description', 'Category', 'Amount (PKR)', 'Deductible', 'Source'];
    const tableRows: (string|number)[][] = [];

    expenses.forEach(expense => {
        const isDeductible = 
            (expense.category === 'Medical' && expense.amount <= medicalDeductionLimit) || 
            (expense.category === 'Education' && isEligibleForEducationDeduction) ||
            (expense.category === 'Charitable Donations');
            
        const sourceText = expense.source === 'bank' ? 'Bank' : (expense.isManual ? 'Manual' : 'Receipt');

        const row = [
            expense.date,
            expense.merchant_name,
            expense.category,
            expense.amount.toLocaleString(),
            isDeductible ? 'Yes' : 'No',
            sourceText
        ];
        tableRows.push(row);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: (doc as any).lastAutoTable.finalY ? (doc as any).lastAutoTable.finalY + 15 : 95,
    });

    doc.save(`FBR_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const isExportDisabled = typeof annualIncome !== 'number' || annualIncome <= 0;

  return (
    <Card className="mt-6 border-0 shadow-none">
      <CardHeader>
        <CardTitle>FBR Tax Compliance</CardTitle>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Alert variant={medicalExpenses > medicalDeductionLimit ? "destructive" : "default"}>
                {medicalExpenses > medicalDeductionLimit ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                <AlertTitle>Medical Expenses</AlertTitle>
                <AlertDescription>
                  <p>Limit (10% of income): {medicalDeductionLimit.toLocaleString()} PKR</p>
                  <p>Claimed: {medicalExpenses.toLocaleString()} PKR</p>
                  {medicalExpenses > medicalDeductionLimit && <p className="font-bold mt-1">Claim exceeds limit.</p>}
                </AlertDescription>
              </Alert>
              <Alert variant={!isEligibleForEducationDeduction && educationExpenses > 0 ? "destructive" : "default"}>
                {isEligibleForEducationDeduction ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>Education Expenses</AlertTitle>
                <AlertDescription>
                  <p>Eligibility: {isEligibleForEducationDeduction ? 'Eligible' : 'Not Eligible'}</p>
                  <p>Claimed: {educationExpenses.toLocaleString()} PKR</p>
                  {!isEligibleForEducationDeduction && educationExpenses > 0 && <p className="font-bold mt-1">Not eligible based on income.</p>}
                </AlertDescription>
              </Alert>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Charitable Donations</AlertTitle>
                <AlertDescription>
                  <p>Claimed: {charitableDonations.toLocaleString()} PKR</p>
                  <p className="text-xs mt-1">Ensure you have valid proof of donation.</p>
                </AlertDescription>
              </Alert>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <ListChecks className="h-6 w-6" />
                    <div >
                        <CardTitle>Documentation Checklist</CardTitle>
                        <CardDescription>A reminder of the proof you'll need for tax deductions.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm list-disc pl-5 text-muted-foreground">
                        {medicalExpenses > 0 && <li><strong>Medical Expenses:</strong> Keep all original receipts and prescriptions from registered medical practitioners.</li>}
                        {educationExpenses > 0 && <li><strong>Education Expenses:</strong> Retain fee challans, bank deposit slips, and the National Tax Number (NTN) of the educational institution.</li>}
                        {charitableDonations > 0 && <li><strong>Charitable Donations:</strong> You must have a tax exemption certificate from the approved charitable organization for the relevant tax year.</li>}
                        <li><strong>General Expenses:</strong> For all business-related claims, ensure you have original invoices and proof of payment (e.g., bank transaction records).</li>
                    </ul>
                </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex gap-4">
            <Button onClick={handleExportCSV} disabled={isExportDisabled}>
                <Download className="mr-2 h-4 w-4" />
                Export as CSV
            </Button>
            <Button onClick={handleExportPDF} disabled={isExportDisabled} variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
