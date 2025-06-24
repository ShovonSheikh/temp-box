import { useState, useEffect } from 'react';
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
  Github
} from 'lucide-react';
import { InboxManager } from './components/InboxManager';
import { MessageViewer } from './components/MessageViewer';
import { BlogModal } from './components/BlogModal';
import { ThemeToggle } from './components/ThemeToggle';
import { CleanupStatus } from './components/CleanupStatus';
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

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeBlogModal, setActiveBlogModal] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showInboxManager, setShowInboxManager] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // Animation state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({ name: '', email: '', message: '' });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Debug: Log when modal opens
  useEffect(() => {
    if (showInboxManager) {
      console.log('Modal opened.');
      setTimeout(() => setModalVisible(true), 10);
    } else {
      setModalVisible(false);
    }
  }, [showInboxManager]);

  // Only unmount modal after exit animation
  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => setShowInboxManager(false), 300); // Match duration-300
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'inbox') {
      setShowInboxManager(true);
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const activeBlogPost = blogPosts.find(p => p.id === activeBlogModal);

  // Load AdSense script on component mount
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1369369221989066';
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src*="adsbygoogle.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  // Feedback modal submit handler (dummy, just shows success)
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    setTimeout(() => {
      setFeedbackSubmitting(false);
      setFeedbackSuccess(true);
      setFeedback({ name: '', email: '', message: '' });
      setTimeout(() => {
        setFeedbackSuccess(false);
        setShowFeedbackModal(false);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 relative overflow-x-hidden">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-violet-200 to-purple-200 dark:from-violet-900/30 dark:to-purple-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-slow"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-200 to-teal-200 dark:from-cyan-900/30 dark:to-teal-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-slow animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-orange-200 to-pink-200 dark:from-orange-900/30 dark:to-pink-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-slow animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="font-display font-bold text-2xl bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
              TempBox
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
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
              <CleanupStatus />
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
            <div className="pt-4">
              <CleanupStatus />
            </div>
          </div>
        </div>
      </nav>

      {/* Inbox Manager Modal */}
      {(showInboxManager || modalVisible) && (
        <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out ${modalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div
            className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-700/50 transform transition-all duration-300 ease-in-out ${modalVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-white">
                  <Inbox className="w-5 h-5" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-800 dark:text-slate-200">
                  TempBox Inbox
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <InboxManager onMessageSelect={setSelectedMessageId} />
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          {/* 5 Ad slots in hero section */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[1,2,3,4,5].map((i) => (
              <div key={`hero-ad-${i}`} className="w-full sm:w-1/2 md:w-1/3 lg:w-1/5 p-2 flex justify-center">
                <AdSenseAd
                  client="ca-pub-1369369221989066"
                  slot={`hero-${i}`}
                  format="auto"
                  responsive={true}
                  style={{ display: 'block', width: '100%', minHeight: '90px' }}
                />
              </div>
            ))}
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
            Temporary inboxes with automated cleanup and 7-day maximum retention.
          </p>
          
          <button 
            onClick={() => {
              setShowInboxManager(true);
            }}
            className="group bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-4 px-8 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none transition-all duration-300 relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center">
              <>
                <Plus className="mr-2 w-5 h-5" />
                Create Inbox
              </>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </section>
      
      {/* How It Works */}
      <section id="howitworks" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* 2 Ad slots in section */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[1,2].map((i) => (
              <div key={`howitworks-ad-${i}`} className="w-full sm:w-1/2 md:w-1/4 p-2 flex justify-center">
                <AdSenseAd
                  client="ca-pub-1369369221989066"
                  slot={`howitworks-${i}`}
                  format="auto"
                  responsive={true}
                  style={{ display: 'block', width: '100%', minHeight: '90px' }}
                />
              </div>
            ))}
          </div>
          
          <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Create Inbox",
                description: "One click, no login required. Auto-expires in 1 hour.",
                color: "from-violet-500 to-purple-500"
              },
              {
                icon: <Copy className="w-8 h-8" />,
                title: "Copy & Use",
                description: "Use anywhere, anytime. Real-time message monitoring.",
                color: "from-cyan-500 to-teal-500"
              },
              {
                icon: <RefreshCw className="w-8 h-8" />,
                title: "Auto-Cleanup",
                description: "Automatic deletion after expiry. Maximum 7-day retention.",
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
      
      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* 2 Ad slots in section */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[1,2].map((i) => (
              <div key={`features-ad-${i}`} className="w-full sm:w-1/2 md:w-1/4 p-2 flex justify-center">
                <AdSenseAd
                  client="ca-pub-1369369221989066"
                  slot={`features-${i}`}
                  format="auto"
                  responsive={true}
                  style={{ display: 'block', width: '100%', minHeight: '90px' }}
                />
              </div>
            ))}
          </div>
          
          <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
            Features That Matter
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Instant Inbox",
                description: "Create temporary inboxes in milliseconds",
                gradient: "from-violet-500 to-purple-500"
              },
              {
                icon: <RefreshCw className="w-6 h-6" />,
                title: "Real-time Updates",
                description: "Emails appear instantly with live notifications",
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
                title: "Built-in Privacy",
                description: "Your privacy is protected by design",
                gradient: "from-blue-500 to-indigo-500"
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Auto-Cleanup",
                description: "Automated deletion with 7-day maximum retention",
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
          {/* 2 Ad slots in section */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[1,2].map((i) => (
              <div key={`freeforever-ad-${i}`} className="w-full sm:w-1/2 md:w-1/4 p-2 flex justify-center">
                <AdSenseAd
                  client="ca-pub-1369369221989066"
                  slot={`freeforever-${i}`}
                  format="auto"
                  responsive={true}
                  style={{ display: 'block', width: '100%', minHeight: '90px' }}
                />
              </div>
            ))}
          </div>
          
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-12 rounded-3xl shadow-2xl border border-violet-200/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-teal-600/10"></div>
            <div className="relative z-10 text-center">
              <div className="inline-flex p-4 bg-white/20 rounded-2xl mb-6">
                <Heart className="w-8 h-8 text-white animate-pulse-gentle" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-6">
                Always Free. Automated Cleanup. Maximum Privacy.
              </h2>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                TempBox provides free temporary email with automated cleanup and a 7-day maximum retention policy. 
                We're supported by privacy-respecting, non-intrusive advertisements.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-white/90">
                <div className="flex items-center">
                  <Check className="w-5 h-5 mr-2" />
                  <span>1-hour auto-expiry</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 mr-2" />
                  <span>7-day maximum retention</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 mr-2" />
                  <span>Automated cleanup</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 mr-2" />
                  <span>No data collection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Blog Section */}
      <section id="blog" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* 2 Ad slots in section */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[1,2].map((i) => (
              <div key={`blog-ad-${i}`} className="w-full sm:w-1/2 md:w-1/4 p-2 flex justify-center">
                <AdSenseAd
                  client="ca-pub-1369369221989066"
                  slot={`blog-${i}`}
                  format="auto"
                  responsive={true}
                  style={{ display: 'block', width: '100%', minHeight: '90px' }}
                />
              </div>
            ))}
          </div>
          
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
              Making email privacy accessible with automated cleanup and maximum retention policies.
            </p>
          </div>
          <div className="text-center text-slate-500 dark:text-slate-500 text-sm space-y-2">
            <p>© {new Date().getFullYear()} TempBox. Built with privacy in mind.</p>
            <div className="flex justify-center items-center space-x-6 mt-2">
              <button
                className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium"
                onClick={() => setShowFeedbackModal(true)}
              >
                Give Feedback
              </button>
              <a
                href="https://github.com/airdropcodex/blaze-mail"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                title="View source on GitHub"
              >
                <Github className="inline w-5 h-5 align-text-bottom" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BlogModal 
        post={activeBlogPost || null} 
        onClose={() => setActiveBlogModal(null)} 
      />
      
      <MessageViewer 
        messageId={selectedMessageId} 
        onClose={() => setSelectedMessageId(null)} 
      />

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-8 relative">
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              aria-label="Close feedback modal"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4 text-center">Give Feedback</h2>
            {feedbackSuccess ? (
              <div className="text-green-600 dark:text-green-400 text-center font-medium py-8">Thank you for your feedback!</div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  placeholder="Your Name"
                  value={feedback.name}
                  onChange={e => setFeedback(f => ({ ...f, name: e.target.value }))}
                  required
                />
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  placeholder="Your Email"
                  value={feedback.email}
                  onChange={e => setFeedback(f => ({ ...f, email: e.target.value }))}
                  required
                />
                <textarea
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-400 min-h-[100px] resize-none"
                  placeholder="Your Feedback"
                  value={feedback.message}
                  onChange={e => setFeedback(f => ({ ...f, message: e.target.value }))}
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:from-violet-700 hover:to-cyan-700 transition-all duration-300 disabled:opacity-60"
                  disabled={feedbackSubmitting}
                >
                  {feedbackSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '16px',
            color: '#334155',
          },
        }}
      />
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