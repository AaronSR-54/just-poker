# Spec Delta

## ADDED Requirements

### Requirement: Disposición sin solape de las tarjetas con partida en curso

En la portada, cuando una o ambas modalidades tienen partida en curso, las dos filas de cada
tarjeta (continuar y nueva partida) y las dos tarjetas entre sí SHALL mostrarse completas y
nunca solaparse, en todos los tamaños de pantalla soportados, incluido el rango de tablet
(768–1023 px de ancho).

#### Scenario: Portada en tablet con una partida en curso

- **WHEN** el humano abre el menú en un ancho de tablet con al menos una modalidad en curso
- **THEN** las filas «Continuar partida» y «Nueva partida» de esa tarjeta, y las dos tarjetas, se
  ven completas y sin solaparse

#### Scenario: Portada en tablet con las dos modalidades en curso

- **WHEN** el humano abre el menú en un ancho de tablet con partida local y sesión online en curso
- **THEN** las cuatro filas de las dos tarjetas se ven completas, sin solaparse entre sí ni con la
  columna del hero

#### Scenario: Portada sin partida en curso

- **WHEN** el humano abre el menú en un ancho de tablet sin ninguna partida en curso
- **THEN** cada tarjeta se muestra como una única fila completa, sin solaparse

#### Scenario: Portada en móvil

- **WHEN** el humano abre el menú en móvil con partida en curso
- **THEN** las tarjetas se muestran apiladas en una columna, completas y sin solaparse

### Requirement: Ajuste o desplazamiento cuando falta altura

Cuando la altura disponible de la ventana no basta para mostrar el contenido de la portada con
partida en curso a tamaño completo, el sistema SHALL ajustar o permitir desplazar el contenido de
modo que ninguna fila quede recortada ni solapada, y la portada SHALL seguir siendo navegable.

#### Scenario: Tablet con ventana corta

- **WHEN** el humano abre el menú con partida en curso en un ancho de tablet y una altura reducida
  que no permite mostrar las tarjetas a tamaño completo
- **THEN** el contenido se ajusta o se puede desplazar, y las filas «Continuar partida» y «Nueva
  partida» siguen siendo visibles y accionables sin solaparse
