import { Outfit } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { ThemeProvider } from '@/context/ThemeContext';
import { MqttProvider } from '@/context/MqttContext';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <MqttProvider>{children}</MqttProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
