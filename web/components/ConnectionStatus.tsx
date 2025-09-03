'use client'

import React from 'react';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface ConnectionStatusProps {
  status: ConnectionState;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const statusColors: Record<ConnectionState, string> = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    error: 'bg-red-500',
    disconnected: 'bg-gray-400',
  };

  const getStatusText = (): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      <span className="text-xs text-gray-600">{getStatusText()}</span>
    </div>
  );
};
