'use client';

import { useTranslations } from 'next-intl';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, User, Car, Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

// Define schema matches API expectation
// Schema moved inside component to support localization

interface Option {
    id: string; // for key
    code: string;
    label: string; // or name
}

interface Props {
    vehicleTypes: Option[];
    locations: Option[];
}

export function IndividualRegistrationForm({ vehicleTypes, locations }: Props) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const t = useTranslations('Public.ETC.Register.Individual');

    const formSchema = z.object({
        applicantName: z.string()
            .min(2, t('Validation.NameMin'))
            .regex(/^[^\u0D80-\u0DFF\u0B80-\u0BFF]*$/, t('Validation.EnglishOnly')),
        applicantNICOrPassport: z.string()
            .min(5, t('Validation.IDRequired'))
            .regex(/^[^\u0D80-\u0DFF\u0B80-\u0BFF]*$/, t('Validation.EnglishOnly')),
        applicantMobile: z.string().regex(/^07[0-9]{8}$/, t('Validation.MobileFormat')),
        applicantEmail: z.string().email(t('Validation.EmailInvalid')).optional().or(z.literal('')),
        lpn: z.string()
            .min(2, t('Validation.LPNRequired'))
            .regex(/^([A-Z]{2,3}|[0-9]{2,3})-[0-9]{4}$/, t('Validation.LPNFormat')),
        vehicleTypeCode: z.string().min(1, t('Validation.SelectVehicle')),
        preferredLocationCode: z.string().min(1, t('Validation.SelectLocation')),
        notifications: z.object({
            sms: z.boolean().default(true),
            email: z.boolean().default(false),
        }),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            applicantName: '',
            applicantNICOrPassport: '',
            applicantMobile: '',
            applicantEmail: '',
            lpn: '',
            vehicleTypeCode: '',
            preferredLocationCode: '',
            notifications: {
                sms: true,
                email: false,
            },
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const payload = {
                requestType: 'NEW_INDIVIDUAL',
                channel: 'WEB',
                vehicleTypeCode: values.vehicleTypeCode,
                preferredLocationCode: values.preferredLocationCode,
                lpn: values.lpn,
                applicantName: values.applicantName,
                applicantNICOrPassport: values.applicantNICOrPassport,
                applicantMobile: values.applicantMobile,
                applicantEmail: values.applicantEmail || undefined,
                notifySMS: values.notifications.sms,
                notifyEmail: values.notifications.email,
            };

            const res = await fetch('/api/public/etc/registration/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit request');
            }

            toast.success('Registration request created successfully!');
            router.push(`/etc/register/success?requestNo=${data.requestNo}`);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto py-8 px-4">
            {/* Header Section */}
            <div className="mb-8">
                <div className="inline-flex items-center gap-3 mb-4">
                    <div className="h-1.5 w-8 bg-primary rounded-full"></div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t('Title')}</h1>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">{t('Description')}</p>
            </div>

            <Card className="border border-border shadow-lg overflow-hidden">
                <CardContent className="p-0">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">

                            {/* Applicant Details Section */}
                            <div className="bg-gradient-to-r from-primary/5 to-transparent px-6 md:px-8 pt-8 pb-8 border-b border-border">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                                        <User className="w-6 h-6 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground">{t('ApplicantDetails.Title')}</h2>
                                </div>

                                <div className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="applicantName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base font-semibold text-foreground">{t('ApplicantDetails.FullName.Label')} <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t('ApplicantDetails.FullName.Placeholder')}
                                                        {...field}
                                                        className="h-12 text-base px-4 rounded-lg border-2 border-border bg-white/50 focus:bg-white transition-colors"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-base" />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="applicantNICOrPassport"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base font-semibold text-foreground">{t('ApplicantDetails.NIC.Label')} <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={t('ApplicantDetails.NIC.Placeholder')}
                                                            {...field}
                                                            className="h-12 text-base px-4 rounded-lg border-2 border-border bg-white/50 focus:bg-white transition-colors"
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-base" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="applicantMobile"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base font-semibold text-foreground">{t('ApplicantDetails.Mobile.Label')} <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={t('ApplicantDetails.Mobile.Placeholder')}
                                                            {...field}
                                                            className="h-12 text-base px-4 rounded-lg border-2 border-border bg-white/50 focus:bg-white transition-colors"
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-base" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="applicantEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base font-semibold text-foreground">{t('ApplicantDetails.Email.Label')}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t('ApplicantDetails.Email.Placeholder')}
                                                        {...field}
                                                        className="h-12 text-base px-4 rounded-lg border-2 border-border bg-white/50 focus:bg-white transition-colors"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-base" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Vehicle Details Section */}
                            <div className="bg-gradient-to-r from-primary/5 to-transparent px-6 md:px-8 pt-8 pb-8 border-b border-border">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                                        <Car className="w-6 h-6 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground">{t('VehicleDetails.Title')}</h2>
                                </div>

                                <div className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="lpn"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base font-semibold text-foreground">{t('VehicleDetails.LPN.Label')} <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t('VehicleDetails.LPN.Placeholder')}
                                                        {...field}
                                                        onChange={(e) => {
                                                            let value = e.target.value.toUpperCase();
                                                            // Auto-format: replace space with dash
                                                            value = value.replace(/\s/g, '-');
                                                            // Restrict: allow only A-Z, 0-9, and -
                                                            if (/^[A-Z0-9-]*$/.test(value)) {
                                                                field.onChange(value);
                                                            }
                                                        }}
                                                        className="h-12 text-base px-4 rounded-lg border-2 border-border bg-white/50 focus:bg-white transition-colors uppercase font-mono placeholder:normal-case"
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-base text-muted-foreground">{t('VehicleDetails.LPN.Description')}</FormDescription>
                                                <FormMessage className="text-base" />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="vehicleTypeCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base font-semibold text-foreground">{t('VehicleDetails.VehicleType.Label')} <span className="text-destructive">*</span></FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 text-base rounded-lg border-2 border-border bg-white/50 focus:bg-white transition-colors">
                                                                <SelectValue placeholder={t('VehicleDetails.VehicleType.Placeholder')} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {vehicleTypes.map((t) => (
                                                                <SelectItem key={t.id} value={t.code} className="text-base">{t.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-base" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="preferredLocationCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base font-semibold text-foreground">{t('VehicleDetails.Location.Label')} <span className="text-destructive">*</span></FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 text-base rounded-lg border-2 border-border bg-white/50 focus:bg-white transition-colors">
                                                                <SelectValue placeholder={t('VehicleDetails.Location.Placeholder')} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {locations.map((l) => (
                                                                <SelectItem key={l.id} value={l.code} className="text-base">{l.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-base" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notification Preferences Section */}
                            <div className="bg-gradient-to-r from-primary/5 to-transparent px-6 md:px-8 pt-8 pb-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                                        <Bell className="w-6 h-6 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground">{t('Preferences.Title')}</h2>
                                </div>

                                <p className="text-base text-muted-foreground mb-6">{t('Preferences.Description')}</p>

                                <div className="flex flex-col sm:flex-row gap-8">
                                    <FormField
                                        control={form.control}
                                        name="notifications.sms"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start gap-4 p-4 rounded-lg border border-border/50 bg-white/30 flex-1">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="h-6 w-6 rounded border-2 border-primary mt-1"
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel className="text-base font-semibold text-foreground cursor-pointer">
                                                        {t('Preferences.SMS')}
                                                    </FormLabel>
                                                    <p className="text-sm text-muted-foreground">Receive SMS notifications</p>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="notifications.email"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start gap-4 p-4 rounded-lg border border-border/50 bg-white/30 flex-1">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="h-6 w-6 rounded border-2 border-primary mt-1"
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel className="text-base font-semibold text-foreground cursor-pointer">
                                                        {t('Preferences.Email')}
                                                    </FormLabel>
                                                    <p className="text-sm text-muted-foreground">Receive email notifications</p>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Submit Button Section */}
                            <div className="px-6 md:px-8 pt-4 pb-8">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-14 text-lg font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-3 h-5 w-5 animate-spin" /> {t('Actions.Submitting')}
                                        </>
                                    ) : (
                                        <>
                                            {t('Actions.Submit')} <ArrowRight className="ml-3 h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
