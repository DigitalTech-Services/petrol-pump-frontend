export function useChartDefaults() {
  const GRID  = 'rgba(31,45,66,0.7)'
  const TICK  = '#4e6080'
  const baseScales = (yCallback) => ({
    x: { grid: { color: GRID }, ticks: { color: TICK, font: { size: 9 }, maxRotation: 50 } },
    y: { grid: { color: GRID }, ticks: { color: TICK, font: { size: 10 }, callback: yCallback || (v => v) } },
  })
  const baseLegend = () => ({ labels: { color: TICK, font: { size: 11 }, boxWidth: 10, padding: 12 } })
  const baseOpts = (yCallback) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: baseLegend(), tooltip: { backgroundColor: '#1c2535', titleColor: '#e2e8f4', bodyColor: '#8796b0', borderColor: '#2a3d57', borderWidth: 1 } },
    scales: baseScales(yCallback),
  })
  const rupeeY = v => '₹' + (v >= 100000 ? (v/100000).toFixed(1)+'L' : Number(v).toLocaleString('en-IN'))
  return { baseOpts, rupeeY, GRID, TICK }
}
