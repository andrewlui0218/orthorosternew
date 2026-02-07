import { useState, useRef, useCallback, useMemo } from 'react';
import { Download, RotateCcw, Users, Loader2, X, Share2, Save, FileSpreadsheet } from 'lucide-react';
import { INITIAL_STAFF, SESSIONS } from './constants';
import { StaffMember, RosterState } from './types';
import { Magnet } from './components/Magnet';
import { RosterBoard } from './components/RosterBoard';
import { generateRosterBlob, downloadBlob } from './services/imageExporter';

export default function App() {
  const exportRef = useRef<HTMLDivElement>(null);
  
  // State
  const [roster, setRoster] = useState<RosterState>({});
  const [activeTab, setActiveTab] = useState<'PT' | 'Support'>('PT');
  const [staffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [isExporting, setIsExporting] = useState(false);
  const [exportBlob, setExportBlob] = useState<Blob | null>(null);
  
  // Selection state for "Stamp" mode
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const selectedStaffMember = useMemo(() => 
    staffList.find(s => s.id === selectedStaffId), 
  [selectedStaffId, staffList]);

  // Helper to get staff by role (allows multiple assignments)
  const getStaffByRole = useCallback((role: 'PT' | 'Support') => {
    return staffList.filter(s => s.role === role);
  }, [staffList]);

  // Calculate FTE for Physio staff
  const physioFTE = useMemo(() => {
    let count = 0;
    Object.values(roster).forEach(staffIds => {
      staffIds.forEach(id => {
        const staff = staffList.find(s => s.id === id);
        if (staff?.role === 'PT') {
          count++;
        }
      });
    });
    return count * 0.25;
  }, [roster, staffList]);

  // Validation Logic
  const isValidPlacement = (staff: StaffMember, columnId: string): { valid: boolean; error?: string } => {
    const isPcaColumn = columnId === 'PCA' || columnId.endsWith('PCA');
    
    if (staff.role === 'PT' && isPcaColumn) {
      return { valid: false, error: "Physiotherapists (PT) cannot be placed in the PCA column." };
    }
    if (staff.role === 'Support' && !isPcaColumn) {
      return { valid: false, error: "Support staff (PCA) cannot be placed in PT columns." };
    }
    return { valid: true };
  };

  // --- Click Handlers ---

  const handleStaffClick = (id: string) => {
    setSelectedStaffId(prev => prev === id ? null : id);
  };

  const handleGridCellClick = (cellId: string) => {
    if (!selectedStaffId) return;
    const staff = staffList.find(s => s.id === selectedStaffId);
    if (!staff) return;

    const columnId = cellId.split('-').slice(1).join('-');
    const validation = isValidPlacement(staff, columnId);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setRoster(prev => {
      const currentCell = prev[cellId] || [];
      // Toggle logic: remove if exists, add if not
      if (currentCell.includes(selectedStaffId)) {
        return {
          ...prev,
          [cellId]: currentCell.filter(id => id !== selectedStaffId)
        };
      } else {
        return {
          ...prev,
          [cellId]: [...currentCell, selectedStaffId]
        };
      }
    });
  };

  const handleColumnHeaderClick = (colId: string) => {
    if (!selectedStaffId) return;

    const staff = staffList.find(s => s.id === selectedStaffId);
    if (!staff) return;

    const validation = isValidPlacement(staff, colId);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setRoster(prev => {
      const newRoster = { ...prev };
      SESSIONS.forEach(session => {
        const cellId = `${session}-${colId}`;
        const currentCell = newRoster[cellId] || [];
        if (!currentCell.includes(selectedStaffId)) {
          newRoster[cellId] = [...currentCell, selectedStaffId];
        }
      });
      return newRoster;
    });
  };

  // --- Export Logic ---

  const handleExport = async () => {
    setIsExporting(true);
    setSelectedStaffId(null);
    setExportBlob(null);

    // Short delay to let UI update
    setTimeout(async () => {
      if (exportRef.current) {
        const blob = await generateRosterBlob(exportRef.current);
        if (blob) {
            const fileName = `roster-${new Date().toISOString().split('T')[0]}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            
            // Try Native Share First (Mobile "Save to Photos" workflow)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Daily Staff Roster',
                        text: 'Here is today\'s roster.'
                    });
                    setIsExporting(false); // Done if shared successfully
                    return; 
                } catch (err) {
                    console.log('Share cancelled or failed, falling back to modal', err);
                }
            }

            // Fallback: Show Modal
            setExportBlob(blob);
        }
      }
      setIsExporting(false);
    }, 100);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear the entire roster?')) {
      setRoster({});
      setSelectedStaffId(null);
    }
  };

  const displayedStaff = getStaffByRole(activeTab);

  return (
    // Use 100dvh (Dynamic Viewport Height) to ensure full mobile screen usage without address bar issues
    <div className="h-[100dvh] w-full bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900 overflow-hidden relative">
      
      {/* Loading Overlay */}
      {isExporting && (
        <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-400" />
          <p className="text-lg font-medium animate-pulse">Processing Roster...</p>
        </div>
      )}

      {/* Export Success Modal (Fallback) */}
      {exportBlob && (
        <div className="absolute inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h3 className="font-semibold text-lg text-slate-800">Export Ready</h3>
                    <button onClick={() => setExportBlob(null)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-6 flex-1 overflow-auto bg-slate-50 flex items-center justify-center">
                    <img 
                        src={URL.createObjectURL(exportBlob)} 
                        alt="Roster Export" 
                        className="max-w-full shadow-lg border border-gray-200 rounded-md" 
                    />
                </div>
                <div className="p-4 border-t border-gray-100 bg-white text-center">
                    <p className="text-sm text-slate-500 mb-4">
                        <span className="md:hidden">Long-press to save to Photos</span>
                        <span className="hidden md:inline">Right-click to Save Image</span>
                    </p>
                    <button 
                        onClick={() => downloadBlob(exportBlob, `roster-${new Date().toISOString().split('T')[0]}.jpg`)}
                        className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                    >
                        <Save className="w-4 h-4" /> Save to Device
                    </button>
                </div>
             </div>
        </div>
      )}

      {/* --- HIDDEN EXPORT BOARD (FIXED 4:3 RATIO: 1280x960) --- */}
      <div 
        style={{ position: 'absolute', top: -9999, left: -9999, width: '1280px', height: '960px', zIndex: -10 }}
      >
        <RosterBoard 
          ref={exportRef}
          roster={roster}
          staffList={staffList}
          physioFTE={physioFTE}
          selectedStaffId={null} 
          forceDesktop={true} // Triggers desktop layout styles
        />
      </div>

      {/* --- DESKTOP SIDEBAR (Hidden on mobile) --- */}
      <div 
        className="hidden md:flex w-80 bg-white border-r border-gray-200 flex-col shadow-lg z-20 shrink-0 h-full"
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
             <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                 <FileSpreadsheet className="w-5 h-5" />
             </div>
             <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">Staff Roster</h1>
                <p className="text-xs text-slate-500">Daily Assignment Board</p>
             </div>
          </div>
          
          {/* Desktop "Placing" Indicator in Pool Area */}
          <div className="mb-4 h-10 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100">
             {selectedStaffMember ? (
               <div className="flex items-center gap-2 text-sm">
                 <span className="text-slate-500">Placing:</span>
                 <span className={`font-semibold px-2 py-0.5 rounded ${selectedStaffMember.role === 'PT' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {selectedStaffMember.name}
                 </span>
               </div>
             ) : (
               <p className="text-xs text-slate-400">Select a staff member to assign</p>
             )}
          </div>
          
          <div className="flex p-1 bg-slate-100 rounded-lg">
            {(['PT', 'Support'] as const).map(role => (
              <button
                key={role}
                onClick={() => { setActiveTab(role); setSelectedStaffId(null); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === role 
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {role === 'PT' ? 'Physiotherapist' : 'Support / PCA'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 grid grid-cols-2 gap-2 content-start">
          {displayedStaff.map(staff => (
            <Magnet 
              key={staff.id}
              staff={staff} 
              onClick={() => handleStaffClick(staff.id)}
              isSelected={selectedStaffId === staff.id}
            />
          ))}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col gap-3">
          <button 
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export Image
          </button>
          <button 
            type="button" 
            onClick={handleReset} 
            className="w-full py-2 bg-white border border-gray-200 text-slate-600 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Clear Board
          </button>
        </div>
      </div>

      {/* --- MAIN AREA --- */}
      <div className="flex-1 bg-slate-100 relative flex flex-col h-full overflow-hidden">
        
        {/* Board Container - Takes up remaining height */}
        <div className="flex-1 overflow-hidden p-2 md:p-6 flex flex-col justify-center">
           <RosterBoard 
             roster={roster}
             staffList={staffList}
             physioFTE={physioFTE}
             selectedStaffId={selectedStaffId}
             onColumnClick={handleColumnHeaderClick}
             onCellClick={handleGridCellClick}
             forceDesktop={false}
           />
        </div>

        {/* --- MOBILE CONTROLS / STAFF POOL --- */}
        {/* Fixed height (30dvh) bottom sheet */}
        <div 
          className="md:hidden bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-20 shrink-0 h-[32dvh] flex flex-col border-t border-gray-100" 
        >
           {/* Handle */}
           <div className="w-full flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
           </div>

          {/* Header Row: Actions & Toggles */}
          <div className="flex items-center justify-between px-3 pb-2 shrink-0">
             {/* Left: Action Buttons */}
             <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={handleReset} 
                  className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"
                  aria-label="Reset"
                >
                   <RotateCcw className="w-5 h-5" />
                </button>
                <button 
                  type="button" 
                  onClick={handleExport} 
                  disabled={isExporting}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                  aria-label="Export"
                >
                   {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                </button>
             </div>

             {/* Center: Placing Indicator */}
             <div className="flex-1 flex justify-center px-2">
               {selectedStaffMember && (
                 <div className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm animate-pulse flex items-center gap-1
                    ${selectedStaffMember.role === 'PT' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}
                 `}>
                   <span>Assigning:</span>
                   <span>{selectedStaffMember.name}</span>
                 </div>
               )}
             </div>
             
             {/* Right: Role Toggles */}
             <div className="flex bg-slate-100 rounded-lg p-0.5">
               {(['PT', 'Support'] as const).map(role => (
                 <button
                   key={role}
                   onClick={() => { setActiveTab(role); setSelectedStaffId(null); }}
                   className={`px-3 py-1.5 text-[10px] font-semibold rounded-md transition-all ${
                     activeTab === role ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                   }`}
                 >
                   {role === 'PT' ? 'PT' : 'PCA'}
                 </button>
               ))}
             </div>
          </div>

          {/* Scrollable Staff Grid */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 pt-1 bg-white grid grid-cols-3 xs:grid-cols-4 gap-2 content-start">
             {displayedStaff.map(staff => (
               <div key={staff.id} className="select-none">
                 <Magnet
                    staff={staff}
                    onClick={() => handleStaffClick(staff.id)}
                    isSelected={selectedStaffId === staff.id}
                 />
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}