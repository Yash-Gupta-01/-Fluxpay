import React from 'react';
import Faq from '../assets/FAQ.svg';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const FAQ = () => {
  const faqs = [
    {
      question: "What is the user flow in FluxPay?",
      answer: "The user flow in FluxPay starts with user registration, followed by account verification. They can manage their finances through a dashboard and transfer money. The application provides a seamless and intuitive interface for easy navigation and usage."
    },
    {
      question: "Why did you choose React for the frontend?",
      answer: "React is chosen for its component-based architecture, which makes it easier to manage and scale the application. It also offers excellent performance and a rich ecosystem of tools and libraries."
    },
    {
      question: "How do you ensure the security of the application?",
      answer: "Security is ensured through the use of HTTPS, end-to-end encryption, and implementation of best security practices such as input validation, authentication, and authorization mechanisms."
    },
    {
      question: "What technologies are used in FluxPay?",
      answer: "FluxPay is built using modern web technologies including React for the frontend, Node.js and Express for the backend, and MongoDB for the database. Tailwind CSS is used for styling."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <img
                  src={Faq}
                  alt="Frequently Asked Questions"
                  className="w-full h-auto object-cover"
                />
              </CardContent>
            </Card>
          </div>
          <div className="w-full lg:w-1/2">
            <div className="text-center lg:text-left mb-8">
              <h1 className="text-3xl lg:text-5xl font-bold mb-4 text-foreground">
                Frequently Asked Questions
              </h1>
              <p className="text-muted-foreground text-lg">
                Clearing common queries about FluxPay
              </p>
            </div>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;