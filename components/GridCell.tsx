import React from 'react';
import { StaffMember } from '../types';
import { Magnet } from './Magnet';

interface GridCellProps {
  id: string;
  staffInCell: StaffMember[];
  onClick?: () => void;
  isHighlighted?: boolean;
  forceDesktop?: boolean;
}

export const GridCell: React.FC<GridCellProps> = ({ 
  id, 
  staffInCell, 
  onClick,
  isHighlighted,
  forceDesktop = false
}) => {

  // Helper for responsive padding
  const pClass = forceDesktop ? 'p-1' : 'p-0.5 md:p-1';

  return (
    <div
      onClick={onClick}
      data-cell-id={id}
      className={`
        h-full w-full 
        flex flex-col items-center justify-center ${pClass}
        transition-colors duration-200 overflow-hidden
        ${isHighlighted ? 'bg-blue-50/80 ring-inset ring-2 ring-blue-200' : 'hover:bg-gray-50'}
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      <div className="flex flex-wrap justify-center content-center w-full gap-1 pointer-events-none">
        {/* Pointer events none on wrapper, auto on children to ensure clicks pass through correctly or target magnets */}
        {staffInCell.map((staff) => (
          <div key={staff.id} className="pointer-events-auto">
            <Magnet
              staff={staff}
              forceDesktop={forceDesktop}
            />
          </div>
        ))}
      </div>
    </div>
  );
};