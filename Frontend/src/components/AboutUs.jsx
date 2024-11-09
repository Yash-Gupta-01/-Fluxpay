import React from 'react'; 
import aboutImage from '../assets/AboutUs.png'; 

const AboutUs = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col lg:flex-row items-center">
        <div className="w-full lg:w-1/2 order-2 lg:order-1 mt-4 lg:mt-0 lg:pr-8">
          <h1 className="text-2xl lg:text-5xl font-bold mb-4">About FlexiWallet</h1>
          <p className="text-lg lg:text-2xl mb-4">
          FlexiWallet simplifies financial management with robust features for secure transactions, comprehensive account management,
          and user-friendly navigation, making it an essential tool for modern financial needs.
          </p>
           <p className="text-lg lg:text-2xl mb-4">
           With FlexiWallet,you can securely manage your funds, make payments, and transfer money effortlessly.
           </p>
           <hr className="my-6 border-gray-300" />
        </div>
        <div className="w-full lg:w-1/2 order-1 lg:order-2">
          <img
            src={aboutImage} 
            alt="About Us Image" 
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default AboutUs;