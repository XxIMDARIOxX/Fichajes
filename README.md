# MBE App Client

A modern web application for office check-in/check-out tracking system.

## Features

- **QR Code Authentication**: Secure login via QR code scanning
- **Check-in and Check-out**: Track employee attendance with simple one-click operations
- **Reporting**: View weekly and monthly attendance reports with detailed summaries
- **Admin Dashboard**: For managers to monitor team attendance
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Comprehensive error management and user feedback
- **Loading States**: Visual indicators for all asynchronous operations

## Technology Stack

- **React**: Front-end UI library
- **Vite**: Build tool and development server
- **React Router**: For navigation
- **Axios**: API communication with interceptors for consistent error handling
- **QR Code Libraries**: For generating and scanning QR codes

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
- Create a `.env` file with your API URL:
```
VITE_API_URL=http://localhost:3000/api
```

3. Start the development server:
```bash
npm run dev
```

## Building for Production

```bash
npm run build
```

The production files will be in the `dist` directory. Make sure to update the `.env.production` file with your production API URL before building.

## API Integration

This client app is designed to work with the MBE-API. Make sure the API server is running and accessible at the URL specified in your environment variables.

## QR Code Functionality

This application includes QR code functionality for convenient login:

1. When accessed, the app displays a QR code that can be scanned by mobile devices.

2. The QR code contains a time-limited token that allows secure authentication.

3. When scanned, the user is directed to the login page where they can enter their credentials.

4. After successful authentication, users can perform check-in and check-out operations.

**Note:** Make sure your firewall allows connections to ports 3000 and 5173.

## Application Flow

1. **Initial Load**: The app starts with a QR code for login, or shows the login form if accessed directly
2. **Authentication**: Users can log in via QR code scanning or username/password
3. **Main Interface**: After authentication, users can check in, check out, or view reports
4. **Reports View**: Weekly or monthly views of attendance with hours calculation
5. **Admin Functions**: Admins have access to additional reporting features

## Best Practices Used

- Centralized API service with Axios interceptors for consistent error handling
- State management for authentication and user data
- Responsive loading states and error handling
- Environment-specific configuration

## Security Considerations

- JWT authentication
- Token validation
- Secure QR code generation
- Proper error handling to prevent information leakage
