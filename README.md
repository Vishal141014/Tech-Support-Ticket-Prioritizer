# Tech-Support-Ticket-Prioritizer
## An AI-powered tech support ticket classification and prioritization system. This project automatically categorizes support tickets and assigns priority levels based on content, helping support teams focus on the most critical issues first.
=======
# Tech Support Ticket Prioritizer

A full-stack application for managing, prioritizing, and resolving customer support tickets with AI-based classification.

## Overview

The Tech Support Ticket Prioritizer is a MERN stack application designed to streamline the management of tech support tickets. It features user authentication, ticket creation and management, and AI-powered ticket classification to help prioritize support requests.

## Features

- **User Authentication**
  - Secure registration and login
  - Role-based access (admin and user)
  - JWT token-based authentication

- **Ticket Management**
  - Create, read, update, and delete tickets
  - View ticket status and history
  - Filter and search functionality

- **AI-Powered Classification**
  - Automatic prioritization of tickets
  - Classification based on text analysis
  - Multiple ML models including Random Forest (20.03% accuracy) and CNN (20.46% accuracy)

- **Admin Dashboard**
  - Overview of all tickets
  - User management
  - Analytics and reporting

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Chart.js for analytics
- Socket.io for real-time updates

### Backend
- Node.js
- Express.js
- MongoDB for database
- JWT for authentication

### Machine Learning
- TF-IDF Vectorization
- Multiple algorithms implemented:
  - Logistic Regression
  - Multinomial Naive Bayes
  - Random Forest
  - Support Vector Machine (SVM)
  - Convolutional Neural Network (CNN)

## Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- Python 3.x (for ML components)

### Backend Setup
1. Clone the repository
   ```
   git clone https://github.com/Vishal141014/Tech-Support-Ticket-Prioritizer

2. Navigate to server directory
   ```
   cd tech-support-ticket-prioritizer/server
   ```

3. Install dependencies
   ```
   npm install
   ```

4. Create a .env file with the following variables
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/ai_customer_support
   JWT_SECRET=vishal&nikita
   ```

5. Start the server
   ```
   npm run dev
   ```

### Frontend Setup
1. Navigate to web-ui directory
   ```
   cd ../web-ui
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the frontend application
   ```
   npm start
   ```

## Usage

### User Registration/Login
1. Navigate to the homepage
2. Click on "Register" to create a new account or "Login" if you already have one
3. For admin access, use the default admin account:
   - Email: admin@example.com
   - Password: admin123

### Creating a Ticket
1. Login to your account
2. Navigate to the dashboard
3. Click on "New Ticket"
4. Fill in the ticket details and submit

### Admin Features
1. Login with admin credentials
2. Access the admin dashboard
3. View all tickets, manage users, and see analytics

## Project Structure
```
tech-support-ticket-prioritizer/
├── server/                   # Backend code
│   ├── config/               # Configuration files
│   ├── middleware/           # Express middleware
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API routes
│   └── server.js             # Main server file
├── web-ui/                   # Frontend code
│   ├── public/               # Static files
│   └── src/                  # React components
│       ├── components/       # Reusable components
│       ├── context/          # React context
│       ├── pages/            # Page components
│       └── App.js            # Main React component
└── Customer-Support-Ticket-Classification/ # ML components
    ├── customer_ticket_analysis.ipynb  # ML model notebook
    └── requirements.txt      # Python dependencies
```

## AI Model Training

The ticket classification system uses several machine learning algorithms:

1. **Text Preprocessing**:
   - Tokenization and stemming
   - TF-IDF vectorization

2. **Models Implemented**:
   - Logistic Regression (18.73% accuracy)
   - Multinomial Naive Bayes (19.64% accuracy)
   - Random Forest (20.03% accuracy)
   - Support Vector Machine (18.93% accuracy)
   - CNN with embedding layers (20.46% accuracy)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- MongoDB for database
- Express.js for API
- React.js for frontend
- Node.js for backend
- TensorFlow and scikit-learn for ML components
