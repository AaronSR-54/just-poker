# Spec Delta

## Purpose

Define la presentación y las dimensiones del panel de subida anclado que se muestra en pantallas anchas al abrir las opciones de apuesta, de modo que el deslizador y los atajos de importe dispongan de espacio suficiente.

## ADDED Requirements

### Requirement: El panel de subida anclado es holgado en pantallas anchas

En pantallas anchas (≥768px), el panel de subida anclado SHALL presentar un ancho holgado, de al menos 20rem (320px), que dé cabida al deslizador de importe y a los atajos de apuesta en una sola fila sin apretarse.

#### Scenario: Atajos y deslizador holgados en una sola fila

- **WHEN** el humano abre las opciones de subida en una pantalla ancha
- **THEN** los cuatro atajos de apuesta y la pista del deslizador se muestran en una sola fila con espacio de sobra, sin apretarse

#### Scenario: El panel no desborda la pantalla

- **WHEN** el humano abre las opciones de subida en una pantalla ancha
- **THEN** el panel se muestra por completo dentro de la pantalla, sin recortar su contenido

### Requirement: El aumento de ancho no altera el contenido del panel

El aumento de ancho SHALL ser el único cambio visual del panel: el orden de sus elementos, el tamaño de sus controles y textos, y su comportamiento permanecen iguales.

#### Scenario: Contenido y controles intactos

- **WHEN** el humano abre el panel de subida en una pantalla ancha
- **THEN** los atajos, el deslizador y el botón de confirmar conservan su orden, su tamaño y su comportamiento, solo con más espacio horizontal

### Requirement: La hoja de subida de móvil no cambia

En pantallas estrechas, la hoja de subida SHALL mantener su presentación actual, sin verse afectada por el nuevo ancho del panel anclado.

#### Scenario: Apertura en pantalla estrecha

- **WHEN** el humano abre las opciones de subida en una pantalla estrecha
- **THEN** la hoja inferior conserva su ancho y su aspecto actuales
