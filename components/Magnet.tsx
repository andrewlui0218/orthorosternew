import React from 'react';
import { StaffMember } from '../types';

interface MagnetProps {
  staff: StaffMember;
  onClick?: () => void;
  isSelected?: boolean;
  forceDesktop?: boolean;
}

export const Magnet: React.FC<MagnetProps> = ({ 
  staff, 
  onClick,
  isSelected,
  forceDesktop = false
}) => {
  // Determine style based on role for professional clarity
  // PT = Indigo/Blue tone, Support = Emerald/Teal tone
  const roleStyles = staff.role === 'PT' 
    ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const selectedStyles = isSelected 
    ? 'ring-2 ring-blue-600 ring-offset-1 shadow-md z-10 bg-white border-blue-600 text-blue-800' 
    : 'hover:shadow-sm hover:border-gray-300';

  // Helper for responsive classes
  const cx = (mobile: string, desktop: string) => forceDesktop ? desktop : `${mobile} md:${desktop}`;

  return (
    <div
      onClick={onClick}
      className={`
        relative 
        ${cx('px-2 py-1', 'px-3 py-1.5')}
        rounded-md border
        ${isSelected ? selectedStyles : roleStyles}
        ${onClick ? 'cursor-pointer active:scale-95' : ''}
        select-none
        transition-all duration-200
        text-center font-medium
        ${cx('text-[10px]', 'text-sm')} 
        uppercase tracking-wide
        whitespace-nowrap overflow-hidden text-ellipsis max-w-full
        flex items-center justify-center
      `}
    >
      {/* Tiny indicator dot for role */}
      <div className={`
        rounded-full mr-1.5 shrink-0
        ${cx('w-1 h-1', 'w-1.5 h-1.5')}
        ${staff.role === 'PT' ? 'bg-indigo-400' : 'bg-emerald-400'}
      `}></div>
      {staff.name}
    </div>
  );
};