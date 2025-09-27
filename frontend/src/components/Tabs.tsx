import React from 'react';

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap
        ${isActive
          ? 'border-cyan-600 text-cyan-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
      `}
    >
      {label}
    </button>
  );
};

interface TabsProps {
  children: React.ReactElement<TabProps>[];
}

export const Tabs: React.FC<TabsProps> = ({ children }) => {
  return (
    <div className="border-b border-gray-200">
      <nav 
        className="-mb-px flex space-x-6 overflow-x-auto" 
        aria-label="Tabs"
        // Add a little extra padding on the sides for better spacing
        style={{ paddingLeft: '1rem', paddingRight: '1rem' }} 
      >
        {children}
      </nav>
    </div>
  );
};

export { Tab };