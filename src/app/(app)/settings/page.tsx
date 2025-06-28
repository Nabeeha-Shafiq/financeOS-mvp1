import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                    Manage your application preferences.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center min-h-[300px] bg-muted rounded-lg">
                    <p className="text-muted-foreground">Settings page is under construction.</p>
                </div>
            </CardContent>
        </Card>
    );
}
