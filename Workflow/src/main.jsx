import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Sun, Moon, Plus, X, AlignLeft, 
  Settings, User, ChevronRight, Clock, 
  Trash2, Pin, Edit2, MinusCircle, Bell, 
  Check, Image as ImageIcon, AlertCircle, UploadCloud, Sword, MoreVertical,
  Copy, LogOut, Skull, ShieldPlus
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

const AVATARS = [ '/pfp1.jpeg', '/pfp2.jpeg', '/pfp3.jpeg', '/pfp4.jpeg' ];

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('workflow_auth') ? 'main' : 'splash';
  });
  const [introStage, setIntroStage] = useState(0); 
  const [theme, setTheme] = useState('night'); 

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('workflow_user');
    return saved ? JSON.parse(saved) : { name: 'Task Master', email: 'user@workflow.io', avatar: AVATARS[0], isGuest: false };
  });
  const [points, setPoints] = useState(0);

  const [boards, setBoards] = useState([{ id: 'b1', name: 'Main Board', isPinned: true, rowCount: 5 }]);
  const [activeBoardId, setActiveBoardId] = useState('b1');
  const [boardMenuOpen, setBoardMenuOpen] = useState(null);

  const [tasks, setTasks] = useState([
    { id: 't1', boardId: 'b1', title: 'Title', subtitle: 'Sub title', description: 'Description', rowId: 1, reminder: null },
  ]);
  const [deletedTasks, setDeletedTasks] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [graveyardOpen, setGraveyardOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeModal, setActiveModal] = useState(null); 
  const [notificationBanner, setNotificationBanner] = useState('');

  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [grayGhostId, setGrayGhostId] = useState(null); 
  const [dragOverTaskId, setDragOverTaskId] = useState(null); 
  const [draggedRowId, setDraggedRowId] = useState(null);
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);
  
  const [slashingTask, setSlashingTask] = useState(null);
  const [animatingTasks, setAnimatingTasks] = useState([]); 
  const [completedTasks, setCompletedTasks] = useState([]); 

  const activeBoard = boards.find(b => b.id === activeBoardId) || boards[0];

  useEffect(() => {
    ['/night01.jpg', '/day01.jpg', '/moneyz.jpg', ...AVATARS].forEach((src) => {
      const img = new Image(); img.src = src;
    });
  }, []);

  // Scroll Lock for Modals
  useEffect(() => {
    if (activeModal || editingTask || slashingTask || graveyardOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [activeModal, editingTask, slashingTask, graveyardOpen]);

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

  const handleSplashClick = () => {
    if (introStage === 0) {
      setIntroStage(1);
      setTimeout(() => setIntroStage(2), 600); 
    }
  };

  const handleEnterApp = (e, isGuest = false) => {
    e.stopPropagation();
    const newProfile = { ...userProfile, isGuest, name: isGuest ? 'Guest' : 'Google User' };
    setUserProfile(newProfile);
    localStorage.setItem('workflow_auth', 'true');
    localStorage.setItem('workflow_user', JSON.stringify(newProfile));
    setCurrentView('main');
  };

  const handleSignOut = () => {
    localStorage.removeItem('workflow_auth');
    localStorage.removeItem('workflow_user');
    setCurrentView('splash');
    setIntroStage(0);
    setActiveModal(null);
    setSidebarOpen(false);
  };

  const handleCreateTask = () => {
    setEditingTask({
      id: 'task_' + Date.now(), boardId: activeBoardId,
      title: 'Title', subtitle: 'Sub title', description: 'Description',
      rowId: 'forgotten', reminder: null, isNew: true
    }); 
  };

  const handleDuplicateTask = (task) => {
    setTasks(prev => [...prev, { ...task, id: 'task_' + Date.now() }]);
    triggerNotification('Card Duplicated');
  };

  const handleSaveTask = (updatedTask) => {
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
    triggerNotification('Angel Restored Task!');
  };

  const handleCompleteTask = () => {
    if (!slashingTask) return;
    let earnedPoints = 1;
    if (slashingTask.rowId !== 'forgotten') {
      earnedPoints = Math.max(10 - 2 * (parseInt(slashingTask.rowId) - 1), 1);
    }
    setPoints(p => p + earnedPoints);
    setAnimatingTasks(prev => [...prev, slashingTask.id]);
    setCompletedTasks(prev => [{ ...slashingTask, earnedPoints, completedAt: Date.now() }, ...prev]);
    setSlashingTask(null);
    triggerNotification(`+${earnedPoints} Points!`);
    setTimeout(() => {
      setTasks(prev => prev.filter(t => t.id !== slashingTask.id));
      setAnimatingTasks(prev => prev.filter(id => id !== slashingTask.id));
    }, 600);
  };

  const handleDragStartTask = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    setGrayGhostId(taskId);
    setTimeout(() => setDraggedTaskId(taskId), 10);
  };

  const handleDropOnRow = (e, targetRowId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      setTasks(prev => {
        let newTasks = [...prev];
        const taskIdx = newTasks.findIndex(t => t.id === taskId);
        if (taskIdx > -1) {
          const draggedTask = { ...newTasks[taskIdx], rowId: targetRowId };
          newTasks.splice(taskIdx, 1);
          newTasks.push(draggedTask);
        }
        return newTasks;
      });
    }
    setDraggedTaskId(null); setGrayGhostId(null); setIsHoveringTrash(false);
  };

  if (currentView === 'splash') {
    return (
      <div onClick={handleSplashClick} className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 overflow-hidden select-none cursor-pointer bg-[#0c051a]">
        <div className={`flex flex-col items-center text-center max-w-md w-full z-10 transition-all duration-1000 ease-in-out ${introStage > 0 ? '-translate-y-32' : ''}`}>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-md mb-2 text-white">WorkFlow</h1>
          {introStage === 0 && <p className="text-amber-200 font-bold tracking-wider uppercase text-sm mt-8 animate-pulse">Tap anywhere to start</p>}
          <div className={`w-full space-y-6 px-2 absolute top-1/2 left-1/2 -translate-x-1/2 transition-all duration-1000 ${introStage === 2 ? 'opacity-100 translate-y-32' : 'opacity-0 translate-y-48 pointer-events-none'}`}>
            <button onClick={(e) => handleEnterApp(e, false)} className="w-full py-4 px-6 rounded-2xl bg-white text-stone-900 font-bold text-base shadow-xl flex items-center justify-center gap-3">
              Google Account (Demo)
            </button>
            <button onClick={(e) => handleEnterApp(e, true)} className="w-full mt-4 py-4 px-6 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold flex items-center justify-center gap-2">
              <User size={18} /> Enter as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen w-full flex overflow-x-hidden ${theme === 'night' ? 'text-slate-100' : 'text-stone-900'} transition-colors duration-500 font-sans`}>
      
      {/* Backgrounds */}
      <div className="fixed inset-0 w-screen h-screen pointer-events-none z-0 overflow-hidden">
        <div className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out ${theme === 'night' ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url('/night01.jpg')` }}>
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out ${theme === 'day' ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url('/day01.jpg')` }}>
          <div className="absolute inset-0 bg-white/10" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer { 0% { filter: brightness(1) drop-shadow(0 0 10px rgba(251,191,36,0.3)); } 50% { filter: brightness(1.3) drop-shadow(0 0 30px rgba(251,191,36,0.8)); } 100% { filter: brightness(1) drop-shadow(0 0 10px rgba(251,191,36,0.3)); } }
        .gold-shimmer { animation: shimmer 3s infinite ease-in-out; }
        .broken-bottom { clip-path: polygon(0 0, 100% 0, 100% 88%, 92% 100%, 84% 88%, 76% 100%, 68% 88%, 60% 100%, 52% 88%, 44% 100%, 36% 88%, 28% 100%, 20% 88%, 12% 100%, 4% 88%, 0 100%); }
      `}} />

      {notificationBanner && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md border border-white/20 text-sm font-medium flex items-center gap-2 animate-bounce">
          <Bell size={16} className="text-amber-400" /> {notificationBanner}
        </div>
      )}

      {/* Sidebar */}
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
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-black/10"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <button onClick={() => { setActiveModal('account'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 text-sm font-medium"><User size={18} className="text-amber-500" /> Profile</button>
          <button onClick={() => { setActiveModal('settings'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 text-sm font-medium"><Settings size={18} className="text-emerald-500" /> Settings</button>
        </div>
        <div className="p-4 border-t border-inherit">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 text-sm font-bold"><LogOut size={18} /> Sign Out</button>
        </div>
      </aside>

      {/* Main Board Area */}
      <div className="relative z-10 flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 px-4 sm:px-6 py-3 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className={`p-2 rounded-xl ${theme === 'night' ? 'bg-white/10 text-white' : 'bg-black/5 text-stone-900'}`}><AlignLeft size={22} /></button>
            <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20"><span className="font-black text-amber-500 text-sm">{points} pts</span></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setGraveyardOpen(true)} className="p-2 rounded-xl bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700 shadow-md">
              <Skull size={22} />
            </button>
            <button onClick={handleCreateTask} className="h-10 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-rose-400 text-white shadow-lg flex items-center gap-2 font-bold text-sm">
              <Plus size={18} strokeWidth={3} /> Add Task
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-5xl mx-auto px-3 py-4 relative">
          <div className="flex items-start gap-3 sm:gap-6 relative">
            <div className="flex flex-col items-center shrink-0 pt-2 z-10">
              <div onClick={() => setActiveModal('treasure')} className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center border-2 border-yellow-100 cursor-pointer hover:scale-110 shadow-lg z-10">
                <Sword className="text-amber-900" />
              </div>
              <div className="w-4 rounded-full -mt-4 shadow-inner bg-gradient-to-b from-amber-400 via-rose-500 to-cyan-500 z-0" style={{ height: `${(activeBoard.rowCount * 95) + 30}px` }} />
            </div>

            <div className="flex-1 flex flex-col pt-12 space-y-1">
              {Array.from({ length: activeBoard.rowCount }).map((_, idx) => {
                const rowId = idx + 1;
                const rowStyle = DYNAMIC_COLORS[Math.min(idx, DYNAMIC_COLORS.length - 1)];
                const rowTasks = tasks.filter(t => t.boardId === activeBoardId && t.rowId === rowId);

                return (
                  <div key={rowId} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropOnRow(e, rowId)} className="min-h-[90px] flex items-stretch py-1.5 rounded-2xl">
                    <div className="flex-1 flex flex-wrap gap-3 items-center min-h-[75px] pl-3">
                      {rowTasks.map((task, index) => (
                        <TaskCard key={task.id} task={task} colorObj={rowStyle} index={index}
                          isDragged={draggedTaskId === task.id} isGrayGhost={grayGhostId === task.id}
                          isAnimating={animatingTasks.includes(task.id)}
                          onClick={() => setEditingTask(task)} onSlash={() => setSlashingTask(task)}
                          onDuplicate={(e) => { e.stopPropagation(); handleDuplicateTask(task); }}
                          onDragStart={handleDragStartTask} onDragEnd={() => setDraggedTaskId(null)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="mt-8 pt-4">
                <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropOnRow(e, 'forgotten')} className={`rounded-3xl p-5 border-2 border-dashed ${theme === 'night' ? 'bg-slate-900/40 border-slate-600/50' : 'bg-white/40 border-stone-300/60'}`}>
                  <div className="flex items-center gap-2 mb-4"><div className="w-3 h-3 rounded-full bg-slate-400" /><h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">No Priority</h3></div>
                  <div className="flex flex-wrap gap-3 min-h-[90px]">
                    {tasks.filter(t => t.rowId === 'forgotten').map((task, index) => (
                      <TaskCard key={task.id} task={task} colorObj={FORGOTTEN_COLOR} index={index} 
                        isDragged={draggedTaskId === task.id} isGrayGhost={grayGhostId === task.id}
                        isAnimating={animatingTasks.includes(task.id)}
                        onClick={() => setEditingTask(task)} onSlash={() => setSlashingTask(task)}
                        onDuplicate={(e) => { e.stopPropagation(); handleDuplicateTask(task); }}
                        onDragStart={handleDragStartTask} onDragEnd={() => setDraggedTaskId(null)}/>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* LEFT-SIDE TRASH ZONE */}
      {draggedTaskId && (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsHoveringTrash(true); }}
          onDragLeave={() => setIsHoveringTrash(false)}
          onDrop={(e) => { e.preventDefault(); handleDeleteTask(draggedTaskId); setDraggedTaskId(null); setIsHoveringTrash(false); }}
          className="fixed left-0 top-0 w-32 h-full z-50 flex items-center justify-center transition-all bg-gradient-to-r from-rose-500/20 to-transparent"
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all shadow-[0_0_40px_rgba(244,63,94,0.6)] ${isHoveringTrash ? 'bg-rose-600 scale-125' : 'bg-rose-500/80 scale-100'}`}>
            <Trash2 size={isHoveringTrash ? 32 : 24} />
          </div>
        </div>
      )}

      {/* GRAVEYARD PANEL */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity ${graveyardOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setGraveyardOpen(false)} />
      <aside className={`fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-zinc-950 border-l border-zinc-800 text-zinc-300 z-50 transform transition-transform duration-300 flex flex-col shadow-2xl ${graveyardOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3"><Skull size={24} className="text-zinc-500" /><h2 className="font-black text-lg tracking-widest uppercase text-zinc-400">Graveyard</h2></div>
          <button onClick={() => setGraveyardOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {deletedTasks.length === 0 && <p className="text-center text-sm opacity-50 mt-10">No spirits wander here.</p>}
          {deletedTasks.map((t) => (
            <div key={t.id} className="relative w-full h-[85px] bg-zinc-800 border-2 border-zinc-700 p-3 flex flex-col justify-between text-zinc-400 broken-bottom overflow-hidden shadow-black shadow-inner">
               <div className="flex justify-between items-start">
                 <h4 className="font-black text-sm truncate w-[70%] text-zinc-300 line-through">{t.title}</h4>
                 <button onClick={() => handleRestoreTask(t)} className="flex items-center gap-1 text-[10px] uppercase font-bold text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded hover:bg-cyan-800/50 border border-cyan-800 z-10 relative">
                   <ShieldPlus size={12} /> Restore
                 </button>
               </div>
               <p className="text-[11px] opacity-70 truncate">{t.subtitle}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* EDIT MODAL with Calendar */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => { if(!editingTask.isNew) setEditingTask(null); else handleDeleteTask(editingTask.id); }} />
          <div className={`relative w-full md:w-1/2 h-full ${theme === 'night' ? 'bg-[#0f1429] text-slate-100' : 'bg-white text-stone-900'} p-6 sm:p-8 flex flex-col justify-between overflow-y-auto border-l border-slate-700/30 animate-in slide-in-from-right duration-300`}>
            <div>
              <div className="flex justify-between pb-4 border-b border-slate-500/20 mb-6">
                <span className="text-xs font-black uppercase bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full">Task Details</span>
                <button onClick={() => { if(editingTask.isNew) handleDeleteTask(editingTask.id); else setEditingTask(null); }} className="p-2 hover:bg-black/10 rounded-full"><X size={20} /></button>
              </div>
              <input type="text" maxLength={20} value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} placeholder="Title" className="w-full text-2xl font-black bg-transparent border-b-2 border-slate-500/30 focus:border-amber-500 focus:outline-none py-1.5 mb-6"/>
              <input type="text" maxLength={50} value={editingTask.subtitle || ''} onChange={(e) => setEditingTask({ ...editingTask, subtitle: e.target.value })} placeholder="Sub title" className="w-full text-sm font-semibold bg-transparent border-b border-slate-500/30 focus:border-amber-500 focus:outline-none py-1.5 mb-6"/>
              <textarea rows={8} value={editingTask.description || ''} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} placeholder="Description..." className={`w-full p-4 rounded-2xl bg-black/5 border focus:ring-2 focus:ring-amber-500 text-sm resize-none mb-6 ${theme === 'night' ? 'border-slate-700' : 'border-stone-200'}`}/>
              
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
                <label className="flex items-center gap-2 text-xs font-bold text-blue-500 mb-2 uppercase"><Clock size={14}/> Set Reminder</label>
                <input type="datetime-local" value={editingTask.reminder || ''} onChange={(e) => setEditingTask({...editingTask, reminder: e.target.value})} className={`w-full bg-black/10 p-2 rounded-lg text-sm font-medium outline-none text-blue-500 ${theme === 'night' ? 'color-scheme-dark' : ''}`} />
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-500/20">
              <button onClick={() => handleDeleteTask(editingTask.id)} className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-500"><Trash2 size={20} /></button>
              <button onClick={() => handleSaveTask(editingTask)} className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-sm shadow-xl flex justify-center gap-2"><Check size={18} /> Save</button>
            </div>
          </div>
        </div>
      )}

      {/* GOLD ROOM */}
      {activeModal === 'treasure' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-2xl h-[85vh] flex flex-col rounded-[2.5rem] overflow-hidden bg-[#1a1040] border-4 border-amber-400/50 shadow-[0_0_100px_rgba(251,191,36,0.4)] animate-in zoom-in-95">
            <div className="p-6 border-b border-amber-500/20 bg-black/40 z-20 flex justify-between items-center">
              <h3 className="font-black text-2xl text-amber-400">Vault</h3>
              <button onClick={() => setActiveModal(null)} className="text-amber-500 p-2"><X size={24} /></button>
            </div>
            
            <div className="flex-1 p-6 z-20 overflow-y-auto">
               <div className="bg-black/40 rounded-3xl p-5 border border-amber-500/20 min-h-full">
                  <h4 className="text-center text-amber-500/70 text-xs font-bold uppercase tracking-widest mb-4">History</h4>
                  {completedTasks.map((ct, i) => (
                    <div key={i} className="flex justify-between p-3 mb-2 bg-amber-900/30 rounded-xl">
                      <div><h5 className="font-bold text-amber-50 text-sm">{ct.title}</h5></div>
                      <div className="text-amber-500 font-bold">+{ct.earnedPoints}</div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="h-64 relative z-10 flex items-end justify-center overflow-hidden border-t border-amber-500/30">
              <div className="absolute inset-0 bg-cover bg-center gold-shimmer brightness-110" style={{ backgroundImage: `url('/moneyz.jpg')` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="relative z-30 mb-8 flex flex-col items-center bg-black/80 px-8 py-4 rounded-full border border-amber-500/30 shadow-[0_0_30px_rgba(251,191,36,0.6)]">
                 <div className="text-5xl font-black text-white">{points} pts</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, colorObj, index, isDragged, isGrayGhost, onClick, onSlash, onDuplicate, onDragStart, onDragEnd }) {
  const lightness = Math.max(20, colorObj.baseL - (index * 4));
  const bgColor = isGrayGhost ? '#64748b' : `hsl(${colorObj.hue}, ${colorObj.sat}%, ${lightness}%)`;
  const textColor = isGrayGhost ? 'text-white' : (lightness > 60 ? 'text-stone-900' : 'text-white');

  if (isDragged) return <div className="hidden" />;

  return (
    <div draggable onDragStart={(e) => onDragStart(e, task.id)} onDragEnd={onDragEnd} onClick={onClick} style={{ backgroundColor: bgColor }} className={`relative w-[170px] shrink-0 h-[75px] rounded-2xl p-2.5 cursor-pointer shadow-md flex flex-col justify-between ${textColor} border-2 border-transparent group hover:scale-105 transition-transform`}>
      <div className="flex justify-between gap-1">
        <h4 className="font-black text-sm truncate w-[60%]">{task.title}</h4>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onDuplicate} className="p-1 bg-black/10 hover:bg-black/20 rounded-md"><Copy size={12}/></button>
          <button onClick={(e) => { e.stopPropagation(); onSlash(); }} className="p-1 bg-black/10 hover:bg-black/20 rounded-md"><Sword size={12}/></button>
        </div>
      </div>
      <div className="flex justify-between mt-auto">
        <p className="text-[11px] truncate w-[80%]">{task.subtitle}</p>
        {task.reminder && <Clock size={12} />}
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
}
