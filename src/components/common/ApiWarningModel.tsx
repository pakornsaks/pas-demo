import React from 'react';

interface ApiWarningModelProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const ApiWarningModel: React.FC<ApiWarningModelProps> = ({
  isOpen,
  onClose,
  message = 'This is example page of api use.',
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>Notice</h3>
        <p style={{ margin: '0 0 20px 0', color: '#555' }}>{message}</p>
        <button
          onClick={onClose}
          style={{
            padding: '8px 20px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default ApiWarningModel;