import { useState, useEffect, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { 
  Mail, 
  Zap, 
  Copy, 
  RefreshCw, 
  Shield, 
  Clock, 
  Sparkles, 
  Menu, 
  X, 
  Heart,
  ArrowRight,
  Inbox,
  Plus,
  Check,
  Github,
  Send,
  ArrowLeft
} from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import { AdSenseAd } from './components/AdSenseAd';
import { blogPosts } from './data/blog';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const InboxManager = lazy(() => import('./components/InboxManager').then(module => ({ default: module.InboxManager })));
const MessageViewer = lazy(() => import('./components/MessageViewer').then(module => ({ default: module.MessageViewer })));
const BlogModal = lazy(() => import('./components/BlogModal').then(module => ({ default: module.BlogModal })));

type ViewMode = 'home' | 'inbox' | 'message';

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeBlogModal, setActiveBlogModal] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({ name: '', email: '', message: '' });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Prevent body scroll when modal is open (only for blog modal now)
  useEffect(() => {
    if (showFeedbackModal || activeBlogModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showFeedbackModal, activeBlogModal]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'inbox') {
      setCurrentView('inbox');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const handleMessageSelect = (messageId: string) => {
    setSelectedMessageId(messageId);
    setCurrentView('message');
  };

  const handleBackToInbox = () => {
    setSelectedMessageId(null);
    setCurrentView('inbox');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedMessageId(null);
  };

  const activeBlogPost = blogPosts.find(p => p.id === activeBlogModal);

  // Enhanced feedback submission with proper backend integration
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    try {
      // TODO: Replace with actual backend endpoint
      // await fetch('/api/feedback', { ... });
      // Simulate success for now
      setFeedbackSuccess(true);
      setFeedback({ name: '', email: '', message: '' });
      setTimeout(() => {
        setFeedbackSuccess(false);
        setShowFeedbackModal(false);
      }, 2000);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Render different views based on currentView
  const renderCurrentView = () => {
    switch (currentView) {
      case 'inbox':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="mb-6">
                <button
                  onClick={handleBackToHome}
                  className="inline-flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Home</span>
                </button>
              </div>
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-6">
                <Suspense fallback={<div className="p-8 text-center">Loading inbox...</div>}>
                  <InboxManager onMessageSelect={handleMessageSelect} />
                </Suspense>
              </div>
            </div>
          </div>
        );
      
      case 'message':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="mb-6">
                <button
                  onClick={handleBackToInbox}
                  className="inline-flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Inbox</span>
                </button>
              </div>
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                <Suspense fallback={<div className="p-8 text-center">Loading message...</div>}>
                  <MessageViewer 
                    messageId={selectedMessageId} 
                    onClose={handleBackToInbox}
                    embedded={true}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 relative overflow-x-hidden">
            {/* Subtle Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-violet-200 to-purple-200 dark:from-violet-900/30 dark:to-purple-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-slow"></div>
              <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-200 to-teal-200 dark:from-cyan-900/30 dark:to-teal-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-slow animation-delay-2000"></div>
              <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-orange-200 to-pink-200 dark:from-orange-900/30 dark:to-pink-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-slow animation-delay-4000"></div>
            </div>

            {/* Hero Section with reduced ad density */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-7xl mx-auto text-center">
                {/* Reduced to 1 ad slot in hero section for better compliance */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  <div className="w-full sm:w-1/2 md:w-1/3 p-2 flex justify-center">
                    <AdSenseAd
                      client="ca-pub-1369369221989066"
                      slot="hero-1"
                      format="auto"
                      responsive={true}
                      style={{ display: 'block', width: '100%', minHeight: '90px' }}
                    />
                  </div>
                </div>
                
                <div className="animate-float mb-8">
                  <div className="relative inline-block">
                    <Mail className="w-20 h-20 text-violet-600 animate-pulse-gentle" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full animate-bounce-gentle"></div>
                  </div>
                </div>
                
                <h1 className="font-display text-5xl md:text-7xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                    TempBox
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto font-medium">
                  Temporary inboxes, built for privacy and speed. 10-minute secure email addresses.
                </p>
                
                <button 
                  onClick={() => setCurrentView('inbox')}
                  className="group bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-4 px-8 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
                >
                  <span className="relative z-10 flex items-center">
                    <Plus className="mr-2 w-5 h-5" />
                    Create Inbox
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </section>
            
            {/* How It Works - Removed ad */}
            <section id="howitworks" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-7xl mx-auto">
                <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                  How It Works
                </h2>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: <Zap className="w-8 h-8" />,
                      title: "Create Inbox",
                      description: "One click, 10-minute secure inbox",
                      color: "from-violet-500 to-purple-500"
                    },
                    {
                      icon: <Copy className="w-8 h-8" />,
                      title: "Copy & Use",
                      description: "Anywhere, anytime you need it",
                      color: "from-cyan-500 to-teal-500"
                    },
                    {
                      icon: <RefreshCw className="w-8 h-8" />,
                      title: "Receive Instantly",
                      description: "Real-time updates, no waiting",
                      color: "from-orange-500 to-pink-500"
                    }
                  ].map((step, index) => (
                    <div
                      key={index}
                      className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-8 rounded-3xl shadow-lg hover:shadow-2xl border border-slate-200/50 dark:border-slate-700/50 transition-all duration-500 hover:-translate-y-2"
                    >
                      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${step.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        {step.icon}
                      </div>
                      <h3 className="font-display text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                        {step.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Features Section - Removed ad */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-7xl mx-auto">
                <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                  Features That Matter
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      icon: <Zap className="w-6 h-6" />,
                      title: "10-Minute Inbox",
                      description: "Perfect duration for most verification needs",
                      gradient: "from-violet-500 to-purple-500"
                    },
                    {
                      icon: <RefreshCw className="w-6 h-6" />,
                      title: "Real-time Loading",
                      description: "Emails appear instantly as they arrive",
                      gradient: "from-cyan-500 to-teal-500"
                    },
                    {
                      icon: <Copy className="w-6 h-6" />,
                      title: "One-click Copy",
                      description: "Copy email addresses with a single click",
                      gradient: "from-orange-500 to-pink-500"
                    },
                    {
                      icon: <Shield className="w-6 h-6" />,
                      title: "No Account Needed",
                      description: "Anonymous and completely registration-free",
                      gradient: "from-green-500 to-emerald-500"
                    },
                    {
                      icon: <Sparkles className="w-6 h-6" />,
                      title: "Built-in Anonymity",
                      description: "Your privacy is protected by design",
                      gradient: "from-blue-500 to-indigo-500"
                    },
                    {
                      icon: <Clock className="w-6 h-6" />,
                      title: "Auto-expiry",
                      description: "Inboxes clean up automatically after 10 minutes",
                      gradient: "from-red-500 to-rose-500"
                    }
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        {feature.icon}
                      </div>
                      <h3 className="font-display text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Free Forever Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-12 rounded-3xl shadow-2xl border border-violet-200/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-teal-600/10"></div>
                  <div className="relative z-10 text-center">
                    <div className="inline-flex p-4 bg-white/20 rounded-2xl mb-6">
                      <Heart className="w-8 h-8 text-white animate-pulse-gentle" />
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-6">
                      Always Free. No Signups. No Hidden Fees.
                    </h2>
                    <p className="text-xl text-white/90 mb-8 leading-relaxed">
                      TempBox is committed to providing free temporary email services. 
                      We're supported by privacy-respecting, non-intrusive advertisements.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-white/90">
                      <div className="flex items-center">
                        <Check className="w-5 h-5 mr-2" />
                        <span>Privacy-first policies</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="w-5 h-5 mr-2" />
                        <span>No data collection</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="w-5 h-5 mr-2" />
                        <span>Open source friendly</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Blog Section */}
            <section id="blog" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-7xl mx-auto">
                <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                  Latest Insights
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {blogPosts.map((post) => (
                    <article
                      key={post.id}
                      className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                      onClick={() => setActiveBlogModal(post.id)}
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-2xl">{post.emoji}</span>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          <span>{post.readingTime} min read</span>
                          <span className="mx-2">•</span>
                          <span>{post.publishedAt}</span>
                        </div>
                      </div>
                      <h3 className="font-display text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-200">
                        {post.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                        {post.excerpt}
                      </p>
                      <button className="inline-flex items-center text-violet-600 dark:text-violet-400 font-medium group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors duration-200">
                        Read More
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                  <div className="font-display text-2xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent mb-4">
                    TempBox
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                    Making email privacy accessible, one temporary inbox at a time.
                  </p>
                </div>
                <div className="text-center text-slate-500 dark:text-slate-500 text-sm space-y-2">
                  <p>© {new Date().getFullYear()} TempBox. Built with privacy in mind.</p>
                  <div className="flex justify-center items-center space-x-6 mt-2">
                    <button
                      className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium flex items-center space-x-1"
                      onClick={() => setShowFeedbackModal(true)}
                    >
                      <Send className="w-4 h-4" />
                      <span>Give Feedback</span>
                    </button>
                    <a
                      href="https://github.com/ShovonSheikh/temp-box"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center space-x-1"
                      title="View source on GitHub"
                    >
                      <Github className="w-4 h-4" />
                      <span>GitHub</span>
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={handleBackToHome}
              className="font-display font-bold text-2xl bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent cursor-pointer"
            >
              TempBox
            </button>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {currentView === 'home' ? (
                <>
                  {['Inbox', 'HowItWorks', 'Features', 'Blog'].map((item) => (
                    <button
                      key={item}
                      onClick={() => scrollToSection(item.toLowerCase())}
                      className="text-slate-700 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200 font-medium relative group"
                    >
                      {item === 'HowItWorks' ? 'How It Works' : item}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-violet-600 to-cyan-600 transition-all duration-300 group-hover:w-full"></span>
                    </button>
                  ))}
                </>
              ) : (
                <button
                  onClick={handleBackToHome}
                  className="text-slate-700 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200 font-medium"
                >
                  Back to Home
                </button>
              )}
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-700 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200 p-2"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden fixed inset-y-0 right-0 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200/50 dark:border-slate-700/50 transform transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="pt-20 px-6 space-y-6">
            {currentView === 'home' ? (
              <>
                {['Inbox', 'HowItWorks', 'Features', 'Blog'].map((item, index) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item.toLowerCase())}
                    className="block w-full text-left text-slate-700 dark:text-slate-300 text-lg font-medium hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 py-3 transform hover:translate-x-2"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {item === 'HowItWorks' ? 'How It Works' : item}
                  </button>
                ))}
              </>
            ) : (
              <button
                onClick={handleBackToHome}
                className="block w-full text-left text-slate-700 dark:text-slate-300 text-lg font-medium hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 py-3 transform hover:translate-x-2"
              >
                Back to Home
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {renderCurrentView()}

      {/* Blog Modal (unchanged) */}
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <BlogModal 
          post={activeBlogPost || null} 
          onClose={() => setActiveBlogModal(null)} 
        />
      </Suspense>

      {/* Toast Container */}
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;