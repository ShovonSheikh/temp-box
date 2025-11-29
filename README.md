# TempBox v2

A modern, privacy-focused temporary email service built with React, Vite, and Tailwind CSS. Instantly create disposable inboxes for secure, anonymous, and spam-free email communication.

## Overview

TempBox is a frontend application that provides users with temporary, self-destructing email addresses that expire after 10 minutes. Perfect for sign-ups, verifications, and protecting your primary email from spam. The application requires no account creation and prioritizes user privacy above all else.

## Key Features

- **10-Minute Self-Destructing Inboxes**: Create temporary email addresses that automatically expire after 10 minutes
- **No Account Required**: Completely anonymous usage—no registration, no data collection, no tracking
- **Real-Time Email Updates**: Receive emails instantly with live polling and updates
- **One-Click Copy**: Easily copy your temporary email address with a single click
- **Privacy-First Design**: Built with privacy as a core principle; all data is ephemeral
- **Responsive Mobile UI**: Beautiful, modern interface optimized for all devices
- **Dark Mode Support**: Seamless dark/light theme toggle
- **Blog & Educational Content**: Learn about digital privacy and email security
- **User Feedback**: Built-in feedback system to share suggestions
- **Open Source**: Community-friendly and self-hosting ready

## Tech Stack

### Frontend
- **React 18+** - UI framework with hooks
- **Vite** - Lightning-fast build tool
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **PostCSS** - CSS processing with autoprefixer

### State Management & Data Fetching
- **React Query** (@tanstack/react-query) - Server state management with caching and polling
- **React Hooks** - Local state management

### UI & Utilities
- **Lucide React** - Beautiful, consistent icons
- **react-hot-toast** - Elegant notifications
- **DOMPurify** - HTML sanitization for email content
- **date-fns** - Date formatting and manipulation

## Project Structure

```
├── dist/                              # Production build output
├── public/                            # Static assets
├── src/
│   ├── components/
│   │   ├── AuthModal.tsx              # Authentication (reserved for future use)
│   │   ├── BlogModal.tsx              # Blog post display modal
│   │   ├── InboxManager.tsx           # Main inbox interface
│   │   ├── Logo.tsx                   # Logo component
│   │   ├── MessageViewer.tsx          # Email message display
│   │   ├── SystemStats.tsx            # System statistics display
│   │   ├── ThemeToggle.tsx            # Dark/light mode toggle
│   │   └── UserStatus.tsx             # User status display
│   ├── data/
│   │   └── blog.ts                    # Blog posts data
│   ├── hooks/
│   │   ├── useInbox.ts                # Inbox management hook
│   │   ├── useMessage.ts              # Message fetching hook
│   │   └── useTheme.ts                # Theme preference hook
│   ├── services/
│   │   ├── authService.ts             # Authentication logic
│   │   ├── cleanupService.ts          # Auto-cleanup on expiry
│   │   ├── mailApi.ts                 # Mail.tm API wrapper
│   │   └── storageService.ts          # Local storage management
│   ├── types/
│   │   └── api.ts                     # TypeScript API type definitions
│   ├── utils/
│   │   └── dateUtils.ts               # Date utility functions
│   ├── App.tsx                        # Main application component
│   ├── index.css                      # Global styles
│   ├── main.tsx                       # React entry point
│   └── vite-env.d.ts                  # Vite environment types
├── .env                               # Environment variables (local)
├── .gitignore
├── index.html                         # HTML entry point
├── package.json
├── tailwind.config.js                 # Tailwind configuration
├── postcss.config.js                  # PostCSS configuration
├── vite.config.ts                     # Vite configuration
├── tsconfig.json                      # TypeScript configuration
├── tsconfig.app.json                  # App TypeScript configuration
├── tsconfig.node.json                 # Node TypeScript configuration
├── eslint.config.js                   # ESLint configuration
└── README.md
```

## How It Works

### User Flow

1. **Create Inbox**
   - User clicks "Create Inbox" button
   - System generates a random temporary email address using mail.tm API
   - Email address is displayed and copied to clipboard

2. **Receive Emails**
   - Real-time polling fetches incoming emails every few seconds
   - Messages appear instantly in the inbox
   - Each message shows sender, subject, and preview

3. **View Messages**
   - Click on any message to view full content
   - HTML emails are sanitized using DOMPurify for security
   - Attachments and metadata are displayed

4. **Auto-Expiry**
   - After 10 minutes, the inbox automatically expires
   - User is notified of expiration
   - All data is cleared from storage
   - Old inboxes cannot receive new emails

### Architecture

**Frontend Architecture:**
- Single Page Application (SPA) with React Router-style navigation
- Component-based UI with reusable, modular components
- Centralized API service for mail.tm integration
- Custom hooks for inbox, message, and theme management
- Local storage for session persistence
- Real-time polling via React Query for email updates

**Data Flow:**
```
User Action → Component → Hook → API Service → mail.tm API → Response → State Update → UI Render
```

### API Integration

TempBox integrates with the [mail.tm](https://mail.tm/) API:

- **Domains**: Fetches available email domains
- **Accounts**: Creates temporary email accounts
- **Authentication**: Issues JWT tokens for account access
- **Messages**: Polls for incoming emails
- **Message Details**: Retrieves full email content
- **Cleanup**: Deletes accounts and messages

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 3+
- A modern web browser

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ShovonSheikh/temp-box.git
   cd temp-box
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment (optional):**
   Create a `.env.local` file if you need custom configuration:
   ```env
   VITE_API_BASE_URL=https://api.mail.tm
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   The application will be available at [http://localhost:5173](http://localhost:5173)

### Development

- **Lint code:** `npm run lint`
- **Build for production:** `npm run build`
- **Preview production build:** `npm run preview`

## Component Overview

### InboxManager
Main interface for managing temporary inboxes. Handles account creation, email polling, and message list display.

**Key Features:**
- Creates new inbox on demand
- Real-time email polling with React Query
- Auto-refresh mechanism
- Loading and error states
- Message list with read/unread indicators

### MessageViewer
Displays individual email messages with full content and metadata.

**Key Features:**
- HTML content sanitization
- Sender and recipient information
- Email attachments (if available)
- Message timestamps
- Copy and delete actions

### BlogModal
Modal component for displaying blog posts about privacy and email security.

**Content Topics:**
- Email privacy best practices
- Why temporary emails matter
- Digital security tips
- Tech behind temporary inboxes

### ThemeToggle
Dark/light mode switcher that persists user preference.

### UserStatus
Displays current session information and inbox status.

## Hooks

### useInbox
Manages inbox creation and account lifecycle.

```typescript
const { account, loading, error, createInbox, deleteInbox } = useInbox();
```

### useMessage
Manages message fetching and polling with React Query.

```typescript
const { messages, loading, error, refetch } = useMessage(accountId, messageId);
```

### useTheme
Manages dark/light mode preference and system detection.

```typescript
const { isDark, toggle } = useTheme();
```

## Services

### mailApi
API wrapper for mail.tm service. Handles all backend communication.

**Methods:**
- `getDomains()` - Fetch available email domains
- `createAccount(address, password)` - Create temporary account
- `getToken(address, password)` - Authenticate and get JWT
- `getMessages(page, itemsPerPage)` - Fetch inbox messages
- `getMessage(messageId)` - Get full message content
- `markMessageAsRead(messageId)` - Mark as read
- `deleteMessage(messageId)` - Delete message
- `deleteAccount(accountId)` - Delete account and cleanup

### authService
Handles authentication state and token management.

### storageService
LocalStorage wrapper for session and preference persistence.

### cleanupService
Auto-cleanup timer for expired inboxes.

## Privacy & Security

- **No Data Collection**: No analytics, tracking cookies, or user profiling
- **No Account Creation**: Use without providing personal information
- **Ephemeral Data**: All emails and inboxes are temporary and auto-delete
- **HTML Sanitization**: Email content is sanitized with DOMPurify
- **HTTPS Only**: All API communication is encrypted
- **Client-Side Processing**: Data stays on your device as much as possible

## Performance Optimizations

- **Code Splitting**: Lazy-loaded components for faster initial load
- **React Query Caching**: Efficient data fetching with automatic caching
- **Memoization**: Components optimized to prevent unnecessary re-renders
- **Vite Fast Refresh**: Instant HMR during development
- **Production Build**: Optimized bundle size and tree-shaking

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Customization

### Branding
Update theme colors in `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
    },
  },
}
```

### API Integration
Modify API endpoints in `src/services/mailApi.ts`:
```typescript
const API_BASE = 'https://your-custom-api.com';
```

### Blog Content
Edit blog posts in `src/data/blog.ts`:
```typescript
export const blogPosts = [
  { id: 'post-id', title: 'Your Post', content: '...' },
];
```

## Deployment

### Build for Production
```bash
npm run build
```
Output is in the `dist/` folder.

### Hosting Options
- **Vercel** (recommended) - Optimized for Vite projects
- **Netlify** - Excellent serverless functions
- **AWS S3 + CloudFront** - Highly scalable
- **GitHub Pages** - Simple, free static hosting
- **Self-hosted** - Docker, VPS, or on-premises

### Environment Variables for Production
```env
VITE_API_BASE_URL=https://api.mail.tm
```

## Troubleshooting

### Issue: "Account no longer exists" error
**Solution**: This occurs after the 10-minute expiry. Create a new inbox to continue.

### Issue: Emails not appearing in real-time
**Solution**: Check your email domain configuration and ensure the mail.tm service is accessible. Refresh manually or wait for the next polling interval.

### Issue: Dark mode not persisting
**Solution**: Clear browser cache and localStorage, then restart the application.

### Issue: Build errors with TypeScript
**Solution**: Run `npm run lint` to identify type issues, then fix reported errors.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes with clear messages
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License. See [LICENSE](./LICENSE) for details.

## Credits

- [mail.tm](https://mail.tm/) - Email API provider
- [Lucide Icons](https://lucide.dev/) - Icon library
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [React Query](https://tanstack.com/query/latest) - Data fetching library
- [Vite](https://vitejs.dev/) - Build tool
- [React](https://react.dev/) - UI framework

## Support

For issues, feature requests, or questions:
- Open an issue on [GitHub](https://github.com/ShovonSheikh/temp-box)
- Check existing issues for solutions
- Review documentation and examples

---

**TempBox** – Making email privacy accessible, one temporary inbox at a time.

Built with privacy in mind. No tracking. No ads. No nonsense.
