# Casino Carmesí · v2 (estilo app de casino)

Lobby con banner 3D, tarjetas de categoría, buscador y filas de juegos con iconos 3D generados en el navegador (Three.js).
Juegos con fichas de demostración: Plinko, Mines, Crash, Dice, Hi-Lo, Ruleta 3D, Blackjack y Carmesí 777.
Rutas: `#/` lobby · `#/juego/plinko` (y el resto de ids) · `#/sala` la Sala física en 3D con reservas.

**Publicar en GitHub Pages:** copia `dist-single/index.html` a la raíz del repositorio (sustituye el anterior) y en Settings → Pages elige `main` / `(root)`.

# Casino Carmesí — la sala en 3D y el casino online (demo)

Casino ficticio creado como demostración. Dos mundos separados, con su propio menú, estética y secciones:

- **Portal (`#/`):** una ficha de casino en 3D. Cara A, la Sala; cara B, Online. Al elegir, la ficha se lanza contra la pantalla y una cortina te lleva al mundo elegido.
- **La Sala (`#/sala`):** el casino físico en 3D (ruleta, blackjack, póker, sala VIP, máquinas, barra, restaurante y escenario), con zonas, elección de mesa, vista desde la silla, bebidas servidas en la mesa, paseo en primera persona y reserva por WhatsApp. Además, barra, eventos, invitación regalo y cómo llegar.
- **Carmesí Online (`#/online`):** con fichas de demostración sin valor económico.
  - **Ruleta 3D** (`#/online/ruleta`): rueda europea en Three.js; la cámara persigue la bola hasta el bolsillo.
  - **Blackjack** (`#/online/blackjack`) y **Carmesí 777** (`#/online/slots`).
  - **Modo transparente** en cada juego: probabilidades reales de tu jugada, pérdida media esperada, RTP calculado de la tragaperras y la jugada de estrategia básica en cada mano de blackjack.
  - **Aprende:** comparativa de la ventaja de la casa en cada juego.
  - **Juego responsable:** tiempo de juego, aviso cada 10 minutos, límite de pérdidas y pausa de 24 horas.
- **Sonido** sintetizado en el navegador (fichas, bola, cartas, rodillos), con botón para silenciar.

> Para ofrecer juego online con dinero real en España hace falta licencia de la Dirección General de Ordenación del Juego (DGOJ),
> verificación de identidad y pasarela de pago. Esta demo no incluye ni simula pagos.

## Probarla

- Rápido: abre `dist-single/index.html` con Live Server.
- Proyecto: `npm install` y `npm run dev`. Para publicar en GitHub Pages está el flujo de `.github/workflows`.

Datos de ejemplo en `src/data.js`.
