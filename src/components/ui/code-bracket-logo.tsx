import React from 'react';

interface CodeBracketLogoProps {
  className?: string;
  variant?: 'brackets' | 'code-tags';
}

const CodeBracketLogo: React.FC<CodeBracketLogoProps> = ({ 
  className = '', 
  variant = 'brackets' 
}) => {
  if (variant === 'code-tags') {
    return (
      <div className={`inline-flex items-center justify-center font-mono font-bold ${className}`}>
        <span className="text-indigo-600">&lt;/&gt;</span>
      </div>
    );
  }
  
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="text-indigo-600"
      >
        <path 
          d="M9 22L3 12L9 2M15 2L21 12L15 22" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default CodeBracketLogo;
