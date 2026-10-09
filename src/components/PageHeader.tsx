import React from 'react';
import BackButton from './BackButton';
import Wordmark from './Wordmark';

interface PageHeaderProps {
  onBack: () => void;
  /** `aria-label` del botón volver, ya traducido. */
  backLabel: string;
  /** Nodo opcional a la derecha del Wordmark (p. ej. un `Avatar`). */
  right?: React.ReactNode;
  /** Clases del contenedor (ancho y padding). Por defecto, cabecera de escritorio. */
  className?: string;
  /** Clases de tamaño del Wordmark. */
  wordmarkClassName?: string;
}

/**
 * Cabecera de pantalla de contenido: `BackButton (←)` a la izquierda y
 * `Wordmark` (stack) a la derecha, con un hueco opcional para un nodo extra.
 * Es la cabecera que comparten `Local`, `HandsGuide` y `Online`.
 */
const PageHeader: React.FC<PageHeaderProps> = ({ onBack, backLabel, right, className, wordmarkClassName }) => (
  <header
    className={
      className ?? 'mx-auto flex w-full max-w-[87.5rem] shrink-0 items-start justify-between gap-4 px-10 pt-7 lg:px-20'
    }
  >
    <BackButton onClick={onBack} label={backLabel} />
    <div className="flex items-end gap-3">
      <Wordmark
        layout="stack"
        className={`flex flex-col items-end uppercase leading-[0.86] tracking-[-0.015em] ${wordmarkClassName ?? 'text-fs-800'}`}
      />
      {right}
    </div>
  </header>
);

export default PageHeader;
