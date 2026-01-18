import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export default async function RegistrationSuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ requestNo: string }>;
}) {
    const { requestNo } = await searchParams;

    if (!requestNo) {
        return (
            <div className="container mx-auto py-12 text-center text-red-500">
                Error: Request Number missing.
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-md py-12 px-4">
            <Card className="text-center border-t-4 border-t-green-600 shadow-lg">
                <CardHeader>
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                        <CheckCircle2 size={32} />
                    </div>
                    <CardTitle className="text-2xl">Registration Request Created!</CardTitle>
                    <CardDescription>
                        Your request has been successfully submitted.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Request Number</p>
                        <p className="text-2xl font-mono font-bold tracking-widest">{requestNo}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Please proceed to payment to actuate your request. You can also track your status using this number later.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Link href={`/etc/register/${requestNo}/payment`} className="w-full">
                        <Button className="w-full" size="lg">
                            Proceed to Payment <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href={`/etc/track/${requestNo}`} className="w-full">
                        <Button variant="ghost" className="w-full">
                            Track Request Status
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
