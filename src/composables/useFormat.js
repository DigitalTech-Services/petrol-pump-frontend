export function useFormat() {
  const fmt = (n, decimals = 0) => {
    if (n === null || n === undefined) return '0'
    return Number(n).toLocaleString('en-IN', { maximumFractionDigits: decimals })
  }
  const fmtCr = (n) => {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + 'Cr'
    if (n >= 100000)   return '₹' + (n / 100000).toFixed(2) + 'L'
    return '₹' + fmt(n)
  }
  const fmtINR = (n) => '₹' + fmt(n)
  return { fmt, fmtCr, fmtINR }
}
