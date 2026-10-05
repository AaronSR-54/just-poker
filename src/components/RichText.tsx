import React from 'react';

/** Renderiza el texto aplicando **negrita** a las palabras marcadas. */
export function renderRich(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-bold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}
