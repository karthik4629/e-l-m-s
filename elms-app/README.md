# Employee Leave Management System (ELMS)

A web-based Employee Leave Management System built using React and Vite for the frontend, with a Node.js, Express, and MongoDB backend.

## Project Overview

The Employee Leave Management System allows employees, managers, and administrators to manage the complete leave management process.

### Employee

- Register and log in
- View employee dashboard
- View profile
- View leave balances
- Apply for leave
- View submitted leaves
- View leave status
- Cancel pending leave requests
- Reset forgotten password
- Receive notifications

### Manager

- Log in as a manager
- View manager dashboard
- View assigned employees
- View leave requests from assigned employees
- Approve leave requests
- Reject leave requests with comments
- View manager profile
- Receive notifications

### Admin

- Log in as an administrator
- View admin dashboard
- View users
- View employees
- View managers
- Create employees
- Create managers
- Activate/deactivate users
- Update employee leave balances
- Assign employees to managers
- View all leave records
- View admin profile

## Technology Stack

### Frontend

- React
- Vite
- React Router DOM
- JavaScript
- CSS
- ESLint

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt

## Frontend Structure

```text
elms-app/
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   │
│   ├── Admin/
│   │   ├── admin.jsx
│   │   └── admin.css
│   │
│   ├── Employee/
│   │   ├── employee.jsx
│   │   └── employee.css
│   │
│   ├── Manager/
│   │   ├── manager.jsx
│   │   └── manager.css
│   │
│   ├── Login/
│   │   ├── login.jsx
│   │   ├── login.css
│   │   ├── register.jsx
│   │   ├── register.css
│   │   ├── forgotPassword.jsx
│   │   ├── forgotPassword.css
│   │   ├── resetPassword.jsx
│   │   └── resetPassword.css
│   │
│   ├── components/
│   │   ├── NotificationPanel.jsx
│   │   └── NotificationPanel.css
│   │
│   ├── assets/
│   │   └── hero.png
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
└── README.md