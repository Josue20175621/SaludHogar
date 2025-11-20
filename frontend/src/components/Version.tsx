import React from 'react';

const Version: React.FC = () => {
  const footerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '10px',
    right: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '8px 15px',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '14px',
    zIndex: 1000,
    pointerEvents: 'none',
  };

  return (
    <div style={footerStyle}>
      RC 1
    </div>
  );
};

export default Version;