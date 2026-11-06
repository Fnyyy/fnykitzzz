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
import DocSummarizer from './tools/DocSummarizer';
import HdEnhancer from './tools/HdEnhancer';
import Logo from './components/Logo';

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
      case 'summarizer': return <DocSummarizer {...props} />;
      case 'hd': return <HdEnhancer {...props} />;
      case 'encoding': return <EncodingUtility {...props} />;
      default: return <Home onSelectTool={setCurrentTool} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ═══════════  NAVBAR  ═══════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(248, 250, 252, 0.94)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--line)',
        padding: '10px 16px'
      }}>
        <div style={{
          maxWidth: '1060px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px'
        }}>
          <div onClick={goHome}
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Logo size={32} showText={true} />
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: 'var(--cyan-light)', padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem', fontWeight: 700, color: 'var(--cyan-dark)',
            whiteSpace: 'nowrap'
          }}>
            <Shield size={12} />
            <span>Lokal / Privat</span>
          </div>
        </div>
      </header>

      {/* ═══════════  CONTENT  ═══════════ */}
      <main style={{ flex: 1, padding: '16px 12px 105px' }}>
        {renderTool()}
      </main>

      {/* ═══════════  BOTTOM NAV  ═══════════ */}
      <nav className="mobile-bottom-nav" style={{
        position: 'fixed', bottom: '14px', left: '50%',
        transform: 'translateX(-50%)', zIndex: 200,
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        padding: '5px 10px', borderRadius: 'var(--radius-full)',
        display: 'flex', gap: '4px',
        boxShadow: '0 10px 35px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.12)'
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
            <button
              key={item.id}
              onClick={() => setCurrentTool(item.id)}
              className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '8px 13px', borderRadius: 'var(--radius-full)',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                background: isActive
                  ? 'linear-gradient(135deg, #2563eb, #0ea5e9)'
                  : 'transparent',
                fontSize: '0.76rem', fontWeight: 700,
                transition: 'var(--transition)',
                boxShadow: isActive ? '0 2px 10px rgba(37, 99, 235, 0.4)' : 'none'
              }}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
