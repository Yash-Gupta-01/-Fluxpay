import React from 'react';
import { Button } from './ui/button';
import { Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground">&copy; 2024 FluxPay. All rights reserved.</p>
            <p className="text-muted-foreground">Made by Yash</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Connect on</span>
            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://www.linkedin.com/in/yash-gupta-62a192228/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1"
              >
                <Linkedin className="h-4 w-4" />
                <span>LinkedIn</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;