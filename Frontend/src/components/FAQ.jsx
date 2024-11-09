import React from 'react';
import Faq from '../assets/FAQ.svg';
const FAQ = () => {
  return (
    <div className="container mx-auto p-8">
      <div className="flex flex-col md:flex-row items-center">
        <div className="md:w-1/2">
          <img 
          src= {Faq}
          alt="FAQ Image" 
          className="w-full h-auto" />
        </div>
        <div className="md:w-1/2 md:pl-10">
          <h1 className="text-2xl lg:text-5xl font-bold text-center md:text-left">Frequently Asked Questions</h1>
          <hr className="my-4 border-gray-300 w-full" />
          <p className="text-gray-500 text-center md:text-left mb-8">Clearing common queries about FlexiWallet</p>
          <div>
            <div className="mb-6">
              <h3 className="font-semibold text-lg">What is the user flow in FlexiWallet?</h3>
              <p> The user flow in FlexiWallet starts with user registration, followed by account verification.They can manage their finances through a dashboard and transfer money. The application provides a seamless and intuitive interface for easy navigation and usage.</p>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-lg">Why did you choose React for the frontend?</h3>
              <p>React is chosen for its component-based architecture, which makes it easier to manage and scale the application. It also offers excellent performance and a rich ecosystem of tools and libraries.</p>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-lg">How do you ensure the security of the application?</h3>
              <p>Security is ensured through the use of HTTPS, end-to-end encryption, and implementation of best security practices such as input validation, authentication, and authorization mechanisms.</p>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-lg">What technologies are used in FlexiWallet?</h3>
              <p>FlexiWallet is built using modern web technologies including React for the frontend, Node.js and Express for the backend, and MongoDB for the database. Tailwind CSS is used for styling.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;