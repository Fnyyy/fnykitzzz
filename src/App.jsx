import React, { useState, useEffect } from 'react';
import Home from './tools/Home';
import Photobooth from './tools/Photobooth';
import CollageStudio from './tools/CollageStudio';
import RemoveBg from './tools/RemoveBg';
import ImageUtility from './tools/ImageUtility';
import SpinWheel from './tools/SpinWheel';
import GroupGenerator from './tools/GroupGenerator';
import FoodRoulette from './tools/FoodRoulette';
import QrStudio from './tools/QrStudio';
import NotesAndTodo from './tools/NotesAndTodo';
import CollegeSchedule from './tools/CollegeSchedule';
import EncodingUtility from './tools/EncodingUtility';

import {
  Home as HomeIcon, Camera, LayoutGrid, Play, Users, Shield
} from 'lucide-react';

export default function App() {
  const [currentTool, setCurrentTool] = useState('home');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentTool]);

  const goHome = () => setCurrentTool('home');

  const renderTool = () => {
    const props = { onBack: goHome };
    switch (currentTool) {
      case 'booth': return <Photobooth {...props} />;
      case 'studio': return <CollageStudio {...props} />;
      case 'removebg': return <RemoveBg {...props} />;
      case 'convert': return <ImageUtility {...props} />;
      case 'wheel': return <SpinWheel {...props} />;
      case 'groups': return <GroupGenerator {...props} />;
      case 'food': return <FoodRoulette {...props} />;
      case 'qr': return <QrStudio {...props} />;
      case 'todo': return <NotesAndTodo {...props} />;
      case 'schedule': return <CollegeSchedule {...props} />;
      case 'encoding': return <EncodingUtility {...props} />;
      default: return <Home onSelectTool={setCurrentTool} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ═══════════  NAVBAR  ═══════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(248, 250, 252, 0.92)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--line)',
        padding: '10px 20px'
      }}>
        <div style={{
          maxWidth: '1060px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div onClick={goHome}
            style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '13px', letterSpacing: '-0.5px',
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)'
            }}>
              fk
            </div>
            <span style={{ fontWeight: 900, fontSize: '1.08rem', letterSpacing: '-0.4px', color: 'var(--ink)' }}>
              fnykids
            </span>
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: 'var(--cyan-light)', padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.74rem', fontWeight: 700, color: 'var(--cyan-dark)'
          }}>
            <Shield size={13} /> Offline / Lokal
          </div>
        </div>
      </header>

      {/* ═══════════  CONTENT  ═══════════ */}
      <main style={{ flex: 1, padding: '20px 14px' }}>
        {renderTool()}
      </main>

      {/* ═══════════  BOTTOM NAV  ═══════════ */}
      <nav style={{
        position: 'fixed', bottom: '14px', left: '50%',
        transform: 'translateX(-50%)', zIndex: 200,
        background: 'rgba(26, 26, 46, 0.92)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        padding: '5px 10px', borderRadius: 'var(--radius-full)',
        display: 'flex', gap: '3px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {[
          { id: 'home', label: 'Home', icon: HomeIcon },
          { id: 'booth', label: 'Booth', icon: Camera },
          { id: 'studio', label: 'Kolase', icon: LayoutGrid },
          { id: 'wheel', label: 'Wheel', icon: Play },
          { id: 'groups', label: 'Grup', icon: Users }
        ].map(item => {
          const Icon = item.icon;
          const isActive = currentTool === item.id;
          return (
            <button key={item.id} onClick={() => setCurrentTool(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '8px 14px', borderRadius: 'var(--radius-full)',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                background: isActive
                  ? 'linear-gradient(135deg, #2563eb, #0ea5e9)'
                  : 'transparent',
                fontSize: '0.78rem', fontWeight: 700,
                transition: 'var(--transition)',
                boxShadow: isActive ? '0 2px 10px rgba(37, 99, 235, 0.4)' : 'none'
              }}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
