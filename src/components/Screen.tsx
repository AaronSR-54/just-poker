import React from 'react';

/** Contenedor de pantalla a altura completa, con el fondo y tipografía base de la app. */
const Screen = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...rest }, ref) => (
    <div
      ref={ref}
      className={`relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone ${className}`}
      {...rest}
    />
  ),
);
Screen.displayName = 'Screen';

export default Screen;
