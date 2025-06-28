import { MainNav } from "@/components/main-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <MainNav />
            <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
                {children}
            </main>
        </div>
    );
}
