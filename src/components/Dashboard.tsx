import React, { useMemo, useState } from 'react';
import { Hole } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle2, Circle, Droplets, Timer, BellRing, TrendingUp, DollarSign, Activity } from 'lucide-react';

interface Props {
  holes: Hole[];
}

export function Dashboard({ holes }: Props) {
  const [pricePerMeter, setPricePerMeter] = useState<number>(0);
  const [pricePerKg, setPricePerKg] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  const stats = useMemo(() => {
    let filteredHoles = holes;
    if (selectedMonth !== 'ALL') {
      filteredHoles = holes.filter(h => {
        if (!h.drillingEndDate) return false;
        const month = h.drillingEndDate.substring(0, 7); // YYYY-MM
        return month === selectedMonth;
      });
    }

    const total = filteredHoles.length;
    const pending = filteredHoles.filter(h => h.status === 'PENDING').length;
    const drilled = filteredHoles.filter(h => h.status === 'DRILLED').length;
    const injected = filteredHoles.filter(h => h.status === 'INJECTED').length;
    const completed = filteredHoles.filter(h => h.status === 'COMPLETED').length;
    
    let plannedDepth = 0;
    let realizedDepth = 0;
    let plannedCement = 0;
    let realizedCement = 0;

    filteredHoles.forEach(h => {
      plannedDepth += h.depth || 0;
      realizedDepth += h.drilledDepth || 0;
      plannedCement += h.cement || 0;
      realizedCement += h.injectedCement || 0;
    });

    let minDate = Infinity;
    let maxDate = -Infinity;

    filteredHoles.forEach(h => {
      if (h.drillingStartDate) {
        minDate = Math.min(minDate, new Date(h.drillingStartDate).getTime());
      }
      if (h.drillingEndDate) {
        maxDate = Math.max(maxDate, new Date(h.drillingEndDate).getTime());
      }
    });

    let days = 1;
    if (minDate !== Infinity && maxDate !== -Infinity) {
      days = Math.max(1, (maxDate - minDate) / (1000 * 3600 * 24));
    }

    const productivity = realizedDepth > 0 ? realizedDepth / days : 0;
    const totalValue = (realizedDepth * pricePerMeter) + (realizedCement * pricePerKg);

    const consumptionIndex = plannedCement > 0 ? (realizedCement / plannedCement) * 100 : 0;
    const executionIndex = plannedDepth > 0 ? (realizedDepth / plannedDepth) * 100 : 0;

    return { total, pending, drilled, injected, completed, plannedDepth, realizedDepth, plannedCement, realizedCement, productivity, totalValue, consumptionIndex, executionIndex };
  }, [holes, selectedMonth, pricePerMeter, pricePerKg]);

  const { readyHoles, blockStats, months } = useMemo(() => {
    const blocks: Record<string, { total: number, completed: number }> = {};
    const readyToComplete: Hole[] = [];
    const now = Date.now();
    const cureTimeMs = 12 * 60 * 60 * 1000;
    const monthSet = new Set<string>();

    holes.forEach(h => {
      if (!blocks[h.block]) blocks[h.block] = { total: 0, completed: 0 };
      blocks[h.block].total += h.depth || 0;
      blocks[h.block].completed += h.drilledDepth || 0;

      if (h.status === 'INJECTED' && h.injectedAt) {
        const injectedTime = new Date(h.injectedAt).getTime();
        if (now - injectedTime >= cureTimeMs) {
          readyToComplete.push(h);
        }
      }

      if (h.drillingEndDate) {
        monthSet.add(h.drillingEndDate.substring(0, 7));
      }
    });
    
    return {
      readyHoles: readyToComplete,
      blockStats: Object.entries(blocks)
        .map(([name, data]) => ({
          name: `Bloco ${name}`,
          Concluídos: parseFloat(data.completed.toFixed(2)),
          Restantes: parseFloat(Math.max(0, data.total - data.completed).toFixed(2))
        }))
        .sort((a, b) => {
          const numA = parseInt(a.name.replace('Bloco ', ''));
          const numB = parseInt(b.name.replace('Bloco ', ''));
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.name.localeCompare(b.name);
        }),
      months: Array.from(monthSet).sort().reverse()
    };
  }, [holes]);

  return (
    <div className="space-y-6">
      {readyHoles.length > 0 && (
        <div className="bg-[#1A1D24]/50 border-l-2 border-[#F27D26] p-4 rounded border border-[#262A33] shadow-lg">
          <div className="flex items-start">
            <BellRing className="h-5 w-5 text-[#F27D26] mr-3 mt-0.5 animate-pulse" />
            <div>
              <h3 className="text-[10px] text-[#F27D26] font-bold uppercase tracking-widest">Alertas de Cura</h3>
              <p className="text-gray-400 text-sm mt-1">
                Há <span className="text-white font-mono">{readyHoles.length}</span> {readyHoles.length === 1 ? 'furo que concluiu' : 'furos que concluíram'} as 12 horas de cura. Acesse o Sequenciador Executivo para marcá-los como concluídos.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center bg-[#111318] p-4 rounded-xl border border-[#262A33]">
        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Mês Referência:</span>
            <select 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-[#0A0B0E] border border-[#303642] text-white px-3 py-1.5 rounded-sm text-xs font-mono outline-none"
            >
              <option value="ALL">Geral (Todos)</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">R$/m (Perf):</span>
            <input 
              type="number" 
              value={pricePerMeter}
              onChange={e => setPricePerMeter(parseFloat(e.target.value) || 0)}
              className="bg-[#0A0B0E] border border-[#303642] text-white px-2 py-1 rounded w-20 text-xs font-mono outline-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">R$/kg (Cim):</span>
            <input 
              type="number" 
              value={pricePerKg}
              onChange={e => setPricePerKg(parseFloat(e.target.value) || 0)}
              className="bg-[#0A0B0E] border border-[#303642] text-white px-2 py-1 rounded w-20 text-xs font-mono outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Furos" 
          value={stats.total} 
          icon={<Circle className="text-gray-500" size={20} />} 
          subtitle="Planejados"
        />
        <StatCard 
          title="Perfurados" 
          value={stats.drilled} 
          icon={<Timer className="text-[#00E5FF]" size={20} />} 
          subtitle="Aguardando injeção"
        />
        <StatCard 
          title="Produtividade" 
          value={stats.productivity.toFixed(1)} 
          unit="m/dia"
          icon={<TrendingUp className="text-[#F27D26]" size={20} />} 
          subtitle="Média de avanço"
        />
        <StatCard 
          title="Valor Produzido" 
          value={stats.totalValue.toLocaleString('pt-BR')} 
          prefix="R$"
          icon={<DollarSign className="text-[#4CAF50]" size={20} />} 
          subtitle="Período selecionado"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1A1D24] p-6 rounded-xl shadow-lg border border-[#262A33]">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Índice Perfuração (Prev vs Real)</h3>
            <span className={`text-xs font-bold font-mono px-2 py-1 rounded ${stats.executionIndex > 100 ? 'bg-[#4CAF50]/10 text-[#4CAF50]' : 'bg-[#00E5FF]/10 text-[#00E5FF]'}`}>
              {stats.executionIndex.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-400 mb-1">Realizado</p>
              <h4 className="text-3xl font-mono text-[#00E5FF]">{stats.realizedDepth.toFixed(2)}m</h4>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Previsto</p>
              <h4 className="text-xl font-mono text-gray-300">{stats.plannedDepth.toFixed(2)}m</h4>
            </div>
          </div>
          <div className="w-full bg-[#0A0B0E] h-2 mt-4 rounded overflow-hidden">
            <div className="bg-[#00E5FF] h-full" style={{ width: `${Math.min(100, stats.plannedDepth ? (stats.realizedDepth / stats.plannedDepth) * 100 : 0)}%` }}></div>
          </div>
        </div>
        <div className="bg-[#1A1D24] p-6 rounded-xl shadow-lg border border-[#262A33]">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Índice Consumo (Prev vs Real)</h3>
            <span className={`text-xs font-bold font-mono px-2 py-1 rounded ${stats.consumptionIndex > 100 ? 'bg-red-500/10 text-red-500' : 'bg-[#F27D26]/10 text-[#F27D26]'}`}>
              {stats.consumptionIndex.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-400 mb-1">Realizado</p>
              <h4 className="text-3xl font-mono text-[#F27D26]">{stats.realizedCement.toFixed(2)}kg</h4>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Previsto</p>
              <h4 className="text-xl font-mono text-gray-300">{stats.plannedCement.toFixed(2)}kg</h4>
            </div>
          </div>
          <div className="w-full bg-[#0A0B0E] h-2 mt-4 rounded overflow-hidden flex">
            <div className="bg-[#F27D26] h-full" style={{ width: `${Math.min(100, stats.plannedCement ? (stats.realizedCement / stats.plannedCement) * 100 : 0)}%` }}></div>
          </div>
        </div>
      </div>

      <div className="bg-[#111318] p-6 rounded-xl border border-[#262A33] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00E5FF 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 relative z-10">Progresso por Bloco</h3>
        <div className="h-[300px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={blockStats}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262A33" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip 
                cursor={{ fill: '#1A1D24' }}
                contentStyle={{ backgroundColor: '#0F1116', border: '1px solid #262A33', borderRadius: '4px', color: '#E0E2E5', fontSize: '12px' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#9CA3AF' }} />
              <Bar dataKey="Concluídos" stackId="a" fill="#4CAF50" radius={[0, 0, 2, 2]} maxBarSize={32} />
              <Bar dataKey="Restantes" stackId="a" fill="#303642" radius={[2, 2, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle, prefix, unit }: { title: string, value: number | string, icon: React.ReactNode, subtitle: string, prefix?: string, unit?: string }) {
  return (
    <div className="bg-[#1A1D24] p-6 rounded-xl shadow-lg border border-[#262A33] flex flex-col justify-between h-full relative overflow-hidden group hover:border-[#303642] transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">{title}</p>
          <h3 className="text-4xl font-light text-white font-mono flex items-baseline">
            {prefix && <span className="text-xl mr-1 text-gray-400">{prefix}</span>}
            {value}
            {unit && <span className="text-sm ml-1 text-gray-400">{unit}</span>}
          </h3>
        </div>
        <div className="p-3 bg-[#0A0B0E] rounded border border-[#262A33] z-10 group-hover:border-[#303642] transition-colors">
          {icon}
        </div>
      </div>
      <p className="text-[10px] text-gray-500 z-10">{subtitle}</p>
    </div>
  );
}
