import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Sun, Moon, Plus, X, AlignLeft, 
  Settings, User, ChevronRight, Clock, 
  Trash2, Pin, Edit2, MinusCircle, Bell, 
  Check, Image as ImageIcon, AlertCircle, UploadCloud, Sword, MoreVertical,
  Copy, LogOut, Skull, ShieldPlus, BarChart3, LogIn
} from 'lucide-react';

const DYNAMIC_COLORS = [
  { hue: 45, sat: 100, baseL: 55, text: 'text-amber-950' },   
  { hue: 25, sat: 100, baseL: 55, text: 'text-white' },       
  { hue: 350, sat: 90, baseL: 60, text: 'text-white' },       
  { hue: 270, sat: 80, baseL: 60, text: 'text-white' },       
  { hue: 230, sat: 85, baseL: 60, text: 'text-white' },       
  { hue: 210, sat: 90, baseL: 55, text: 'text-white' },       
  { hue: 190, sat: 95, baseL: 45, text: 'text-white' },       
  { hue: 170, sat: 85, baseL: 40, text: 'text-white' },       
];

const FORGOTTEN_COLOR = { hue: 215, sat: 15, baseL: 40, text: 'text-slate-100' };

const AVATARS = [
  '/pfp1.jpeg',
  '/pfp2.jpeg',
  '/pfp3.jpeg',
  '/pfp4.jpeg'
];

export default function App() {
  // --- AUTH & INTRO STATE ---
  const [currentView, setCurrentView] = useState('splash');
  const [introStage, setIntroStage] = useState(0); 
  const [theme, setTheme] = useState('night'); 

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('workflow_user');
    return saved ? JSON.parse(saved) : { 
      name: 'Guest Explorer', 
      email: 'Temporary session', 
      avatar: AVATARS[0], 
      isGuest: true 
    };
  });
  
  const [points, setPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState(() => {
    // Generate dummy data for the graph (last 7 days)
    const history = [];
    const today = new Date();
    for(let i=6; i>=0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const dayNum = d.getDate();
      history.push({ label: `${dayName} ${dayNum}`, value: Math.floor(Math.random() * 50) + 10 });
    }
    return history;
  });

  // --- BOARDS & TASKS ---
  const [boards, setBoards] = useState([{ id: 'b1', name: 'Main Board', isPinned: true, rowCount: 5 }]);
  const [activeBoardId, setActiveBoardId] = useState('b1');
  const [boardMenuOpen, setBoardMenuOpen] = useState(null);

  const [tasks, setTasks] = useState([
    { id: 't1', boardId: 'b1', title: 'Title', subtitle: 'Sub title', description: 'Description', rowId: 1, reminder: null },
  ]);
  const [deletedTasks, setDeletedTasks] = useState([]);

  // --- UI STATE ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [graveyardOpen, setGraveyardOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeModal, setActiveModal] = useState(null); 
  const [notificationBanner, setNotificationBanner] = useState('');
  
  // Header scroll tracking
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // --- DRAG & DROP ---
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [grayGhostId, setGrayGhostId] = useState(null); 
  const [dragOverTaskId, setDragOverTaskId] = useState(null); 
  const [draggedRowId, setDraggedRowId] = useState(null);
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);
  
  // --- ANIMATIONS ---
  const [slashingTask, setSlashingTask] = useState(null);
  const [animatingTasks, setAnimatingTasks] = useState([]); 
  const [completedTasks, setCompletedTasks] = useState([]); 
  const [flyingCoins, setFlyingCoins] = useState([]);
  const angelRef = useRef(null);

  const activeBoard = boards.find(b => b.id === activeBoardId) || boards[0];

  // 1. Preload images
  useEffect(() => {
    ['/night01.jpg', '/day01.jpg', ...AVATARS].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // 2. Scroll Lock for Background when Modals are open
  useEffect(() => {
    if (activeModal || editingTask || slashingTask || graveyardOpen || sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [activeModal, editingTask, slashingTask, graveyardOpen, sidebarOpen]);

  // 3. Header Scroll Direction Logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(false); // Hide slowly when scrolling UP
      } else {
        setIsHeaderVisible(true); // Show when scrolling DOWN
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // 4. Row Cascade Logic
  useEffect(() => {
    if (tasks.length === 0) return;
    let tasksChanged = false;
    let newTasks = [...tasks];
    
    for (let i = 1; i <= activeBoard.rowCount; i++) {
      const rowTasks = newTasks.filter(t => t.boardId === activeBoardId && t.rowId === i);
      if (rowTasks.length === 0) {
        const tasksBelow = newTasks.filter(t => t.boardId === activeBoardId && typeof t.rowId === 'number' && t.rowId > i);
        if (tasksBelow.length > 0) {
          newTasks = newTasks.map(t => {
            if (t.boardId === activeBoardId && typeof t.rowId === 'number' && t.rowId > i) {
              return { ...t, rowId: t.rowId - 1 };
            }
            return t;
          });
          tasksChanged = true;
          break;
        }
      }
    }
    if (tasksChanged) setTasks(newTasks);
  }, [tasks, activeBoardId, activeBoard.rowCount]);

  const triggerNotification = (msg) => {
    if(typeof msg !== 'string') return;
    setNotificationBanner(msg);
    setTimeout(() => setNotificationBanner(''), 3500);
  };

  // --- HANDLERS ---
  const handleSplashClick = () => {
    if (introStage === 0) {
      const isLoggedIn = localStorage.getItem('workflow_auth') === 'true';
      if (isLoggedIn) {
        setCurrentView('main');
      } else {
        setIntroStage(1);
      }
    }
  };

  const handleEnterApp = (e, isGuest = false) => {
    e.stopPropagation();
    const profile = {
      ...userProfile, 
      isGuest,
      name: isGuest ? 'Guest Explorer' : 'Google User',
      email: isGuest ? 'Temporary session' : 'google.user@example.com'
    };
    setUserProfile(profile);
    localStorage.setItem('workflow_auth', 'true');
    localStorage.setItem('workflow_user', JSON.stringify(profile));
    setCurrentView('main');
  };

  const handleSignOut = () => {
    localStorage.removeItem('workflow_auth');
    localStorage.removeItem('workflow_user');
    setCurrentView('splash');
    setIntroStage(0);
    setSidebarOpen(false);
  };

  const handleCreateTask = () => {
    setEditingTask({
      id: 'task_' + Date.now(), 
      boardId: activeBoardId,
      title: 'Title', 
      subtitle: 'Sub title', 
      description: 'Description',
      rowId: 'forgotten', 
      reminder: null, 
      isNew: true
    }); 
  };

  const handleDuplicateTask = (task) => {
    setTasks(prev => [...prev, { ...task, id: 'task_' + Date.now() }]);
    triggerNotification('Card Duplicated');
  };

  const handleSaveTask = (updatedTask) => {
    if (!updatedTask.title.trim()) {
      triggerNotification('Please enter a title');
      return;
    }
    setTasks(prev => {
      const exists = prev.find(t => t.id === updatedTask.id);
      const cleanTask = { ...updatedTask };
      delete cleanTask.isNew;
      if (exists) return prev.map(t => t.id === cleanTask.id ? cleanTask : t);
      return [cleanTask, ...prev]; 
    });
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete) {
      setDeletedTasks(prev => [{ ...taskToDelete, deletedAt: Date.now() }, ...prev]);
    }
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (editingTask?.id === taskId) setEditingTask(null);
  };

  const handleRestoreTask = (task) => {
    setDeletedTasks(prev => prev.filter(t => t.id !== task.id));
    const restored = { ...task };
    delete restored.deletedAt;
    setTasks(prev => [...prev, restored]);
    triggerNotification('Angel restored your card!');
  };

  const spawnFlyingCoins = () => {
    const rect = angelRef.current?.getBoundingClientRect();
    if (!rect) return;
    const newCoins = Array.from({ length: 5 }).map((_, i) => ({
      id: Date.now() + i,
      targetX: rect.left + rect.width / 2,
      targetY: rect.top + rect.height / 2
    }));
    setFlyingCoins(newCoins);
    setTimeout(() => setFlyingCoins([]), 1000);
  };

  const handleCompleteTask = () => {
    if (!slashingTask) return;
    
    let earnedPoints = 1;
    if (slashingTask.rowId !== 'forgotten') {
      earnedPoints = Math.max(10 - 2 * (parseInt(slashingTask.rowId) - 1), 1);
    }
    
    spawnFlyingCoins();
    
    setTimeout(() => {
      setPoints(p => p + earnedPoints);
      triggerNotification(`+${earnedPoints} Points!`);
    }, 600); // add points when coins arrive

    setAnimatingTasks(prev => [...prev, slashingTask.id]);
    setCompletedTasks(prev => [{ ...slashingTask, earnedPoints, completedAt: Date.now() }, ...prev]);
    setSlashingTask(null);

    setTimeout(() => {
      setTasks(prev => prev.filter(t => t.id !== slashingTask.id));
      setAnimatingTasks(prev => prev.filter(id => id !== slashingTask.id));
    }, 600);
  };

  const handleUndoTask = (completedTask) => {
    setPoints(p => Math.max(0, p - completedTask.earnedPoints));
    setCompletedTasks(prev => prev.filter(t => t.id !== completedTask.id));
    const restoredTask = { ...completedTask };
    delete restoredTask.earnedPoints;
    delete restoredTask.completedAt;
    if (typeof restoredTask.rowId === 'number' && restoredTask.rowId > activeBoard.rowCount) {
      restoredTask.rowId = activeBoard.rowCount;
    }
    setTasks(prev => [...prev, restoredTask]);
    triggerNotification('Task restored to board!');
  };

  const handleDragStartTask = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setGrayGhostId(taskId);
    setTimeout(() => setDraggedTaskId(taskId), 10);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setGrayGhostId(null);
    setDraggedRowId(null);
    setDragOverTaskId(null);
    setIsHoveringTrash(false);
  };

  const handleDropOnRow = (e, targetRowId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const taskId = e.dataTransfer.getData('text/plain');
    const sourceRowId = e.dataTransfer.getData('text/rowId');

    if (taskId && taskId.startsWith('t')) {
      setTasks(prev => {
        let newTasks = [...prev];
        const taskIdx = newTasks.findIndex(t => t.id === taskId);
        if (taskIdx > -1) {
          const draggedTask = { ...newTasks[taskIdx], rowId: targetRowId };
          newTasks.splice(taskIdx, 1);
          if (dragOverTaskId) {
            const targetIdx = newTasks.findIndex(t => t.id === dragOverTaskId);
            if (targetIdx > -1) newTasks.splice(targetIdx, 0, draggedTask);
            else newTasks.push(draggedTask);
          } else {
            newTasks.push(draggedTask);
          }
        }
        return newTasks;
      });
    }
    handleDragEnd();
  };

  const handleAddRow = () => {
    if (activeBoard.rowCount >= DYNAMIC_COLORS.length) return;
    setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, rowCount: b.rowCount + 1 } : b));
  };

  const handleRemoveRow = () => {
    if (activeBoard.rowCount <= 1) return;
    const oldRowCount = activeBoard.rowCount;
    const newRowCount = oldRowCount - 1;
    setTasks(prev => prev.map(t => {
      if (t.boardId === activeBoardId && t.rowId === oldRowCount) return { ...t, rowId: newRowCount };
      return t;
    }));
    setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, rowCount: newRowCount } : b));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setUserProfile(prev => ({ ...prev, avatar: URL.createObjectURL(file) }));
  };
  // --- RENDERING ---

  // SPLASH & AUTH SCREENS (Gradient Background)
  if (currentView === 'splash') {
    return (
      <div 
        onClick={handleSplashClick}
        className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 overflow-hidden select-none cursor-pointer bg-gradient-to-br from-indigo-900 via-purple-900 to-amber-900"
      >
        {/* Animated background overlay */}
        <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>

        <div className={`flex flex-col items-center text-center max-w-md w-full z-10 transition-all duration-1000 ease-in-out ${introStage > 0 ? '-translate-y-32' : ''}`}>
          <div className={`relative mb-6 transition-all duration-1000 ease-in-out ${introStage > 0 ? 'scale-125 translate-y-[-10px] shadow-[0_0_100px_rgba(251,191,36,0.8)]' : 'shadow-[0_10px_35px_rgba(251,191,36,0.4)] animate-bounce'} w-28 h-28 rounded-3xl bg-gradient-to-tr from-amber-300 to-yellow-100 flex items-center justify-center border-4 border-amber-200`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-800 drop-shadow">
              <path d="M7 6l2 3 3-4 3 4 2-3v4H7z" fill="currentColor"/>
              <circle cx="12" cy="12" r="3" />
              <path d="M8 21v-3a4 4 0 0 1 8 0v3" />
              <path d="M7 13c-4 0-6 2-4 5 1 2 2 1 2-1" />
              <path d="M17 13c4 0 6 2 4 5-1 2-2 1-2-1" />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-md mb-2 text-white">WorkFlow</h1>
          
          {introStage === 0 && (
            <p className="text-amber-200 font-bold tracking-wider uppercase text-sm sm:text-base mt-8 animate-pulse drop-shadow-md">
              Tap anywhere to start
            </p>
          )}

          <div className={`w-full space-y-6 px-2 absolute top-1/2 left-1/2 -translate-x-1/2 transition-all duration-1000 ${introStage > 0 ? 'opacity-100 translate-y-32' : 'opacity-0 translate-y-48 pointer-events-none'}`}>
            <button onClick={(e) => handleEnterApp(e, false)} className="w-full py-4 px-6 rounded-2xl bg-white text-stone-900 font-bold text-base shadow-xl hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button onClick={(e) => handleEnterApp(e, true)} className="w-full mt-4 py-4 px-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm backdrop-blur-md active:scale-95 transition-all flex items-center justify-center gap-2">
              <User size={18} />
              <span>Enter as Guest</span>
            </button>

            <div className="flex flex-col items-center justify-center gap-1.5 text-[11px] text-amber-100/70 pt-3 leading-relaxed text-center px-4">
              <span className="flex items-center gap-1 font-bold text-amber-300"><AlertCircle size={12} /> Privacy Warning</span>
              <span>Guest mode runs entirely in this browser. If you clear your history or lose this device, your tasks and progress will vanish permanently.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN APP VIEW
  return (
    <div className={`relative min-h-screen w-full flex overflow-x-hidden ${theme === 'night' ? 'text-slate-100' : 'text-stone-900'} transition-colors duration-500 font-sans`}>
      
      {/* Background Layers */}
      <div className="fixed inset-0 w-screen h-screen pointer-events-none z-0 overflow-hidden">
        <div className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out ${theme === 'night' ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url('/night01.jpg')` }}>
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out ${theme === 'day' ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url('/day01.jpg')` }}>
          <div className="absolute inset-0 bg-white/10" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes split-top { 0% { transform: translateY(0) rotate(0); opacity: 1; } 100% { transform: translateY(-40px) rotate(-15deg); opacity: 0; } }
        @keyframes split-bottom { 0% { transform: translateY(0) rotate(0); opacity: 1; } 100% { transform: translateY(40px) rotate(15deg); opacity: 0; } }
        .anim-split-top { animation: split-top 0.6s ease-out forwards; clip-path: polygon(0 0, 100% 0, 100% 50%, 0 45%); }
        .anim-split-bottom { animation: split-bottom 0.6s ease-out forwards; clip-path: polygon(0 45%, 100% 50%, 100% 100%, 0 100%); }
        .broken-bottom { clip-path: polygon(0 0, 100% 0, 100% 90%, 95% 100%, 85% 90%, 75% 100%, 65% 90%, 55% 100%, 45% 90%, 35% 100%, 25% 90%, 15% 100%, 5% 90%, 0 100%); }
        
        @keyframes fly-to-angel {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; left: 50vw; top: 50vh; }
          100% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; left: var(--tx); top: var(--ty); }
        }
        .coin-anim { animation: fly-to-angel 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
      `}} />

      {/* Flying Coins Animation */}
      {flyingCoins.map((coin, index) => (
        <div key={coin.id} className="fixed z-[100] coin-anim w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center border-2 border-yellow-100 shadow-[0_0_20px_rgba(251,191,36,0.8)]"
             style={{ '--tx': `${coin.targetX}px`, '--ty': `${coin.targetY}px`, animationDelay: `${index * 0.05}s` }}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-yellow-900"><path d="M7 6l2 3 3-4 3 4 2-3v4H7z" fill="currentColor"/></svg>
        </div>
      ))}

      {notificationBanner && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium flex items-center gap-2 animate-bounce">
          <Bell size={16} className="text-amber-400" />
          <span>{notificationBanner}</span>
        </div>
      )}

      {/* SIDEBAR */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] ${theme === 'night' ? 'bg-[#0f1429] border-slate-800 text-slate-100' : 'bg-white/90 backdrop-blur-xl border-stone-200 text-stone-900'} border-r z-50 transform transition-transform duration-300 flex flex-col shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={userProfile.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400 cursor-pointer" onClick={() => setActiveModal('account')} />
            <div className="overflow-hidden">
              <h4 className="font-bold text-sm truncate">{userProfile.name}</h4>
              <p className="text-[11px] opacity-60 truncate">{userProfile.isGuest ? 'Guest Session' : userProfile.email}</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-black/10 text-slate-400"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <button onClick={() => { setActiveModal('account'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium">
            <User size={18} className="text-amber-500" /> <span>Profile / Avatars</span>
          </button>
          <button onClick={() => { setActiveModal('settings'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium">
            <Settings size={18} className="text-emerald-500" /> <span>Settings</span>
          </button>

          <div className="pt-6">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs uppercase font-extrabold tracking-wider opacity-50">Your Boards</span>
              <button onClick={() => setBoards([...boards, { id: 'b_'+Date.now(), name: `Board ${boards.length+1}`, isPinned: false, rowCount: 5 }])} className="text-amber-500 p-1 hover:bg-amber-500/10 rounded-md"><Plus size={16} /></button>
            </div>
            <div className="space-y-1 relative">
              {boards.map((b) => (
                <div key={b.id} className="relative group">
                  <div onClick={() => { setActiveBoardId(b.id); setSidebarOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-all ${activeBoardId === b.id ? (theme === 'night' ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-900') : 'hover:bg-black/5'}`}>
                    <div className="flex items-center gap-2 truncate">
                      {b.isPinned && <Pin size={13} className="text-amber-400 rotate-45 shrink-0" />}
                      <span className="truncate">{b.name}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setBoardMenuOpen(boardMenuOpen === b.id ? null : b.id); }} className="p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/10"><MoreVertical size={16} /></button>
                  </div>
                  {boardMenuOpen === b.id && (
                    <div className={`absolute right-2 top-11 z-50 w-36 rounded-xl shadow-xl border p-1 text-xs ${theme === 'night' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-stone-200 text-stone-900'}`}>
                      <button onClick={() => { const nm = prompt('Rename:', b.name); if(nm) setBoards(prev => prev.map(item => item.id === b.id ? { ...item, name: nm } : item)); setBoardMenuOpen(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/5 flex items-center gap-2"><Edit2 size={13} /> <span>Rename</span></button>
                      <button onClick={() => { setBoards(prev => prev.map(item => item.id === b.id ? { ...item, isPinned: !item.isPinned } : item)); setBoardMenuOpen(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/5 flex items-center gap-2"><Pin size={13} /> <span>{b.isPinned ? 'Unpin' : 'Pin'}</span></button>
                      <button onClick={() => { if(boards.length > 1) { setBoards(bds => bds.filter(x => x.id !== b.id)); setActiveBoardId(boards[0].id); } setBoardMenuOpen(null); }} className="w-full text-left px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-500/10 flex items-center gap-2"><Trash2 size={13} /> <span>Delete</span></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sign Out / Sign In Buttons in Sidebar */}
        <div className="p-4 border-t border-inherit space-y-2">
           {userProfile.isGuest && (
             <button onClick={() => { handleSignOut(); }} className="w-full flex items-center justify-center gap-3 px-3 py-3 rounded-xl text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors text-sm font-bold">
               <LogIn size={18} /> <span>Sign In / Up</span>
             </button>
           )}
           <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-3 px-3 py-3 rounded-xl text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-colors text-sm font-bold">
             <LogOut size={18} /> <span>{userProfile.isGuest ? 'Exit Guest Mode' : 'Sign Out'}</span>
           </button>
        </div>
      </aside>

      {/* HEADER (Sticky & Scroll Responsive) */}
      <header className={`fixed top-0 w-full z-30 px-4 sm:px-6 py-3 flex items-center justify-between backdrop-blur-md bg-black/10 transition-transform duration-500 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className={`p-2 rounded-xl active:scale-95 transition-all ${theme === 'night' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-stone-900'}`}>
            <AlignLeft size={22} />
          </button>
          {/* Graph Trigger */}
          <button onClick={() => setActiveModal('graph')} className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-1.5 rounded-full border border-amber-500/30 backdrop-blur-md shadow-sm hover:scale-105 transition-transform cursor-pointer">
            <BarChart3 size={16} className="text-amber-400" />
            <span className="font-black text-amber-500 text-sm tracking-wide">{points} pts</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setGraveyardOpen(true)} className={`p-2.5 rounded-xl border transition-colors shadow-md ${theme === 'night' ? 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white' : 'bg-white/80 border-stone-300 text-stone-600 hover:bg-white hover:text-stone-900'}`}>
             <Skull size={20} />
          </button>

          {/* HORIZONTAL ADD BUTTON */}
          <button onClick={handleCreateTask} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-300 hover:to-rose-300 text-white shadow-lg active:scale-95 transition-all flex items-center gap-2 border-2 border-white/20 font-black text-sm">
            <Plus size={18} strokeWidth={3} />
            <span className="hidden sm:inline">Add Card</span>
          </button>
        </div>
      </header>

      {/* MAIN LEADERBOARD BODY */}
      {/* pr-28 ensures tasks don't get hidden under the persistent right-side bin */}
      <div className="relative z-10 flex-1 flex flex-col min-h-screen pt-20 pr-20 sm:pr-28">
        <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 pb-36 relative">
          <div className="flex items-start gap-3 sm:gap-6 relative">
            
            {/* CENTRAL LEADERBOARD SPINE & ANGEL */}
            <div className="flex flex-col items-center shrink-0 select-none relative z-10 pt-2">
              {/* Angel Trigger Ref */}
              <div 
                ref={angelRef}
                onClick={() => setActiveModal('treasure')}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center shadow-[0_4px_20px_rgba(245,158,11,0.5)] border-2 border-yellow-100 z-10 relative cursor-pointer hover:scale-110 active:scale-95 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-900">
                  <path d="M7 6l2 3 3-4 3 4 2-3v4H7z" fill="currentColor"/>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M8 21v-3a4 4 0 0 1 8 0v3" />
                  <path d="M7 13c-4 0-6 2-4 5 1 2 2 1 2-1" />
                  <path d="M17 13c4 0 6 2 4 5-1 2-2 1-2-1" />
                </svg>
              </div>

              <div 
                className="w-3.5 sm:w-4 rounded-full -mt-4 shadow-inner bg-gradient-to-b from-amber-400 via-rose-500 via-purple-600 via-blue-600 to-cyan-500 transition-all duration-300 z-0 relative"
                style={{ height: `${(activeBoard.rowCount * 95) + 30}px` }}
              />

              <div className="flex flex-col items-center gap-1.5 pt-2 relative z-10">
                <button onClick={handleAddRow} className={`w-8 h-8 rounded-full flex items-center justify-center border hover:scale-110 active:scale-90 transition-all ${theme === 'night' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-amber-100 border-amber-300 text-amber-700'}`}><Plus size={16} strokeWidth={2.5} /></button>
                {activeBoard.rowCount > 1 && <button onClick={handleRemoveRow} className={`w-8 h-8 rounded-full flex items-center justify-center border hover:scale-110 active:scale-90 transition-all ${theme === 'night' ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-rose-100 border-rose-300 text-rose-700'}`}><MinusCircle size={16} /></button>}
              </div>
            </div>

            {/* TASK ROWS */}
            <div className="flex-1 flex flex-col pt-12 space-y-1">
              {Array.from({ length: activeBoard.rowCount }).map((_, idx) => {
                const rowId = idx + 1;
                const rowStyle = DYNAMIC_COLORS[Math.min(idx, DYNAMIC_COLORS.length - 1)];
                const rowTasks = tasks.filter(t => t.boardId === activeBoardId && t.rowId === rowId);

                return (
                  <div key={rowId} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropOnRow(e, rowId)}
                    className="min-h-[90px] flex items-stretch py-1.5 transition-all duration-300 border border-transparent rounded-2xl group"
                  >
                    <div className="flex-1 flex flex-wrap gap-2 sm:gap-3 items-center min-h-[75px] pl-2 sm:pl-3 relative">
                      {rowTasks.map((task, index) => (
                        <TaskCard 
                          key={task.id} task={task} colorObj={rowStyle}
                          index={index}
                          isDragged={draggedTaskId === task.id}
                          isGrayGhost={grayGhostId === task.id}
                          isDragOver={dragOverTaskId === task.id}
                          isAnimating={animatingTasks.includes(task.id)}
                          onClick={() => setEditingTask(task)}
                          onSlash={() => setSlashingTask(task)}
                          onDuplicate={(e) => { e.stopPropagation(); handleDuplicateTask(task); }}
                          onDragStart={handleDragStartTask}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (draggedTaskId && draggedTaskId !== task.id) setDragOverTaskId(task.id); }}
                          onDragEnd={handleDragEnd}
                        />
                      ))}
                    </div>
                    <div draggable onDragStart={(e) => handleDragStartRow(e, rowId)} onDragEnd={handleDragEnd} className="w-8 shrink-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-40 hover:!opacity-100 cursor-grab px-2 transition-opacity">
                      <div className="flex gap-1 mb-1"><div className="w-1 h-1 rounded-full bg-current"/><div className="w-1 h-1 rounded-full bg-current"/></div>
                      <div className="flex gap-1 mb-1"><div className="w-1 h-1 rounded-full bg-current"/><div className="w-1 h-1 rounded-full bg-current"/></div>
                      <div className="flex gap-1"><div className="w-1 h-1 rounded-full bg-current"/><div className="w-1 h-1 rounded-full bg-current"/></div>
                    </div>
                  </div>
                );
              })}

              {/* NO PRIORITY */}
              <div className="mt-8 pt-4">
                <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropOnRow(e, 'forgotten')} className={`rounded-3xl p-4 sm:p-5 border-2 border-dashed transition-all ${theme === 'night' ? 'bg-slate-900/40 border-slate-600/50' : 'bg-white/40 border-stone-300/60'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                      <h3 className={`text-xs uppercase font-extrabold tracking-widest ${theme === 'night' ? 'text-slate-300' : 'text-stone-600'}`}>No Priority</h3>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3 items-center min-h-[90px]">
                    {tasks.filter(t => t.boardId === activeBoardId && t.rowId === 'forgotten').map((task, index) => (
                      <TaskCard key={task.id} task={task} colorObj={FORGOTTEN_COLOR} index={index} 
                        isDragged={draggedTaskId === task.id} 
                        isGrayGhost={grayGhostId === task.id}
                        isDragOver={dragOverTaskId === task.id} 
                        isAnimating={animatingTasks.includes(task.id)} 
                        onClick={() => setEditingTask(task)} 
                        onSlash={() => setSlashingTask(task)} 
                        onDuplicate={(e) => { e.stopPropagation(); handleDuplicateTask(task); }}
                        onDragStart={handleDragStartTask} 
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (draggedTaskId && draggedTaskId !== task.id) setDragOverTaskId(task.id); }} 
                        onDragEnd={handleDragEnd}/>
                    ))}
                    {tasks.filter(t => t.boardId === activeBoardId && t.rowId === 'forgotten').length === 0 && <div className="w-full text-center py-4 opacity-50 text-xs italic">Drag tasks here to remove priority</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* PERMANENT RIGHT-SIDE TRASH ZONE */}
      <div 
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsHoveringTrash(true); }}
        onDragLeave={() => setIsHoveringTrash(false)}
        onDrop={(e) => { e.preventDefault(); if(draggedTaskId) handleDeleteTask(draggedTaskId); handleDragEnd(); }}
        className={`fixed right-0 top-0 w-20 sm:w-28 h-full z-20 flex flex-col items-center justify-center transition-all border-l border-white/10 ${isHoveringTrash ? 'bg-rose-600/40 backdrop-blur-md' : 'bg-black/20 backdrop-blur-sm hover:bg-black/30'}`}
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${isHoveringTrash ? 'bg-rose-500 text-white scale-125 shadow-[0_0_30px_rgba(244,63,94,0.8)]' : 'bg-transparent text-white/30 border-2 border-white/20'}`}>
          <Trash2 size={isHoveringTrash ? 28 : 24} className={isHoveringTrash ? 'animate-pulse' : ''} />
        </div>
        <span className="uppercase text-[10px] font-black tracking-widest text-white/30 mt-4 rotate-90 sm:rotate-0 sm:mt-6 text-center">Drop<br className="hidden sm:block"/>to Bin</span>
      </div>

      {/* GRAVEYARD PANEL */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${graveyardOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setGraveyardOpen(false)} />
      <aside className={`fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-zinc-950 border-l border-zinc-800 text-zinc-300 z-50 transform transition-transform duration-300 flex flex-col shadow-2xl ${graveyardOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <Skull size={24} className="text-zinc-500" />
            <h2 className="font-black text-lg tracking-widest uppercase text-zinc-400">Graveyard</h2>
          </div>
          <button onClick={() => setGraveyardOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {deletedTasks.length === 0 && (
             <div className="flex flex-col items-center justify-center opacity-40 mt-10">
               <Skull size={48} className="mb-4" />
               <p className="text-center text-sm font-bold">No spirits wander here.</p>
             </div>
          )}

          {deletedTasks.map((t) => (
            <div key={t.id} className="relative w-full h-[85px] bg-zinc-800 border-2 border-zinc-700 p-3 flex flex-col justify-between text-zinc-400 broken-bottom overflow-hidden shadow-black shadow-inner">
               <div className="flex justify-between items-start">
                 <h4 className="font-black text-sm truncate w-[70%] text-zinc-300 line-through">{t.title}</h4>
                 <button 
                   onClick={() => handleRestoreTask(t)} 
                   className="flex items-center gap-1 text-[10px] uppercase font-bold text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded hover:bg-cyan-800/50 border border-cyan-800 transition-colors z-10 relative"
                 >
                   <ShieldPlus size={12} /> Restore
                 </button>
               </div>
               <p className="text-[11px] opacity-70 truncate">{t.subtitle}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* SWORD TASK SLASH CONFIRMATION */}
      {slashingTask && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSlashingTask(null)} />
          <div className={`relative w-full max-w-sm ${theme === 'night' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-stone-200 text-stone-900'} p-6 rounded-3xl shadow-2xl border flex flex-col items-center text-center animate-in zoom-in-95 duration-200`}>
            <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mb-4">
              <Sword size={32} strokeWidth={2} />
            </div>
            <h3 className="font-black text-xl mb-2">Have you completed this task?</h3>
            <p className="text-sm opacity-70 mb-6 px-4">"{slashingTask.title || 'Untitled Task'}"</p>
            
            <div className="flex w-full gap-3">
              <button onClick={() => setSlashingTask(null)} className="flex-1 py-3 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 font-bold rounded-xl text-sm transition-colors text-slate-600 dark:text-slate-300">
                Not Yet
              </button>
              <button onClick={handleCompleteTask} className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-amber-950 font-black rounded-xl text-sm shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all flex items-center justify-center gap-2">
                <Check size={18} strokeWidth={3} /> Yes!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TASK EDIT DRAWER (With Actual Calendar Picker) */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => { if(!editingTask.isNew) setEditingTask(null); else handleDeleteTask(editingTask.id); }} />
          <div className={`relative w-full md:w-1/2 h-full max-h-[92vh] md:max-h-full ${theme === 'night' ? 'bg-[#0f1429] text-slate-100' : 'bg-white text-stone-900'} shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto rounded-t-3xl md:rounded-t-none md:rounded-l-3xl border-l border-slate-700/30 animate-in slide-in-from-bottom md:slide-in-from-right duration-300`}>
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-500/20 mb-6">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${editingTask.rowId === 'forgotten' ? 'bg-slate-500/20 text-slate-400' : 'bg-amber-500/20 text-amber-500'}`}>
                    {editingTask.rowId === 'forgotten' ? 'No Priority' : `In Priority Row`}
                  </span>
                </div>
                <button onClick={() => { if(editingTask.isNew) handleDeleteTask(editingTask.id); else setEditingTask(null); }} className="p-2 rounded-full hover:bg-black/10 text-slate-400"><X size={20} /></button>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1"><label className="text-xs uppercase font-extrabold opacity-50">Title</label><span className="text-[11px] opacity-50">{editingTask.title.length}/20</span></div>
                <input type="text" maxLength={20} value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} placeholder="Title" className="w-full text-2xl font-black bg-transparent border-b-2 border-slate-500/30 focus:border-amber-500 focus:outline-none py-1.5 transition-colors"/>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-1"><label className="text-xs uppercase font-extrabold opacity-50">Sub Title</label><span className="text-[11px] opacity-50">{(editingTask.subtitle || '').length}/50</span></div>
                <input type="text" maxLength={50} value={editingTask.subtitle || ''} onChange={(e) => setEditingTask({ ...editingTask, subtitle: e.target.value })} placeholder="Sub Title" className="w-full text-sm font-semibold bg-transparent border-b border-slate-500/30 focus:border-amber-500 focus:outline-none py-1.5 transition-colors"/>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs uppercase font-extrabold opacity-50">Description</label>
                </div>
                <textarea rows={6} value={editingTask.description || ''} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} placeholder="Description..." className={`w-full p-4 rounded-2xl bg-black/5 border border-slate-500/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm leading-relaxed resize-none ${theme === 'night' ? 'placeholder-slate-500 text-white' : 'placeholder-stone-400 text-stone-900'}`}/>
              </div>

              {/* Actual Calendar Input */}
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
                 <label className="flex items-center gap-2 text-xs font-bold text-blue-500 mb-2 uppercase tracking-wide">
                   <Clock size={14}/> Set Reminder Date & Time
                 </label>
                 <input 
                   type="datetime-local" 
                   value={editingTask.reminder || ''} 
                   onChange={(e) => setEditingTask({...editingTask, reminder: e.target.value})} 
                   className={`w-full bg-black/10 dark:bg-black/20 p-2.5 rounded-lg text-sm font-medium outline-none border border-transparent focus:border-blue-500 text-blue-500 cursor-pointer ${theme === 'night' ? 'color-scheme-dark' : ''}`}
                 />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-500/20">
              <button onClick={() => handleDeleteTask(editingTask.id)} className="p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors" title="Delete Task">
                <Trash2 size={20} />
              </button>
              
              {!editingTask.isNew && (
                <button onClick={() => { setSlashingTask(editingTask); setEditingTask(null); }} className="p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors shadow-sm border border-amber-500/20 group" title="Complete Task">
                  <Sword size={20} className="group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                </button>
              )}

              <button onClick={() => handleSaveTask(editingTask)} className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-sm shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2"><Check size={18} strokeWidth={2.5} /> <span>Save Card</span></button>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT MODAL WITH AVATAR PICKER */}
      {activeModal === 'account' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className={`relative w-full max-w-md ${theme === 'night' ? 'bg-slate-900 text-white' : 'bg-white text-stone-900'} p-6 rounded-3xl shadow-2xl border border-slate-700/50`}>
            <div className="flex justify-between items-center mb-5"><h3 className="font-extrabold text-lg flex items-center gap-2"><ImageIcon size={20} className="text-amber-500" /> <span>Profile & Avatars</span></h3><button onClick={() => setActiveModal(null)} className="p-1 rounded-lg hover:bg-black/10"><X size={18} /></button></div>
            
            <div className="mb-5 flex flex-col items-center gap-4">
              <img src={userProfile.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover ring-4 ring-amber-500 shadow-xl" />
              
              <div className="w-full">
                <label className="text-xs uppercase font-extrabold opacity-50 mb-2 block text-center">Choose an Avatar</label>
                <div className="flex justify-center gap-3">
                  {AVATARS.map((av, idx) => (
                    <img 
                      key={idx} 
                      src={av} 
                      alt={`Avatar option ${idx + 1}`} 
                      onClick={() => {
                        const newProf = { ...userProfile, avatar: av };
                        setUserProfile(newProf);
                        localStorage.setItem('workflow_user', JSON.stringify(newProf));
                      }}
                      className={`w-12 h-12 rounded-full object-cover cursor-pointer hover:scale-110 transition-all border-2 ${userProfile.avatar === av ? 'ring-2 ring-amber-400 border-white' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>

              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="avatar-upload" />
              <label htmlFor="avatar-upload" className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-black/10 dark:bg-white/10 rounded-xl text-xs font-semibold hover:bg-black/20 dark:hover:bg-white/20 transition-all"><UploadCloud size={16} /> Custom Upload</label>
            </div>
            
            <div className="mb-6"><label className="text-xs uppercase font-extrabold opacity-50 mb-1 block">Display Name</label><input type="text" value={userProfile.name} onChange={(e) => { const newProf = { ...userProfile, name: e.target.value }; setUserProfile(newProf); localStorage.setItem('workflow_user', JSON.stringify(newProf)); }} className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-500/20 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"/></div>
            <button onClick={() => setActiveModal(null)} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-sm">Done</button>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className={`relative w-full max-w-md ${theme === 'night' ? 'bg-slate-900 text-white' : 'bg-white text-stone-900'} p-6 rounded-3xl shadow-2xl border border-slate-700/50`}>
            <div className="flex justify-between items-center mb-5"><h3 className="font-extrabold text-lg flex items-center gap-2"><Settings size={20} className="text-emerald-500" /> <span>Settings</span></h3><button onClick={() => setActiveModal(null)} className="p-1 rounded-lg hover:bg-black/10"><X size={18} /></button></div>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-black/5 dark:bg-white/5">
                <div><h5 className="font-bold text-sm">Theme Mode</h5><p className="text-[11px] opacity-60">Night Sky or Sunrise Cloud</p></div>
                <button onClick={() => setTheme(t => t === 'night' ? 'day' : 'night')} className="p-2.5 rounded-xl bg-black/10 dark:bg-white/10">{theme === 'night' ? <Moon size={18} /> : <Sun size={18} />}</button>
              </div>
            </div>
            <button onClick={() => setActiveModal(null)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm">Close</button>
          </div>
        </div>
      )}

      {/* GRAPH MODAL (Points History) */}
      {activeModal === 'graph' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-2xl h-[70vh] flex flex-col rounded-[2.5rem] shadow-[0_0_100px_rgba(251,191,36,0.5)] overflow-hidden bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-600 border-4 border-amber-200 animate-in zoom-in-95 duration-300">
            
            <div className="flex justify-between items-center p-6 border-b border-white/20 bg-black/20 backdrop-blur-md z-20">
              <h3 className="font-black text-2xl text-white flex items-center gap-3 drop-shadow-md">
                <BarChart3 size={28} />
                Coins Collected
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-2.5 rounded-full hover:bg-white/20 text-white transition-colors"><X size={24} strokeWidth={3} /></button>
            </div>

            <div className="flex-1 p-6 z-20 flex items-end justify-between gap-2 overflow-x-auto">
               {pointsHistory.map((day, idx) => {
                 const maxVal = Math.max(...pointsHistory.map(d => d.value));
                 const heightPercent = maxVal === 0 ? 0 : (day.value / maxVal) * 100;
                 return (
                   <div key={idx} className="flex flex-col items-center justify-end h-full flex-1 min-w-[50px] group">
                      <span className="font-black text-white text-lg mb-2 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">{day.value}</span>
                      <div className="w-full max-w-[40px] bg-white/40 rounded-t-xl hover:bg-white/60 transition-all border-t-2 border-l-2 border-r-2 border-white/50" style={{ height: `${heightPercent}%` }}></div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider mt-4 whitespace-nowrap opacity-80">{day.label}</span>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>
      )}

      {/* PLAIN LIST COMPLETED TASKS (Angel Modal) */}
      {activeModal === 'treasure' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActiveModal(null)} />
          <div className={`relative w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden ${theme === 'night' ? 'bg-[#1a1040] border-amber-500/20 text-white' : 'bg-white border-amber-200 text-stone-900'} border animate-in zoom-in-95 duration-300`}>
            
            <div className={`flex justify-between items-center p-6 border-b ${theme === 'night' ? 'border-amber-500/20 bg-black/20' : 'border-amber-500/10 bg-amber-50/50'}`}>
              <h3 className="font-black text-xl text-amber-500 flex items-center gap-2">
                <Sword size={24} />
                Completed Quests
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-2 rounded-full hover:bg-black/10 transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
               {completedTasks.length === 0 ? (
                 <div className="flex flex-col items-center justify-center opacity-50 py-10">
                    <Sword size={48} className="mb-4 opacity-50" />
                    <p className="font-bold">No completed quests yet.</p>
                 </div>
               ) : (
                 completedTasks.map((ct, idx) => (
                   <div key={idx} className={`flex flex-col p-4 rounded-2xl border ${theme === 'night' ? 'bg-black/20 border-slate-700/50' : 'bg-black/5 border-stone-200'}`}>
                      <h5 className="font-black text-sm">{ct.title || 'Untitled Task'}</h5>
                      <p className="text-xs font-medium opacity-70 mt-1">{ct.subtitle}</p>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// TASK CARD
function TaskCard({ task, colorObj, index = 0, isDragged, isGrayGhost, isDragOver, isAnimating, onClick, onSlash, onDuplicate, onDragStart, onDragOver, onDragEnd }) {
  let bgColor, borderColor, textColor;

  const isHeldGray = isGrayGhost;
  
  if (isHeldGray) {
    bgColor = '#64748b';
    borderColor = '#475569';
    textColor = 'text-white';
  } else if (colorObj.hue !== undefined) {
    const lightness = Math.max(20, colorObj.baseL - (index * 4));
    bgColor = `hsl(${colorObj.hue}, ${colorObj.sat}%, ${lightness}%)`;
    borderColor = `hsl(${colorObj.hue}, ${colorObj.sat}%, ${Math.max(10, lightness - 10)}%)`;
    textColor = lightness > 60 ? 'text-stone-900' : 'text-white';
  } else {
    bgColor = '#1e293b'; 
    borderColor = '#334155';
    textColor = 'text-white';
  }

  if (isAnimating) {
    return (
      <div className="relative w-[170px] h-[75px] shrink-0">
        <div className={`absolute inset-0 rounded-2xl p-2.5 flex flex-col justify-between anim-split-top ${textColor} border-2`} style={{ backgroundColor: bgColor, borderColor: borderColor }}>
           <h4 className="font-black text-sm tracking-tight truncate">{task.title}</h4>
           <p className="text-xs font-semibold opacity-90 truncate">{task.subtitle}</p>
        </div>
        <div className={`absolute inset-0 rounded-2xl p-2.5 flex flex-col justify-between anim-split-bottom ${textColor} border-2`} style={{ backgroundColor: bgColor, borderColor: borderColor }}>
           <h4 className="font-black text-sm tracking-tight truncate">{task.title}</h4>
           <p className="text-xs font-semibold opacity-90 truncate">{task.subtitle}</p>
        </div>
      </div>
    );
  }

  if (isDragged) return <div className="hidden" />;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{ backgroundColor: bgColor, borderColor: borderColor }}
      className={`relative w-[170px] shrink-0 h-[75px] rounded-2xl p-2.5 cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 ease-out flex flex-col justify-between select-none ${textColor} border-2 group ${isDragOver ? 'ml-[180px] scale-95 opacity-80' : 'scale-100'}`}
    >
      <div className="flex items-start justify-between gap-1">
        <h4 className="font-black text-sm tracking-tight truncate w-[60%]">{task.title}</h4>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
          <button onClick={onDuplicate} className="shrink-0 p-1 bg-black/10 hover:bg-black/20 rounded-md transition-colors" title="Duplicate">
            <Copy size={12} className="text-current" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onSlash(task); }} className="shrink-0 p-1 bg-black/10 hover:bg-black/20 rounded-md transition-colors" title="Complete">
            <Sword size={12} className="text-current group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <p className="text-[11px] font-medium opacity-90 truncate w-[80%]">{task.subtitle}</p>
        {task.reminder && <Clock size={12} className="shrink-0 opacity-80" />}
      </div>
    </div>
  );
}

// MOUNT TO ROOT
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
