import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layouts";
import { LayoutDashboard } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ownerNavItems = [
  {
    label: "Home",
    href: "/",
    icon: <LayoutDashboard size={18} />,
    exact: true,
  },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="w-full h-screen flex">
          <Sidebar items={ownerNavItems} />
          {children}
        </div>
      </body>
    </html>
  );
}
