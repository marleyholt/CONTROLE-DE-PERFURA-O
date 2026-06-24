/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useHoles } from './hooks/useHoles';
import { Dashboard } from './components/Dashboard';
import { ExecutionTable } from './components/ExecutionTable';
import { LayoutDashboard, ListTodo, TestTube, HardHat, Loader2 } from 'lucide-react';

export default function App() {
  const { holes, loading, user, login, logout, markDrilled, markInjected, markCompleted, resetData, debugAdvanceTime, updateHole } = useHoles();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'execution'>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B0E] text-[#E0E2E5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00E5FF] animate-spin" />
        <span className="ml-3 text-sm font-bold tracking-widest text-[#00E5FF] uppercase">Sincronizando...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0B0E] text-[#E0E2E5] flex flex-col items-center justify-center font-sans">
        <div className="bg-[#111318] p-8 rounded-xl border border-[#262A33] shadow-2xl w-full max-w-md text-center">
          <HardHat className="h-16 w-16 text-[#00E5FF] mx-auto mb-6" />
          <h1 className="text-xl font-bold text-white tracking-[0.2em] uppercase mb-2">GEO-DRIVE SYSTEM</h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-8">Controle de Perfuração e Injeção</p>
          <button 
            onClick={login}
            className="w-full bg-[#00E5FF] text-black font-bold uppercase tracking-wider text-sm py-3 px-4 rounded-sm hover:bg-[#00E5FF]/80 transition-colors"
          >
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#E0E2E5] font-sans">
      <header className="bg-[#0F1116] border-b border-[#262A33] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <HardHat className="h-8 w-8 text-[#00E5FF] mr-3" />
              <div>
                <h1 className="text-sm font-bold text-[#00E5FF] tracking-[0.2em] uppercase">GEO-DRIVE SYSTEM</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Controle de Perfuração e Injeção</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-500 mr-4 font-mono hidden sm:block">{user.email}</div>
              <button
                onClick={debugAdvanceTime}
                className="text-[10px] font-bold uppercase tracking-wider flex items-center text-[#F27D26] border border-[#F27D26]/30 hover:bg-[#F27D26]/10 px-3 py-1.5 rounded-sm transition-colors"
                title="Avançar tempo de cura em 12h para testes"
              >
                <TestTube className="w-3 h-3 mr-1" />
                Avançar Tempo (Dev)
              </button>
              <button
                onClick={resetData}
                className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-red-500 px-3 py-1.5 transition-colors"
              >
                Zerar Dados
              </button>
              <button
                onClick={logout}
                className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-white px-3 py-1.5 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex space-x-1 border-b border-[#262A33]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center px-4 py-3 border-b-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              activeTab === 'dashboard'
                ? 'border-[#00E5FF] text-[#00E5FF]'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-[#303642]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard Geral
          </button>
          <button
            onClick={() => setActiveTab('execution')}
            className={`flex items-center px-4 py-3 border-b-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              activeTab === 'execution'
                ? 'border-[#00E5FF] text-[#00E5FF]'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-[#303642]'
            }`}
          >
            <ListTodo className="w-4 h-4 mr-2" />
            Sequenciador Executivo
          </button>
        </div>

        <div className="animate-in fade-in duration-300">
          {activeTab === 'dashboard' ? (
            <Dashboard holes={holes} />
          ) : (
            <ExecutionTable 
              holes={holes} 
              onMarkDrilled={markDrilled}
              onMarkInjected={markInjected}
              onMarkCompleted={markCompleted}
              onUpdateHole={updateHole}
            />
          )}
        </div>
      </main>
    </div>
  );
}
