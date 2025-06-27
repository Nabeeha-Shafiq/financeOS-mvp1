'use client';
import Image from 'next/image';
import { format } from 'date-fns';
import type { FileWrapper, ProcessedBankTransaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

interface ExpenseDetailsProps {
  expense: FileWrapper;
  transaction?: ProcessedBankTransaction;
}

export function ExpenseDetails({ expense, transaction }: ExpenseDetailsProps) {
  const { extractedData, file } = expense;

  if (!extractedData) {
    return <p className="p-4 text-center">No expense data available.</p>;
  }

  const getCreationMethod = () => {
    if (extractedData.isManual) return 'Manual Entry';
    if (transaction) return 'Bank Import & Matched';
    return 'Receipt Scan';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[80vh] overflow-y-auto p-1">
      <div className="md:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{extractedData.merchant_name}</CardTitle>
            <CardDescription>{format(new Date(extractedData.date), 'PPP')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-4">
              {extractedData.amount.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">PKR</span>
            </p>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Category</TableCell>
                  <TableCell>{extractedData.category}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Items</TableCell>
                  <TableCell>{extractedData.items.join(', ')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Location/Payment</TableCell>
                  <TableCell>{extractedData.location}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Source</TableCell>
                  <TableCell>{getCreationMethod()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Original Filename</TableCell>
                  <TableCell>{file.name}</TableCell>
                </TableRow>
                {!extractedData.isManual && (
                  <TableRow>
                    <TableCell className="font-medium">AI Confidence</TableCell>
                    <TableCell>{(extractedData.confidence_score * 100).toFixed(0)}%</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  <TableCell>
                    <Badge variant={transaction ? 'default' : 'secondary'}>
                      {transaction ? 'Matched to Bank Transaction' : 'Unmatched'}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {transaction && (
          <Card>
            <CardHeader>
              <CardTitle>Matched Bank Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Date</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Description</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Debit</TableCell>
                    <TableCell>{transaction.debit?.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Credit</TableCell>
                    <TableCell>{transaction.credit?.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="md:col-span-1">
        {!extractedData.isManual && expense.previewUrl ? (
          <a href={expense.previewUrl} target="_blank" rel="noopener noreferrer" title="Click to open full-size image">
            <Image
              src={expense.previewUrl}
              alt={`Receipt for ${extractedData.merchant_name}`}
              width={400}
              height={600}
              className="object-contain w-full h-auto rounded-md shadow-lg border cursor-zoom-in"
              data-ai-hint="receipt document"
            />
          </a>
        ) : (
          <div className="h-full flex items-center justify-center bg-muted rounded-md border text-muted-foreground p-4 text-center">
            <p>No receipt image for this entry.</p>
          </div>
        )}
      </div>
    </div>
  );
}
