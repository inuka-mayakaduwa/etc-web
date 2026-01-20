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
import { updateApplication } from '@/app/[locale]/etc/edit/[requestNo]/actions';

// Define schema matches API expectation
const formSchema = z.object({
    applicantName: z.string().min(2, 'Name must be at least 2 characters'),
    applicantNICOrPassport: z.string().min(5, 'Valid ID required'),
    applicantMobile: z.string().regex(/^07[0-9]{8}$/, 'Must be a valid 10-digit mobile number starting with 07'),
    applicantEmail: z.string().email('Invalid email').optional().or(z.literal('')),
    applicantAddress: z.string().min(5, 'Address is required'),
    lpn: z.string().min(2, 'License Plate Number required'),
    vehicleTypeCode: z.string().min(1, 'Select a vehicle type'),
    preferredLocationCode: z.string().min(1, 'Select a location'),
    notifications: z.object({
        sms: z.boolean().default(true),
        email: z.boolean().default(false),
    }),
    terms: z.object({
        authorized: z.literal(true, { errorMap: () => ({ message: "You must accept this" }) }),
        windowTint: z.literal(true, { errorMap: () => ({ message: "You must accept this" }) }),
        agreement: z.literal(true, { errorMap: () => ({ message: "You must accept this" }) }),
    }),
});

interface Option {
    id: string; // for key
    code: string;
    label: string; // or name
}

interface Props {
    requestId: string;
    requestNo: string;
    initialValues: any;
    vehicleTypes: Option[];
    locations: Option[];
}

export function IndividualEditForm({ requestId, requestNo, initialValues, vehicleTypes, locations }: Props) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            applicantName: initialValues.applicantName || '',
            applicantNICOrPassport: initialValues.applicantNICOrPassport || '',
            applicantMobile: initialValues.applicantMobile || '',
            applicantEmail: initialValues.applicantEmail || '',
            lpn: initialValues.lpn || '',
            vehicleTypeCode: initialValues.vehicleTypeCode || '',
            preferredLocationCode: initialValues.preferredLocationCode || '',
            applicantAddress: initialValues.applicantAddress || '',
            notifications: {
                sms: initialValues.notifySMS ?? true,
                email: initialValues.notifyEmail ?? false,
            },
            terms: {
                authorized: undefined,
                windowTint: undefined,
                agreement: undefined,
            } as any,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            // Map codes to IDs for the server action if needed, or handle in action.
            // Action expects IDs? My action draft expected IDs for vehicle/location.
            // Let's resolve them here from the props options.
            const vehicleType = vehicleTypes.find(v => v.code === values.vehicleTypeCode);
            const location = locations.find(l => l.code === values.preferredLocationCode);

            if (!vehicleType || !location) throw new Error("Invalid selection");

            const payload = {
                applicantName: values.applicantName,
                applicantNICOrPassport: values.applicantNICOrPassport,
                applicantMobile: values.applicantMobile,
                applicantEmail: values.applicantEmail || null,
                lpn: values.lpn,
                vehicleTypeId: vehicleType.id,
                preferredLocationId: location.id,

                notifySMS: values.notifications.sms,
                notifyEmail: values.notifications.email,
                applicantAddress: values.applicantAddress,
            };

            await updateApplication(requestId, payload);

            toast.success('Application updated successfully!');
            router.push(`/etc/track/${requestNo}`); // Redirect back to tracking

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="w-full max-w-2xl mx-auto border-t-4 border-t-orange-500 shadow-lg">
            <CardHeader>
                <CardTitle>Edit Application</CardTitle>
                <CardDescription>Update your details and resubmit for review.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Personal Details */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Applicant Details</h3>

                            <FormField
                                control={form.control}
                                name="applicantName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
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
                                        <FormLabel>Email (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="john@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="applicantAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123/4, Main Street, Colombo" {...field} />
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
                                                    Notify via SMS
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

                        {/* Terms & Conditions */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Disclaimers</h3>

                            <FormField
                                control={form.control}
                                name="terms.authorized"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>
                                                I am authorized to register behalf of this vehicle
                                            </FormLabel>
                                            <FormMessage />
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="terms.windowTint"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="leading-normal">
                                                I understand and accept that, to ensure proper installation and reliable reading of the ETC Pass in the Expressways, it may be necessary to cut out a portion of the window tint.
                                            </FormLabel>
                                            <FormMessage />
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="terms.agreement"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="leading-normal">
                                                I agree to Terms and Conditions of the ETC Customer Service Agreement and certify that information provided was true
                                            </FormLabel>
                                            <FormMessage />
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                                </>
                            ) : (
                                <>
                                    Save Changes & Resubmit <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
