'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, CreditCard, Building, Banknote, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Types from Prisma (simplified for client)
type PaymentMethod = 'GOVPAY' | 'BANK_TRANSFER' | 'IPG' | 'CASH';

interface Props {
    request: any; // Using any to avoid importing partial prisma types on client, strictly typing is better but verbose here
}

import { useTranslations } from 'next-intl';

export function PaymentInterface({ request }: Props) {
    const t = useTranslations('Public.ETC.Payment');
    const router = useRouter();
    const [method, setMethod] = useState<PaymentMethod>('GOVPAY');
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDemoModal, setShowDemoModal] = useState(false);

    const activeAttempt = request.activePaymentAttempt;

    // If active attempt exists and is PENDING, show declaration form
    // If no active attempt (or it's rejected/expired but currentStatus allows retry), show methods
    // Logic simplified: if activeAttempt && status == PENDING, show declare. Else show methods.

    const showDeclaration = activeAttempt && activeAttempt.status === 'PENDING';
    const showReview = request.currentStatus?.code === 'PAYMENT_REVIEW' || (activeAttempt && activeAttempt.status === 'PENDING_REVIEW');
    const showSuccess = request.currentStatus?.code === 'PENDING_INFORMATION_REVIEW';

    const submitPaymentAttempt = async (simulateOutcome?: 'success' | 'failure') => {
        setLoading(true);
        try {
            const payload = {
                method,
                amount: 1000, // Fixed amount for v1
            };

            const res = await fetch(`/api/public/etc/registration/${request.requestNo}/payment-attempt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            if (method === 'IPG') {
                if (simulateOutcome === 'success') {
                    await fetch(`/api/public/etc/registration/${request.requestNo}/payment-attempt/simulate-success`, {
                        method: 'POST'
                    });
                    toast.success(t('Success.Title'));
                } else {
                    toast.success('Redirecting to Payment Gateway...');
                }
                router.refresh();
            } else {
                toast.success('Payment method selected.');
                router.refresh();
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
            setShowDemoModal(false);
        }
    };

    const handleCreateAttempt = () => {
        if (method === 'IPG') {
            submitPaymentAttempt('success');
        } else if (method === 'GOVPAY') {
            submitPaymentAttempt();
        } else {
            setShowDemoModal(true);
        }
    };

    const handleDemoOutcome = (outcome: 'success' | 'failure') => {
        if (outcome === 'failure') {
            toast.error(t('Demo.ToastFailed'));
            setShowDemoModal(false);
        } else {
            submitPaymentAttempt('success');
        }
    };

    const handleDeclare = async () => {
        if (!reference) return toast.error(t('Declare.Error.Required'));

        // Validate Reference: Starts with 9992025 or 9992026 and is 16 digits total
        const isValidFormat = /^999(2025|2026)\d{9}$/.test(reference);

        if (!isValidFormat) {
            return toast.error(t('Declare.Error.InvalidFormat'));
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/public/etc/registration/${request.requestNo}/payment-attempt/${activeAttempt.attemptNo}/declare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            toast.success(t('Declare.Toast.Submitted'));
            router.refresh();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChangeMethod = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/public/etc/registration/${request.requestNo}/payment-attempt/active`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to cancel attempt');

            router.refresh();
        } catch (e) {
            toast.error("Could not change method");
        } finally {
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <Card className="text-center border-t-4 border-t-green-500 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-green-600">{t('Success.Title')}</CardTitle>
                    <CardDescription>{t('Success.Description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center p-6 space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-3xl">✅</span>
                        </div>
                        <p>{t('Success.Message')}</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => router.push(`/etc/track/${request.requestNo}`)}>
                        {t('Success.Button')}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (showReview) {
        return (
            <Card className="text-center border-t-4 border-t-yellow-500 shadow-sm">
                <CardHeader>
                    <CardTitle>{activeAttempt?.method === 'GOVPAY' ? t('Review.PendingVerification') : t('Review.UnderReview')}</CardTitle>
                    <CardDescription>{t('Review.Description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>{t('Review.Ref')} <span className="font-mono">{activeAttempt?.reference}</span></p>
                    <p>{t('Review.Amount')} LKR {activeAttempt?.amount}</p>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => router.push(`/etc/track/${request.requestNo}`)}>
                        {t('Review.Button')}
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    if (showDeclaration) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('Declare.Title')}</CardTitle>
                    <CardDescription>
                        {t('Declare.Selected')} <Badge variant="outline">{activeAttempt.method}</Badge>.
                        <span dangerouslySetInnerHTML={{ __html: ' ' + t.raw('Declare.Instruction').replace('{amount}', activeAttempt.amount) }} />
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded text-sm">
                        <p className="font-semibold">{t('Declare.BankInfo.Title')}</p>
                        <p>{t('Declare.BankInfo.Bank')}</p>
                        <p>{t('Declare.BankInfo.AccNo')}</p>
                        <p>{t('Review.Ref')} {request.requestNo}</p>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('Declare.Label')}</Label>
                        <Input
                            placeholder={t('Declare.Placeholder')}
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="ghost" onClick={handleChangeMethod} disabled={loading}>
                        {t('Declare.Actions.ChangeMethod')}
                    </Button>
                    <Button onClick={handleDeclare} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('Declare.Actions.Submit')}
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{t('SelectMethod.Title')}</CardTitle>
                    <CardDescription><span dangerouslySetInnerHTML={{ __html: t.raw('SelectMethod.FeeDescription') }} /></CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={method} onValueChange={(v) => setMethod(v as PaymentMethod)} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div>
                            <RadioGroupItem value="GOVPAY" id="govpay" className="peer sr-only" />
                            <Label
                                htmlFor="govpay"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                                <Building className="mb-3 h-6 w-6" />
                                {t('SelectMethod.Methods.GovPay')}
                            </Label>
                        </div>

                        <div>
                            <RadioGroupItem value="BANK_TRANSFER" id="bt" className="peer sr-only" />
                            <Label
                                htmlFor="bt"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                                <Banknote className="mb-3 h-6 w-6" />
                                {t('SelectMethod.Methods.BankTransfer')}
                            </Label>
                        </div>

                        <div>
                            <RadioGroupItem value="IPG" id="ipg" className="peer sr-only" />
                            <Label
                                htmlFor="ipg"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                                <CreditCard className="mb-3 h-6 w-6" />
                                {t('SelectMethod.Methods.Card')}
                            </Label>
                        </div>

                    </RadioGroup>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleCreateAttempt} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('SelectMethod.Button', { method: method === 'IPG' ? t('SelectMethod.Methods.Card') : method === 'GOVPAY' ? t('SelectMethod.Methods.GovPay') : t('SelectMethod.Methods.BankTransfer') })}
                    </Button>
                </CardFooter>
            </Card>

            <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Demo.Title')}</DialogTitle>
                        <DialogDescription>
                            {t('Demo.Description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <Button
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 h-24 flex flex-col gap-2"
                            onClick={() => handleDemoOutcome('success')}
                        >
                            <span className="text-2xl">✅</span>
                            {t('Demo.Success')}
                        </Button>
                        <Button
                            variant="destructive"
                            className="h-24 flex flex-col gap-2"
                            onClick={() => handleDemoOutcome('failure')}
                        >
                            <span className="text-2xl">❌</span>
                            {t('Demo.Failure')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Import Dialog at the top to avoid issues, I'll handle that next if needed, but this tool call is for replacement.
// Wait, I need to add the import separately or include it in the replacement chunk if it spans the top?
// The current replacement chunk starts at line 23 which is inside the component.
// I need to add the import at the top. I'll do this in a separate step or try to do it all at once if safe.
// The file has imports at 1-12.
// The component implementation is effectively replaced from 23 onwards in my chunk.

// I will split this into two calls or use multi_replace.
// I will use multi_replace_file_content to add imports AND update the component body.

