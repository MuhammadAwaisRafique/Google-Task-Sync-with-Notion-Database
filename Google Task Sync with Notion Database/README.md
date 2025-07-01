# Google Tasks ↔ Notion Sync

A comprehensive full-stack application that synchronizes Google Tasks with Notion databases using the MERN stack.

## Features

- **Google OAuth Authentication** - Secure login with Google accounts
- **Notion Integration** - Connect to your Notion workspace and databases
- **Real-time Sync** - Manual and automatic task synchronization
- **Task Management** - View, filter, and manage synced tasks
- **Error Handling** - Comprehensive error tracking and retry mechanisms
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## Architecture

### Backend (Node.js + Express)
- **Authentication**: Google OAuth2 with JWT tokens
- **Database**: MongoDB with Mongoose ODM
- **APIs**: Google Tasks API and Notion API integration
- **Scheduling**: Automated sync with node-cron
- **Security**: Rate limiting, CORS, Helmet

### Frontend (React)
- **Routing**: React Router for navigation
- **State Management**: Context API for authentication
- **UI Components**: Custom components with Tailwind CSS
- **API Integration**: Axios for HTTP requests

### Database Schema
- **Users**: Store user profiles, tokens, and configuration
- **SyncedTasks**: Track synchronized tasks between platforms
- **SyncLogs**: Maintain sync history and statistics

## Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Google Cloud Platform account
- Notion workspace with integration

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd google-tasks-notion-sync
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google Tasks API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`

4. **Configure Notion Integration**
   - Go to [Notion Integrations](https://www.notion.so/my-integrations)
   - Create a new integration
   - Copy the integration token
   - Create a database with required properties:
     - Name (Title)
     - Status (Select: Not started, Done)
     - Google Task ID (Text)
     - Task List (Text)
     - Due Date (Date)

5. **Environment Configuration**
   The `.env` file is already configured with your credentials.

6. **Start the application**
   ```bash
   npm run dev
   ```

   This starts both the backend server (port 5000) and frontend client (port 3000).

## Usage

1. **Authentication**
   - Visit `http://localhost:3000`
   - Click "Continue with Google" to authenticate
   - Grant necessary permissions for Google Tasks access

2. **Setup Notion**
   - Navigate to the Setup page
   - Enter your Notion API token and database ID
   - Configure sync settings (manual vs automatic)

3. **Sync Tasks**
   - Use the Dashboard to start manual synchronization
   - Enable automatic sync for scheduled synchronization
   - Monitor sync status and task statistics

4. **Manage Tasks**
   - View synchronized tasks in the Tasks page
   - Filter by status (pending, completed, errors)
   - Search through task titles
   - Access original tasks in Google Tasks

## API Endpoints

### Authentication
- `GET /api/auth/google` - Get Google OAuth URL
- `GET /api/auth/google/callback` - Handle OAuth callback
- `POST /api/auth/notion-config` - Update Notion configuration
- `GET /api/auth/me` - Get current user

### Sync Management
- `POST /api/sync/start` - Start manual sync
- `GET /api/sync/status` - Get sync status and history
- `POST /api/sync/settings` - Update sync settings

### Tasks
- `GET /api/tasks` - Get synced tasks with pagination
- `GET /api/tasks/stats` - Get task statistics

## Security Features

- **Rate Limiting**: Prevents API abuse
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Validates all user inputs
- **CORS Protection**: Configurable cross-origin requests
- **Helmet Security**: Security headers for Express
- **Token Refresh**: Automatic Google token renewal

## Error Handling

- **Graceful Degradation**: Continues sync even if individual tasks fail
- **Retry Logic**: Automatic retry for transient failures
- **Error Logging**: Comprehensive error tracking and logging
- **User Feedback**: Clear error messages and status indicators

## Development

### Project Structure
```
├── server/                 # Backend application
│   ├── config/            # Configuration files
│   ├── controllers/       # Request handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── middleware/        # Custom middleware
│   └── index.js           # Server entry point
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── services/      # API services
│   └── public/            # Static assets
└── README.md
```

### Scripts
- `npm run dev` - Start development servers
- `npm run build` - Build production client
- `npm run start` - Start production server
- `npm run install:all` - Install all dependencies

## License

This project is licensed under the MIT License.

---

Built with ❤️ using the MERN stack for seamless task synchronization between Google Tasks and Notion.