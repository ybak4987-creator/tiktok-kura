import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Users, Clock, CheckCircle2, ShieldCheck, AlertTriangle, Video, Sparkles } from 'lucide-react';
import { DrawSettings, DrawResult, Follower, CleaningReport } from '../types/draw';

interface DrawStatusDashboardCardProps {
  followers: Follower[];
  settings: DrawSettings;
  results: DrawResult[];
  report: CleaningReport | null;
}

interface ChartDataPoint {
  label: string;
  count: number;
  color: string;
  description: string;
}

export function DrawStatusDashboardCard({
  followers,
  settings,
  results,
  report,
}: DrawStatusDashboardCardProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredData, setHoveredData] = useState<ChartDataPoint | null>(null);

  // Participant breakdown data for D3 chart
  const chartData: ChartDataPoint[] = useMemo(() => {
    const eligible = followers.length;
    const duplicates = report?.duplicateCount ?? 0;
    const blocked = (report?.profaneCount ?? 0) + (report?.blacklistedCount ?? 0);

    // If completely empty, show a neutral baseline
    if (eligible === 0 && duplicates === 0 && blocked === 0) {
      return [
        { label: 'Katılımcı Bekleniyor', count: 1, color: '#3f3f46', description: 'Henüz liste yüklenmedi' }
      ];
    }

    return [
      {
        label: 'Geçerli Katılımcı',
        count: Math.max(eligible, 0),
        color: '#25F4EE',
        description: 'Kurada bilet hakkına sahip tekil takipçiler',
      },
      {
        label: 'Mükerrer Temizlenen',
        count: Math.max(duplicates, 0),
        color: '#F59E0B',
        description: 'Çift yazılan ve tekilleştirilen isimler',
      },
      {
        label: 'Filtrelenen / Yasaklı',
        count: Math.max(blocked, 0),
        color: '#FE2C55',
        description: 'Küfür veya kara listeden elenenler',
      },
    ].filter((d) => d.count > 0);
  }, [followers.length, report]);

  const totalAnalyzed = useMemo(() => {
    const eligible = followers.length;
    const duplicates = report?.duplicateCount ?? 0;
    const blocked = (report?.profaneCount ?? 0) + (report?.blacklistedCount ?? 0);
    return eligible + duplicates + blocked;
  }, [followers.length, report]);

  // Render D3 Interactive Donut Chart
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 180;
    const height = 180;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.65;
    const outerRadius = radius * 0.95;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // D3 Pie Generator
    const pie = d3
      .pie<ChartDataPoint>()
      .value((d) => d.count)
      .sort(null)
      .padAngle(0.04);

    // D3 Arc Generator
    const arc = d3
      .arc<d3.PieArcDatum<ChartDataPoint>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(5);

    const arcHover = d3
      .arc<d3.PieArcDatum<ChartDataPoint>>()
      .innerRadius(innerRadius - 2)
      .outerRadius(outerRadius + 4)
      .cornerRadius(6);

    const pieData = pie(chartData);

    // Filter definitions for cyber glow
    const defs = svg.append('defs');
    const glowFilter = defs.append('filter').attr('id', 'neon-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Draw Arcs
    const paths = g
      .selectAll('path')
      .data(pieData)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#0b0c10')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease');

    // Interactive Hover Events
    paths
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', arcHover as any)
          .style('filter', 'url(#neon-glow)');
        setHoveredData(d.data);
      })
      .on('mouseleave', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', arc as any)
          .style('filter', 'none');
        setHoveredData(null);
      });

    // Center static text rendered via D3
    const centerGroup = g.append('g').attr('text-anchor', 'middle').attr('class', 'pointer-events-none');

    centerGroup
      .append('text')
      .attr('dy', '-0.1em')
      .attr('fill', '#ffffff')
      .attr('font-size', '20px')
      .attr('font-weight', '900')
      .attr('font-family', 'monospace')
      .text(followers.length.toLocaleString('tr-TR'));

    centerGroup
      .append('text')
      .attr('dy', '1.3em')
      .attr('fill', '#a1a1aa')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('letter-spacing', '0.05em')
      .text('KATILIMCI');
  }, [chartData, followers.length]);

  const isCompleted = settings.status === 'completed';

  return (
    <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800/90 p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-5">
      {/* Background neon ambient lighting */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#25F4EE]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#FE2C55]/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP STATUS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider uppercase text-zinc-400 font-mono">
              CANLI DURUM PANELİ
            </span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-300">
              d3.js v7
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
            <span>Kura & Katılımcı Analizi</span>
            <Sparkles className="w-4 h-4 text-[#25F4EE]" />
          </h2>
        </div>

        {/* Dynamic Draw Status Pill */}
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-700/80 text-emerald-300 text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tamamlandı (3 Kazanan Seçildi)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-700/80 text-cyan-300 text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#25F4EE] animate-ping shrink-0" />
              <span>Kura Beklemede ({settings.drawTime || '19:00'})</span>
            </div>
          )}
        </div>
      </div>

      {/* GRID CONTENT: METRICS & D3.JS CHART */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left Column: D3 Donut Visual (5 Cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/70">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg ref={svgRef} className="w-full h-full overflow-visible" />
          </div>

          {/* Interactive D3 Hover State Indicator */}
          <div className="h-9 mt-2 text-center flex flex-col items-center justify-center">
            {hoveredData ? (
              <div className="animate-fadeIn">
                <span className="text-xs font-bold font-mono text-white flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredData.color }} />
                  {hoveredData.label}: {hoveredData.count.toLocaleString('tr-TR')}
                </span>
                <span className="text-[10px] text-zinc-400 block truncate max-w-[220px]">
                  {hoveredData.description}
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-zinc-400 font-mono">
                Grafik dilimlerinin üzerine gelerek detayları görün
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Status Cards & Legend (7 Cols) */}
        <div className="md:col-span-7 space-y-3">
          {/* Stat 1: Kuraya Girecek Hak Sahibi */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-[#25F4EE]/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#25F4EE]/10 border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Kuraya Girecek Katılımcı
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  {totalAnalyzed > 0
                    ? `%${Math.round((followers.length / totalAnalyzed) * 100)} geçerlilik oranı`
                    : 'Havuz temiz ve hazır'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#25F4EE] font-mono tabular-nums block">
                {followers.length.toLocaleString('tr-TR')}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">1 Kişi = 1 Hak</span>
            </div>
          </div>

          {/* Stat 2: Çekiliş Durumu & Video Hakları */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Dağıtılan Video Hakları
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  {isCompleted ? '3 Takipçiye Hak Tanımlandı' : 'Kura Bekleniyor'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black font-mono text-white">
                {results.length} <span className="text-zinc-500 text-sm">/ 3</span>
              </span>
              <span className="text-[10px] font-mono text-purple-400 block">
                {isCompleted ? '✓ Tamamlandı' : '3 Hak Ayrıldı'}
              </span>
            </div>
          </div>

          {/* Legend Items Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block truncate">
                  Mükerrer Temizlenen
                </span>
                <span className="text-xs font-bold text-amber-400 font-mono">
                  {(report?.duplicateCount ?? 0).toLocaleString('tr-TR')} Adet
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FE2C55] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block truncate">
                  Filtrelenen / Kara Liste
                </span>
                <span className="text-xs font-bold text-rose-400 font-mono">
                  {((report?.profaneCount ?? 0) + (report?.blacklistedCount ?? 0)).toLocaleString('tr-TR')} Adet
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER BADGE BAR */}
      <div className="pt-3 border-t border-zinc-800/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Güvenlik: Harf duyarsız tekilleştirme ve küfür filtresi devrede</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-300">
          <Clock className="w-3.5 h-3.5 text-[#25F4EE]" />
          <span>Hedef: {settings.drawTime || '19:00'}</span>
        </div>
      </div>
    </div>
  );
}
