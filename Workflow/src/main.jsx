import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Sun, Moon, Plus, X, AlignLeft, 
  Settings, User, ChevronRight, Clock, 
  Trash2, Pin, Edit2, MinusCircle, Bell, 
  Check, Image as ImageIcon, AlertCircle, UploadCloud, Sword, MoreVertical
} from 'lucide-react';

// True Color Grading Engine Base HSL Values
const DYNAMIC_COLORS = [
  { hue: 45, sat: 100, baseL: 55, text: 'text-amber-950' },   // Row 1: Yellows
  { hue: 25, sat: 100, baseL: 55, text: 'text-white' },       // Row 2: Oranges
  { hue: 350, sat: 90, baseL: 60, text: 'text-white' },       // Row 3: Reds/Rose
  { hue: 270, sat: 80, baseL: 60, text: 'text-white' },       // Row 4: Purples
  { hue: 230, sat: 85, baseL: 60, text: 'text-white' },       // Row 5: Indigos
  { hue: 210, sat: 90, baseL: 55, text: 'text-white' },       // Row 6: Blues
  { hue: 190, sat: 95, baseL: 45, text: 'text-white' },       // Row 7: Cyans
  { hue: 170, sat: 85, baseL: 40, text: 'text-white' },       // Row 8: Teals
];

const FORGOTTEN_COLOR = { hue: 215, sat: 15, baseL: 40, text: 'text-slate-100' };

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

export default function App() {
  const [currentView, setCurrentView] = useState('splash');
  const [introStage, setIntroStage] = useState(0); 
  const [theme, setTheme] = useState('night'); 

  // User & Points
  const [userProfile, setUserProfile] = useState({ name: 'Task Master', email: 'user@workflow.io', avatar: DEFAULT_AVATAR, isGuest: false });
  const [points, setPoints] = useState(0);

  // App Data
  const [boards, setBoards] = useState([{ id: 'b1', name: 'Main Board', isPinned: true, rowCount: 5 }]);
  const [activeBoardId, setActiveBoardId] = useState('b1');
  const [boardMenuOpen, setBoardMenuOpen] = useState(null);

  // Default clean tasks
  const [tasks, setTasks] = useState([
    { id: 't1', boardId: 'b1', title: 'Title', subtitle: 'Sub Title', description: 'Description', rowId: 1, reminder: null },
    { id: 't2', boardId: 'b1', title: 'Title', subtitle: 'Sub Title', description: 'Description', rowId: 2, reminder: null },
    { id: 't3', boardId: 'b1', title: 'Title', subtitle: 'Sub Title', description: 'Description', rowId: 3, reminder: null },
  ]);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeModal, setActiveModal] = useState(null); 
  const [notificationBanner, setNotificationBanner] = useState('');

  // Drag State
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [grayGhostId, setGrayGhostId] = useState(null); 
  const [dragOverTaskId, setDragOverTaskId] = useState(null); 
  const [draggedRowId, setDraggedRowId] = useState(null);
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);
  
  // Slashing State
  const [slashingTask, setSlashingTask] = useState(null);
  const [animatingTasks, setAnimatingTasks] = useState([]); 
  const [completedTasks, setCompletedTasks] = useState([]); 

  const activeBoard = boards.find(b => b.id === activeBoardId) || boards[0];

  // Auto-shift empty rows up
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

  // Close menus when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => setBoardMenuOpen(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const triggerNotification = (msg) => {
    if(typeof msg !== 'string') return;
    setNotificationBanner(msg);
    setTimeout(() => setNotificationBanner(''), 3500);
  };

  const handleSplashClick = () => {
    if (introStage === 0) {
      setIntroStage(1);
      setTimeout(() => setIntroStage(2), 600); 
    }
  };

  const handleEnterApp = (e, isGuest = false) => {
    e.stopPropagation();
    setUserProfile(prev => ({
      ...prev, isGuest,
      name: isGuest ? 'Guest Explorer' : 'Authorized User',
      email: isGuest ? 'Temporary local session' : 'google.user@example.com'
    }));
    setCurrentView('main');
  };

  const handleCreateTask = () => {
    const newTask = {
      id: 'task_' + Date.now(), boardId: activeBoardId,
      title: '', subtitle: '', description: '',
      rowId: 'forgotten', reminder: null, isNew: true
    };
    setEditingTask(newTask); 
  };

  const handleSaveTask = (updatedTask) => {
    if (!updatedTask.title.trim()) {
      triggerNotification('Please enter a title for the task');
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
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (editingTask?.id === taskId) setEditingTask(null);
  };

  const handleCompleteTask = () => {
    if (!slashingTask) return;
    
    let earnedPoints = 1;
    if (slashingTask.rowId !== 'forgotten') {
      earnedPoints = Math.max(10 - 2 * (parseInt(slashingTask.rowId) - 1), 1);
    }
    
    setPoints(p => p + earnedPoints);
    setAnimatingTasks(prev => [...prev, slashingTask.id]);
    
    // Save to completed history
    setCompletedTasks(prev => [{ ...slashingTask, earnedPoints, completedAt: Date.now() }, ...prev]);
    
    setSlashingTask(null);
    triggerNotification(`+${earnedPoints} Points!`);

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
    setTimeout(() => {
      setDraggedTaskId(taskId);
    }, 10);
  };

  const handleDragStartRow = (e, rowId) => {
    e.stopPropagation();
    setDraggedRowId(rowId);
    e.dataTransfer.setData('text/rowId', rowId.toString());
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
            if (targetIdx > -1) {
              newTasks.splice(targetIdx, 0, draggedTask);
            } else {
              newTasks.push(draggedTask);
            }
          } else {
            newTasks.push(draggedTask);
          }
        }
        return newTasks;
      });
    } else if (sourceRowId) {
      const sId = parseInt(sourceRowId);
      const tId = parseInt(targetRowId);
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
    if (file) {
      setUserProfile(prev => ({ ...prev, avatar: URL.createObjectURL(file) }));
    }
  };

  // -------------------------------------------------------------
  // VIEW: SPLASH / WELCOME SCREEN
  // -------------------------------------------------------------
  if (currentView === 'splash') {
    return (
      <div 
        onClick={handleSplashClick}
        className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 overflow-hidden select-none cursor-pointer bg-[#1a1040]"
      >
        <div className="fixed w-screen h-screen top-0 left-0 bg-gradient-to-br from-[#12082b] via-[#1a1040] to-[#070b1f] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,_#3b185f_0%,_transparent_40%)] opacity-70"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,_#1f144a_0%,_transparent_50%)] opacity-80"></div>
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px] mix-blend-screen -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className={`flex flex-col items-center text-center max-w-md w-full z-10 transition-all duration-1000 ease-in-out ${introStage > 0 ? '-translate-y-32' : ''}`}>
          
          <div className={`relative mb-6 transition-all duration-1000 ease-in-out ${introStage > 0 ? 'scale-125 translate-y-[-10px] shadow-[0_0_100px_rgba(251,191,36,0.8)]' : 'shadow-[0_10px_35px_rgba(251,191,36,0.4)] animate-bounce'} w-28 h-28 rounded-3xl bg-gradient-to-tr from-amber-300 to-yellow-100 flex items-center justify-center border-4 border-amber-200`}>
            {/* Custom Angel with Crown Logo */}
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

          {/* Buttons Area */}
          <div className={`w-full space-y-6 px-2 absolute top-1/2 left-1/2 -translate-x-1/2 transition-all duration-1000 ${introStage === 2 ? 'opacity-100 translate-y-32' : 'opacity-0 translate-y-48 pointer-events-none'}`}>
            <button
              onClick={(e) => handleEnterApp(e, false)}
              className="w-full py-4 px-6 rounded-2xl bg-white text-stone-900 font-bold text-base shadow-xl hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              onClick={(e) => handleEnterApp(e, true)}
              className="w-full mt-4 py-4 px-6 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/20 text-white font-semibold text-sm backdrop-blur-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <User size={18} />
              <span>Enter as Guest</span>
            </button>
            <div className="flex flex-col items-center justify-center gap-1.5 text-[11px] text-amber-100/70 pt-3 leading-relaxed text-center px-4">
              <span className="flex items-center gap-1"><AlertCircle size={12} className="text-amber-300" /> Guest session</span>
              <span>If app gets deleted, saved information will be lost.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: MAIN APPLICATION
  // -------------------------------------------------------------
  return (
    <div className={`relative min-h-screen w-full flex overflow-x-hidden ${theme === 'night' ? 'text-slate-100' : 'text-stone-900'} transition-colors duration-500 font-sans`}>
      
      {/* Dynamic Backgrounds (Locked to viewport using w-screen h-screen fixed) */}
      <div className="fixed w-screen h-screen top-0 left-0 pointer-events-none z-0 overflow-hidden transition-colors duration-700">
        {theme === 'night' ? (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c051a] via-[#16123a] to-[#26104e]">
             <div className="absolute top-0 left-1/4 w-full h-[600px] bg-purple-700/20 rounded-full blur-[150px] mix-blend-screen transform -rotate-12"></div>
             <div className="absolute bottom-1/4 right-0 w-[800px] h-[800px] bg-blue-700/10 rounded-full blur-[150px] mix-blend-screen"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#a1c4fd] via-[#ffc3a0] to-[#ffafbd]">
            <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-white/40 to-transparent"></div>
            <div className="absolute top-1/4 left-0 w-full h-[300px] bg-orange-300/30 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-pink-400/20 rounded-full blur-[120px]"></div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes split-top {
          0% { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translateY(-40px) rotate(-15deg); opacity: 0; }
        }
        @keyframes split-bottom {
          0% { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translateY(40px) rotate(15deg); opacity: 0; }
        }
        .anim-split-top { animation: split-top 0.6s ease-out forwards; clip-path: polygon(0 0, 100% 0, 100% 50%, 0 45%); }
        .anim-split-bottom { animation: split-bottom 0.6s ease-out forwards; clip-path: polygon(0 45%, 100% 50%, 100% 100%, 0 100%); }
      `}} />

      {notificationBanner && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium flex items-center gap-2 animate-bounce">
          <Bell size={16} className="text-amber-400" />
          <span>{notificationBanner}</span>
        </div>
      )}

      {/* SIDEBAR OVERLAY */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-xs z-30 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] ${theme === 'night' ? 'bg-[#0f1429] border-slate-800 text-slate-100' : 'bg-white/90 backdrop-blur-xl border-stone-200 text-stone-900'} border-r z-40 transform transition-transform duration-300 flex flex-col shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
            <User size={18} className="text-amber-500" /> <span>Profile / Gallery</span>
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
                  <div 
                    onClick={() => { setActiveBoardId(b.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-all ${activeBoardId === b.id ? (theme === 'night' ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-900') : 'hover:bg-black/5'}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {b.isPinned && <Pin size={13} className="text-amber-400 rotate-45 shrink-0" />}
                      <span className="truncate">{b.name}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setBoardMenuOpen(boardMenuOpen === b.id ? null : b.id); }} className="p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/10">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  {boardMenuOpen === b.id && (
                    <div className={`absolute right-2 top-11 z-50 w-36 rounded-xl shadow-xl border p-1 text-xs ${theme === 'night' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-stone-200 text-stone-900'}`}>
                      <button onClick={() => { const nm = prompt('Rename Board:', b.name); if(nm) setBoards(prev => prev.map(item => item.id === b.id ? { ...item, name: nm } : item)); setBoardMenuOpen(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/5 flex items-center gap-2"><Edit2 size={13} /> <span>Rename</span></button>
                      <button onClick={() => { setBoards(prev => prev.map(item => item.id === b.id ? { ...item, isPinned: !item.isPinned } : item)); setBoardMenuOpen(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/5 flex items-center gap-2"><Pin size={13} /> <span>{b.isPinned ? 'Unpin' : 'Pin'}</span></button>
                      <button onClick={() => { if(boards.length > 1) { setBoards(bds => bds.filter(x => x.id !== b.id)); setActiveBoardId(boards[0].id); } setBoardMenuOpen(null); }} className="w-full text-left px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-500/10 flex items-center gap-2"><Trash2 size={13} /> <span>Delete</span></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* HEADER & MAIN WORKSPACE */}
      <div className="relative z-10 flex-1 flex flex-col min-h-screen">
        
        <header className="sticky top-0 z-20 px-4 sm:px-6 py-3 flex items-center justify-between transition-colors backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className={`p-2 rounded-xl active:scale-95 transition-all ${theme === 'night' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-stone-900'}`}>
              <AlignLeft size={22} />
            </button>
            <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 backdrop-blur-md shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-500">
                 <path d="M7 6l2 3 3-4 3 4 2-3v4H7z" fill="currentColor"/>
              </svg>
              <span className="font-black text-amber-500 text-sm tracking-wide">{points} pts</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleCreateTask} className="w-[35px] h-[50px] rounded-[10px] bg-gradient-to-br from-amber-400 via-rose-400 to-purple-500 text-white shadow-lg hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-start pt-1.5 border-2 border-white/20">
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 pb-36 relative">
          <div className="flex items-start gap-3 sm:gap-6 relative">
            
            {/* VERTICAL LEADERBOARD SPINE */}
            <div className="flex flex-col items-center shrink-0 select-none relative z-10 pt-2">
              <div 
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

            {/* ROWS CONTENT */}
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
                          onDragStart={handleDragStartTask}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (draggedTaskId && draggedTaskId !== task.id) setDragOverTaskId(task.id); }}
                          onDragEnd={handleDragEnd}
                        />
                      ))}
                    </div>
                    {/* Row Drag Handle - Grip Dots */}
                    <div draggable onDragStart={(e) => handleDragStartRow(e, rowId)} onDragEnd={handleDragEnd} className="w-8 shrink-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-40 hover:!opacity-100 cursor-grab px-2 transition-opacity">
                      <div className="flex gap-1 mb-1"><div className="w-1 h-1 rounded-full bg-current"/><div className="w-1 h-1 rounded-full bg-current"/></div>
                      <div className="flex gap-1 mb-1"><div className="w-1 h-1 rounded-full bg-current"/><div className="w-1 h-1 rounded-full bg-current"/></div>
                      <div className="flex gap-1"><div className="w-1 h-1 rounded-full bg-current"/><div className="w-1 h-1 rounded-full bg-current"/></div>
                    </div>
                  </div>
                );
              })}

              {/* NO PRIORITY SECTION */}
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

      {/* FULL-WIDTH INVISIBLE TRASH DROP ZONE */}
      {draggedTaskId && (
        <div 
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsHoveringTrash(true); }}
          onDragLeave={() => setIsHoveringTrash(false)}
          onDrop={(e) => { e.preventDefault(); handleDeleteTask(draggedTaskId); handleDragEnd(); }}
          className="fixed bottom-0 left-0 w-full h-40 z-50 flex items-end justify-center transition-all bg-gradient-to-t from-rose-500/20 to-transparent"
        >
          <div className={`w-20 h-20 mb-8 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-[0_0_40px_rgba(244,63,94,0.6)] ${isHoveringTrash ? 'bg-rose-600 scale-125' : 'bg-rose-500/80 scale-100'}`}>
            <Trash2 size={isHoveringTrash ? 32 : 24} className="transition-all" />
          </div>
        </div>
      )}

      {/* SWORD COMPLETION MODAL */}
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

      {/* HALF-SCREEN TASK DETAIL / EDIT MODAL */}
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
                  {editingTask.reminder && <span className="text-xs flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full font-medium"><Clock size={12} /> {editingTask.reminder}</span>}
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
                  <span className={`text-[11px] font-medium ${(editingTask.description || '').trim().split(/\s+/).filter(x=>x).length > 500 ? 'text-rose-500' : 'opacity-50'}`}>
                    {(editingTask.description || '').trim().split(/\s+/).filter(x=>x).length} / 500 words
                  </span>
                </div>
                <textarea rows={8} value={editingTask.description || ''} onChange={(e) => { const text = e.target.value; if ((text.trim().split(/\s+/).filter(x=>x).length <= 500) || text.length < (editingTask.description || '').length) setEditingTask({ ...editingTask, description: text }); }} placeholder="Description..." className={`w-full p-4 rounded-2xl bg-black/5 border border-slate-500/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm leading-relaxed resize-none ${theme === 'night' ? 'placeholder-slate-500 text-white' : 'placeholder-stone-400 text-stone-900'}`}/>
              </div>

              <div onClick={() => { const d = prompt("Set a reminder timestamp:", editingTask.reminder || ''); if (d !== null) setEditingTask({ ...editingTask, reminder: d.trim() || null }); }} className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 cursor-pointer transition-all border border-blue-500/20 mb-4">
                <div className="flex items-center gap-3"><Clock size={18} /><span className="text-xs sm:text-sm font-bold">{editingTask.reminder ? `Reminder: ${editingTask.reminder}` : 'Set Schedule (Demo)'}</span></div><ChevronRight size={16} />
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

      {/* ACCOUNT MODAL */}
      {activeModal === 'account' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className={`relative w-full max-w-md ${theme === 'night' ? 'bg-slate-900 text-white' : 'bg-white text-stone-900'} p-6 rounded-3xl shadow-2xl border border-slate-700/50`}>
            <div className="flex justify-between items-center mb-5"><h3 className="font-extrabold text-lg flex items-center gap-2"><ImageIcon size={20} className="text-amber-500" /> <span>Profile & Gallery</span></h3><button onClick={() => setActiveModal(null)} className="p-1 rounded-lg hover:bg-black/10"><X size={18} /></button></div>
            <div className="mb-5 flex flex-col items-center gap-4">
              <img src={userProfile.avatar} alt="Profile" className="w-28 h-28 rounded-full object-cover ring-4 ring-amber-500 shadow-xl" />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="avatar-upload" />
              <label htmlFor="avatar-upload" className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-black/10 dark:bg-white/10 rounded-xl text-sm font-semibold hover:bg-black/20 dark:hover:bg-white/20 transition-all"><UploadCloud size={18} /> Choose from Gallery</label>
            </div>
            <div className="mb-6"><label className="text-xs uppercase font-extrabold opacity-50 mb-1 block">Display Name</label><input type="text" value={userProfile.name} onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-500/20 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"/></div>
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
                <div><h5 className="font-bold text-sm">Theme Mode</h5><p className="text-[11px] opacity-60">Night Nebula or Sunset Day</p></div>
                <button onClick={() => setTheme(t => t === 'night' ? 'day' : 'night')} className="p-2.5 rounded-xl bg-black/10 dark:bg-white/10">{theme === 'night' ? <Moon size={18} /> : <Sun size={18} />}</button>
              </div>
            </div>
            <button onClick={() => setActiveModal(null)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm">Close</button>
          </div>
        </div>
      )}

      {/* TREASURE ROOM MODAL */}
      {activeModal === 'treasure' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActiveModal(null)} />
          <div className={`relative w-full max-w-2xl h-[85vh] flex flex-col rounded-[2.5rem] shadow-[0_0_100px_rgba(251,191,36,0.2)] overflow-hidden ${theme === 'night' ? 'bg-[#1a1040] border-amber-900/50' : 'bg-gradient-to-b from-amber-50 to-orange-100 border-amber-200'} border-4 animate-in zoom-in-95 duration-300`}>
            
            <div className="flex justify-between items-center p-6 border-b border-amber-500/20 bg-black/20 backdrop-blur-sm z-20">
              <h3 className="font-black text-2xl text-amber-400 flex items-center gap-3 drop-shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 drop-shadow"><path d="M7 6l2 3 3-4 3 4 2-3v4H7z" fill="currentColor"/><circle cx="12" cy="12" r="3" /><path d="M8 21v-3a4 4 0 0 1 8 0v3" /></svg>
                Treasure Vault
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-2.5 rounded-full hover:bg-black/20 text-amber-500 transition-colors"><X size={24} strokeWidth={3} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 z-20">
               <div className={`rounded-3xl p-5 min-h-full shadow-inner flex flex-col border-2 ${theme === 'night' ? 'bg-black/40 border-amber-500/20' : 'bg-white/40 border-amber-500/40'}`}>
                 <h4 className={`font-extrabold uppercase tracking-widest text-xs mb-5 text-center ${theme === 'night' ? 'text-amber-300/70' : 'text-amber-700/70'}`}>Quest History</h4>
                 
                 {completedTasks.length === 0 ? (
                   <div className={`flex-1 flex flex-col items-center justify-center opacity-50 ${theme === 'night' ? 'text-amber-100' : 'text-amber-900'}`}>
                      <Sword size={48} className="mb-4 opacity-50" />
                      <p className="font-bold">No completed quests yet.</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {completedTasks.map((ct, idx) => (
                       <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border ${theme === 'night' ? 'bg-amber-900/30 border-amber-500/20' : 'bg-amber-500/10 border-amber-500/30'}`}>
                          <div>
                             <h5 className={`font-black text-sm ${theme === 'night' ? 'text-amber-50' : 'text-amber-950'}`}>{ct.title || 'Untitled Task'}</h5>
                             <p className={`text-xs font-semibold mt-0.5 ${theme === 'night' ? 'text-amber-200/70' : 'text-amber-800/80'}`}>{ct.subtitle}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-amber-500 font-black text-lg">
                               <span>+{ct.earnedPoints}</span>
                               <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center border-2 border-yellow-200 shadow-sm">
                                 <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-yellow-900"><path d="M7 6l2 3 3-4 3 4 2-3v4H7z" fill="currentColor"/></svg>
                               </div>
                            </div>
                            
                            <button onClick={() => handleUndoTask(ct)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-all group" title="Undo Task">
                               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform">
                                 <path d="M22 2L15 9" />
                                 <path d="M11 13L2 22" />
                                 <path d="M20 9L15 4" />
                                 <path d="M9 20L4 15" />
                                 <line x1="10" y1="14" x2="14" y2="10" strokeDasharray="2 2" />
                               </svg>
                            </button>
                          </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>

            {/* Vault Pyramid of Coins */}
            <div className="h-64 relative z-10 mt-auto flex items-end justify-center overflow-hidden pt-10 pb-6 border-t border-amber-500/20 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-yellow-900/40 via-transparent to-transparent">
              <div className="absolute top-4 z-30 flex flex-col items-center bg-black/50 px-8 py-3 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
                 <div className="text-5xl font-black text-white drop-shadow-[0_2px_15px_rgba(251,191,36,0.6)] flex items-center gap-3">
                   {points} 
                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center border-2 border-yellow-100 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                     <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-yellow-900"><path d="M7 6l2 3 3-4 3 4 2-3v4H7z" fill="currentColor"/></svg>
                   </div>
                 </div>
                 <span className="text-amber-300 font-extrabold tracking-widest uppercase text-[10px] mt-1 drop-shadow-md">Total Wealth</span>
              </div>

              <div className="relative z-20 w-full flex justify-center items-end h-full translate-y-4">
                {(() => {
                  const rows = 6;
                  const coins = [];
                  for (let r = 0; r < rows; r++) {
                    const coinsInRow = rows - r + 1;
                    for (let c = 0; c < coinsInRow; c++) {
                      const xOffset = (c - (coinsInRow - 1) / 2) * 35;
                      const yOffset = r * -15;
                      coins.push(
                        <div key={`${r}-${c}`} className="absolute rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-yellow-700 border border-yellow-200 flex items-center justify-center shadow-[0_5px_15px_rgba(0,0,0,0.8)] transition-transform hover:scale-110"
                          style={{ 
                            width: '45px', height: '45px',
                            transform: `translate(${xOffset}px, ${yOffset}px) rotate(${(Math.random() - 0.5) * 40}deg)`,
                            zIndex: r
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-yellow-900/70"><path d="M7 6l2 3 3-4 3 4 2-3v4H7z" fill="currentColor"/><circle cx="12" cy="12" r="3" /><path d="M8 21v-3a4 4 0 0 1 8 0v3" /></svg>
                        </div>
                      );
                    }
                  }
                  return coins;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: FULLY COLORED DRAGGABLE TASK CARD
// -------------------------------------------------------------
function TaskCard({ task, colorObj, index = 0, isDragged, isGrayGhost, isDragOver, isAnimating, onClick, onSlash, onDragStart, onDragOver, onDragEnd }) {
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
           <h4 className="font-black text-sm tracking-tight truncate">{task.title || 'Title'}</h4>
           <p className="text-xs font-semibold opacity-90 truncate">{task.subtitle || 'Sub Title'}</p>
        </div>
        <div className={`absolute inset-0 rounded-2xl p-2.5 flex flex-col justify-between anim-split-bottom ${textColor} border-2`} style={{ backgroundColor: bgColor, borderColor: borderColor }}>
           <h4 className="font-black text-sm tracking-tight truncate">{task.title || 'Title'}</h4>
           <p className="text-xs font-semibold opacity-90 truncate">{task.subtitle || 'Sub Title'}</p>
        </div>
      </div>
    );
  }

  if (isDragged) {
    return <div className="hidden" />;
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{ 
        backgroundColor: bgColor, 
        borderColor: borderColor,
      }}
      className={`relative w-[170px] shrink-0 h-[75px] rounded-2xl p-2.5 cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 ease-out flex flex-col justify-between select-none ${textColor} border-2 group 
        ${isDragOver ? 'ml-[180px] scale-95 opacity-80' : 'scale-100'}
      `}
    >
      <div className="flex items-start justify-between gap-1">
        <h4 className="font-black text-sm tracking-tight truncate w-[80%]">{task.title || 'Title'}</h4>
        <button onClick={(e) => { e.stopPropagation(); onSlash(task); }} className="shrink-0 p-1 bg-black/10 hover:bg-black/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 mt-0.5">
          <Sword size={14} className="text-current group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <p className="text-[11px] font-medium opacity-90 truncate w-[80%]">{task.subtitle || 'Sub Title'}</p>
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
