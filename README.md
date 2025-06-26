# TempBox

A modern, privacy-focused temporary email service frontend. Instantly create disposable inboxes for secure, anonymous, and spam-free email communication. Built with React, Vite, and Tailwind CSS.

## Features

- **10-Minute Inboxes**: Create secure, disposable email addresses that auto-expire after 10 minutes.
- **Real-Time Updates**: Instantly receive emails in your temporary inbox with real-time loading.
- **No Signups Required**: Use all features anonymously—no registration or personal data needed.
- **One-Click Copy**: Easily copy your temporary email address for use anywhere.
- **Privacy-First**: No data collection, no tracking, and automatic cleanup of all inboxes and messages.
- **Open Source**: Friendly for contributions and self-hosting.
- **Blog & Insights**: Learn about privacy, digital wellness, and the tech behind temp inboxes.
- **Feedback Modal**: Share your thoughts directly from the app.
- **Responsive UI**: Beautiful, modern design with full mobile support.

## Tech Stack

- **Frontend**: React (with hooks), Vite, TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **State/Data**: React Query (@tanstack/react-query)
- **Icons**: Lucide React
- **Notifications**: react-hot-toast
- **Ads**: Google AdSense integration (privacy-respecting)

## Project Structure

```
├── public/                # Static assets
├── src/
│   ├── components/        # UI components (InboxManager, MessageViewer, etc.)
│   ├── data/              # Static data (blog posts)
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API and utility services
│   ├── types/             # TypeScript types (API, domain models)
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main app component
│   └── main.tsx           # App entry point
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/ShovonSheikh/temp-box.git
   cd temp-box
   ```
2. **Install dependencies:**
   ```sh
   npm install
   # or
   yarn install
   ```
3. **Start the development server:**
   ```sh
   npm run dev
   # or
   yarn dev
   ```
4. **Open in your browser:**
   Visit [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

### Build for Production

```sh
npm run build
# or
yarn build
```

The output will be in the `dist/` folder.

## Customization
- **AdSense**: Update AdSense client/slot IDs in `src/components/AdSenseAd.tsx` if self-hosting.
- **API Integration**: Connect to your backend by updating API endpoints in `src/services/`.
- **Branding**: Replace logos and update theme colors in Tailwind config as needed.

## Contributing

Contributions are welcome! Please open issues or pull requests for bug fixes, features, or improvements.

## License

MIT License. See [LICENSE](./LICENSE) for details.

## Credits
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query/latest)
- [Vite](https://vitejs.dev/)

---

**TempBox** – Making email privacy accessible, one temporary inbox at a time.
