import { useEffect } from 'react';
import { AppProvider, useApp } from './store.jsx';
import Home from './components/Home.jsx';
import Sala from './components/Sala.jsx';
import { Learn, Responsible, GamePage } from './components/Online.jsx';
import { Nav, Curtain, Bar, Events, Gift, Visit, Footer, AgeGate, Toast, Booking } from './components/Sections.jsx';

/* Lobby (#/), página de juego (#/juego/plinko) y la Sala física en 3D (#/sala). */
function Worlds() {
  const { route } = useApp();
  useEffect(() => { document.documentElement.dataset.world = route.world; window.scrollTo(0, 0); }, [route.world, route.game]);
  return (
    <>
      <Nav />
      {route.world === 'sala' ? (
        <main id="main" className="world world-sala">
          <Sala />
          <Bar />
          <Events />
          <Gift />
          <Visit />
        </main>
      ) : (
        <main id="main" className="world world-casino">
          {route.world === 'juego' ? <GamePage id={route.game} /> : <><Home /><Learn /><Responsible /></>}
        </main>
      )}
      <Footer world={route.world === 'sala' ? 'sala' : 'online'} />
      <Booking />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <a className="skip" href="#main">Saltar al contenido</a>
      <Worlds />
      <Curtain />
      <Toast />
      <AgeGate />
    </AppProvider>
  );
}
