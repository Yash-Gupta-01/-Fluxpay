# Fluxpay
Fluxpay is a comprehensive web application designed to handle basic wallet functionalities such as user registration, login, searching for users, and transferring money between users.

## Features

- User registration and authentication
- Secure login system
- Search for other users
- Transfer money between users
- Transaction history
- Account management

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose)
- JWT for authentication
- Zod for validation

### Frontend
- React
- Vite
- Tailwind CSS
- Axios for API calls
- React Router for navigation

## Prerequisites
- Node.js (version 14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/FlexiWallet.git
   cd FlexiWallet
   ```

2. Install backend dependencies:
   ```bash
   cd Backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../Frontend
   npm install
   ```

4. Set up environment variables:
   Create a `.env` file in the Backend directory with:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

5. Start the backend server:
   ```bash
   cd Backend
   npm start
   ```

6. Start the frontend:
   ```bash
   cd ../Frontend
   npm run dev
   ```

## Usage

1. Open your browser and navigate to `http://localhost:5173` (default Vite port).
2. Register a new account or log in.
3. Search for users to transfer money.
4. View transaction history on the dashboard.

## API Endpoints

- `POST /api/v1/user/signup` - User registration
- `POST /api/v1/user/signin` - User login
- `GET /api/v1/user/bulk` - Search users
- `GET /api/v1/account/balance` - Get account balance
- `POST /api/v1/account/transfer` - Transfer money
- `GET /api/v1/transactions` - Get transaction history

## Contributing

1. Fork the repository.
2. Create a new branch for your feature.
3. Make your changes and commit them.
4. Push to your fork and submit a pull request.

## License

This project is licensed under the MIT License.

## Architecture
![image](https://github.com/Yash-Gupta-01/FlexiWallet/blob/6e8c079b0a392ebf14356676889ad947d593fc6a/Diagrams/Application%20Architecture.png)
