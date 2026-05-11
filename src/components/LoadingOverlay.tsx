import React from 'react';

interface Props {
  message: string;
}

export default function LoadingOverlay({ message }: Props) {
  return (
    <div className="loading-overlay">
      <div className="loading-dialog">
        <div className="loading-dialog-title">処理中</div>
        <div className="loading-dialog-body">
          <p>{message}</p>
          <div className="loading-bar-track">
            <div className="loading-bar-fill" />
          </div>
        </div>
      </div>
    </div>
  );
}
