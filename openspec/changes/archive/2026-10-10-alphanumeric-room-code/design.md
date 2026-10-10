# Design

## Context

El código de sala se genera en el servidor (`GameManager.generateCode`) con 4 dígitos y se resuelve por búsqueda exacta (`getRoomIdByCode`). En el cliente, las 4 casillas de `Online.tsx` filtran a dígitos (`\D`), igual que el pegado y la lectura del `?code=`. Cliente y servidor son proyectos TypeScript separados (`src/` y `server/`) que no comparten módulos. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Código de 4 caracteres alfanuméricos en mayúsculas, sin ambiguos (`O 0 I 1 L`), con la misma UI de 4 casillas.
- Entrada tolerante: teclado, pegado y `?code=` aceptan cualquier caso y se normalizan a mayúsculas.

**Non-Goals:**
- Cambiar la longitud (siguen 4 casillas) ni el flujo de enlace/QR.
- Migrar o mantener válidos los códigos numéricos ya emitidos.

## Decisions

- **Alfabeto y longitud: 4 caracteres de `A-Z` + `2-9` (31 símbolos), excluyendo `O 0 I 1 L`.** Da ~19.8 bits frente a ~13.3 de los 4 dígitos, sin cambiar la UI. Alternativas: 6 caracteres (más entropía, pero cambiaría la UI y la longitud ya está fijada por las casillas); `A-Z0-9` completo (los ambiguos provocan errores al dictar/escanear).
- **El alfabeto vive solo en el servidor (generación).** El cliente no necesita el alfabeto exacto: acepta el superconjunto `[A-Za-z0-9]`, descarta el resto y pasa a mayúsculas. Así se evita duplicar la constante entre `src/` y `server/`, que no comparten módulos; cualquier carácter fuera del alfabeto generado simplemente no resuelve a ninguna sala.
- **Normalización en dos puntos.** El cliente normaliza al teclear, pegar y al leer `?code=`; el servidor normaliza también `data.code` a mayúsculas antes de buscar, para ser la autoridad y tolerar enlaces/entradas en minúsculas.
- **Sin helper compartido cliente/servidor.** La única lógica común es un `toUpperCase()` trivial; extraer un módulo compartido obligaría a reconfigurar ambos `tsconfig` y cruzar el límite de build (navegador vs Node) por muy poco. Se documenta como duplicación aceptada y mínima.
- **UI de entrada.** Se mantienen `Panel`, `NameField`, `CtaButton`, `QrCode`/`QrDialog` y `PersonCard` sin cambios; solo se ajusta el filtrado de caracteres y el tipo de teclado de las casillas (de numérico a texto, con autocapitalización a mayúsculas). No se crean componentes ni clases CSS nuevas.

## Risks / Trade-offs

- **Códigos numéricos antiguos dejan de resolver** → salas ya creadas deben recrearse; son efímeras y se documenta como BREAKING en `proposal.md`.
- **El cliente permite caracteres ambiguos** (`O`, `I`, `L`, `0`, `1`) que el generador nunca emite → un código así no resuelve. Mitigación: es el superconjunto; se prioriza no duplicar el alfabeto. Alternativa considerada: replicar el alfabeto en el cliente (rechazar ambiguos al teclear), descartada por duplicación.
- **Confusión de mayúsculas/minúsculas** → mitigado normalizando en cliente y servidor.

## Migration Plan

- Desplegar servidor y cliente a la vez. Sin migración de datos.
- Rollback: revertir el despliegue; las salas creadas con el nuevo código alfanumérico dejarían de resolver (efímeras, sin pérdida persistente).
