# Fluxpay
Fluxpay is a comprehensive web application designed to handle basic wallet functionalities such as user registration, login, searching for users, and transferring money between users.

## ✨ Features

- **Modern UI/UX**: Clean, minimalistic design with shadcn/ui components and smooth transitions
- **Dark/Light Mode**: Toggle between themes with persistent user preference
- **Secure Authentication**: JWT-based authentication with protected routes
- **Real-time Notifications**: Instant updates using Server-Sent Events
- **Digital Wallet**: Send and receive money with VPA (Virtual Payment Address)
- **Transaction History**: Comprehensive transaction tracking and filtering
- **Account Management**: Balance tracking and account overview
- **Responsive Design**: Mobile-first approach with seamless cross-device experience
- **Real-time Balance Updates**: Instant balance synchronization across sessions

## Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL (with Sequelize)
- JWT for authentication
- Zod for validation

### Frontend
- React 18
- Vite
- Tailwind CSS
- shadcn/ui (Modern component library)
- React Router for navigation
- Axios for API calls
- React Context for state management

## Prerequisites
- Node.js (version 18 or higher)
- PostgreSQL (local or cloud instance)
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
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=3000
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

## 🎨 UI Components

The application features modernized components with consistent styling:

- **NavBar**: Responsive navigation with theme toggle and authentication state
- **Dashboard**: Modern card-based layout with balance display and quick actions
- **TransferPage**: Clean form design for money transfers
- **TransactionHistory**: Tabular data with filtering and sorting
- **Notifications**: Real-time notification center with read/unread states
- **Login/Signup**: Modern authentication forms with validation
- **Landing Page**: Hero section with call-to-action and feature highlights

## 🌙 Dark/Light Mode

- Toggle between themes using the theme switcher in the navigation
- Persistent theme preference stored in localStorage
- Smooth transitions between light and dark modes
- Consistent theming across all components

## 📱 Responsive Design

- Mobile-first approach with breakpoints at 640px, 768px, and 1024px
- Touch-friendly interface elements
- Optimized layouts for tablet and desktop viewing
- Accessible design following WCAG guidelines

## 🔗 API Endpoints

### Authentication
- `POST /api/v1/user/signup` - User registration
- `POST /api/v1/user/signin` - User login
- `GET /api/v1/user/profile` - Get user profile
- `PUT /api/v1/user` - Update user profile

### Account Management
- `GET /api/v1/account/balance` - Get account balance
- `POST /api/v1/account/transfer` - Transfer money
- `GET /api/v1/account/user/:id` - Get user details by ID

### Transactions
- `GET /api/v1/transaction/history` - Get transaction history
- `POST /api/v1/transaction/transfer` - Create new transaction

### Notifications
- `GET /api/v1/notification` - Get user notifications
- `PUT /api/v1/notification/:id/read` - Mark notification as read

**Note**: All endpoints except signup and signin require JWT authentication via Authorization header.

## 📊 Database Schema (ER Diagram)

### Entities & Attributes

#### 👤 User
- `id` (Primary Key)
- `userName` (Unique, lowercase)
- `password` (8-100 chars)
- `firstName`
- `lastName`
- `email` (Unique)
- `createdAt`, `updatedAt`

#### 💰 Account
- `id` (Primary Key)
- `userId` (Foreign Key → User.id)
- `balance` (Default: 100.00)
- `vpaAddress` (Unique)
- `createdAt`, `updatedAt`

#### 💸 Transaction
- `id` (Primary Key)
- `transactionId` (Unique UUID)
- `senderId` (Foreign Key → User.id)
- `receiverId` (Foreign Key → User.id)
- `amount` (Decimal 10,2)
- `description` (Text)
- `status` (ENUM: pending, completed, failed)
- `createdAt`, `updatedAt`

#### 🔔 Notification
- `id` (Primary Key)
- `userId` (Foreign Key → User.id)
- `transactionId` (Foreign Key → Transaction.id)
- `message` (Text)
- `read` (Boolean, Default: false)
- `createdAt`, `updatedAt`

### Relationships

```
User (1) ─── (1) Account
   │
   ├── (1:N) ─── (N) Transaction (as sender)
   ├── (1:N) ─── (N) Transaction (as receiver)
   │
   └── (1:N) ─── (N) Notification

Transaction (1) ─── (1:N) Notification
```

### Key Relationships Explained

#### User ↔ Account (One-to-One)
- Each user has exactly one account
- Account belongs to one user
- Account gets 100.00 initial balance

#### User ↔ Transaction (One-to-Many, Bidirectional)
- User can send many transactions (as sender)
- User can receive many transactions (as receiver)
- Each transaction has one sender and one receiver

#### User ↔ Notification (One-to-Many)
- User can have many notifications
- Each notification belongs to one user

#### Transaction ↔ Notification (One-to-Many)
- Each transaction can generate multiple notifications
- Each notification relates to one transaction

### Business Logic
- **VPA (Virtual Payment Address)**: Unique identifier for money transfers
- **Transaction Flow**: Sender's balance decreases, receiver's balance increases atomically
- **Notification System**: Real-time updates for transaction events
- **Security**: Password validation, JWT authentication, secure transaction processing

### Database Design Highlights
✅ **Normalized Structure** - No data redundancy
✅ **Referential Integrity** - Foreign key constraints
✅ **Indexing** - Optimized for VPA lookups and user queries
✅ **Atomic Transactions** - Database-level transaction support
✅ **Audit Trail** - Timestamps on all entities

## Contributing

1. Fork the repository.
2. Create a new branch for your feature.
3. Make your changes and commit them.
4. Push to your fork and submit a pull request.

## License

This project is licensed under the MIT License.



