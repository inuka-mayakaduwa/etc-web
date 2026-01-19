'use client';

import Link from 'next/link';
import { User, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegistrationStartPage() {
    return (
        <div className="container mx-auto max-w-5xl py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">New ETC Registration</h1>
                <p className="text-lg text-muted-foreground">
                    Choose your registration type to get started with your Electronic Toll Collection tag.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Individual Card */}
                <Link href="/etc/register/individual" className="group">
                    <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50 cursor-pointer">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <User size={24} />
                            </div>
                            <CardTitle className="text-2xl">Single Vehicle ETC Registration</CardTitle>
                            <CardDescription>
                                For personal vehicles owned by individuals.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                                <li className="flex items-center">✓ National ID / Passport Required</li>
                                <li className="flex items-center">✓ Vehicle Registration Book (CR)</li>
                                <li className="flex items-center">✓ Instant Online Payment</li>
                            </ul>
                            <Button className="w-full group-hover:bg-primary/90">
                                Register as Individual <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                {/* Company Card */}
                <Link href="/etc/register/company" className="group">
                    <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50 cursor-pointer">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Building2 size={24} />
                            </div>
                            <CardTitle className="text-2xl">Company Registration</CardTitle>
                            <CardDescription>
                                For vehicles owned by businesses and organizations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                                <li className="flex items-center">✓ Business Registration Number</li>
                                <li className="flex items-center">✓ Company Address Details</li>
                                <li className="flex items-center">✓ Bulk Processing Available</li>
                            </ul>
                            <Button variant="outline" className="w-full group-hover:border-primary group-hover:text-primary">
                                Register as Company <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
