# BD Company Ltd - Inventory Management System

A modern inventory management system built with Next.js, TypeScript, and Prisma for BD Company Ltd.

## Features

- **User Authentication**: Secure login system with JWT tokens
- **Customer Management**: Add, view, edit, and delete customers
- **Photo Upload**: Upload customer photos
- **Search & Filter**: Search customers by name, phone, address, or email
- **Dashboard**: Overview with statistics and recent customers
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: JWT tokens
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Login

- **Username**: admin
- **Password**: admin123

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── customers/         # Customer pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/             # React components
├── lib/                   # Utility functions
├── prisma/                # Database schema and seeds
└── public/                # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed the database

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Customers
- `GET /api/customers` - Get all customers (with pagination and search)
- `POST /api/customers` - Create new customer
- `GET /api/customers/[id]` - Get single customer
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## Database Schema

### Users
- id (Primary Key)
- username (Unique)
- password (Hashed)
- createdAt
- updatedAt

### Customers
- id (Primary Key)
- name
- phone
- address
- email (Optional)
- photoPath (Optional)
- notes (Optional)
- createdAt
- updatedAt
- createdBy (Foreign Key to Users)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary to BD Company Ltd.
