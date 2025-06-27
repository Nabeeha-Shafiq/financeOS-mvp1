'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Bot, LayoutDashboard, FileText } from 'lucide-react';
import { useFinancialData } from '@/context/financial-data-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isProcessing } = useFinancialData();

    return (
        <>
            <Sidebar>
                <SidebarContent>
                    <SidebarHeader>
                        <div className="flex items-center gap-2">
                            <Bot className="w-8 h-8 text-primary" />
                            <h1 className="text-xl font-bold text-foreground tracking-tight">FinanceOS Lite</h1>
                        </div>
                    </SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard')}>
                                <Link href="/dashboard">
                                    <LayoutDashboard />
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname.startsWith('/reports')}>
                                <Link href="/reports">
                                    <FileText />
                                    <span>Reports</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10 md:p-3 md:pl-2">
                    <SidebarTrigger />
                    <p className="text-sm text-muted-foreground">
                        {isProcessing ? "Processing..." : "Session data only. No data is stored."}
                    </p>
                </header>
                <main className="flex-1 p-4 md:p-8">
                    {children}
                </main>
                 <footer className="p-4 text-center text-sm text-muted-foreground border-t">
                    <p>Built with Google AI. Session data only. No data is stored.</p>
                </footer>
            </SidebarInset>
        </>
    );
}
