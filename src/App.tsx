import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, Crown, MoreVertical, Copy, RefreshCw, Mail, Inbox, ChevronLeft, Trash2, History, RotateCcw, Info, Check, X, Bell, Moon, Shield, FileText, CreditCard, AlertCircle, Globe, Sparkles, MessageSquare, Star, Shuffle, List, EyeOff, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { translations } from './translations';

const RimpaMailLogo = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 120 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Envelope Base Shadow */}
    <rect x="10" y="25" width="100" height="60" rx="4" fill="#e2e8f0" transform="translate(0, 4)" />
    
    {/* Envelope Base */}
    <rect x="10" y="25" width="100" height="60" rx="4" fill="#ffffff" stroke="#d1d5db" strokeWidth="2" />
    
    {/* Top Flap (Red) */}
    <path d="M10 25 L60 55 L110 25 Z" fill="#e11d48" stroke="#be123c" strokeWidth="2" strokeLinejoin="round" />
    
    {/* Left Flap (Blue) */}
    <path d="M10 25 L50 50 L10 85 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="2" strokeLinejoin="round" />
    
    {/* Right Flap (Yellow) */}
    <path d="M110 25 L70 50 L110 85 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="2" strokeLinejoin="round" />
    
    {/* Bottom Flap (White) */}
    <path d="M10 85 L50 50 L70 50 L110 85 Z" fill="#f8fafc" stroke="#d1d5db" strokeWidth="2" strokeLinejoin="round" />

    {/* Notification Badge */}
    <circle cx="100" cy="15" r="12" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
    <text x="100" y="19" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">1</text>
  </svg>
);

const getTimeAgo = (timestamp: number) => {
  const diff = Math.floor((Date.now() - timestamp) / 60000);
  if (diff < 1) return 'Just now';
  if (diff === 1) return '1 min. ago';
  if (diff < 60) return `${diff} min. ago`;
  const hours = Math.floor(diff / 60);
  if (hours === 1) return '1 hr. ago';
  return `${hours} hrs. ago`;
};

export default function App() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('email');
  const [manageTab, setManageTab] = useState('active');
  const [isPremium, setIsPremium] = useState(false);
  const [showCustomEmailModal, setShowCustomEmailModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [selectedPremiumDomain, setSelectedPremiumDomain] = useState('@oakon.com');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState('1month');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUpiGateway, setShowUpiGateway] = useState(false);
  const [selectedUpiApp, setSelectedUpiApp] = useState<{id: string, name: string, logo: string} | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');
  const [upiPaymentStep, setUpiPaymentStep] = useState<'scan' | 'verifying' | 'success'>('scan');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [emailHistory, setEmailHistory] = useState<{email: string, token: string, timestamp: number}[]>([]);
  const knownMessageIds = useRef<Set<string>>(new Set());
  const activeTabRef = useRef(activeTab);
  const isInitialFetch = useRef(true);
  const swipeControls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'clearHistory' | null>(null);

  const t = (key: string) => {
    return translations['en']?.[key] || key;
  };

  const renderWithBrandNames = (text: string) => {
    if (!text) return text;
    const parts = text.split(/(Gmail|Rimpa Mail|Premium|App Rimpa Mail Version 1\.0\.0)/g);
    return parts.map((part, i) => {
      if (part === 'Gmail' || part === 'Rimpa Mail' || part === 'Premium' || part === 'App Rimpa Mail Version 1.0.0') {
        return <span key={i} translate="no" className="notranslate font-inherit">{part}</span>;
      }
      return part;
    });
  };

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      setEmailHistory(prev => {
        const filtered = prev.filter(item => now - item.timestamp < 3600000);
        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (email && !emailHistory.some(item => item.email === email)) {
      setEmail('');
      setToken('');
      setMessages([]);
    }
  }, [emailHistory, email]);

  useEffect(() => {
    if (!showSplash) return;
    
    const duration = 2500; // 2.5 seconds
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(Math.round((currentStep / steps) * 100), 100);
      setProgress(newProgress);
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => setShowSplash(false), 300); // small delay at 100%
      }
    }, interval);

    return () => clearInterval(timer);
  }, [showSplash]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [isLoadingDomains, setIsLoadingDomains] = useState(true);

  // Check for checkout success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setIsPremium(true);
      localStorage.setItem('rimpa_premium', 'true');
      
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      setTimeout(() => {
        alert("Payment successful! You are now a Premium user.");
      }, 500);
    } else if (localStorage.getItem('rimpa_premium') === 'true') {
      setIsPremium(true);
    }
  }, []);

  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/mailbox/domains`);
        if (res.ok) {
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            if (data.domains && data.domains.length > 0) {
              setAvailableDomains(data.domains);
              setSelectedDomain(data.domains[Math.floor(Math.random() * data.domains.length)]);
            }
          } catch (e) {
            console.error('Failed to parse domains JSON:', e);
          }
        }
      } catch (error) {
        console.error('Failed to fetch domains:', error);
      } finally {
        setIsLoadingDomains(false);
      }
    };
    fetchDomains();
  }, []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiInstance = useRef<any>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerConfetti = () => {
    if (!canvasRef.current) return;
    
    if (!confettiInstance.current) {
      confettiInstance.current = confetti.create(canvasRef.current, {
        resize: true,
        useWorker: false
      });
    }
    
    const myConfetti = confettiInstance.current;

    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      myConfetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      myConfetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
  };

  const generateNewEmail = async (domainToUse?: string, customName?: string) => {
    const domain = domainToUse || selectedDomain;
    setIsGenerating(true);
    try {
      let url = `${import.meta.env.VITE_API_BASE_URL || ''}/api/mailbox/create?domain=${domain}`;
      if (customName) {
        url += `&name=${encodeURIComponent(customName)}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        let errStr = 'Network response was not ok';
        try {
          const text = await res.text();
          const errData = JSON.parse(text);
          errStr = errData.error || errStr;
        } catch(e) {}
        throw new Error(errStr);
      }
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid response format: ${text.substring(0, 50)}...`);
      }
      if (data.error) throw new Error(data.error);
      
      if (data.domains && data.domains.length > 0) {
        const allDomains = Array.from(new Set([...data.domains, 'guerrillamail.com', 'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.org', 'guerrillamails.com', 'sharklasers.com', 'grr.la', 'spam4.me', 'pokemail.net', 'sharebot.net']));
        setAvailableDomains(allDomains);
        if (!domainToUse && !allDomains.includes(domain)) {
          setSelectedDomain(allDomains[0]);
        }
      }

      setEmail(data.email);
      setToken(data.token);
      setEmailHistory(prev => [{ email: data.email, token: data.token, timestamp: Date.now() }, ...prev]);
      setMessages([]);
      setSelectedMessage(null);
      knownMessageIds.current.clear();
      isInitialFetch.current = true;
      triggerConfetti();
    } catch (error: any) {
      console.error("Failed to generate email", error);
      // Show error to user via toast
      setErrorToast(`Error generating email: ${error.message}`);
      setTimeout(() => setErrorToast(null), 5000);
      
      // Fallback for demo purposes if API fails
      const fallbackEmail = customName ? `${customName}@${domain}` : `rimpa${Math.floor(Math.random() * 100000)}@${domain}`;
      setEmail(fallbackEmail);
      setEmailHistory(prev => [{ email: fallbackEmail, token: 'dummy-token', timestamp: Date.now() }, ...prev]);
      knownMessageIds.current.clear();
      isInitialFetch.current = true;
      triggerConfetti();
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchMessages = useCallback(async () => {
    if (!email || !token) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/mailbox/list?token=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error('Network response was not ok');
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid response format: ${text.substring(0, 50)}...`);
      }
      if (data.error) throw new Error(data.error);
      
      if (!Array.isArray(data)) {
        console.error("Expected array for messages but got:", data);
        return;
      }
      
      const newMessages = data.filter((msg: any) => !knownMessageIds.current.has(msg.id));
      
      if (!isInitialFetch.current && newMessages.length > 0) {
        if ('Notification' in window && Notification.permission === 'granted' && notificationsEnabled) {
          new Notification('New Email Received', { body: `You have ${newMessages.length} new message(s)` });
        }
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        
        // Trigger bounce animation
        setIsBouncing(true);
        setTimeout(() => setIsBouncing(false), 1000);
        
        if (activeTabRef.current !== 'inbox') {
          setUnreadCount(prev => prev + newMessages.length);
        }
      }
      
      data.forEach((msg: any) => knownMessageIds.current.add(msg.id));
      isInitialFetch.current = false;
      
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [email, token, notificationsEnabled]);

  const fetchMessageDetails = async (id: number) => {
    if (!email || !token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/mailbox/read?token=${encodeURIComponent(token)}&id=${id}`);
      if (!res.ok) throw new Error('Network response was not ok');
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid response format: ${text.substring(0, 50)}...`);
      }
      if (data.error) throw new Error(data.error);
      setSelectedMessage(data);
    } catch (error) {
      console.error("Failed to fetch message details", error);
    }
  };

  const deleteMessage = async (id: number) => {
    if (!email || !token) return;
    try {
      // Optimistically remove from UI
      setMessages(prev => prev.filter(msg => msg.id !== id));
      setSelectedMessage(null);
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/mailbox/remove?token=${encodeURIComponent(token)}&id=${id}`,  {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Network response was not ok');
    } catch (error) {
      console.error("Failed to delete message", error);
      fetchMessages(); // Refresh if failed
    }
  };

  useEffect(() => {
    generateNewEmail();
  }, []);

  // Auto-refresh inbox every 10 seconds globally
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (email) {
      interval = setInterval(() => {
        fetchMessages();
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [email, fetchMessages]);

  // Fetch immediately when switching to inbox tab
  useEffect(() => {
    if (activeTab === 'inbox') {
      setUnreadCount(0);
      if (email && !selectedMessage) {
        fetchMessages();
      }
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChange = () => {
    setShowConfirmModal(true);
  };

  const confirmChange = () => {
    setShowConfirmModal(false);
    const newDomain = availableDomains[Math.floor(Math.random() * availableDomains.length)];
    setSelectedDomain(newDomain);
    generateNewEmail(newDomain);
  };

  const cancelChange = () => {
    setShowConfirmModal(false);
  };

  const handleDragEnd = (event: any, info: any) => {
    const containerWidth = containerRef.current?.offsetWidth || 300;
    const buttonWidth = 56; // w-14 is 56px
    const threshold = containerWidth - buttonWidth - 20; // close to the right edge

    if (info.offset.x >= threshold) {
      confirmChange();
      swipeControls.set({ x: 0 });
    } else {
      swipeControls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  const deleteHistoryItem = (index: number) => {
    setEmailHistory(prev => prev.filter((_, i) => i !== index));
  };

  const reactivateEmail = (historyItem: {email: string, token: string, timestamp: number}) => {
    setEmail(historyItem.email);
    setToken(historyItem.token);
    setMessages([]);
    setSelectedMessage(null);
    knownMessageIds.current.clear();
    isInitialFetch.current = true;
    setActiveTab('email');
    triggerConfetti();
    
    // Fetch messages for the reactivated email
    setTimeout(() => {
      fetchMessages();
    }, 100);
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#082b19] text-white" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
        <div className="flex flex-col items-center mb-20">
          <div className="relative flex flex-col items-center">
            {/* RIMPA text */}
            <h1 className="text-6xl font-serif font-bold italic text-[#00a859] tracking-wider" style={{ WebkitTextStroke: '2px white', textShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
              RIMPA
            </h1>
            {/* MAIL pill */}
            <div className="bg-white border-[5px] border-[#fde047] rounded-full px-10 py-1 mt-[-15px] shadow-lg z-10">
              <h2 className="text-5xl font-black text-[#dc2626] tracking-widest" style={{ textShadow: '1px 2px 2px rgba(0,0,0,0.2)' }}>
                MAIL
              </h2>
            </div>
          </div>
          <p className="mt-8 text-[11px] font-bold tracking-[0.25em] text-white/90">
            SECURE DISPOSABLE INBOX
          </p>
        </div>

        <div className="w-72 flex flex-col items-center mt-12">
          <span className="text-xl font-bold mb-5">{progress}%</span>
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#00a859] rounded-full transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-bold tracking-[0.15em] text-white/50 mt-5">
            SYNCING DATA...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex flex-col h-screen bg-[#f0f3f7] dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 selection:bg-emerald-200 relative overflow-hidden transition-colors duration-300">
        
        {/* Confirmation Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={cancelChange}
        >
          <div 
            className="bg-white w-full sm:w-[400px] rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-center mb-2">{t('are_you_sure')}</h3>
            <p className="text-sm text-slate-500 text-center mb-8 px-4">
              The current email address and messages will be deleted and new mailbox created.
            </p>
            
            <div 
              ref={containerRef}
              className="relative w-full h-14 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden"
            >
              <span className="text-slate-600 font-semibold flex items-center gap-2 pl-8 pointer-events-none">
                Swipe to Delete <ChevronLeft className="w-4 h-4 rotate-180" /> <ChevronLeft className="w-4 h-4 rotate-180 -ml-3" />
              </span>
              <motion.div
                drag="x"
                dragConstraints={containerRef}
                dragElastic={0.05}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                animate={swipeControls}
                className="absolute left-0 top-0 w-14 h-14 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm z-10"
              >
                <Trash2 className="w-6 h-6 pointer-events-none" />
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* System-like Dropdown Notification */}
      <div 
        className={`absolute top-4 left-4 right-4 bg-[#f1f3f4] rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 z-50 transition-all duration-500 ease-out flex gap-3 cursor-pointer ${
          showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-[150%] pointer-events-none'
        }`}
        onClick={() => {
          setShowToast(false);
          setActiveTab('inbox');
          setUnreadCount(0);
        }}
      >
        <div className="w-8 h-8 bg-[#9c7a27] rounded-full flex items-center justify-center shrink-0 mt-0.5">
          <Mail className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-slate-500">{renderWithBrandNames(t('app_name'))} • 1m</span>
            <ChevronLeft className="w-4 h-4 text-slate-500 rotate-90" />
          </div>
          <span className="text-[15px] font-bold text-black mb-0.5 leading-tight">{t('new_otp')}</span>
          <span className="text-[13px] text-slate-600">{t('click_to_open')}</span>
        </div>
      </div>



      {/* Settings Modal */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-4"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 w-full max-w-[360px] rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Envelope Icon */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#14b8a6] rounded-2xl flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-800 z-10">
              <Mail className="w-8 h-8 text-white" />
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1 overflow-y-auto pt-12 pb-6 px-2 scrollbar-hide">
              {/* Menu Items */}
              <div className="space-y-1">
                <button 
                  onClick={() => { setIsSettingsOpen(false); setShowPremiumModal(true); }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 text-slate-800 dark:text-slate-200">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <span className="font-medium">{renderWithBrandNames(t('premium'))}</span>
                  </div>
                  <div className="bg-[#14b8a6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {t('try')}
                  </div>
                </button>

                <button 
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-slate-700 dark:text-slate-200"
                  onClick={() => { setIsSettingsOpen(false); setShowCustomEmailModal(true); }}
                >
                  <Mail className="w-5 h-5 text-slate-400" />
                  <span className="font-medium">{t('custom_email')}</span>
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-700 my-2 mx-4" />



                <button 
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                  onClick={() => setDarkMode(!darkMode)}
                >
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                    <Moon className="w-5 h-5 text-slate-400" />
                    <span className="font-medium">{t('dark_mode')}</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${darkMode ? 'bg-[#14b8a6]' : 'bg-slate-200 dark:bg-slate-600'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>

                <button 
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                  onClick={() => setAnimationsEnabled(!animationsEnabled)}
                >
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                    <Sparkles className="w-5 h-5 text-slate-400" />
                    <span className="font-medium">{t('animations')}</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${animationsEnabled ? 'bg-[#14b8a6]' : 'bg-slate-200 dark:bg-slate-600'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${animationsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>

                <button 
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                  onClick={() => {
                    if ('Notification' in window) {
                      if (Notification.permission === 'default') {
                        Notification.requestPermission().then(perm => {
                          setNotificationsEnabled(perm === 'granted');
                          if (perm !== 'granted') {
                            alert('Notifications were denied. Please enable them in your browser settings.');
                          }
                        });
                      } else if (Notification.permission === 'denied') {
                        alert('Notifications are blocked by your browser. Please enable them in your site settings.');
                      } else {
                        setNotificationsEnabled(!notificationsEnabled);
                      }
                    } else {
                      alert('Your browser does not support notifications.');
                    }
                  }}
                >
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                    <Bell className="w-5 h-5 text-slate-400" />
                    <span className="font-medium">{t('notifications')}</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${notificationsEnabled ? 'bg-[#14b8a6]' : 'bg-slate-200 dark:bg-slate-600'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-700 my-2 mx-4" />

                <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-slate-700 dark:text-slate-200">
                  <MessageSquare className="w-5 h-5 text-slate-400" />
                  <span className="font-medium">{t('help_center')}</span>
                </button>

                <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-slate-700 dark:text-slate-200">
                  <Star className="w-5 h-5 text-slate-400" />
                  <span className="font-medium">{t('rate_us')}</span>
                </button>
              </div>

              {/* Premium Banner */}
              <div className="mx-4 mt-6 bg-[#fcd34d] rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <Crown className="w-8 h-8 text-amber-600" />
                  </div>
                  <span className="font-bold text-amber-900">{t('want_more')}</span>
                </div>
                <button 
                  onClick={() => { setIsSettingsOpen(false); setShowPremiumModal(true); }}
                  className="bg-white text-amber-900 font-bold px-4 py-2 rounded-xl text-sm shadow-sm relative z-10"
                >
                  {renderWithBrandNames(t('premium'))}
                </button>
              </div>

              {/* Footer Links */}
              <div className="mt-8 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-3 mb-1">
                  <a href="https://whatsapp.com/channel/0029VbBEzVc002TGq85uLD2t" target="_blank" rel="noopener noreferrer" className="w-6 h-6 bg-slate-800 dark:bg-slate-200 rounded-full flex items-center justify-center text-white dark:text-slate-800 hover:scale-110 transition-transform">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                  <a href="https://www.facebook.com/rimpalove18" target="_blank" rel="noopener noreferrer" className="w-6 h-6 bg-slate-800 dark:bg-slate-200 rounded-full flex items-center justify-center text-white dark:text-slate-800 hover:scale-110 transition-transform">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a href="https://www.instagram.com/rimpalove18" target="_blank" rel="noopener noreferrer" className="w-6 h-6 bg-slate-800 dark:bg-slate-200 rounded-full flex items-center justify-center text-white dark:text-slate-800 hover:scale-110 transition-transform">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </a>
                  <a href="https://t.me/allyonorummycode" target="_blank" rel="noopener noreferrer" className="w-6 h-6 bg-slate-800 dark:bg-slate-200 rounded-full flex items-center justify-center text-white dark:text-slate-800 hover:scale-110 transition-transform">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 pr-[1px] pb-[1px]" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a5.8 5.8 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setActiveModal('terms'); setIsSettingsOpen(false); }} className="hover:text-slate-600 dark:hover:text-slate-300">{t('terms')}</button>
                  <span>•</span>
                  <button onClick={() => { setActiveModal('privacy'); setIsSettingsOpen(false); }} className="hover:text-slate-600 dark:hover:text-slate-300">{t('privacy')}</button>
                </div>
                <div>{renderWithBrandNames(t('app_version'))}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Menu */}
      {isDrawerOpen && (
        <>
          <div 
            className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-[310] w-72 bg-white dark:bg-slate-800 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RimpaMailLogo className="w-6 h-6" />
                <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{t('menu')}</span>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <button 
                className="w-full px-6 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-700 dark:text-slate-200"
                onClick={() => {
                  setActiveModal('clearHistory');
                  setIsDrawerOpen(false);
                }}
              >
                <Trash2 className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-500">{t('clear_history')}</span>
              </button>

              <div className="px-6 mt-6 mb-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('about')}</div>
              
              <button 
                onClick={() => { setActiveModal('privacy'); setIsDrawerOpen(false); }}
                className="w-full px-6 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-700 dark:text-slate-200"
              >
                <Shield className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                <span className="font-medium">{t('privacy_policy')}</span>
              </button>
              
              <button 
                onClick={() => { setActiveModal('terms'); setIsDrawerOpen(false); }}
                className="w-full px-6 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-700 dark:text-slate-200"
              >
                <FileText className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                <span className="font-medium">{t('terms_of_service')}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Info Modals */}
      {activeModal && (
        <div 
          className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-4"
          onClick={() => setActiveModal(null)}
        >
          {activeModal === 'clearHistory' ? (
            <div 
              className="relative w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 mt-10"
              style={{ 
                background: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #a16207 100%)',
                padding: '6px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.4)',
                borderRadius: '16px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Inner border */}
              <div 
                className="flex flex-col h-full relative bg-white min-h-[200px]"
                style={{
                  borderRadius: '10px',
                  border: '2px solid #854d0e',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)'
                }}
              >
                
                {/* Corner Gems */}
                {[
                  { top: '-12px', left: '-12px' },
                  { top: '-12px', right: '-12px' },
                  { bottom: '-12px', left: '-12px' },
                  { bottom: '-12px', right: '-12px' }
                ].map((pos, i) => (
                  <div 
                    key={i}
                    className="absolute w-10 h-10 rounded-full shadow-lg flex items-center justify-center z-20"
                    style={{
                      ...pos,
                      background: 'linear-gradient(135deg, #fef08a, #ca8a04)',
                      border: '1px solid #713f12',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.5)'
                    }}
                  >
                    <div 
                      className="w-6 h-6 rounded-full relative"
                      style={{
                        background: 'radial-gradient(circle at 30% 30%, #7dd3fc, #0284c7, #082f49)',
                        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4)'
                      }}
                    >
                      <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/60 blur-[1px]"></div>
                      <div className="absolute top-1.5 left-1.5 w-1 h-1 rounded-full bg-white"></div>
                    </div>
                  </div>
                ))}

                {/* Top Tab */}
                <div 
                  className="absolute -top-[42px] left-1/2 -translate-x-1/2 px-12 py-2 font-black text-amber-900 shadow-md whitespace-nowrap z-10 tracking-wide uppercase text-sm" 
                  style={{ 
                    background: 'linear-gradient(to bottom, #fef08a, #eab308)',
                    borderTop: '3px solid #fef9c3',
                    borderLeft: '3px solid #fef9c3',
                    borderRight: '3px solid #ca8a04',
                    borderBottom: '1px solid #a16207',
                    borderRadius: '12px 12px 0 0',
                    boxShadow: '0 -4px 10px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.8)',
                    textShadow: '0 1px 1px rgba(255,255,255,0.8)'
                  }}
                >
                  {t('clear_history')}
                </div>

                <div className="p-8 pt-10 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                    <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-slate-600 font-medium">{t('clear_history_warning')}</p>
                </div>
                <div className="p-6 pt-2 mt-auto flex gap-3 bg-gradient-to-t from-white via-white to-transparent">
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors border border-slate-200 shadow-sm"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    onClick={() => {
                      setEmailHistory([]);
                      setActiveModal(null);
                    }}
                    className="flex-1 relative group overflow-hidden rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(to bottom, #ef4444, #dc2626)',
                      border: '2px solid #b91c1c',
                      borderTopColor: '#f87171',
                      textShadow: '0 -1px 1px rgba(0,0,0,0.3)'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <div className="py-3 px-6 relative z-10">
                      {t('clear_history')}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="relative w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 mt-10"
              style={{ 
                background: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #a16207 100%)',
                padding: '6px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.4)',
                borderRadius: '16px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Inner border */}
              <div 
                className="flex flex-col h-full relative bg-white min-h-[350px]"
                style={{
                  borderRadius: '10px',
                  border: '2px solid #854d0e',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)'
                }}
              >
                
                {/* Corner Gems */}
                {[
                  { top: '-12px', left: '-12px' },
                  { top: '-12px', right: '-12px' },
                  { bottom: '-12px', left: '-12px' },
                  { bottom: '-12px', right: '-12px' }
                ].map((pos, i) => (
                  <div 
                    key={i}
                    className="absolute w-10 h-10 rounded-full shadow-lg flex items-center justify-center z-20"
                    style={{
                      ...pos,
                      background: 'linear-gradient(135deg, #fef08a, #ca8a04)',
                      border: '1px solid #713f12',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.5)'
                    }}
                  >
                    <div 
                      className="w-6 h-6 rounded-full relative"
                      style={{
                        background: 'radial-gradient(circle at 30% 30%, #7dd3fc, #0284c7, #082f49)',
                        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4)'
                      }}
                    >
                      <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/60 blur-[1px]"></div>
                      <div className="absolute top-1.5 left-1.5 w-1 h-1 rounded-full bg-white"></div>
                    </div>
                  </div>
                ))}

                {/* Top Tab */}
                <div 
                  className="absolute -top-[42px] left-1/2 -translate-x-1/2 px-12 py-2 font-black text-amber-900 shadow-md whitespace-nowrap z-10 tracking-wide uppercase text-sm" 
                  style={{ 
                    background: 'linear-gradient(to bottom, #fef08a, #eab308)',
                    borderTop: '3px solid #fef9c3',
                    borderLeft: '3px solid #fef9c3',
                    borderRight: '3px solid #ca8a04',
                    borderBottom: '1px solid #a16207',
                    borderRadius: '12px 12px 0 0',
                    boxShadow: '0 -4px 10px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.8)',
                    textShadow: '0 1px 1px rgba(255,255,255,0.8)'
                  }}
                >
                  {activeModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                </div>

                {/* Content */}
                <div className="p-8 pt-10 overflow-y-auto text-slate-700 text-sm space-y-5 max-h-[65vh] leading-relaxed">
                  {activeModal === 'privacy' ? (
                    <>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-amber-500" />
                          {t('protecting_real_inbox')}
                        </h4>
                        <p>{renderWithBrandNames(t('protecting_real_inbox_desc'))}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <Trash2 className="w-4 h-4 text-amber-500" />
                          {t('data_retention')}
                        </h4>
                        <p>{renderWithBrandNames(t('data_retention_desc'))}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <EyeOff className="w-4 h-4 text-amber-500" />
                          {t('no_tracking')}
                        </h4>
                        <p>{t('no_tracking_desc')}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-500" />
                          {t('usage')}
                        </h4>
                        <p>{renderWithBrandNames(t('usage_desc'))}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          {t('limitations')}
                        </h4>
                        <p>{renderWithBrandNames(t('limitations_desc'))}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4 text-amber-500" />
                          {t('disclaimer')}
                        </h4>
                        <p>{t('disclaimer_desc')}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Close Button */}
                <div className="p-6 pt-2 mt-auto bg-gradient-to-t from-white via-white to-transparent">
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="w-full relative group overflow-hidden rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(to bottom, #22c55e, #16a34a)',
                      border: '2px solid #15803d',
                      borderTopColor: '#4ade80',
                      textShadow: '0 -1px 1px rgba(0,0,0,0.3)'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <div className="py-3 px-6 relative z-10 flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Close
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 pt-10 shrink-0 z-10 bg-[#14b8a6] text-white">
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors bg-[#0f766e] rounded-full shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="9" x2="20" y2="9"></line>
            <line x1="4" y1="15" x2="20" y2="15"></line>
          </svg>
        </button>
        
        <div className="flex flex-col items-center">
          {activeTab === 'email' ? (
            <>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center w-8 h-6">
                  <svg viewBox="0 0 24 16" className="w-full h-full rounded-sm overflow-hidden shadow-sm">
                    <path d="M0 0 L12 8 L24 0 Z" fill="#ea4335" />
                    <path d="M0 0 L12 8 L0 16 Z" fill="#4285f4" />
                    <path d="M24 0 L12 8 L24 16 Z" fill="#fbbc04" />
                    <path d="M0 16 L12 8 L24 16 Z" fill="#34a853" />
                    <rect width="24" height="16" fill="none" stroke="white" strokeWidth="1" />
                  </svg>
                  {unreadCount > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border border-[#14b8a6] flex items-center justify-center">
                      <span className="text-[7px] text-white font-bold leading-none">{unreadCount}</span>
                    </div>
                  )}
                </div>
                <h1 className="text-[22px] font-bold text-white tracking-tight">
                  Trust<span className="text-red-500">Mail</span>
                </h1>
              </div>
              <div className="flex items-center gap-1 mt-[-2px] ml-8">
                <div className="w-4 h-[1px] bg-white/50"></div>
                <svg className="w-2.5 h-2.5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <div className="w-4 h-[1px] bg-white/50"></div>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white tracking-tight capitalize">
                {activeTab === 'history' ? t('history') || 'History' : selectedMessage ? t('message') : t('inbox')}
              </h1>
              {activeTab === 'history' && (
                <div className="text-[10px] text-white/90 border border-white/50 px-1.5 py-0.5 mt-0.5 rounded-sm bg-transparent">
                  This entry will be deleted after 1 hour.
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a href="https://t.me/allyonorummycode" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#3b82f6] rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors shadow-sm">
            <svg viewBox="0 0 24 24" className="w-5 h-5 ml-[-1px]" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a5.8 5.8 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </a>
        </div>
      </header>

      {/* Error Toast */}
      <AnimatePresence>
        {errorToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 font-medium"
          >
            <AlertCircle className="w-5 h-5" />
            {errorToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 px-6 flex flex-col items-center pt-8 overflow-y-auto w-full bg-[#f8fafc] dark:bg-slate-900">
        {activeTab === 'email' ? (
          <>
            {/* Envelope Card */}
            <motion.div 
              className="w-full max-w-[340px] relative"
              animate={isBouncing ? { y: [0, -20, 0, -10, 0] } : { y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.08)] relative overflow-hidden aspect-[4/4.8] flex flex-col">
                
                {/* Envelope Flap SVG */}
                <div className="absolute top-0 left-0 w-full h-[50%] pointer-events-none overflow-hidden z-0">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full absolute top-0 left-0">
                        <path d="M-5,0 L50,45 L105,0" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    </svg>
                </div>

                {/* Blue Icon Box at the tip of the V */}
                <div className="absolute top-[22%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#2563eb] rounded-full flex items-center justify-center z-20 border-[6px] border-white dark:border-slate-800 shadow-sm">
                  <Mail className="w-7 h-7 text-white" strokeWidth={2} />
                </div>

                {/* Top spacer to push content below the icon */}
                <div className="h-[35%] w-full shrink-0"></div>

                {/* Content Area */}
                <div className="relative z-10 flex flex-col items-center w-full flex-1 justify-between pb-6 pt-2">
                  {/* Top section: Email address */}
                  <div className="bg-[#f8fafc] dark:bg-slate-700/50 w-full py-3.5 flex justify-center items-center border-y border-slate-100 dark:border-slate-700/50">
                    <h2 className="text-[1.1rem] font-bold text-black dark:text-slate-100 text-center break-all px-6">
                      {email || 'Loading...'}
                    </h2>
                  </div>

                  {/* Middle section: Label */}
                  <div className="bg-[#fdf2f8] dark:bg-pink-900/30 px-5 py-2.5 rounded-xl">
                    <p className="text-[13px] text-[#db2777] dark:text-pink-400 font-bold">
                      {t('temp_email_label') || 'Your Temporary Email Address'}
                    </p>
                  </div>

                  {/* Bottom Section with Copy Button */}
                  <div className="w-full px-6">
                    <button
                      onClick={handleCopy}
                      className="w-full relative group overflow-hidden rounded-xl font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] bg-[#3b82f6]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                      <div className="py-3.5 px-6 relative z-10 flex items-center justify-center gap-2">
                        <Copy className="w-5 h-5" strokeWidth={2} />
                        {copied ? 'Copied!' : 'Copy email'}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Create New Account Button */}
            <button
              onClick={handleChange}
              disabled={isGenerating}
              className={`mt-8 relative group overflow-hidden rounded-xl font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] w-full max-w-[340px] bg-[#22c55e] ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <div className="py-4 px-6 relative z-10 flex items-center justify-center gap-2">
                <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} strokeWidth={2.5} />
                {isGenerating ? 'Generating...' : 'Create New Account'}
              </div>
            </button>
          </>
        ) : activeTab === 'history' ? (
          <div className="w-full max-w-md flex flex-col h-full pb-6 mt-2">
            <div className="space-y-4 w-full">
              {emailHistory
                .filter(item => (currentTime - item.timestamp) <= 3600000)
                .map((item, index) => {
                const timeLeft = 3600000 - (currentTime - item.timestamp);
                const minutesLeft = Math.floor(timeLeft / 60000);
                const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
                
                return (
                  <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border-b-4 border-red-500 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-[15px]">{item.email}</p>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => reactivateEmail(item)}
                          className="w-8 h-8 rounded-full bg-[#e6f6ed] dark:bg-[#00a859]/20 flex items-center justify-center text-[#00a859] hover:bg-[#d1f0df] transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(item.email);
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 2000);
                          }}
                          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">Just now</span>
                      <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded font-medium">
                        {minutesLeft}m {secondsLeft}s left
                      </span>
                    </div>
                  </div>
                );
              })}
              {emailHistory.filter(item => (currentTime - item.timestamp) <= 3600000).length === 0 && (
                <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
                  {t('no_emails_generated')}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'inbox' ? (
          <div className="w-full max-w-md flex flex-col h-full pb-6">
            {/* Email Bar */}
            <div className="bg-[#e2e8f0] dark:bg-slate-800 rounded-xl py-3 px-4 flex items-center justify-between mb-6 shrink-0 relative" ref={accountMenuRef}>
              <div className="flex items-center gap-2 cursor-pointer truncate mr-2" onClick={handleCopy}>
                <span className="text-sm font-medium truncate dark:text-slate-200">{email || 'Loading...'}</span>
                {copied && <Check className="w-4 h-4 text-green-500 shrink-0" />}
              </div>
              <button 
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
                onClick={() => setShowAccountMenu(!showAccountMenu)}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {showAccountMenu && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('your_accounts')}</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {(emailHistory || []).map((historyItem, index) => (
                      <div key={index} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                        <button 
                          onClick={() => {
                            reactivateEmail(historyItem);
                            setShowAccountMenu(false);
                          }}
                          className={`flex-1 text-left truncate text-sm mr-2 ${email === historyItem.email ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                          {historyItem.email}
                        </button>
                        <button 
                          onClick={() => {
                            deleteHistoryItem(index);
                            if (email === historyItem.email) {
                              const remaining = emailHistory.filter((_, i) => i !== index);
                              if (remaining.length > 0) {
                                reactivateEmail(remaining[0]);
                              } else {
                                const newDomain = availableDomains[Math.floor(Math.random() * availableDomains.length)];
                                setSelectedDomain(newDomain);
                                generateNewEmail(newDomain);
                              }
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {emailHistory.length === 0 && (
                      <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                        No accounts found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedMessage ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm flex-1 flex flex-col overflow-hidden mt-2 w-full mb-2 border border-slate-100 dark:border-slate-700">
                {/* Top Bar */}
                <div className="flex items-center justify-between mb-5 shrink-0">
                  <button 
                    onClick={() => setSelectedMessage(null)}
                    className="w-10 h-10 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="w-10 h-10 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full flex items-center justify-center text-red-500 dark:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <h2 className="text-[1.1rem] font-bold mb-4 shrink-0 leading-tight text-slate-900 dark:text-slate-100">{selectedMessage.subject}</h2>
                  
                  <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold text-lg uppercase">
                        {selectedMessage.from.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedMessage.from.split('@')[0]}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          to me <ChevronLeft className="w-3 h-3 -rotate-90" />
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {getTimeAgo(selectedMessage.date)}
                    </span>
                  </div>

                  <div className="flex-1 w-full min-h-0 relative">
                    <iframe 
                      className="absolute inset-0 w-full h-full border-0 bg-white dark:bg-slate-200 rounded-lg"
                      srcDoc={`
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                        <style>
                          body { 
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                            margin: 0; 
                            padding: 0; 
                            word-break: break-word;
                            font-size: 14px;
                            color: #0f1419;
                          }
                          img { display: none !important; }
                          a { display: none !important; }
                          *[style*="color: #888"], *[style*="color:#888"], 
                          *[style*="color: #657786"], *[style*="color:#657786"],
                          *[style*="color: #999"], *[style*="color:#999"],
                          *[color="#888888"], *[color="#657786"] { 
                            display: none !important; 
                          }
                          table, div, td, p { max-width: 100% !important; }
                          /* Force tables to shrink on small screens */
                          table { width: 100% !important; box-sizing: border-box; }
                        </style>
                        ${selectedMessage.htmlBody || selectedMessage.textBody}
                      `}
                      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                      title="Email Content"
                    />
                  </div>
                </div>
              </div>
            ) : (Array.isArray(messages) && messages.length > 0) ? (
              <div className="flex flex-col gap-3 overflow-y-auto">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => fetchMessageDetails(msg.id)}
                    className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm flex flex-col items-start text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors w-full border border-slate-100 dark:border-slate-700"
                  >
                    <div className="flex justify-between w-full mb-2 items-center">
                      <span className="font-bold text-sm truncate pr-2 dark:text-slate-200">{msg.from.split('@')[0]}</span>
                      <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 shrink-0">
                        <span>{getTimeAgo(msg.date)}</span>
                        <ChevronLeft className="w-3 h-3 rotate-180" />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate w-full mb-1">{msg.subject}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate w-full">{t('tap_to_read')}</span>
                  </button>
                ))}
              </div>
            ) : (
              /* Empty Envelope Graphic (Card Skin Theme) */
              <div className="flex-1 relative w-full flex flex-col items-center justify-center min-h-[400px] py-2">
                <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-xl relative overflow-hidden w-full h-full flex flex-col border-[12px] border-white dark:border-slate-800">
                  
                  {/* Pink Glow */}
                  <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#fbcfe8] opacity-30 blur-2xl rounded-full z-0 pointer-events-none"></div>

                  {/* Envelope Flap SVG */}
                  <div className="absolute top-0 left-0 w-full h-[35%] pointer-events-none overflow-hidden z-0 drop-shadow-md">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full absolute top-0 left-0">
                      <path d="M0,0 L50,55 L100,0" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                    </svg>
                  </div>

                  {/* Blue Icon Box at the tip of the V */}
                  <div className="absolute top-[19%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4.5rem] h-[4.5rem] bg-[#1d4ed8] rounded-full flex items-center justify-center z-20 border-[6px] border-white dark:border-slate-800">
                    <Mail className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>

                  <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center z-10 px-4">
                    <p className="text-[#94a3b8] dark:text-slate-500 font-bold text-[22px]">{t('your_inbox_empty')}</p>
                  </div>

                  {/* Refresh Button inside envelope */}
                  <div className="p-4 relative z-10 w-full mt-auto">
                    <button
                      onClick={fetchMessages}
                      className="w-full relative group overflow-hidden rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(to bottom, #3b82f6, #2563eb)',
                        border: '2px solid #1d4ed8',
                        borderTopColor: '#60a5fa',
                        textShadow: '0 -1px 1px rgba(0,0,0,0.3)'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                      <div className="py-4 relative z-10 flex items-center justify-center gap-2">
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={2.5} />
                        {isRefreshing ? t('refreshing') : t('refresh')}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Bottom Navigation */}
      <nav className="pb-8 pt-4 px-6 flex justify-between items-center w-full max-w-md mx-auto bg-[#f0f3f7] dark:bg-slate-900 shrink-0">
        <button
          onClick={() => { setActiveTab('email'); setSelectedMessage(null); }}
          className={`flex flex-col items-center gap-1.5 transition-colors ${
            activeTab === 'email' ? 'text-[#00a859] dark:text-[#00a859]' : 'text-[#8b9bb4] dark:text-slate-500'
          }`}
        >
          <Mail className="w-6 h-6" strokeWidth={activeTab === 'email' ? 2.5 : 2} />
          <span className="text-[11px] font-bold">{t('email')}</span>
        </button>
        <button
          onClick={() => { setActiveTab('inbox'); setSelectedMessage(null); setUnreadCount(0); }}
          className={`flex flex-col items-center gap-1.5 transition-colors ${
            activeTab === 'inbox' ? 'text-[#00a859] dark:text-[#00a859]' : 'text-[#8b9bb4] dark:text-slate-500'
          }`}
        >
          <div className="relative">
            <Inbox className="w-6 h-6" strokeWidth={activeTab === 'inbox' ? 2.5 : 2} />
            {unreadCount > 0 && (
              <div className="absolute -top-1.5 -right-2 w-[18px] h-[18px] bg-[#ff4b4b] rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-[#f0f3f7] dark:border-slate-900">
                {unreadCount}
              </div>
            )}
          </div>
          <span className="text-[11px] font-bold">{t('inbox')}</span>
        </button>
        <button
          onClick={() => { setActiveTab('history'); setSelectedMessage(null); }}
          className={`flex flex-col items-center gap-1.5 transition-colors ${
            activeTab === 'history' ? 'text-[#00a859] dark:text-[#00a859]' : 'text-[#8b9bb4] dark:text-slate-500'
          }`}
        >
          <History className="w-6 h-6" strokeWidth={activeTab === 'history' ? 2.5 : 2} />
          <span className="text-[11px] font-bold">{t('history')}</span>
        </button>
        <button
          onClick={() => setShowPremiumModal(true)}
          className={`flex flex-col items-center gap-1.5 transition-colors text-[#8b9bb4] dark:text-slate-500`}
        >
          <Crown className="w-6 h-6" strokeWidth={2} />
          <span className="text-[11px] font-bold">{renderWithBrandNames(t('premium'))}</span>
        </button>
      </nav>

      {/* Premium Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[300] bg-white dark:bg-slate-900 flex flex-col overflow-y-auto"
          >
            <div className="flex justify-between items-center p-4 shrink-0 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
              <div className="w-8" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{renderWithBrandNames(t('upgrade_premium'))}</h2>
              <button onClick={() => setShowPremiumModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 px-6 pb-12 w-full max-w-md mx-auto flex flex-col items-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('choose_subscription')}</p>
              
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                <Mail className="w-10 h-10 text-amber-500 dark:text-amber-400" />
              </div>

              {customName && selectedPremiumDomain && (
                <div className="text-center mb-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Create Email Address</p>
                  <p className="font-bold text-lg text-slate-900 dark:text-white">{customName}@*****.com</p>
                </div>
              )}

              <div className="w-full space-y-3 mb-6">
                {[
                  { id: '1week', title: '1 Week', subtitle: 'INR 521.74 /mo', price: '₹120' },
                  { id: '1month', title: '1 Month', badge: 'Save 37%', price: '₹325' },
                  { id: '3month', title: '3 Month', subtitle: 'INR 266.67 /mo', badge: 'Save 49%', price: '₹800' },
                  { id: '12month', title: '12 Month', subtitle: 'INR 204.17 /mo', badge: 'Save 61%', price: '₹2450' }
                ].map((plan, index, array) => (
                  <div 
                    key={plan.id}
                    onClick={() => setSelectedSubscription(plan.id)}
                    className={`w-full rounded-2xl p-4 flex items-center justify-between cursor-pointer border-2 transition-colors ${
                      selectedSubscription === plan.id 
                        ? 'border-[#00a859] bg-[#f0fdf4] dark:bg-emerald-900/20' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      {plan.badge && <span className="text-[10px] font-bold text-[#00a859] uppercase tracking-wider mb-1">{plan.badge}</span>}
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${selectedSubscription === plan.id ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{plan.title}</span>
                        {plan.subtitle && <span className="text-xs text-slate-400">{plan.subtitle}</span>}
                      </div>
                    </div>
                    <span className={`font-bold ${selectedSubscription === plan.id ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{plan.price}</span>
                  </div>
                ))}
              </div>

              <div className="text-slate-400 text-sm mb-6">{t('or')}</div>

              <div className="text-center mb-6">
                <p className="text-sm text-slate-500">
                  {t('then_price')
                    .replace('{price}', [
                      { id: '1week', title: '1 Week', price: '₹120' },
                      { id: '1month', title: '1 Month', price: '₹325' },
                      { id: '3month', title: '3 Month', price: '₹800' },
                      { id: '12month', title: '12 Month', price: '₹2450' }
                    ].find(p => p.id === selectedSubscription)?.price || '₹325')
                    .replace('{duration}', [
                      { id: '1week', title: '1 Week', price: '₹120' },
                      { id: '1month', title: '1 Month', price: '₹325' },
                      { id: '3month', title: '3 Month', price: '₹800' },
                      { id: '12month', title: '12 Month', price: '₹2450' }
                    ].find(p => p.id === selectedSubscription)?.title || '1 Month')}
                </p>
              </div>

              <div className="flex flex-col gap-3 mb-6">
                <button disabled className="text-sm text-center bg-blue-500 text-white font-medium py-2 px-4 rounded-lg select-none mx-auto w-fit mb-1 border-none cursor-default">Select Payment Method to Subscribe</button>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'phonepe', name: 'PhonePe', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg', color: 'hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20' },
                    { id: 'amazon', name: 'Amazon Pay', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg', color: 'hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20' }
                  ].map(method => (
                    <button 
                      key={method.id}
                      disabled={isCheckoutLoading || !!checkoutUrl}
                      onClick={() => {
                        setSelectedUpiApp(method);
                        setShowUpiGateway(true);
                        setUpiPaymentStep('scan');
                        setUtrNumber('');
                        setUtrError('');
                      }}
                      className={`py-3 px-2 flex flex-col items-center justify-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 ${method.color} rounded-xl transition-all gap-1.5 ${isCheckoutLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="h-6 flex items-center justify-center bg-white rounded p-1">
                        <img src={method.logo} alt={method.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{method.name}</span>
                    </button>
                  ))}
                </div>
                
                {isCheckoutLoading && (
                  <div className="flex justify-center mt-2 items-center gap-2 text-sm text-slate-500 font-medium">
                    <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting to {
                      { '1week': 'weekly', '1month': 'monthly', '3month': 'quarterly', '12month': 'yearly' }[selectedSubscription] || 'monthly'
                    } checkout...
                  </div>
                )}
              </div>
              
              <p className="text-xs text-slate-400 mb-8">{t('cancel_anytime')}</p>

              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">{renderWithBrandNames(t('why_go_premium'))}</h3>

              <ul className="w-full space-y-4 text-left">
                {[
                  t('custom_email'),
                  t('multiple_mailboxes'),
                  renderWithBrandNames(t('premium_domains')),
                  t('extended_storage'),
                  renderWithBrandNames(t('premium_support'))
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm">
                    <div className="w-5 h-5 rounded bg-[#00a859] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => { setShowPaymentModal(false); setPaymentError(false); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-slate-900 w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5v-17c0-.8.6-1.5 1.5-1.5h15c.8 0 1.5.6 1.5 1.5v17c0 .8-.6 1.5-1.5 1.5h-15c-.8 0-1.5-.6-1.5-1.5zm16.5-17h-15v17h15v-17z"/></svg>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{t('google_play')}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t('add_payment_method')}</h3>
                <p className="text-sm text-slate-500">user@gmail.com</p>
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 mb-6">
                  By continuing, you create a Google Payments account and agree to the Privacy Notice, Terms of Service.
                </p>
                
                {paymentError ? (
                  <div className="flex items-center gap-3 text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{t('something_went_wrong')}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button onClick={() => { 
                      setIsPremium(true); 
                      setShowPaymentModal(false); 
                      setShowPremiumModal(false); 
                      if (customName && selectedPremiumDomain) {
                        generateNewEmail(selectedPremiumDomain.replace('@', ''), customName);
                      }
                    }} className="w-full flex items-center gap-4 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                      <CreditCard className="w-6 h-6 text-slate-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-200">{t('add_card')}</span>
                    </button>
                    <button onClick={() => { 
                      setIsPremium(true); 
                      setShowPaymentModal(false); 
                      setShowPremiumModal(false); 
                      if (customName && selectedPremiumDomain) {
                        generateNewEmail(selectedPremiumDomain.replace('@', ''), customName);
                      }
                    }} className="w-full flex items-center gap-4 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold text-xs">G</div>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{t('pay_with_upi')}</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual UTR UPI Payment Gateway Modal */}
      <AnimatePresence>
        {showUpiGateway && selectedUpiApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-white dark:bg-slate-900 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
              <button 
                onClick={() => setShowUpiGateway(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg className="w-6 h-6 text-slate-700 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-full p-1 border border-slate-200 flex items-center justify-center">
                  <img src={selectedUpiApp.logo} alt={selectedUpiApp.name} className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white leading-tight">Pay with {selectedUpiApp.name}</h3>
                  <p className="text-[10px] text-slate-500">Secure Direct UPI</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#f8f9fa] dark:bg-slate-950 p-6 flex flex-col items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Rimpa Mail Premium</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium text-lg">
                Amount: {[
                  { id: '1week', title: '1 Week', price: '₹120.00' },
                  { id: '1month', title: '1 Month', price: '₹325.00' },
                  { id: '3month', title: '3 Month', price: '₹800.00' },
                  { id: '12month', title: '12 Month', price: '₹2450.00' }
                ].find(p => p.id === selectedSubscription)?.price || '₹325.00'}
              </p>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 w-full max-w-[340px] flex flex-col items-center">
                <AnimatePresence mode="wait">
                  {upiPaymentStep === 'scan' && (
                    <motion.div 
                      key="scan"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col items-center w-full"
                    >
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-6">
                        <QRCodeSVG 
                          value={`upi://pay?pa=rakibulrk@apl&pn=Rimpa%20Mail&am=${
                            [
                              { id: '1week', price: 120 },
                              { id: '1month', price: 325 },
                              { id: '3month', price: 800 },
                              { id: '12month', price: 2450 }
                            ].find(p => p.id === selectedSubscription)?.price || 325
                          }&cu=INR`}
                          size={180}
                          level="H"
                        />
                      </div>
                      
                      <div className="text-sm text-center text-slate-500 mb-6 px-4">
                        Scan the QR code with any UPI app or click the button below to pay directly via {selectedUpiApp.name}.
                      </div>

                      <a 
                        href={`upi://pay?pa=rakibulrk@apl&pn=Rimpa%20Mail&am=${
                            [
                              { id: '1week', price: 120 },
                              { id: '1month', price: 325 },
                              { id: '3month', price: 800 },
                              { id: '12month', price: 2450 }
                            ].find(p => p.id === selectedSubscription)?.price || 325
                          }&cu=INR`}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mb-6 shadow-md"
                      >
                        Open {selectedUpiApp.name}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>

                      <hr className="w-full border-slate-200 dark:border-slate-800 mb-4" />

                      <div className="w-full text-left">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                          Enter 12-Digit UTR / Ref Number
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. 312345678901" 
                          maxLength={12}
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white"
                        />
                        {utrError && <p className="text-red-500 text-xs mt-1">{utrError}</p>}
                        
                        <button
                          onClick={async () => {
                            if(utrNumber.length !== 12) {
                              setUtrError('Please enter a valid 12-digit UTR number');
                              return;
                            }
                            setUtrError('');
                            setUpiPaymentStep('verifying');
                            
                            // Simulate a backend API call to verify UTR
                            setTimeout(() => {
                              // In a real integration, the backend would call a payment provider API to check this UTR.
                              // Without KYC/Payment Gateway APIs, it's impossible to verify instantly.
                              if (utrNumber === '123456789012') {
                                // Test successful UTR
                                setUpiPaymentStep('success');
                                setTimeout(() => {
                                  setIsPremium(true);
                                  localStorage.setItem('rimpa_premium', 'true');
                                  setShowUpiGateway(false);
                                  setShowPaymentModal(false);
                                  triggerConfetti();
                                }, 2000);
                              } else {
                                // Random UTRs fail
                                setUpiPaymentStep('scan'); // Go back to scan step
                                setUtrError('UTR Verification Failed: Transaction not found. Please ensure payment is completed and enter the correct 12-digit UTR.');
                              }
                            }, 2500);
                          }}
                          disabled={utrNumber.length === 0}
                          className="w-full py-3 mt-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                        >
                          Verify Payment
                        </button>
                      </div>
                    </motion.div>
                  )}
                  {upiPaymentStep === 'verifying' && (
                    <motion.div 
                      key="verifying"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center justify-center py-12"
                    >
                      <div className="w-16 h-16 relative bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                         <span className="w-8 h-8 block rounded-full bg-blue-500 animate-ping opacity-75 absolute"></span>
                         <RefreshCw className="w-8 h-8 text-blue-500 animate-spin relative z-10" />
                      </div>
                      <p className="mt-2 font-bold text-slate-700 dark:text-slate-300">Verifying UTR...</p>
                      <p className="text-xs text-slate-500 mt-1">Please wait while we confirm</p>
                    </motion.div>
                  )}
                  {upiPaymentStep === 'success' && (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12"
                    >
                      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="font-bold text-green-600 dark:text-green-400 text-lg">Payment Verified</p>
                      <p className="text-xs text-slate-500 mt-2">Upgrading to premium...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Email Modal */}
      <AnimatePresence>
        {showCustomEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowCustomEmailModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="w-8" />
                <h3 className="font-bold text-slate-900 dark:text-white">{t('create_new_address')}</h3>
                <button onClick={() => setShowCustomEmailModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto">
                <div className="flex gap-2 mb-6">
                  <input 
                    type="text" 
                    placeholder={t('enter_name')}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 outline-none focus:border-[#00a859] dark:text-white"
                  />
                  <button 
                    onClick={() => {
                      const randomStr = Math.random().toString(36).substring(2, 10);
                      setCustomName(randomStr);
                    }}
                    className="px-6 py-3 rounded-xl font-medium transition-colors bg-[#e6f6ed] text-[#00a859] hover:bg-[#d1f0df]"
                  >
                    {t('generate')}
                  </button>
                </div>

                <div className="text-center font-bold text-slate-900 dark:text-white mb-4">
                  {t('choose_domain')}
                </div>

                <button 
                  onClick={() => {
                    if (!isPremium) return;
                    const domains = (availableDomains || []).map(d => '@' + d);
                    if (domains.length > 0) {
                      setSelectedPremiumDomain(domains[Math.floor(Math.random() * domains.length)]);
                    }
                  }}
                  disabled={!isPremium}
                  className={`w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium py-3 rounded-xl flex items-center justify-center gap-2 mb-6 transition-colors ${!isPremium ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  <Shuffle className="w-4 h-4" />
                  {t('random')}
                </button>

                <div className="text-sm font-bold text-slate-400 mb-3 px-1">
                  {t('premium')}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(availableDomains || []).map(d => '@' + d).map((domain, i) => (
                    <button 
                      key={i}
                      disabled={!isPremium}
                      onClick={() => setSelectedPremiumDomain(domain)}
                      className={`p-3 rounded-xl text-left text-sm font-medium transition-colors ${
                        !isPremium ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent' :
                        selectedPremiumDomain === domain
                          ? 'bg-[#f0fdf4] border border-[#00a859] text-slate-900 dark:text-white flex justify-between items-center' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent'
                      }`}
                    >
                      {isPremium ? domain : '@*****.com'}
                      {isPremium && selectedPremiumDomain === domain && (
                        <div className="w-4 h-4 rounded-full bg-[#00a859] flex items-center justify-center shrink-0 ml-2">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button 
                  onClick={() => {
                    if (isPremium) {
                      if (customName.length > 0 && selectedPremiumDomain) {
                        generateNewEmail(selectedPremiumDomain.replace('@', ''), customName);
                        setShowCustomEmailModal(false);
                      }
                    } else if (customName.length > 0) {
                      setShowCustomEmailModal(false);
                      setShowPremiumModal(true);
                    }
                  }}
                  className={`w-full relative group overflow-hidden rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    customName.length > 0 && (!isPremium || selectedPremiumDomain)
                      ? '' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  style={{
                    background: 'linear-gradient(to bottom, #22c55e, #16a34a)',
                    border: '2px solid #15803d',
                    borderTopColor: '#4ade80',
                    textShadow: '0 -1px 1px rgba(0,0,0,0.3)'
                  }}
                  disabled={customName.length === 0 || (isPremium && !selectedPremiumDomain)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <div className="py-4 px-6 relative z-10 flex items-center justify-center gap-2">
                    {customName.length === 0 ? t('enter_name') : (!isPremium) ? `${customName}@*****.com` : (!selectedPremiumDomain) ? t('choose_domain') : `${customName}${selectedPremiumDomain}`}
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-[200]" />
      
      </div>
    </div>
  );
}
