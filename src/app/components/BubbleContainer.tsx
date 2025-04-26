import React from 'react';

interface BubbleContainerProps {
  children?: React.ReactNode;
}

const BubbleContainer: React.FC<BubbleContainerProps> = ({ children }) => {
  return (
    <div className="w-full flex-1 bg-gray-100 p-6 rounded-lg shadow-inner overflow-hidden relative min-h-[400px]">
      <div className="flex flex-wrap gap-2 justify-center content-start overflow-y-auto h-full">
        {children}
      </div>
    </div>
  );
};

export default BubbleContainer; 