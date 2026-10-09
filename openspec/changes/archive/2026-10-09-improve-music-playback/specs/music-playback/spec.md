# Spec Delta

## Purpose

Gobierna el arranque, la pausa/reanudación y la recuperación de la música de fondo, de forma fiable tanto en el navegador de escritorio como en el WebView móvil (Android).

## ADDED Requirements

### Requirement: Arranque fiable tras un gesto
El sistema SHALL arrancar la música de fondo en el primer gesto válido del usuario y, si ese intento no llega a sonar, SHALL reintentarlo en gestos posteriores hasta que la reproducción esté activa.

#### Scenario: Arranque en el primer gesto
- **WHEN** el usuario realiza un gesto válido (pulsación o tecla) y el navegador permite reproducir audio
- **THEN** la música de fondo empieza a sonar con su fundido de entrada

#### Scenario: Reintento tras un intento fallido
- **WHEN** el primer gesto no consigue arrancar la música (por ejemplo, contexto bloqueado o pista aún no disponible) y el usuario realiza un nuevo gesto válido
- **THEN** el sistema vuelve a intentar el arranque y la música suena sin recargar la app

### Requirement: Intento de arranque automático al abrir
El sistema SHALL intentar reproducir la música de fondo automáticamente al inicializarse, sin esperar a un gesto del usuario, y SHALL conservar el arranque por primer gesto como respaldo cuando la plataforma no permita el autoplay.

#### Scenario: La plataforma permite el autoplay
- **WHEN** la app se abre y el navegador o el WebView permiten reproducir audio sin gesto
- **THEN** la música empieza a sonar durante el arranque, sin interacción del usuario

#### Scenario: La plataforma bloquea el autoplay
- **WHEN** la app se abre y la plataforma exige un gesto para reproducir audio
- **THEN** no suena nada hasta el primer gesto válido y entonces arranca, sin recargar la app

### Requirement: Carga de la pista recuperable
El sistema SHALL permitir reintentar la carga y decodificación de la pista después de un fallo, en lugar de quedar permanentemente inoperativo hasta recargar.

#### Scenario: Reintento tras un fallo de carga
- **WHEN** la primera carga de la pista falla y más tarde el usuario provoca un nuevo arranque
- **THEN** el sistema vuelve a solicitar y decodificar la pista y, si esta vez tiene éxito, reproduce la música

### Requirement: Pausa y reanudación con el ciclo de vida
El sistema SHALL pausar la música cuando la app pasa a segundo plano y reanudarla al volver a primer plano, sin exigir una recarga.

#### Scenario: Vuelta desde segundo plano
- **WHEN** la música está sonando, la app pasa a segundo plano y luego vuelve a primer plano
- **THEN** la música se reanuda desde el bucle en curso

#### Scenario: Vuelta tras una interrupción que deja el audio suspendido
- **WHEN** al volver a primer plano el audio quedó suspendido o inválido y el usuario interactúa
- **THEN** el sistema recupera la reproducción de la música sin recargar la app

### Requirement: Volumen de la música según los ajustes
El sistema SHALL reproducir la música de fondo al volumen configurado en los ajustes y SHALL detenerla cuando ese volumen sea cero, reactivándola cuando vuelva a ser mayor que cero.

#### Scenario: Silenciar y reactivar
- **WHEN** el usuario baja el volumen de música a cero y después lo sube de nuevo
- **THEN** la música se detiene y vuelve a sonar según el nuevo valor

#### Scenario: Arranque con volumen cero
- **WHEN** el primer gesto ocurre con el volumen de música a cero
- **THEN** el sistema no reproduce nada y vuelve a intentarlo cuando el volumen pase a ser mayor que cero
