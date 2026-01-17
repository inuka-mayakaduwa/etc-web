// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    applicationName: "Etc",
    title: "Etc",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="scroll-smooth">
            <head />
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
