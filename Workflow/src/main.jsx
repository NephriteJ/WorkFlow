import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Sun, Moon, Plus, X, AlignLeft, 
  Settings, User, Clock, 
  Trash2, Pin, Edit2, MinusCircle, Bell, 
  Check, Image as ImageIcon, AlertCircle, UploadCloud, Sword, MoreVertical,
  Copy, LogOut, Skull, ShieldPlus, BarChart3, LogIn, ChevronUp, ChevronDown, Lock, Unlock
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import DiamondGame from './DiamondGame.jsx';

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyAv1k8euZ6MVfgN1ffQ0vQfXg0GXmt9SPM",
  authDomain: "workflow-3666c.firebaseapp.com",
  projectId: "workflow-3666c",
  storageBucket: "workflow-3666c.firebasestorage.app",
  messagingSenderId: "772308564055",
  appId: "1:772308564055:web:22eed5ff3b2387cc33cb12"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- CONSTANTS ---
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
const AVATARS = ['/pfp1.jpeg', '/pfp2.jpeg', '/pfp3.jpeg', '/pfp4.jpeg'];

// ROBUST LOCAL STORAGE PARSER (Prevents blank screen crashes)
const safeLoad = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed;
  } catch (e) {
    console.error(`Error loading ${key}:`, e);
    return fallback;
  }
};

export default function App() {
  // --- AUTH & INTRO STATE ---
  // Fix: Auto-skip splash screen if auth token is present
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('workflow_auth') === 'true' ? 'main' : 'splash';
  });
  const [introStage, setIntroStage] = useState(0); 
  const [theme, setTheme] = useState('night'); 

  const [userProfile, setUserProfile] = useState(() => safeLoad('workflow_user', { 
    name: 'Guest Explorer', email: 'Temporary session', avatar: AVATARS[0], isGuest: true, googleId: null 
  }));

  // --- BOARDS & TASKS ---
  const [boards, setBoards] = useState([{ id: 'b1', name: 'Main Board', isPinned: true, rowCount: 5 }]);
  const [activeBoardId, setActiveBoardId] = useState('b1');
  const [boardMenuOpen, setBoardMenuOpen] = useState(null);

  const [tasks, setTasks] = useState(() => safeLoad('workflow_tasks', [
    { id: 't1', boardId: 'b1', title: 'Title', subtitle: 'Sub title', description: 'Description', rowId: 1, reminder: null, isLocked: false }
  ]));
  
  const [deletedTasks, setDeletedTasks] = useState(() => safeLoad('workflow_deleted', []));
  const [completedTasks, setCompletedTasks] = useState(() => safeLoad('workflow_completed', []));
  const [showDiamondGame, setShowDiamondGame] = useState(false);

  // --- UI STATE ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [graveyardOpen, setGraveyardOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeModal, setActiveModal] = useState(null); 
  const [notificationBanner, setNotificationBanner] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // --- DRAG & DROP STATE ---
  const [globalDragState, setGlobalDragState] = useState(null); 
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [grayGhostId, setGrayGhostId] = useState(null); 
  const [dragOverTaskId, setDragOverTaskId] = useState(null); 
  const [draggedRowId, setDraggedRowId] = useState(null);
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);
  const [rowDragHoverId, setRowDragHoverId] = useState(null); 
  const [lockedRows, setLockedRows] = useState(() => safeLoad('workflow_locked_rows', []));
  
  const dragTimeoutRef = useRef(null);
  const dragStartTimeoutRef = useRef(null);
  const angelRef = useRef(null);

  const [slashingTask, setSlashingTask] = useState(null);
  const [animatingTasks, setAnimatingTasks] = useState([]); 

  const activeBoard = boards.find(b => b.id === activeBoardId) || boards[0];

  // --- EFFECTS ---
  useEffect(() => { localStorage.setItem('workflow_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('workflow_completed', JSON.stringify(completedTasks)); }, [completedTasks]);
  useEffect(() => { localStorage.setItem('workflow_deleted', JSON.stringify(deletedTasks)); }, [deletedTasks]);
  useEffect(() => { localStorage.setItem('workflow_locked_rows', JSON.stringify(lockedRows)); }, [lockedRows]);

  useEffect(() => {
    if (activeModal || editingTask || slashingTask || graveyardOpen || sidebarOpen || showDiamondGame) {
      document.body.style.overflow = 'hidden';
    } else { document.body.style.overflow = 'auto'; }
    return () => { document.body.style.overflow = 'auto'; };
  }, [activeModal, editingTask, slashingTask, graveyardOpen, sidebarOpen, showDiamondGame]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 10) setIsHeaderVisible(true);
      else if (currentScrollY > lastScrollY) setIsHeaderVisible(false);
      else setIsHeaderVisible(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const triggerNotification = (msg) => {
    if(typeof msg !== 'string') return;
    setNotificationBanner(msg);
    setTimeout(() => setNotificationBanner(''), 3500);
  };
  // --- AUTH & TRANSITION HANDLERS ---
  const handleSplashClick = () => {
    if (introStage === 0) {
      const isLoggedIn = localStorage.getItem('workflow_auth') === 'true';
      if (isLoggedIn) {
        setCurrentView('transitioning');
        setTimeout(() => setCurrentView('main'), 600);
      } else {
        setIntroStage(1);
      }
    }
  };

  const handleGoogleLogin = async (e) => {
    e.stopPropagation();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const profile = {
        ...userProfile, isGuest: false, name: user.displayName || 'Google User',
        email: user.email, avatar: user.photoURL || AVATARS[0], googleId: user.uid
      };
      setUserProfile(profile);
      localStorage.setItem('workflow_auth', 'true');
      localStorage.setItem('workflow_user', JSON.stringify(profile));
      setCurrentView('transitioning'); setTimeout(() => setCurrentView('main'), 600);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert("Sign in failed. Please try again.");
    }
  };

  const handleGuestLogin = (e) => {
    e.stopPropagation();
    const profile = { ...userProfile, isGuest: true, name: 'Guest Explorer', email: 'Temporary session' };
    setUserProfile(profile);
    localStorage.setItem('workflow_auth', 'true');
    localStorage.setItem('workflow_user', JSON.stringify(profile));
    setCurrentView('transitioning'); setTimeout(() => setCurrentView('main'), 600);
  };

  const handleSignOut = () => {
    localStorage.removeItem('workflow_auth'); localStorage.removeItem('workflow_user');
    setCurrentView('splash'); setIntroStage(0); setSidebarOpen(false);
  };

  // --- TASK MANAGEMENT ---
  const handleCreateTask = () => {
    setEditingTask({
      id: 'task_' + Date.now(), boardId: activeBoardId, title: '', subtitle: '', description: '',
      rowId: 'forgotten', reminder: null, isLocked: false, isNew: true
    }); 
  };

  const handleSaveTask = (updatedTask) => {
    if (!updatedTask.title.trim()) { triggerNotification('Please enter a title'); return; }
    setTasks(prev => {
      const exists = prev.find(t => t.id === updatedTask.id);
      const cleanTask = { ...updatedTask }; delete cleanTask.isNew;
      if (exists) return prev.map(t => t.id === cleanTask.id ? cleanTask : t);
      return [cleanTask, ...prev]; 
    });
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete && !taskToDelete.isLocked) {
      setDeletedTasks(prev => [{ ...taskToDelete, deletedAt: Date.now() }, ...prev]);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } else if (taskToDelete?.isLocked) {
      triggerNotification("Cannot delete a locked card.");
    }
    if (editingTask?.id === taskId) setEditingTask(null);
  };

  const handleRestoreTask = (task) => {
    setDeletedTasks(prev => prev.filter(t => t.id !== task.id));
    const restored = { ...task }; delete restored.deletedAt;
    setTasks(prev => [...prev, restored]);
    triggerNotification('Restored card from graveyard!');
  };

  // DUPLICATE TASK (Forces to No Priority)
  const handleDuplicateTask = (task) => {
    const duplicatedTask = {
      ...task,
      id: 'task_' + Date.now() + Math.random().toString(36).substr(2, 5),
      title: `${task.title} (Copy)`,
      rowId: 'forgotten' 
    };
    setTasks(prev => [...prev, duplicatedTask]);
    triggerNotification('Card duplicated to No Priority!');
  };

  const toggleCardLock = (e, taskId) => {
    e.stopPropagation();
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isLocked: !t.isLocked } : t));
  };

  // --- TASK COMPLETION ---
  const handleCompleteTask = () => {
    if (!slashingTask || slashingTask.isLocked) return;
    setAnimatingTasks(prev => [...prev, slashingTask.id]);
    setCompletedTasks(prev => [{ ...slashingTask, completedAt: Date.now() }, ...(prev || [])]);
    setSlashingTask(null);
    triggerNotification(`Quest Completed!`);

    setTimeout(() => {
      setTasks(prev => prev.filter(t => t.id !== slashingTask.id));
      setAnimatingTasks(prev => prev.filter(id => id !== slashingTask.id));
    }, 600);
  };

  const handleUndoTask = (completedTask) => {
    if (!completedTask || !completedTask.id) return;
    setCompletedTasks(prev => (prev || []).filter(t => t.id !== completedTask.id));
    const restoredTask = { ...completedTask };
    delete restoredTask.completedAt;
    
    if (typeof restoredTask.rowId === 'number' && restoredTask.rowId > activeBoard.rowCount) {
      restoredTask.rowId = activeBoard.rowCount;
    }
    setTasks(prev => [...prev, restoredTask]);
    triggerNotification('Card restored.');
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStartTask = (e, task) => {
    if (task.isLocked) { e.preventDefault(); return; }
    e.dataTransfer.setData('text/plain', task.id); 
    e.dataTransfer.effectAllowed = 'move';
    setGlobalDragState('card');
    setGrayGhostId(task.id); 
    
    // FIX: Strict timeout so instant drops cancel safely and don't turn invisible
    if (dragStartTimeoutRef.current) clearTimeout(dragStartTimeoutRef.current);
    dragStartTimeoutRef.current = setTimeout(() => setDraggedTaskId(task.id), 10);
  };

  const handleDragStartRow = (e, rowId) => {
    e.stopPropagation(); 
    setGlobalDragState('row');
    setDraggedRowId(rowId); 
    e.dataTransfer.setData('text/rowId', rowId.toString());

    // SMOOTH ROW VISUAL FIX: Snaps exact mouse coordinates to perfectly hold the row
    const rowElement = e.currentTarget.closest('.row-container-drag');
    if (rowElement) {
      const rect = rowElement.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      e.dataTransfer.setDragImage(rowElement, offsetX, offsetY);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null); setGrayGhostId(null); setDraggedRowId(null);
    setDragOverTaskId(null); setIsHoveringTrash(false); setGlobalDragState(null); setRowDragHoverId(null);
    
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    if (dragStartTimeoutRef.current) clearTimeout(dragStartTimeoutRef.current);
  };

  const handleDragOverTask = (e, targetTaskId) => {
    e.preventDefault(); e.stopPropagation();
    if (draggedTaskId && draggedTaskId !== targetTaskId) {
      if (!dragTimeoutRef.current) {
        dragTimeoutRef.current = setTimeout(() => {
          setDragOverTaskId(targetTaskId);
          dragTimeoutRef.current = null;
        }, 500); 
      }
    }
  };

  const handleDragLeaveTask = () => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
  };

  const handleDropOnRow = (e, targetRowId) => {
    e.preventDefault(); e.stopPropagation();
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);

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
          } else newTasks.push(draggedTask);
        }
        return newTasks;
      });
    } else if (sourceRowId) {
      const sId = parseInt(sourceRowId); const tId = parseInt(targetRowId);
      if (sId !== tId && !isNaN(sId) && !isNaN(tId)) {
        setTasks(prev => prev.map(t => {
          if (t.boardId === activeBoardId) {
            if (t.rowId === sId) return { ...t, rowId: tId };
            if (t.rowId === tId) return { ...t, rowId: sId };
          }
          return t;
        }));
      }
    }
    handleDragEnd();
  };

  // --- ROW MANAGEMENT (INSERT & DELETE) ---
  const handleInsertRow = (atIndex) => {
    if (activeBoard.rowCount >= DYNAMIC_COLORS.length) { triggerNotification("Maximum rows reached."); return; }
    // Shift all tasks at or below this index down by 1
    setTasks(prev => prev.map(t => {
      if (t.boardId === activeBoardId && typeof t.rowId === 'number' && t.rowId >= atIndex) {
        return { ...t, rowId: t.rowId + 1 };
      }
      return t;
    }));
    setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, rowCount: b.rowCount + 1 } : b));
  };

  const handleDeleteRow = (rowIdToDelete) => {
    if (activeBoard.rowCount <= 1) { triggerNotification("Cannot delete the last row."); return; }
    
    // Move tasks in this row to deleted list
    const tasksInRow = tasks.filter(t => t.boardId === activeBoardId && t.rowId === rowIdToDelete);
    if (tasksInRow.length > 0) {
      setDeletedTasks(prev => [...tasksInRow.map(t => ({ ...t, deletedAt: Date.now() })), ...prev]);
    }
    
    // Remove tasks and shift remaining rows up
    setTasks(prev => prev.filter(t => !(t.boardId === activeBoardId && t.rowId === rowIdToDelete)).map(t => {
      if (t.boardId === activeBoardId && typeof t.rowId === 'number' && t.rowId > rowIdToDelete) {
        return { ...t, rowId: t.rowId - 1 };
      }
      return t;
    }));
    
    setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, rowCount: b.rowCount - 1 } : b));
    triggerNotification("Row deleted.");
  };
  // --- RENDERING ---

  // SPLASH, LOGIN & TRANSITION SCREENS
  if (currentView === 'splash' || currentView === 'transitioning') {
    const isFading = currentView === 'transitioning';
    return (
      <div 
        onClick={handleSplashClick}
        className={`relative min-h-screen w-full flex flex-col items-center justify-center p-6 overflow-hidden select-none cursor-pointer bg-slate-950 transition-all duration-500 ease-in-out ${isFading ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-amber-900 opacity-90"></div>
        <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>

        <div className={`flex flex-col items-center text-center max-w-md w-full z-10 transition-all duration-1000 ease-in-out ${introStage > 0 ? '-translate-y-32' : ''}`}>
          <div className={`relative mb-6 transition-all duration-1000 ease-in-out ${introStage > 0 ? 'scale-125 translate-y-[-10px] shadow-[0_0_100px_rgba(251,191,36,0.8)]' : 'shadow-[0_10px_35px_rgba(251,191,36,0.4)] animate-bounce'} w-28 h-28 rounded-3xl bg-gradient-to-tr from-amber-300 to-yellow-100 flex items-center justify-center border-4 border-amber-200 overflow-hidden`}>
            <img src="/icon-512.png" alt="WorkFlow Logo" className="w-[85%] h-[85%] object-contain drop-shadow-md" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-md mb-2 text-white">WorkFlow</h1>
          {introStage === 0 && <p className="text-amber-200 font-bold tracking-wider uppercase text-sm sm:text-base mt-8 animate-pulse drop-shadow-md">Tap anywhere to start</p>}

          <div className={`w-full space-y-6 px-2 absolute top-1/2 left-1/2 -translate-x-1/2 transition-all duration-1000 ${introStage > 0 ? 'opacity-100 translate-y-32' : 'opacity-0 translate-y-48 pointer-events-none'}`}>
            <button onClick={handleGoogleLogin} className="w-full py-4 px-6 rounded-2xl bg-white text-stone-900 font-bold text-base shadow-xl hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            <button onClick={handleGuestLogin} className="w-full mt-4 py-4 px-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm backdrop-blur-md active:scale-95 transition-all flex items-center justify-center gap-2">
              <User size={18} /><span>Enter as Guest</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN APP VIEW
  return (
    <div className={`relative min-h-screen w-full flex overflow-x-hidden ${theme === 'night' ? 'bg-slate-950 text-slate-100' : 'bg-stone-100 text-stone-900'} transition-colors duration-500 font-sans`}>
      
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
      `}} />

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
          <button onClick={() => { setActiveModal('settings'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium">
            <Settings size={18} className="text-emerald-500" /> <span>Settings</span>
          </button>
        </div>
        
        <div className="p-4 border-t border-inherit space-y-2">
           <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-3 px-3 py-3 rounded-xl text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-colors text-sm font-bold">
             <LogOut size={18} /> <span>{userProfile.isGuest ? 'Exit Guest Mode' : 'Sign Out'}</span>
           </button>
        </div>
      </aside>

      {/* HEADER */}
      <header className={`fixed top-0 w-full z-30 px-4 sm:px-6 py-3 flex items-center justify-between backdrop-blur-md bg-black/10 transition-transform duration-500 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className={`p-2 rounded-xl active:scale-95 transition-all ${theme === 'night' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-stone-900'}`}>
            <AlignLeft size={22} />
          </button>
        </div>

        <div className="flex items-center gap-3 mr-20 sm:mr-28">
          <button onClick={() => setShowDiamondGame(true)} className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white shadow-md transition-all">
             <div className="rotate-45 font-black text-sm flex items-center justify-center w-5 h-5">♦</div>
          </button>

          <button onClick={() => setGraveyardOpen(true)} className={`p-2.5 rounded-xl border transition-colors shadow-md ${theme === 'night' ? 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white' : 'bg-white/80 border-stone-300 text-stone-600 hover:bg-white hover:text-stone-900'}`}>
             <Skull size={20} />
          </button>

          <button onClick={handleCreateTask} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-300 hover:to-rose-300 text-white shadow-lg active:scale-95 transition-all flex items-center gap-2 border-2 border-white/20 font-black text-sm">
            <Plus size={18} strokeWidth={3} />
            <span className="hidden sm:inline">Add Card</span>
          </button>
        </div>
      </header>

      {/* NEW: FIXED LEFT SIDEBAR FOR NO PRIORITY */}
      <div 
        onDragOver={(e) => e.preventDefault()} 
        onDrop={(e) => handleDropOnRow(e, 'forgotten')} 
        className={`fixed left-0 top-20 bottom-0 w-[200px] p-3 overflow-y-auto z-20 border-r-2 border-dashed transition-all hidden sm:block custom-scrollbar ${theme === 'night' ? 'bg-slate-900/40 border-slate-600/50' : 'bg-white/40 border-stone-300/60'} ${globalDragState === 'row' ? 'opacity-40 brightness-75' : ''}`}
      >
        <div className="flex items-center gap-2 mb-4 px-1 sticky top-0 bg-transparent backdrop-blur-md z-10 py-2">
          <div className="w-3 h-3 rounded-full bg-slate-400"></div>
          <h3 className={`text-xs uppercase font-extrabold tracking-widest ${theme === 'night' ? 'text-slate-300' : 'text-stone-600'}`}>No Priority</h3>
        </div>
        
        <div className="flex flex-col gap-3 items-center pb-10">
          {tasks.filter(t => t.boardId === activeBoardId && t.rowId === 'forgotten').map((task, index) => (
            <TaskCard key={task.id} task={task} colorObj={FORGOTTEN_COLOR} index={index} 
              isDragged={draggedTaskId === task.id} isGrayGhost={grayGhostId === task.id} isDragOver={dragOverTaskId === task.id} isAnimating={animatingTasks.includes(task.id)} 
              isDimmed={globalDragState === 'card' && draggedTaskId !== task.id}
              onClick={() => setEditingTask(task)} onSlash={() => setSlashingTask(task)} onDuplicate={() => handleDuplicateTask(task)} onToggleLock={toggleCardLock}
              onDragStart={handleDragStartTask} onDragOver={(e) => handleDragOverTask(e, task.id)} onDragLeave={handleDragLeaveTask} onDragEnd={handleDragEnd}/>
          ))}
          {tasks.filter(t => t.boardId === activeBoardId && t.rowId === 'forgotten').length === 0 && <div className="w-full text-center py-4 opacity-50 text-xs italic">Drag tasks here</div>}
        </div>
      </div>

      {/* MAIN LEADERBOARD BODY */}
      <div className="relative z-10 flex-1 flex flex-col min-h-screen pt-20 pl-[10px] sm:pl-[210px] pr-20 sm:pr-28 transition-all">
        <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 pb-36 relative">
          <div className="flex items-start gap-3 sm:gap-6 relative">
            
            {/* CENTRAL LEADERBOARD SPINE (Removed + and -) */}
            <div className="flex flex-col items-center shrink-0 select-none relative z-10 pt-2">
              <div 
                ref={angelRef}
                onClick={() => setActiveModal('treasure')}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.6)] border-4 border-yellow-200 z-10 relative cursor-pointer hover:scale-110 active:scale-95 transition-all overflow-hidden p-2.5"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-amber-950 drop-shadow-md">
                   <path d="M4 17L2 5l6.5 4.5L12 2l3.5 7.5L22 5l-2 12H4zm16 2c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1v-1h16v1z" />
                </svg>
              </div>

              <div 
                className="w-3.5 sm:w-4 rounded-full -mt-4 shadow-inner bg-gradient-to-b from-amber-400 via-rose-500 via-purple-600 via-blue-600 to-cyan-500 transition-all duration-300 z-0 relative"
                style={{ height: `${(activeBoard.rowCount * 115)}px` }}
              />
            </div>

            {/* TASK ROWS */}
            <div className="flex-1 flex flex-col pt-12">
              {Array.from({ length: activeBoard.rowCount }).map((_, idx) => {
                const rowId = idx + 1;
                const rowStyle = DYNAMIC_COLORS[Math.min(idx, DYNAMIC_COLORS.length - 1)];
                const rowTasks = tasks.filter(t => t.boardId === activeBoardId && t.rowId === rowId);
                const isRowLocked = lockedRows.includes(rowId);
                
                const isRowBeingDragged = globalDragState === 'row' && draggedRowId === rowId;
                const isDimmedRow = globalDragState === 'row' && draggedRowId !== rowId;

                return (
                  <div key={rowId} 
                    className={`row-container-drag min-h-[110px] flex items-stretch py-3 transition-all duration-500 border-b-2 border-dashed ${theme === 'night' ? 'border-white/10' : 'border-stone-300/50'} group ${isRowBeingDragged ? 'opacity-50 brightness-110 scale-[0.98]' : ''} ${isDimmedRow ? 'opacity-40 brightness-75' : 'opacity-100'} ${rowDragHoverId === rowId ? 'bg-white/5 rounded-2xl' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); if (globalDragState === 'row' && !isRowLocked) setRowDragHoverId(rowId); }} 
                    onDragLeave={() => setRowDragHoverId(null)} 
                    onDrop={(e) => handleDropOnRow(e, rowId)}
                  >
                    <div className="flex-1 flex flex-wrap gap-2 sm:gap-3 items-center min-h-[75px] pl-2 sm:pl-3 relative">
                      {rowTasks.map((task, index) => (
                        <TaskCard 
                          key={task.id} task={task} colorObj={rowStyle} index={index}
                          isDragged={draggedTaskId === task.id} isGrayGhost={grayGhostId === task.id} isDragOver={dragOverTaskId === task.id} isAnimating={animatingTasks.includes(task.id)}
                          isDimmed={globalDragState === 'card' && draggedTaskId !== task.id && draggedRowId !== task.rowId}
                          onClick={() => setEditingTask(task)} onSlash={() => setSlashingTask(task)} onDuplicate={() => handleDuplicateTask(task)} onToggleLock={toggleCardLock}
                          onDragStart={handleDragStartTask} onDragOver={(e) => handleDragOverTask(e, task.id)} onDragLeave={handleDragLeaveTask} onDragEnd={handleDragEnd}
                        />
                      ))}
                    </div>
                    {/* Row Handle, Delete Row & Insert Buttons */}
                    <div className="w-10 shrink-0 flex flex-col items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity gap-2">
                      <button onClick={() => handleInsertRow(rowId)} className="hover:scale-110 transition-transform bg-emerald-500/20 text-emerald-400 p-1 rounded-md" title="Insert Row Above">
                         <ChevronUp size={12}/>
                      </button>
                      
                      {/* NEW DELETE ROW BUTTON */}
                      <button onClick={() => handleDeleteRow(rowId)} className="hover:scale-110 transition-transform bg-rose-500/10 text-rose-500 p-1.5 rounded-md" title="Delete Entire Row">
                         <Trash2 size={14}/>
                      </button>
                      
                      <div draggable={!isRowLocked} onDragStart={(e) => handleDragStartRow(e, rowId)} onDragEnd={handleDragEnd} className={`${isRowLocked ? 'cursor-not-allowed opacity-30' : 'cursor-grab'} flex flex-col items-center p-2 bg-black/5 hover:bg-black/10 rounded-lg transition-colors`}>
                        <div className="flex gap-1 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-current"/><div className="w-1.5 h-1.5 rounded-full bg-current"/></div>
                        <div className="flex gap-1 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-current"/><div className="w-1.5 h-1.5 rounded-full bg-current"/></div>
                        <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-current"/><div className="w-1.5 h-1.5 rounded-full bg-current"/></div>
                      </div>

                      <button onClick={() => handleInsertRow(rowId + 1)} className="hover:scale-110 transition-transform bg-emerald-500/20 text-emerald-400 p-1 rounded-md" title="Insert Row Below">
                         <ChevronDown size={12}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
      {/* PERMANENT RIGHT-SIDE TRASH ZONE - INSTANT REACTION */}
      <div 
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsHoveringTrash(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsHoveringTrash(true); }}
        onDragLeave={() => setIsHoveringTrash(false)}
        onDrop={(e) => { e.preventDefault(); setIsHoveringTrash(false); if(draggedTaskId) handleDeleteTask(draggedTaskId); handleDragEnd(); }}
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
          <div className="flex items-center gap-2">
            {deletedTasks.length > 0 && (
              <button onClick={() => { setDeletedTasks([]); triggerNotification('Graveyard cleared forever.'); }} className="flex items-center gap-1 p-1.5 px-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors text-[10px] uppercase font-bold tracking-wider">
                <Trash2 size={12} /> Clear All
              </button>
            )}
            <button onClick={() => setGraveyardOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
          </div>
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
                 <button onClick={() => handleRestoreTask(t)} className="flex items-center gap-1 text-[10px] uppercase font-bold text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded hover:bg-cyan-800/50 border border-cyan-800 transition-colors z-10 relative"><ShieldPlus size={12} /> Restore</button>
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

      {/* TASK EDIT DRAWER */}
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
                <input 
                  type="text" maxLength={20} value={editingTask.title} 
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} 
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTask(editingTask); }}
                  placeholder="Title" 
                  className="w-full text-2xl font-black bg-transparent border-b-2 border-slate-500/30 focus:border-amber-500 focus:outline-none py-1.5 transition-colors"
                />
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-1"><label className="text-xs uppercase font-extrabold opacity-50">Sub Title</label><span className="text-[11px] opacity-50">{(editingTask.subtitle || '').length}/50</span></div>
                <input 
                  type="text" maxLength={50} value={editingTask.subtitle || ''} 
                  onChange={(e) => setEditingTask({ ...editingTask, subtitle: e.target.value })} 
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTask(editingTask); }}
                  placeholder="Sub Title" 
                  className="w-full text-sm font-semibold bg-transparent border-b border-slate-500/30 focus:border-amber-500 focus:outline-none py-1.5 transition-colors"
                />
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs uppercase font-extrabold opacity-50">Description</label>
                </div>
                <textarea rows={6} value={editingTask.description || ''} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} placeholder="Description..." className={`w-full p-4 rounded-2xl bg-black/5 border border-slate-500/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm leading-relaxed resize-none ${theme === 'night' ? 'placeholder-slate-500 text-white' : 'placeholder-stone-400 text-stone-900'}`}/>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-500/20">
              <button onClick={() => handleDeleteTask(editingTask.id)} className="p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors" title="Delete Task">
                <Trash2 size={20} />
              </button>
              
              {!editingTask.isNew && !editingTask.isLocked && (
                <button onClick={() => { setSlashingTask(editingTask); setEditingTask(null); }} className="p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors shadow-sm border border-amber-500/20 group" title="Complete Task">
                  <Sword size={20} className="group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                </button>
              )}

              <button onClick={() => handleSaveTask(editingTask)} className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-sm shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2"><Check size={18} strokeWidth={2.5} /> <span>Save Card</span></button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED TASKS MODAL */}
      {activeModal === 'treasure' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActiveModal(null)} />
          <div className={`relative w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden ${theme === 'night' ? 'bg-[#1a1040] border-amber-500/20 text-white' : 'bg-white border-amber-200 text-stone-900'} border animate-in zoom-in-95 duration-300`}>
            
            <div className={`flex justify-between items-center p-6 border-b ${theme === 'night' ? 'border-amber-500/20 bg-black/20' : 'border-amber-500/10 bg-amber-50/50'}`}>
              <h3 className="font-black text-xl text-amber-500 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M4 17L2 5l6.5 4.5L12 2l3.5 7.5L22 5l-2 12H4zm16 2c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1v-1h16v1z"/></svg>
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
                   <div key={idx} className={`flex justify-between items-center p-4 rounded-2xl border ${theme === 'night' ? 'bg-black/20 border-slate-700/50' : 'bg-black/5 border-stone-200'}`}>
                      <div className="w-[65%]">
                        <h5 className="font-black text-sm truncate">{ct.title || 'Untitled Task'}</h5>
                        <p className="text-xs font-medium opacity-70 mt-1 truncate">{ct.subtitle}</p>
                      </div>
                      <button onClick={() => handleUndoTask(ct)} className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-600 bg-amber-500/20 px-3 py-2 rounded-xl hover:bg-amber-500/40 border border-amber-500/30 transition-colors shrink-0">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="6" width="20" height="12" rx="6" transform="rotate(45 12 12)"/>
                          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                          <circle cx="9.5" cy="9.5" r="1" fill="currentColor"/>
                          <circle cx="14.5" cy="14.5" r="1" fill="currentColor"/>
                        </svg>
                        Restore
                      </button>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}

      {/* THE DIAMOND GAME POPUP */}
      {showDiamondGame && <DiamondGame onClose={() => setShowDiamondGame(false)} />}
      
    </div>
  );
}

// TASK CARD
function TaskCard({ task, colorObj, index = 0, isDragged, isGrayGhost, isDragOver, isAnimating, isDimmed, onClick, onSlash, onDuplicate, onToggleLock, onDragStart, onDragOver, onDragLeave, onDragEnd }) {
  let bgColor, borderColor, textColor;
  const isHeldGray = isGrayGhost;
  
  if (isHeldGray) {
    bgColor = '#64748b'; borderColor = '#475569'; textColor = 'text-white';
  } else if (colorObj.hue !== undefined) {
    const lightness = Math.max(20, colorObj.baseL - (index * 4));
    bgColor = `hsl(${colorObj.hue}, ${colorObj.sat}%, ${lightness}%)`;
    borderColor = `hsl(${colorObj.hue}, ${colorObj.sat}%, ${Math.max(10, lightness - 10)}%)`;
    textColor = lightness > 60 ? 'text-stone-900' : 'text-white';
  } else {
    bgColor = '#1e293b'; borderColor = '#334155'; textColor = 'text-white';
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

  // FIX: Using opacity-0 keeps it in the DOM, so onDragEnd fires if dropped outside!
  if (isDragged) return <div className="w-[170px] h-[75px] shrink-0 opacity-0 pointer-events-none" />;
  
  const dimClass = isDimmed ? 'opacity-40 brightness-75 scale-95' : 'opacity-100 scale-100';

  return (
    <div
      draggable={!task.isLocked}
      onDragStart={(e) => onDragStart(e, task)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{ backgroundColor: bgColor, borderColor: borderColor }}
      className={`relative w-[170px] shrink-0 h-[75px] rounded-2xl p-2.5 cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 ease-out flex flex-col justify-between select-none ${textColor} border-2 group ${dimClass} ${isDragOver ? 'ml-[180px] scale-95 opacity-80' : ''} ${task.isLocked ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start justify-between gap-1">
        <h4 className="font-black text-sm tracking-tight truncate w-[50%]">{task.title}</h4>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
          <button onClick={(e) => onToggleLock(e, task.id)} className="shrink-0 p-1 bg-black/10 hover:bg-black/20 rounded-md transition-colors" title={task.isLocked ? "Unlock" : "Lock"}>
            {task.isLocked ? <Lock size={12} className="text-rose-400" /> : <Unlock size={12} className="text-current" />}
          </button>
          {!task.isLocked && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="shrink-0 p-1 bg-black/10 hover:bg-black/20 rounded-md transition-colors" title="Duplicate">
                <Copy size={12} className="text-current" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onSlash(task); }} className="shrink-0 p-1 bg-black/10 hover:bg-black/20 rounded-md transition-colors" title="Complete">
                <Sword size={12} className="text-current group-hover:rotate-12 transition-transform" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <p className="text-[11px] font-medium opacity-90 truncate w-[80%]">{task.subtitle}</p>
        {task.reminder && <Clock size={12} className="shrink-0 opacity-80" />}
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
