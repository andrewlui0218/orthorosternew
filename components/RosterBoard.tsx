import { forwardRef } from 'react';
import { StaffMember, RosterState } from '../types';
import { GridCell } from './GridCell';
import { SESSIONS, COLUMNS } from '../constants';

interface RosterBoardProps {
  roster: RosterState;
  staffList: StaffMember[];
  physioFTE: number;
  selectedStaffId: string | null;
  onColumnClick?: (colId: string) => void;
  onCellClick?: (cellId: string) => void;
  forceDesktop?: boolean;
}

export const RosterBoard = forwardRef<HTMLDivElement, RosterBoardProps>(({
  roster,
  staffList,
  physioFTE,
  selectedStaffId,
  onColumnClick,
  onCellClick,
  forceDesktop = false
}, ref) => {

  // Helper function to switch classes based on mode
  const cx = (mobile: string, desktop: string) => forceDesktop ? desktop : `${mobile} md:${desktop}`;

  return (
    <div 
      ref={ref}
      className={`flex-1 flex flex-col bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden w-full`}
    >
      {/* Top Header Row (Teams) */}
      <div className={`grid ${cx('grid-cols-[2rem_repeat(5,1fr)]', 'grid-cols-[4rem_repeat(5,1fr)]')} border-b border-gray-200 bg-slate-50 shrink-0`}>
           <div className={`border-r border-gray-200 bg-white`}></div>
           <div className={`col-span-2 text-center text-slate-700 font-semibold uppercase tracking-wider ${cx('text-[10px]', 'text-sm')} ${cx('py-1', 'py-3')} border-r border-gray-200`}>Team 1</div>
           <div className={`col-span-2 text-center text-slate-700 font-semibold uppercase tracking-wider ${cx('text-[10px]', 'text-sm')} ${cx('py-1', 'py-3')} border-r border-gray-200`}>Team 2</div>
           <div className="col-span-1 bg-slate-50"></div>
      </div>

      {/* Column Headers */}
      <div className={`grid ${cx('grid-cols-[2rem_repeat(5,1fr)]', 'grid-cols-[4rem_repeat(5,1fr)]')} border-b border-gray-200 bg-white shrink-0 shadow-sm z-10`}>
        <div className={`border-r border-gray-200 bg-slate-50 flex items-center justify-center`}>
            <span className={`${cx('text-[8px]', 'text-xs')} text-slate-400 font-mono`}>SES</span>
        </div>
        {COLUMNS.map((col, idx) => (
          <div 
            key={col.id}
            onClick={() => onColumnClick && onColumnClick(col.id)}
            className={`
              text-center font-medium ${cx('text-[9px] sm:text-[10px]', 'text-sm')} ${cx('py-1.5', 'py-3')} truncate px-1
              text-slate-600
              ${idx < COLUMNS.length - 1 ? 'border-r border-gray-200' : ''}
              transition-colors duration-150
              ${selectedStaffId ? 'bg-blue-50/50 text-blue-700 cursor-pointer hover:bg-blue-100' : ''}
            `}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Rows Container */}
      <div className="flex-1 flex flex-col min-h-0 bg-white divide-y divide-gray-100">
        {SESSIONS.map((session, sIdx) => (
          <div 
            key={session} 
            className={`flex-1 grid ${cx('grid-cols-[2rem_repeat(5,1fr)]', 'grid-cols-[4rem_repeat(5,1fr)]')} min-h-0`}
          >
            {/* Row Label */}
            <div className={`flex items-center justify-center font-medium text-slate-500 ${cx('text-[9px]', 'text-sm')} border-r border-gray-200 bg-slate-50/50`}>
              {session}
            </div>
            
            {/* Cells */}
            {COLUMNS.map((col, cIdx) => {
              const cellId = `${session}-${col.id}`;
              const staffIds = roster[cellId] || [];
              const staffInCell = staffIds.map(id => staffList.find(s => s.id === id)).filter((s): s is StaffMember => !!s);
              return (
                <div key={cellId} className={`min-h-0 overflow-hidden ${cIdx < COLUMNS.length - 1 ? 'border-r border-gray-100' : ''}`}>
                  <GridCell
                    id={cellId}
                    staffInCell={staffInCell}
                    onClick={onCellClick ? () => onCellClick(cellId) : undefined}
                    isHighlighted={!!selectedStaffId}
                    forceDesktop={forceDesktop}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className={`flex items-center justify-between border-t border-gray-200 bg-slate-50 ${cx('py-1 px-2', 'py-2 px-4')} shrink-0`}>
         <div className={`${cx('text-[8px]', 'text-xs')} text-slate-400`}>{new Date().toLocaleDateString()}</div>
         <div className={`${cx('text-xs', 'text-lg')} font-semibold text-slate-700`}>Physio FTE: <span className="text-blue-600">{physioFTE.toFixed(2)}</span></div>
      </div>
    </div>
  );
});

RosterBoard.displayName = 'RosterBoard';