# K-FIT Gym Management Dashboard

A modern, mobile-first gym management application built with Expo and React Native. The app provides administrators with a comprehensive dashboard to monitor daily operations, manage members, track revenue, and oversee class schedules.

## Features

### Dashboard Overview
- **Real-time Metrics**: Active members, monthly revenue, daily check-ins, and class occupancy
- **Revenue Analytics**: Visual bar chart showing 6-month revenue trends
- **Attention Alerts**: Membership renewals, unpaid invoices, and capacity warnings
- **Session Schedule**: Upcoming classes with trainer details, locations, and booking status

### User Authentication
- Secure login system for administrators
- Role-based access control

### Responsive Design
- Optimized for mobile phones and tablets
- Adaptive layouts that adjust to screen size
- Clean, modern interface with subtle shadows and clear visual hierarchy

## Tech Stack

- **Framework**: Expo SDK 57
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **UI**: React Native with SafeAreaView
- **Styling**: React Native StyleSheet
- **Icons**: Emoji-based icon system

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or bun
- Expo CLI

### Setup

1. Clone the repository
   ```bash
   git clone https://github.com/Ivanrestone/K-FIT-APPLICATION.git
   cd K-FIT-APPLICATION
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npx expo start
   ```

4. Run on your preferred platform
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan the QR code with Expo Go app for mobile device

## Login Credentials

To access the admin dashboard, use the following credentials:

- **Email**: `admin@gmail.com`
- **Password**: `admin123`

## App Structure

```
src/
├── app/
│   ├── _layout.tsx          # Root layout with tabs
│   ├── index.tsx            # Login screen
│   ├── dashboard.tsx        # Admin dashboard
│   └── explore.tsx          # Explore screen
├── components/
│   ├── app-tabs.tsx         # Tab navigation configuration
│   └── animated-icon.tsx    # Animated splash screen
└── assets/
    └── images/
        └── tabIcons/        # Tab navigation icons
```

## Navigation

The app uses Expo Router with a tab-based navigation system:

- **Home** (`/`): Login screen
- **Explore** (`/explore`): Additional features
- **Dashboard** (`/dashboard`): Admin management dashboard

## Development

### Linting
```bash
npx expo lint
```

### Type Checking
```bash
npx tsc --noEmit
```

### Building for Production

For iOS:
```bash
npx expo run:ios
```

For Android:
```bash
npx expo run:android
```

For EAS Build (recommended):
```bash
npx eas-cli build --platform ios
npx eas-cli build --platform android
```

## Future Enhancements

- Member management system
- Class scheduling and booking
- Financial reports and analytics
- Trainer management
- Payment processing integration
- Push notifications for alerts
- Data persistence with backend integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on the GitHub repository.
