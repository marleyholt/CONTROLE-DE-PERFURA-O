import React, { useState, useEffect } from 'react';
import { Hole } from '../types';
import { CheckCircle2, Clock, Download, X } from 'lucide-react';

interface Props {
  holes: Hole[];
  onMarkDrilled: (id: string, drilledDepth: number) => void;
  onMarkInjected: (id: string, injectedCement: number) => void;
  onMarkCompleted: (id: string) => void;
  onUpdateHole?: (id: string, data: Partial<Hole>) => void;
}

export function ExecutionTable({ holes, onMarkDrilled, onMarkInjected, onMarkCompleted, onUpdateHole }: Props) {
  const [now, setNow] = useState(Date.now());
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [filterLocation, setFilterLocation] = useState<string>('ALL');
  const [selectedHole, setSelectedHole] = useState<Hole | null>(null);
  const [datesForm, setDatesForm] = useState({
    drillingStartDate: '',
    drillingEndDate: '',
    injectionStartDate: '',
    injectionEndDate: ''
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '';
    return num.toString().replace('.', ',');
  };

  const handleExport = () => {
    const header = "Seq\tLocal\tBloco\tIdentificação\tStatus\tPrev. Prof (m)\tReal. Prof (m)\tPrev. Cim (kg)\tReal. Cim (kg)\tInício Perf.\tTérmino Perf.\tInício Inj.\tTérmino Inj.\n";
    const rows = holes.map(h => 
      `${h.seq}\t${h.location}\t${h.block}\t${h.name || h.id}\t${h.status}\t${formatNumber(h.depth)}\t${formatNumber(h.drilledDepth)}\t${formatNumber(h.cement)}\t${formatNumber(h.injectedCement)}\t${h.drillingStartDate || ''}\t${h.drillingEndDate || ''}\t${h.injectionStartDate || ''}\t${h.injectionEndDate || ''}`
    ).join("\n");
    // Add BOM for Excel utf-8 parsing
    const blob = new Blob(["\uFEFF" + header + rows], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sequencia_executiva.xls';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openHoleModal = (hole: Hole) => {
    setSelectedHole(hole);
    setDatesForm({
      drillingStartDate: hole.drillingStartDate || '',
      drillingEndDate: hole.drillingEndDate || '',
      injectionStartDate: hole.injectionStartDate || '',
      injectionEndDate: hole.injectionEndDate || ''
    });
  };

  const saveDates = () => {
    if (selectedHole && onUpdateHole) {
      onUpdateHole(selectedHole.id, {
        drillingStartDate: datesForm.drillingStartDate,
        drillingEndDate: datesForm.drillingEndDate,
        injectionStartDate: datesForm.injectionStartDate,
        injectionEndDate: datesForm.injectionEndDate
      });
      setSelectedHole(null);
    }
  };

  const getStatusBadge = (hole: Hole) => {
    switch (hole.status) {
      case 'PENDING':
        return <span className="inline-flex items-center px-2 py-1 rounded border border-[#303642] bg-[#1A1D24] text-[10px] font-bold uppercase tracking-wider text-gray-400">Pendente</span>;
      case 'DRILLED':
        return <span className="inline-flex items-center px-2 py-1 rounded border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[10px] font-bold uppercase tracking-wider text-[#00E5FF]">Perfurado</span>;
      case 'INJECTED':
        return <span className="inline-flex items-center px-2 py-1 rounded border border-[#F27D26]/40 bg-[#F27D26]/10 text-[10px] font-bold uppercase tracking-wider text-[#F27D26]">Injetado</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center px-2 py-1 rounded border border-[#4CAF50]/40 bg-[#4CAF50]/10 text-[10px] font-bold uppercase tracking-wider text-[#4CAF50]">Concluído</span>;
    }
  };

  const getCureStatus = (hole: Hole) => {
    if (hole.status !== 'INJECTED' || !hole.injectedAt) return <span className="text-gray-600 text-xs font-mono">-- : --</span>;
    
    const injectedTime = new Date(hole.injectedAt).getTime();
    const cureTimeMs = 12 * 60 * 60 * 1000; // 12 hours
    const elapsed = now - injectedTime;
    const remaining = cureTimeMs - elapsed;

    if (remaining <= 0) {
      return (
        <div className="flex items-center text-[#4CAF50] text-[10px] font-bold uppercase tracking-wider">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Liberado
        </div>
      );
    }

    const hoursLeft = Math.floor(remaining / (1000 * 60 * 60));
    const minsLeft = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const formattedHours = hoursLeft.toString().padStart(2, '0');
    const formattedMins = minsLeft.toString().padStart(2, '0');

    return (
      <div className="flex items-center text-[#F27D26] text-xs font-mono font-bold">
        <Clock className="w-3 h-3 mr-1.5 opacity-70" />
        {formattedHours}:{formattedMins}:00
      </div>
    );
  };

  const isCureComplete = (hole: Hole) => {
    if (hole.status !== 'INJECTED' || !hole.injectedAt) return false;
    const injectedTime = new Date(hole.injectedAt).getTime();
    const cureTimeMs = 12 * 60 * 60 * 1000;
    return (now - injectedTime) >= cureTimeMs;
  };

  const filteredHoles = holes.filter(h => filterLocation === 'ALL' || h.location === filterLocation);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center bg-[#111318] p-4 rounded-xl border border-[#262A33]">
        <div className="flex space-x-2 items-center">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mr-2">Filtro de Local:</span>
          {['ALL', 'MD', 'VT', 'ME'].map(loc => (
            <button
              key={loc}
              onClick={() => setFilterLocation(loc)}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors ${filterLocation === loc ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40' : 'bg-[#1A1D24] text-gray-400 border border-[#303642] hover:bg-[#303642]'}`}
            >
              {loc === 'ALL' ? 'Todos' : loc}
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/40 rounded-sm hover:bg-[#4CAF50]/20 transition-colors text-[10px] font-bold uppercase tracking-wider"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Excel
        </button>
      </div>

      <div className="bg-[#111318] rounded-xl border border-[#262A33] overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#1A1D24] border-b border-[#262A33]">
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Seq</th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Furo</th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Local / Bloco</th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Prof. Prev. (m)</th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cim. Prev. (kg)</th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status Atual</th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cura Restante</th>
                <th scope="col" className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ações / Realizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1D24]">
              {filteredHoles.map((hole) => (
                <tr key={hole.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => openHoleModal(hole)}>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-[#00E5FF] font-mono" onClick={(e) => e.stopPropagation()}>{hole.seq.padStart(3, '0')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-white max-w-xs truncate" title={hole.name || hole.id} onClick={(e) => e.stopPropagation()}>{hole.name || hole.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono" onClick={(e) => e.stopPropagation()}>{hole.location} / {hole.block}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono" onClick={(e) => e.stopPropagation()}>
                    {hole.drilledDepth ? <span className="line-through text-gray-600 mr-2">{hole.depth.toFixed(2)}</span> : hole.depth.toFixed(2)}
                    {hole.drilledDepth && <span className="text-[#00E5FF]">{hole.drilledDepth.toFixed(2)}</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono" onClick={(e) => e.stopPropagation()}>
                    {hole.injectedCement ? <span className="line-through text-gray-600 mr-2">{hole.cement.toFixed(2)}</span> : hole.cement.toFixed(2)}
                    {hole.injectedCement && <span className="text-[#F27D26]">{hole.injectedCement.toFixed(2)}</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>{getStatusBadge(hole)}</td>
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>{getCureStatus(hole)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium flex justify-end items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    {hole.status === 'PENDING' && (
                      <>
                        <input 
                          type="number" 
                          placeholder="Prof. (m)" 
                          className="bg-[#0A0B0E] border border-[#303642] text-white px-2 py-1 rounded w-20 text-xs font-mono"
                          value={inputs[hole.id] || ''}
                          onChange={(e) => setInputs({...inputs, [hole.id]: e.target.value})}
                        />
                        <button 
                          onClick={() => {
                            const val = parseFloat(inputs[hole.id]);
                            if (isNaN(val)) return alert('Informe a profundidade realizada.');
                            onMarkDrilled(hole.id, val);
                          }}
                          className="text-[#00E5FF] hover:text-[#00E5FF] bg-[#0A0B0E] border border-[#303642] hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/40 px-3 py-1.5 rounded-sm transition-colors text-[10px] font-bold uppercase tracking-wider"
                        >
                          Perfurar
                        </button>
                      </>
                    )}
                    {hole.status === 'DRILLED' && (
                      <>
                        <input 
                          type="number" 
                          placeholder="Cim. (kg)" 
                          className="bg-[#0A0B0E] border border-[#303642] text-white px-2 py-1 rounded w-20 text-xs font-mono"
                          value={inputs[hole.id] || ''}
                          onChange={(e) => setInputs({...inputs, [hole.id]: e.target.value})}
                        />
                        <button 
                          onClick={() => {
                            const val = parseFloat(inputs[hole.id]);
                            if (isNaN(val)) return alert('Informe o cimento injetado.');
                            onMarkInjected(hole.id, val);
                          }}
                          className="text-[#F27D26] hover:text-[#F27D26] bg-[#0A0B0E] border border-[#303642] hover:bg-[#F27D26]/10 hover:border-[#F27D26]/40 px-3 py-1.5 rounded-sm transition-colors text-[10px] font-bold uppercase tracking-wider"
                        >
                          Injetar
                        </button>
                      </>
                    )}
                    {hole.status === 'INJECTED' && isCureComplete(hole) && (
                      <button 
                        onClick={() => onMarkCompleted(hole.id)}
                        className="text-[#4CAF50] hover:text-[#4CAF50] bg-[#0A0B0E] border border-[#303642] hover:bg-[#4CAF50]/10 hover:border-[#4CAF50]/40 px-3 py-1.5 rounded-sm transition-colors text-[10px] font-bold uppercase tracking-wider"
                      >
                        Concluir
                      </button>
                    )}
                    {hole.status === 'INJECTED' && !isCureComplete(hole) && (
                      <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest italic">Aguardando...</span>
                    )}
                    {hole.status === 'COMPLETED' && (
                      <span className="text-[#4CAF50] text-[10px] font-bold uppercase tracking-widest">Finalizado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedHole && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111318] border border-[#262A33] rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-[#262A33]">
              <h3 className="text-sm font-bold text-white tracking-widest uppercase">{selectedHole.name || selectedHole.id} - Datas</h3>
              <button onClick={() => setSelectedHole(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Início Perfuração</label>
                  <input 
                    type="datetime-local" 
                    className="w-full bg-[#0A0B0E] border border-[#303642] rounded-sm px-3 py-2 text-sm text-white"
                    value={datesForm.drillingStartDate}
                    onChange={e => setDatesForm({...datesForm, drillingStartDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Término Perfuração</label>
                  <input 
                    type="datetime-local" 
                    className="w-full bg-[#0A0B0E] border border-[#303642] rounded-sm px-3 py-2 text-sm text-white"
                    value={datesForm.drillingEndDate}
                    onChange={e => setDatesForm({...datesForm, drillingEndDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Início Injeção</label>
                  <input 
                    type="datetime-local" 
                    className="w-full bg-[#0A0B0E] border border-[#303642] rounded-sm px-3 py-2 text-sm text-white"
                    value={datesForm.injectionStartDate}
                    onChange={e => setDatesForm({...datesForm, injectionStartDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Término Injeção</label>
                  <input 
                    type="datetime-local" 
                    className="w-full bg-[#0A0B0E] border border-[#303642] rounded-sm px-3 py-2 text-sm text-white"
                    value={datesForm.injectionEndDate}
                    onChange={e => setDatesForm({...datesForm, injectionEndDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[#262A33] flex justify-end space-x-3">
              <button 
                onClick={() => setSelectedHole(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={saveDates}
                className="px-4 py-2 bg-[#00E5FF] text-black text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#00E5FF]/80 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
