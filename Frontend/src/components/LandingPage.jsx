import React from 'react';
import image from '../assets/E-Wallet.png';
import './LandingPage.css';
import {Link , NavLink} from 'react-router-dom'

const LandingPage = () => {

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col lg:flex-row items-center lg:items-start">
        <div className="w-full lg:w-1/2">
          <img 
            src={image}
            alt="Placeholder"
            className="w-full"
          />
        </div>
        <div className="w-full lg:w-1/2 mt-4 lg:mt-0 lg:pl-8 text-center lg:text-left">
          <h1 className="text-2xl lg:text-6xl font-bold mb-4 my-56 animate-fade-in ">Welcome to FlexiWallet</h1>
          <p className="text-lg lg:text-2xl mb-4 my-48 mt-10 animate-fade-in">
          FlexiWallet is a cutting-edge digital wallet solution designed to streamline your financial transactions.
          </p>
          <hr className="my-6 border-gray-300" />
          
          <Link to="/FirstUser" className="bg-blue-500 text-white text-semibold px-4 py-2 rounded">Get Started</Link>
         
        </div>
      </div>
    </div>
  );
};

export default LandingPage;