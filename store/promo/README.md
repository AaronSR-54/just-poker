# Just Poker — vídeo promocional para TikTok

Vídeo vertical de 33 s que presenta la app con material real: la mesa, los
rivales, el menú, el multijugador privado y la guía de manos.

| Archivo | Uso |
|---|---|
| `just-poker-tiktok-1080x1920.mp4` | Vídeo final. Subir tal cual a TikTok. |
| `just-poker-tiktok-cover.png` | Portada 1080×1920 (frame del hook). |

## Ficha técnica

- **Formato:** 1080×1920 (9:16), 30 fps, 33 s.
- **Códec:** H.264 + AAC 48 kHz estéreo.
- **Sonoridad:** −15,6 LUFS integrados, −1,0 dBTP, sin clipping.
- **Peso:** 16,5 MB.
- **Idioma:** español (la app también tiene interfaz en inglés).

## Guion

| Tiempo | Escena | Contenido |
|---|---|---|
| 0:00–0:03,4 | Hook | «Póker sin anuncios. Contra la IA o con amigos.». Marca, tipografía grande y dos ases reales que se abren y se meten en cámara. |
| 0:03,4–0:12,0 | Mesa | La promesa se demuestra jugando: ciegas, subida de Nora, igualada, flop, turn y escalera real. Cámara que retrocede, se acerca en cada calle y empuja al asiento ganador. |
| 0:12,0–0:17,1 | Rivales | Leo, Nora y Kai entran como un mazo en 3D, con sus alias, estilos y dificultad media (La Guarida). |
| 0:17,1–0:20,5 | Menú | Tarjeta real del menú con los dos modos: «Elige tu mesa.»; el dedo toca «Jugar con amigos» y el toque abre la sala. |
| 0:20,5–0:24,0 | Amigos | Sala privada real, código `D3HM`, QR y jugadores uniéndose. |
| 0:24,0–0:27,4 | Manos | Guía de manos: el abanico de la escalera real se abre, brilla el as y se traga la cámara. |
| 0:27,4–0:33,0 | Cierre | El as se convierte en el icono: wordmark, «Póker de práctica. Sin dinero real.» y CTA «Gratis en Google Play». |

## Material usado

- **Capturas reales** de la app en español (`store/screenshots/es`): menú, selección y sala online. La mesa del vídeo está reconstruida con los mismos tokens, tipografías y assets para poder animar cartas, fichas y bote con movimiento real.
- **Avatares** originales de los rivales (`src/assets/rivals`).
- **Cartas** originales de la app (`src/assets/cards`).
- **Tipografías** de marca: Satoshi e Inter.
- **Música:** `public/music/theme.webm` — «A cup of tea» de TAD (CC0).
- **Efectos:** biblioteca de `public/sounds` de Kenney (CC0): cartas, fichas, clics y confirmaciones.

## Cómo editarlo

El proyecto editable de HyperFrames está en `promo-video/`.

```bash
cd promo-video
npm run dev                 # preview en el navegador
npm run check               # lint + runtime + layout + motion + contraste
npm run render              # MP4 de nuevo
```

`index.html` monta las 7 escenas de `compositions/` y contiene la mezcla de
audio (música + SFX). Para cambiar textos, tiempos o assets, edita la escena
correspondiente y vuelve a renderizar.

## Publicación en TikTok

- Sube el MP4 y usa `just-poker-tiktok-cover.png` como portada.
- El audio ya va montado; no hace falta añadir sonido de TikTok.
- Texto sugerido: «Póker sin anuncios. Contra la IA o con amigos. Gratis en Google Play. ♠️»
- Hashtags: `#poker #pokerdeporte #juegosmoviles #playstore #indiegame`
- Mantén la declaración de **póker de práctica, sin dinero real** en el copy o en la descripción: encaja con la ficha de Play y con las políticas de contenido de TikTok.
