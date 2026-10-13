# game-over Specification

## Purpose

Presenta el final de una partida —resultado, clasificación y resumen de lo jugado— como
un momento reconocible para el jugador, con retroalimentación visual y sonora acorde al
resultado.

## Requirements

### Requirement: Resumen de la partida en el modal
El modal de fin de partida SHALL mostrar un resumen con el tiempo total jugado y el número de manos jugadas de la partida.

#### Scenario: Partida con duración y manos disponibles
- **WHEN** el modal de fin de partida se abre y la partida tiene tiempo jugado y manos registradas
- **THEN** el resumen muestra el tiempo total jugado y el número de manos jugadas

#### Scenario: Partida sin tiempo acumulado
- **WHEN** el modal se abre sin un tiempo jugado disponible
- **THEN** el resumen sigue mostrando el número de manos jugadas y no muestra un tiempo vacío o roto

#### Scenario: Tiempo se muestra en formato legible
- **WHEN** el tiempo jugado se muestra para una partida de más de una hora
- **THEN** el tiempo se presenta en horas y minutos en lugar de un número crudo de segundos

### Requirement: Tratamiento visual distinto según el resultado
El modal de fin de partida SHALL distinguir visualmente la victoria de la derrota con color y un mensaje de apoyo propios de cada resultado, sin basarse solo en el titular.

#### Scenario: Victoria
- **WHEN** el humano gana la partida
- **THEN** el modal presenta el tratamiento visual de victoria, con su color y su mensaje de apoyo

#### Scenario: Derrota
- **WHEN** el humano pierde la partida
- **THEN** el modal presenta el tratamiento visual de derrota, distinto del de victoria, con su color y su mensaje de apoyo

### Requirement: Celebración al ganar la partida
Cuando el humano gana la partida, el modal SHALL reproducir una animación de celebración, y SHALL omitirla cuando el humano pierde.

#### Scenario: Animación de victoria
- **WHEN** el modal de fin de partida se abre y el humano ha ganado
- **THEN** se reproduce la animación de celebración

#### Scenario: Sin animación de celebración al perder
- **WHEN** el modal se abre y el humano ha perdido
- **THEN** no se reproduce la animación de celebración

#### Scenario: Reducción de movimiento activa
- **WHEN** el jugador tiene activada la reducción de movimiento del sistema y gana la partida
- **THEN** la celebración se muestra de forma atenuada o estática, sin movimiento intenso

### Requirement: Contadores animados en el modal
El modal de fin de partida SHALL animar sus cifras al aparecer, tanto las de la clasificación como las del resumen de la partida.

#### Scenario: Entrada de las cifras
- **WHEN** el modal de fin de partida se abre
- **THEN** las cifras de la clasificación y del resumen se animan hasta su valor final

#### Scenario: Reducción de movimiento activa
- **WHEN** el jugador tiene activada la reducción de movimiento del sistema
- **THEN** las cifras aparecen en su valor final sin animación de conteo

### Requirement: Sonido de fin de partida
El modal de fin de partida SHALL reproducir un sonido al abrirse, distinto según el resultado (victoria o derrota), sujeto al volumen de efectos configurado.

#### Scenario: Victoria
- **WHEN** el modal de fin de partida se abre tras una victoria y el volumen de efectos es mayor que cero
- **THEN** se reproduce el sonido de victoria

#### Scenario: Derrota
- **WHEN** el modal de fin de partida se abre tras una derrota y el volumen de efectos es mayor que cero
- **THEN** se reproduce el sonido de derrota, distinto del de victoria

#### Scenario: Efectos silenciados
- **WHEN** el volumen de efectos es cero
- **THEN** el modal se abre sin reproducir sonido de fin de partida

#### Scenario: Un único sonido por partida
- **WHEN** el modal de fin de partida permanece abierto o se vuelve a mostrar sin empezar una partida nueva
- **THEN** el sonido de fin de partida no se repite
