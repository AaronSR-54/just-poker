# Review — vídeo promocional Just Poker

## Lo que se entrega

- 33 s, 1080×1920, 30 fps, H.264 + AAC 48 kHz estéreo.
- 7 escenas: hook, mesa, rivales, menú, amigos, guía de manos y cierre.
- Música original de la app + biblioteca de SFX de la app.
- Comprobaciones: `check` sin errores ni avisos; contraste 51/51 WCAG AA.
- Audio medido: −15,6 LUFS integrados, −1,0 dBTP, 0 clipping.
- Peso: 16,5 MB.

## Decisiones

- **Producto real primero:** la mesa entra justo después del hook, no al final. El hook promete «Póker sin anuncios. Contra la IA o con amigos.» y la siguiente imagen lo demuestra jugando una mano completa. Después llegan los rivales, el menú, la sala privada y la guía.
- **Hook en el primer frame:** cartel compuesto a 0 s con la marca, la promesa y dos ases reales ya visibles. No hay negro ni logo de entrada. El as de picas se abre, se lleva la cámara y sirve de transición a la mesa.
- **Ritmo:** cortes en la rejilla del tema (3,4 s / 11,97 s / 17,1 s / 20,53 s / 23,97 s / 27,4 s). Ninguna escena entra con el mismo recurso que la anterior.
- **Transiciones con causa:**
  - Hook → mesa: zoom through del as de picas + flash de cámara; la mesa aterriza grande y retrocede.
  - Mesa → rivales: la cámara empuja hacia el asiento ganador y el corte cae sobre el hueso.
  - Rivales → menú: el mazo vuela hacia la cámara y el hueso se retira mientras sube la tarjeta del menú.
  - Menú → amigos: el dedo toca «Jugar con amigos» y el zoom entra en esa tarjeta.
  - Manos → cierre: el as de la escalera real llena el encuadre y se convierte en el icono de la app.
- **Dinamismo dentro de cada plano:** push-in continuo en el hook, reparto y abanico de cartas, retroceso y punch-ins en cada calle de la mesa, mazo en 3D en rivales, brillo y parallax en el menú, pulso del código y toasts en la sala, abanico que se cierra y se lanza a cámara en manos. `data-motion-blur="on"` para que los movimientos rápidos dejen estela.
- **Menú legible:** la captura se recorta a la zona de los dos modos y se presenta como tarjeta flotante; así «Jugar en local» y «Jugar con amigos» quedan por encima de la franja que TikTok tapa con su interfaz.
- **Copy:** español, frases cortas, sin promesas de dinero real. El cierre declara «Póker de práctica. Sin dinero real.».
- **Sin repeticiones:** «Póker sin anuncios» y los dos modos viven solo en el hook; el menú pide «Elige tu mesa»; la sala explica el código; el cierre se queda con la declaración obligatoria y el CTA.
- **Audio:** el tema lofi de la app entra con un fundido corto; cada acción visible tiene su SFX (reparto, subida, igualada, flop, turn, river, bote, uniones y CTA).

## Límites conocidos

- El HUD superior de la mesa (mano y última acción) queda en la franja que TikTok puede cubrir con su barra superior. Es información secundaria; los avatares y el juego empiezan por debajo.
- La barra de acciones de la mesa queda en la zona baja, tratada como interfaz del producto; las cartas, el bote y el resultado están por encima.
- La versión es española. Para inglés hay que cambiar las capturas y los textos de las escenas.
- El CTA usa un triángulo de Play genérico, no el badge oficial de Google Play, para no inventar la geometría de la marca.
- El vídeo está pensado para TikTok; un corte de 15 s necesitaría rehacer los tiempos del hook y del cierre.
