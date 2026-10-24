# Spec Delta

## Purpose

Define qué dispositivos pueden instalar y ejecutar la app, cómo se acredita la cobertura del artefacto antes de publicarlo y qué ve el usuario cuando su dispositivo queda por debajo del mínimo soportado.

## ADDED Requirements

### Requirement: Suelo de soporte único y declarado

El proyecto SHALL declarar un único mínimo de sistema operativo y de motor web soportados, y el artefacto Android SHALL poder instalarse en todo dispositivo que lo cumpla, sin filtros adicionales de dispositivo.

#### Scenario: Instalación en el mínimo soportado

- **WHEN** un dispositivo con la versión mínima de sistema operativo declarada abre la ficha de la app en Play Store
- **THEN** la ficha ofrece la instalación y el artefacto se instala correctamente

#### Scenario: Instalación por encima del mínimo

- **WHEN** un dispositivo con una versión de sistema operativo posterior a la mínima abre la ficha de la app
- **THEN** la ficha ofrece la instalación y el artefacto se instala correctamente

#### Scenario: Dispositivo por debajo del mínimo

- **WHEN** un dispositivo no alcanza la versión mínima de sistema operativo declarada
- **THEN** el artefacto no está disponible para él y el suelo de soporte documentado explica por qué

### Requirement: El artefacto no exige hardware opcional

El artefacto Android SHALL declarar compatibles todas las pantallas y densidades y no SHALL exigir hardware opcional, de modo que pueda instalarse en dispositivos sin táctil, sin orientación concreta o sin otros componentes que la app no necesita.

#### Scenario: Dispositivo sin pantalla táctil

- **WHEN** un dispositivo cumple el suelo de soporte pero no declara pantalla táctil
- **THEN** la app sigue estando disponible para su instalación

#### Scenario: Dispositivo de pantalla pequeña o grande

- **WHEN** un dispositivo cumple el suelo de soporte con una pantalla pequeña, normal, grande o extra grande
- **THEN** la app sigue estando disponible para su instalación

### Requirement: Cobertura de dispositivos verificable antes de publicar

Cada build de release SHALL producir un informe de compatibilidad que enumere los filtros de dispositivo efectivos del artefacto, y la comprobación SHALL fallar cuando un filtro restrinja la cobertura más allá del suelo declarado.

#### Scenario: Artefacto dentro de la cobertura esperada

- **WHEN** se comprueba un artefacto que solo aplica el suelo de soporte declarado
- **THEN** el informe muestra los valores esperados y la comprobación termina correctamente

#### Scenario: Filtro de dispositivo añadido por error

- **WHEN** un artefacto declara un requisito de hardware obligatorio o restringe tamaños de pantalla
- **THEN** la comprobación falla e indica la declaración responsable

#### Scenario: Confirmación en Play Console

- **WHEN** un artefacto se sube a una pista de Play Console
- **THEN** la documentación de release indica cómo contrastar el catálogo de dispositivos con el informe de compatibilidad

### Requirement: Aviso cuando el dispositivo no puede ejecutar la app

Si el dispositivo no alcanza el mínimo de ejecución requerido por la app, el sistema SHALL mostrar un aviso legible y traducido que explique la situación y ofrezca una alternativa, en lugar de una pantalla en blanco o un fallo silencioso.

#### Scenario: Motor web demasiado antiguo

- **WHEN** el dispositivo abre la app con un motor web por debajo del mínimo soportado
- **THEN** la app muestra el aviso de dispositivo no compatible con una alternativa utilizable

#### Scenario: Sistema por debajo del mínimo con la app ya instalada

- **WHEN** la app se ejecuta en un dispositivo por debajo del mínimo de sistema operativo
- **THEN** el aviso de dispositivo no compatible aparece en lugar de la interfaz de juego

#### Scenario: Dispositivo compatible

- **WHEN** el dispositivo alcanza el mínimo de ejecución requerido
- **THEN** la app arranca normalmente y no muestra ningún aviso de incompatibilidad

### Requirement: Diagnóstico de visibilidad separado de la compatibilidad

La documentación de release SHALL permitir distinguir si la ausencia de la app en Play Store se debe a la distribución o a una incompatibilidad de dispositivo, indicando las comprobaciones de pista, cuenta tester y catálogo de dispositivos.

#### Scenario: App solo en una pista de prueba

- **WHEN** no existe release en producción
- **THEN** la documentación indica que la app no aparece en la búsqueda pública y que solo la ven las cuentas tester de la pista

#### Scenario: App en producción para un dispositivo compatible

- **WHEN** existe release en producción y el dispositivo está cubierto por el artefacto
- **THEN** la documentación remite a la ficha pública antes de atribuir el problema a un filtro de dispositivo
