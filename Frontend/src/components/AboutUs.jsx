import React from 'react';
import aboutImage from '../assets/AboutUs.png';
import { Card, CardContent } from './ui/card';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <img
                  src={aboutImage}
                  alt="About FluxPay"
                  className="w-full h-auto object-cover"
                />
              </CardContent>
            </Card>
          </div>
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <h1 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">
              About FluxPay
            </h1>
            <div className="space-y-4 text-muted-foreground">
              <p className="text-lg leading-relaxed">
                FluxPay simplifies financial management with robust features for secure transactions, comprehensive account management,
                and user-friendly navigation, making it an essential tool for modern financial needs.
              </p>
              <p className="text-lg leading-relaxed">
                With FluxPay, you can securely manage your funds, make payments, and transfer money effortlessly.
                Experience the future of digital banking with our innovative platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;