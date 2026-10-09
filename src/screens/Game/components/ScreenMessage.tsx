import React from 'react';

/** Pantalla a tamaño completo con un mensaje centrado (cargando, no disponible). */
const ScreenMessage: React.FC<{ title: string; body?: string; action?: React.ReactNode }> = ({ title, body, action }) => (
  <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
    <div className={`flex flex-1 flex-col items-center justify-center ${action ? 'gap-4' : ''}`}>
      <div className="font-display font-bold leading-none tracking-[-0.01em] text-fs-700">{title}</div>
      {body !== undefined && (
        <div className="font-body leading-[1.45] text-fs-300 opacity-40">{body}</div>
      )}
      {action}
    </div>
  </div>
);

export default ScreenMessage;
