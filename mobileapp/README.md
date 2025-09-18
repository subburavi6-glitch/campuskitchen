# Mess Management Mobile App

A React Native mobile application for mess management system built with Expo.

## Features

- **Authentication**: OTP-based login using register number
- **Dashboard**: QR code for mess entry, today's meals, tomorrow's meal plan
- **Meal Rating**: Rate meals after consumption with star rating and comments
- **Meal Planning**: View weekly meal plan and set attendance preferences
- **QR Code Scanning**: Scan QR codes for attendance marking
- **Notifications**: Push notifications and in-app notifications
- **Profile Management**: Update personal information and view statistics

## Tech Stack

- **Frontend**: Expo, React Native, NativeWind (Tailwind CSS)
- **Navigation**: React Navigation
- **State Management**: React Context
- **API Communication**: Axios
- **QR Code**: expo-barcode-scanner, react-native-qrcode-svg
- **Notifications**: Expo Push Notifications
- **Storage**: AsyncStorage

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd mobileapp
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Run on Device/Simulator**
   ```bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   ```

## Project Structure

```
mobileapp/
├── src/
│   ├── contexts/          # React contexts (Auth, Notifications)
│   ├── navigation/        # Navigation configuration
│   ├── screens/          # App screens
│   ├── services/         # API services
│   └── components/       # Reusable components
├── assets/               # Images, icons, fonts
├── App.js               # Main app component
└── package.json         # Dependencies and scripts
```

## Key Features

### Authentication Flow
1. Enter register number
2. Receive OTP (logged to console in development)
3. Verify OTP to login
4. JWT token stored for subsequent requests

### Dashboard
- Personal QR code for mess entry
- Today's meal status with rating option
- Tomorrow's meal plan with attendance toggle

### Meal Rating
- 5-star rating system
- Optional comments
- Feedback stored for analytics

### Meal Planning
- Weekly meal plan view
- Attendance preference setting
- Meal type indicators with icons

### QR Code Features
- Personal QR code generation
- QR code scanning for attendance
- Attendance marking with time validation

### Notifications
- Push notifications support
- In-app notification center
- Mark as read functionality

## API Integration

The app communicates with the existing Node.js server through REST APIs:

- `/api/mobile/send-otp` - Send OTP for login
- `/api/mobile/verify-otp` - Verify OTP and authenticate
- `/api/mobile/profile` - Get/update student profile
- `/api/mobile/meals/*` - Meal-related endpoints
- `/api/mobile/qr-code` - QR code generation
- `/api/mobile/attendance` - Mark attendance
- `/api/mobile/notifications` - Notification management

## Database Schema

New tables added to support mobile functionality:

- `students` - Student master data with QR codes
- `meal_attendances` - Meal attendance tracking
- `meal_ratings` - Meal ratings and feedback
- `notifications` - Push notifications

## Development Notes

- Uses NativeWind for styling (Tailwind CSS for React Native)
- Implements proper error handling and loading states
- Follows React Native best practices
- Responsive design for different screen sizes
- Offline-first approach where applicable

## Production Deployment

1. Configure proper API endpoints in `apiService.js`
2. Set up push notification credentials
3. Build and deploy using Expo EAS Build
4. Configure app store listings

## Demo Credentials

For testing, any register number can be used. The OTP will be logged to the console in development mode.