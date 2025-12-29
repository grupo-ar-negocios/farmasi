import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative bg-white sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-5xl shadow-2xl transform transition-all flex flex-col max-h-[100vh] sm:max-h-[90vh] animate-in sm:fade-in sm:zoom-in-95 slide-in-from-bottom sm:slide-in-from-top-0 duration-300 border border-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white sm:rounded-t-2xl z-10 sticky top-0">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};