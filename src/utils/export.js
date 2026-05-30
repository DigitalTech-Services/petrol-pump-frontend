// ── CSV Export utility ────────────────────────────────────────────
export function exportCSV(filename, headers, rows) {
  const escape = (v) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [
    headers.map(escape).join(','),
    ...rows.map(r => r.map(escape).join(','))
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : filename + '.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Print utility ─────────────────────────────────────────────────
export function printTable(title, headers, rows) {
  const th = headers.map(h => `<th style="padding:8px 12px;background:#f3f4f6;border:1px solid #d1d5db;font-size:12px;text-align:left">${h}</th>`).join('')
  const tr = rows.map(r =>
    `<tr>${r.map(c => `<td style="padding:7px 12px;border:1px solid #e5e7eb;font-size:12px">${c ?? ''}</td>`).join('')}</tr>`
  ).join('')
  const win = window.open('', '_blank')
  win.document.write(`
    <html><head><title>${title}</title>
    <style>body{font-family:sans-serif;padding:24px}h2{margin-bottom:16px}table{border-collapse:collapse;width:100%}@media print{button{display:none}}</style>
    </head><body>
    <h2>${title}</h2>
    <p style="color:#6b7280;font-size:12px;margin-bottom:16px">Generated: ${new Date().toLocaleString('en-IN')}</p>
    <table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>
    <br><button onclick="window.print()">🖨 Print</button>
    </body></html>`)
  win.document.close()
}
