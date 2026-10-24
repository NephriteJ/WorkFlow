import React, { useState, useRef } from 'react';
import { 
  X, Trash2, Plus, MinusCircle, PlusCircle, 
  Settings2, Edit2
} from 'lucide-react';

// --- CONSTANTS & HELPERS ---
const getRandomDiamondColor = (index) => {
  const hues = [345, 355, 5, 335, 15]; 
  const h = hues[index % hues.length];
  const s = 85 + Math.random() * 15; 
  const l = 45 + Math.random() * 15; 
  return `hsl(${h}, ${s}%, ${l}%)`;
};

export default function DiamondGame({ onClose }) {
  // --- WHEEL STATE ---
  const [names, setNames] = useState([
    { id: 'n1', text: 'Player 1', color: getRandomDiamondColor(0) },
    { id: 'n2', text: 'Player 2', color: getRandomDiamondColor(1) },
    { id: 'n3', text: 'Player 3', color: getRandomDiamondColor(2) }
  ]);
  const [newName, setNewName] = useState('');
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);

  // --- GRID STATE (Starts 2 cols x 20 rows) ---
  const [colCount, setColCount] = useState(2);
  const [grid, setGrid] = useState(() => {
    return Array.from({ length: 20 }, (_, rIdx) => 
      Array.from({ length: 2 }, (_, cIdx) => ({
        id: `r${rIdx}c${cIdx}`, text: '', isBold: false, colSpan: 1, isHidden: false
      }))
    );
  });

  // --- WHEEL LOGIC ---
  const handleAddName = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setNames([...names, { id: Date.now().toString(), text: newName.trim(), color: getRandomDiamondColor(names.length) }]);
    setNewName('');
  };

  const handleRemoveName = (id) => {
    setNames(names.filter(n => n.id !== id));
  };

  const handleUpdateName = (id, newText) => {
    setNames(names.map(n => n.id === id ? { ...n, text: newText } : n));
  };

  const spinWheel = () => {
    if (names.length === 0 || isSpinning) return;
    setIsSpinning(true);
    setWinner(null);

    const extraSpins = Math.floor(Math.random() * 5) + 5; 
    const randomOffset = Math.floor(Math.random() * 360);
    const newRotation = rotation + (extraSpins * 360) + randomOffset;
    
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const normalizedRotation = newRotation % 360;
      const sliceAngle = 360 / names.length;
      let winningAngle = (360 - normalizedRotation) % 360;
      if (winningAngle < 0) winningAngle += 360;
      
      const winningIndex = Math.floor(winningAngle / sliceAngle);
      setWinner(names[winningIndex]);
    }, 4000); 
  };

  const handleKeepWinner = () => setWinner(null);

  const handleRemoveWinner = () => {
    setNames(names.filter(n => n.id !== winner.id));
    setWinner(null);
  };

  const getConicGradient = () => {
    if (names.length === 0) return 'conic-gradient(#333 0deg, #555 360deg)';
    const sliceAngle = 360 / names.length;
    let gradientParts = [];
    for (let i = 0; i < names.length; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      gradientParts.push(`${names[i].color} ${startAngle}deg ${endAngle}deg`);
    }
    return `conic-gradient(${gradientParts.join(', ')})`;
  };
  // --- GRID LOGIC ---
  const handleAddRow = () => {
    setGrid([...grid, Array.from({ length: colCount }, (_, cIdx) => ({
      id: `r${grid.length}c${cIdx}_${Date.now()}`, text: '', isBold: false, colSpan: 1, isHidden: false
    }))]);
  };

  const handleRemoveRow = () => {
    if (grid.length > 1) setGrid(grid.slice(0, -1));
  };

  const handleAddCol = () => {
    setColCount(c => c + 1);
    setGrid(grid.map((row, rIdx) => [
      ...row, 
      { id: `r${rIdx}c${colCount}_${Date.now()}`, text: '', isBold: false, colSpan: 1, isHidden: false }
    ]));
  };

  const handleRemoveCol = () => {
    if (colCount > 1) {
      setColCount(c => c - 1);
      setGrid(grid.map(row => {
        const newRow = [...row];
        newRow.pop(); 
        return newRow;
      }));
    }
  };

  const updateCell = (rIdx, cIdx, updates) => {
    setGrid(grid.map((row, i) => 
      i === rIdx ? row.map((cell, j) => j === cIdx ? { ...cell, ...updates } : cell) : row
    ));
  };

  // Smart text combiner: adds space only if both have text
  const combineText = (text1, text2) => {
    if (text1 && text2) return `${text1} ${text2}`;
    return text1 || text2 || '';
  };

  // MERGE RIGHT: Cell 1 takes Cell 2. Result text: "Cell1 Cell2"
  const handleMergeRight = (rIdx, cIdx) => {
    setGrid(grid.map((row, i) => {
      if (i !== rIdx) return row;
      const newRow = [...row];
      const currentCell = newRow[cIdx];
      
      let nextIdx = cIdx + 1;
      while (nextIdx < colCount && newRow[nextIdx].isHidden) nextIdx++;
      
      if (nextIdx < colCount) {
        const nextCell = newRow[nextIdx];
        newRow[cIdx] = { 
          ...currentCell, 
          colSpan: currentCell.colSpan + nextCell.colSpan,
          text: combineText(currentCell.text, nextCell.text)
        };
        newRow[nextIdx] = { ...nextCell, isHidden: true, text: '' };
      }
      return newRow;
    }));
  };

  // MERGE LEFT: Cell 2 goes into Cell 1. Result text: "Cell2 Cell1"
  const handleMergeLeft = (rIdx, cIdx) => {
    setGrid(grid.map((row, i) => {
      if (i !== rIdx) return row;
      const newRow = [...row];
      
      let prevIdx = cIdx - 1;
      while (prevIdx >= 0 && newRow[prevIdx].isHidden) prevIdx--;
      
      if (prevIdx >= 0) {
        const prevCell = newRow[prevIdx];
        const currentCell = newRow[cIdx];
        
        // The left-most cell (prevCell) must remain the visible one for HTML colSpan to work
        newRow[prevIdx] = { 
          ...prevCell, 
          colSpan: prevCell.colSpan + currentCell.colSpan,
          text: combineText(currentCell.text, prevCell.text)
        };
        newRow[cIdx] = { ...currentCell, isHidden: true, text: '' };
      }
      return newRow;
    }));
  };

  // UNGROUP: Restores hidden cells if this block spans multiple columns
  const handleUngroup = (rIdx, cIdx) => {
    setGrid(grid.map((row, i) => {
      if (i !== rIdx) return row;
      const newRow = [...row];
      const currentCell = newRow[cIdx];
      const span = currentCell.colSpan;
      
      if (span > 1) {
        newRow[cIdx] = { ...currentCell, colSpan: 1 };
        let unhiddenCount = 0;
        // Unhide the exact number of cells that were absorbed
        for (let k = cIdx + 1; k < colCount && unhiddenCount < span - 1; k++) {
          if (newRow[k].isHidden) {
            newRow[k] = { ...newRow[k], isHidden: false, colSpan: 1, text: '' };
            unhiddenCount++;
          }
        }
      }
      return newRow;
    }));
  };

  // Row Batch Actions
  const handleRowAction = (rIdx, action) => {
    setGrid(grid.map((row, i) => {
      if (i !== rIdx) return row;
      const allBold = row.every(c => c.isHidden || c.isBold);
      return row.map(cell => {
        if (action === 'bold') return { ...cell, isBold: !allBold };
        if (action === 'clear') return { ...cell, text: '' };
        return cell;
      });
    }));
  };

  // Column Batch Actions
  const handleColAction = (cIdx, action) => {
    setGrid(grid.map(row => row.map((cell, j) => {
      if (j !== cIdx) return cell;
      return action === 'bold' ? { ...cell, isBold: !cell.isBold } : { ...cell, text: '' };
    })));
  };
  // --- RENDERING ---
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-br from-slate-950 via-rose-950 to-slate-950 text-white overflow-y-auto overflow-x-hidden font-sans">
      
      {/* HEADER WITH NEW RED DIAMOND LOGO */}
      <div className="sticky top-0 z-50 flex items-center justify-between p-4 sm:p-6 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-rose-600 drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]">
              <path d="M12 2L2 12l10 10 10-10L12 2z"/>
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">Diamond Destinies</h2>
        </div>
        <button onClick={onClose} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm">
          <X size={24} strokeWidth={3} />
        </button>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-12 pb-32">
        
        {/* TOP SECTION: WHEEL & NAMES */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center pt-4">
           
           {/* THE WHEEL CONTAINER */}
           <div className="w-full lg:w-1/2 flex flex-col items-center">
              <div className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] flex-shrink-0">
                 {/* Pointer/Pin */}
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-10 bg-amber-400" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
                 
                 {/* The Wheel with Names Inside */}
                 <div 
                   className="w-full h-full rounded-full border-8 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transition-transform duration-[4000ms] ease-[cubic-bezier(0.15,0.85,0.15,1)] relative"
                   style={{ 
                     background: getConicGradient(), 
                     transform: `rotate(${rotation}deg)` 
                   }}
                 >
                    {/* Map Names onto the slices */}
                    {names.length > 0 && names.map((name, i) => {
                      const sliceAngle = 360 / names.length;
                      const nameRotation = i * sliceAngle + sliceAngle / 2;
                      return (
                        <div 
                          key={`wheel_txt_${name.id}`} 
                          className="absolute inset-0 flex items-start justify-center pt-6 sm:pt-10 origin-center pointer-events-none z-10"
                          style={{ transform: `rotate(${nameRotation}deg)` }}
                        >
                          <span className="font-black text-white text-xs sm:text-sm tracking-wider drop-shadow-md truncate w-20 sm:w-28 text-center" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                            {name.text}
                          </span>
                        </div>
                      );
                    })}
                    {/* Inner styling ring */}
                    <div className="absolute inset-0 rounded-full border-[12px] border-black/20 pointer-events-none z-20"></div>
                 </div>

                 {/* Center Spin Button */}
                 <button 
                   onClick={spinWheel} 
                   disabled={isSpinning || names.length === 0}
                   className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-rose-500 to-rose-700 hover:from-rose-400 hover:to-rose-600 rounded-full flex items-center justify-center font-black text-lg sm:text-xl uppercase tracking-wider shadow-2xl border-4 border-rose-950 active:scale-95 transition-all disabled:opacity-50 z-30"
                 >
                   SPIN
                 </button>
              </div>
           </div>

           {/* NAME MANAGEMENT */}
           <div className="w-full lg:w-1/2 bg-black/30 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
             <h3 className="text-lg font-black uppercase tracking-wider mb-4 flex items-center gap-2">
               <Settings2 size={20} className="text-amber-400"/> Wheel Entries ({names.length})
             </h3>
             
             <form onSubmit={handleAddName} className="flex gap-2 mb-6">
               <input 
                 type="text" value={newName} onChange={(e) => setNewName(e.target.value)} 
                 placeholder="Enter a name..." 
                 className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-rose-500 transition-colors placeholder-white/30 font-semibold"
               />
               <button type="submit" className="bg-rose-600 hover:bg-rose-500 px-4 rounded-xl font-bold flex items-center justify-center transition-colors">
                 <Plus size={20} strokeWidth={3} />
               </button>
             </form>

             <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
               {names.map((name) => (
                 <div key={name.id} className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-xl group">
                   <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: name.color }}></div>
                   <input 
                     type="text" value={name.text} 
                     onChange={(e) => handleUpdateName(name.id, e.target.value)}
                     className="flex-1 bg-transparent outline-none font-bold text-sm sm:text-base border-b border-transparent focus:border-white/30 transition-colors"
                   />
                   <button onClick={() => handleRemoveName(name.id)} className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-colors opacity-50 group-hover:opacity-100">
                     <Trash2 size={16} />
                   </button>
                 </div>
               ))}
               {names.length === 0 && <p className="text-center opacity-50 italic py-4">Add names to populate the wheel</p>}
             </div>
           </div>
        </div>

        {/* WINNER MODAL */}
        {winner && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div className="relative bg-slate-900 border border-rose-500/30 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_100px_rgba(225,29,72,0.4)] animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 mx-auto rounded-full mb-6 border-4 border-slate-800 shadow-xl" style={{ backgroundColor: winner.color }}></div>
              <h4 className="text-amber-400 font-bold uppercase tracking-widest text-sm mb-2">The Wheel has spoken</h4>
              <h2 className="text-4xl font-black text-white mb-8 drop-shadow-md">{winner.text}</h2>
              <div className="flex gap-4">
                 <button onClick={handleRemoveWinner} className="flex-1 py-4 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl font-bold transition-all border border-rose-600/50">
                   Remove from Wheel
                 </button>
                 <button onClick={handleKeepWinner} className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-xl font-black transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                   Keep & Continue
                 </button>
              </div>
            </div>
          </div>
        )}
        {/* BOTTOM SECTION: DYNAMIC GRID TABLE */}
        <div className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl overflow-x-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 min-w-[600px] gap-4">
             <h3 className="text-lg font-black uppercase tracking-wider flex items-center gap-2">
               <Edit2 size={20} className="text-amber-400"/> Dynamic Grid
             </h3>
             
             {/* ADD / REMOVE ROWS & COLS */}
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5">
                 <span className="text-xs font-bold uppercase opacity-50 px-2">Columns</span>
                 <button onClick={handleRemoveCol} className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"><MinusCircle size={18}/></button>
                 <span className="font-black px-2">{colCount}</span>
                 <button onClick={handleAddCol} className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"><PlusCircle size={18}/></button>
               </div>
               <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5">
                 <span className="text-xs font-bold uppercase opacity-50 px-2">Rows</span>
                 <button onClick={handleRemoveRow} className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"><MinusCircle size={18}/></button>
                 <span className="font-black px-2">{grid.length}</span>
                 <button onClick={handleAddRow} className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"><PlusCircle size={18}/></button>
               </div>
             </div>
          </div>

          {/* THE GRID */}
          <div className="min-w-[800px]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-16 p-2"></th>
                  {Array.from({ length: colCount }).map((_, cIdx) => (
                    <th key={cIdx} className="p-2">
                      <div className="flex justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity bg-black/20 rounded-lg py-1">
                        <button onClick={() => handleColAction(cIdx, 'bold')} className="p-1.5 hover:text-amber-400 font-black text-xs transition-colors" title="Bold Column">B</button>
                        <button onClick={() => handleColAction(cIdx, 'clear')} className="p-1.5 hover:text-rose-400 transition-colors" title="Clear Column"><Trash2 size={14}/></button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="w-16 p-2 align-middle">
                      <div className="flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity bg-black/20 rounded-lg px-1 py-2">
                        <button onClick={() => handleRowAction(rIdx, 'bold')} className="p-1.5 hover:text-amber-400 font-black text-xs transition-colors" title="Bold Row">B</button>
                        <button onClick={() => handleRowAction(rIdx, 'clear')} className="p-1.5 hover:text-rose-400 transition-colors" title="Clear Row"><Trash2 size={14}/></button>
                      </div>
                    </td>
                    {row.map((cell, cIdx) => {
                      if (cell.isHidden) return null;
                      return (
                        <td key={cell.id} colSpan={cell.colSpan} className="p-2 transition-all">
                          <div className="flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-amber-400/50 focus-within:bg-white/10 transition-colors shadow-sm">
                            <div className="flex items-center justify-between bg-black/30 p-1 border-b border-white/5">
                              <div className="flex items-center">
                                <button onClick={() => updateCell(rIdx, cIdx, { isBold: !cell.isBold })} className={`p-1.5 rounded hover:bg-white/10 text-xs font-black transition-colors ${cell.isBold ? 'text-rose-500' : 'text-white/50'}`}>B</button>
                                <button onClick={() => updateCell(rIdx, cIdx, { text: '' })} className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400 transition-colors"><Trash2 size={12}/></button>
                              </div>
                              <div className="flex items-center">
                                <button onClick={() => handleMergeLeft(rIdx, cIdx)} className="p-1.5 rounded hover:bg-white/10 text-white/50 font-bold text-xs" title="Merge Left">{'<'}</button>
                                
                                {/* ONLY SHOW UNGROUP BUTTON IF MERGED */}
                                {cell.colSpan > 1 && (
                                  <button onClick={() => handleUngroup(rIdx, cIdx)} className="p-1.5 rounded hover:bg-white/10 text-amber-400 font-black text-[11px]" title="Ungroup Block">{'><'}</button>
                                )}
                                
                                <button onClick={() => handleMergeRight(rIdx, cIdx)} className="p-1.5 rounded hover:bg-white/10 text-white/50 font-bold text-xs" title="Merge Right">{'>'}</button>
                              </div>
                            </div>
                            <textarea
                              rows={2}
                              value={cell.text}
                              onChange={(e) => updateCell(rIdx, cIdx, { text: e.target.value })}
                              className={`w-full bg-transparent p-3 outline-none resize-none text-sm placeholder-white/20 ${cell.isBold ? 'font-black text-rose-500 drop-shadow-sm' : 'font-medium text-white/90'}`}
                              placeholder="Type here..."
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
