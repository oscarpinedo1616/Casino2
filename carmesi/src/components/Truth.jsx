import { useState } from 'react';

/* Modo transparente: cada juego enseña sus números de verdad mientras juegas. */
export default function Truth({ children }) {
  const [open, setOpen] = useState(() => { try { return localStorage.getItem('carmesi-truth') !== '0'; } catch (e) { return true; } });
  const toggle = () => { const v = !open; setOpen(v); try { localStorage.setItem('carmesi-truth', v ? '1' : '0'); } catch (e) { /* nada */ } };
  return (
    <div className={`truth ${open ? 'open' : ''}`}>
      <button className="truth-h" onClick={toggle} aria-expanded={open}>
        <span className="truth-eye" aria-hidden="true"><i /></span>
        <span><b>Modo transparente</b><small>Los números reales de tu jugada</small></span>
        <span className={`sw ${open ? 'on' : ''}`} aria-hidden="true"><i /></span>
      </button>
      {open && <div className="truth-b">{children}</div>}
    </div>
  );
}
