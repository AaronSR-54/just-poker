import React from 'react';
import Screen from '../../../components/Screen';

/** Pantalla a tamaño completo con un mensaje centrado (cargando, no disponible). */
const ScreenMessage: React.FC<{ title: string; body?: string; action?: React.ReactNode }> = ({ title, body, action }) => (
  <Screen>
    <div className={`flex flex-1 flex-col items-center justify-center ${action ? 'gap-4' : ''}`}>
      <div className="font-display font-bold leading-none tracking-[-0.01em] text-fs-700">{title}</div>
      {body !== undefined && (
        <div className="font-body leading-[1.45] text-fs-300 opacity-40">{body}</div>
      )}
      {action}
    </div>
  </Screen>
);

export default ScreenMessage;
