# Tasks

## 1. Ampliar el ancho del panel anclado

- [x] 1.1 Subir los límites de ancho (`min-w`/`max-w`) del contenedor del panel anclado en `RaiseControls.tsx` (componente `RaisePanel`), verificando a 768px que el deslizador y los cuatro atajos se muestran en una fila sin apretarse ni desbordar.
- [x] 1.2 Comprobar que la hoja de subida de móvil (`RaiseSheet`) y el contenido compartido (`RaiseControls`) no cambian, abriendo las opciones de subida en pantalla estrecha (<768px).

## 2. Verificación

- [x] 2.1 Revisar la checklist de reutilización de `AGENTS.md`: confirmar que no se introduce ni extrae ningún componente de `src/components/` ni helper de `src/utils/`, y que no hay markup ni lógica duplicados.
- [x] 2.2 Ejecutar `npx oxlint src/` y `npx tsc --noEmit` y corregir cualquier aviso.
- [x] 2.3 Ejecutar `npm run build` y verificar que compila sin errores.
- [x] 2.4 Verificación visual en desktop y tablet (≥768px): el panel se ve más ancho, no desborda la mesa ni tapa controles críticos.
