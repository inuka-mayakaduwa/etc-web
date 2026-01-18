'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';

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

const formSchema = z.object({
    // Company Details
    companyName: z.string().min(2, 'Company Name is required'),
    brn: z.string().min(2, 'BRN is required'),
    companyAddress: z.string().optional(),

    // Representative / Applicant
    applicantName: z.string().min(2, 'Representative Name is required'),
    applicantNICOrPassport: z.string().min(5, 'Valid ID required'),
    applicantMobile: z.string().regex(/^07[0-9]{8}$/, 'Must be a valid 10-digit mobile number starting with 07'),
    applicantEmail: z.string().email('Invalid email').optional().or(z.literal('')),

    // Vehicle
    lpn: z.string().min(2, 'License Plate Number required'),
    vehicleTypeCode: z.string().min(1, 'Select a vehicle type'),
    preferredLocationCode: z.string().min(1, 'Select a location'),

    notifications: z.object({
        sms: z.boolean().default(true),
        email: z.boolean().default(false),
    }),
});

interface Option {
    id: string;
    code: string;
    label: string;
}

interface Props {
    vehicleTypes: Option[];
    locations: Option[];
}

export function CompanyRegistrationForm({ vehicleTypes, locations }: Props) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            companyName: '',
            brn: '',
            companyAddress: '',
            applicantName: '',
            applicantNICOrPassport: '',
            applicantMobile: '',
            applicantEmail: '',
            lpn: '',
            vehicleTypeCode: '',
            preferredLocationCode: '',
            notifications: {
                sms: true,
                email: true, // Default true for companies often
            },
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const payload = {
                requestType: 'NEW_COMPANY',
                channel: 'WEB',

                companyName: values.companyName,
                brn: values.brn,
                companyAddress: values.companyAddress || undefined,

                vehicleTypeCode: values.vehicleTypeCode,
                preferredLocationCode: values.preferredLocationCode,
                lpn: values.lpn,

                applicantName: values.applicantName, // Representative
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

            toast.success('Company registration request created successfully!');
            router.push(`/etc/register/success?requestNo=${data.requestNo}`);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="w-full max-w-2xl mx-auto border-t-4 border-t-purple-600 shadow-lg">
            <CardHeader>
                <CardTitle>Company Registration</CardTitle>
                <CardDescription>Register a company vehicle for ETC.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Company Details */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Company Information</h3>

                            <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ABC Logistics Pvt Ltd" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="brn"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Business Reg No (BRN)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="PV12345" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="companyAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Office Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Colombo 03" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Representative Details */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Authorized Person</h3>

                            <FormField
                                control={form.control}
                                name="applicantName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Representative Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nimal Perera" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="applicantNICOrPassport"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>NIC / Passport</FormLabel>
                                            <FormControl>
                                                <Input placeholder="199012345678" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="applicantMobile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mobile Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="0771234567" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="applicantEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Representative Email (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="nimal@company.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Vehicle Details */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Vehicle & Service</h3>

                            <div className="grid grid-cols-1 gap-4">
                                <FormField
                                    control={form.control}
                                    name="lpn"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>License Plate Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ABC-1234" {...field} className="uppercase font-mono placeholder:normal-case" />
                                            </FormControl>
                                            <FormDescription>Enter specific number without spaces (e.g. CAB-1234)</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="vehicleTypeCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vehicle Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {vehicleTypes.map((t) => (
                                                            <SelectItem key={t.id} value={t.code}>{t.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="preferredLocationCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Installation Location</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select location" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {locations.map((l) => (
                                                            <SelectItem key={l.id} value={l.code}>{l.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Preferences</h3>

                            <div className="flex flex-row items-center justify-start space-x-6">
                                <FormField
                                    control={form.control}
                                    name="notifications.sms"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                    Notify via SMS (Representative)
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="notifications.email"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                    Notify via Email
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                                </>
                            ) : (
                                <>
                                    Submit Request <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
