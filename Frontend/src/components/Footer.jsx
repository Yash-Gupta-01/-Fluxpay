import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-blue-800 text-white py-4 mt-8">
      <div className="container mx-auto text-center">
        <p className="mb-2">&copy; 2024 FlexiWallet. All rights reserved.</p>
        <p className="mb-2">Made by Anushka</p>
        <p>
          Connect on  
          <a href="https://x.com/Anushka3007" className="text-white-400 mx-1">Twitter</a>, 
          <a href="https://www.linkedin.com/in/anushka30singh/" className="text-white-600 mx-1">Linkedin</a>
         
        </p>
      </div>
    </footer>
  );
};

export default Footer;