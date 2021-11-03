export default function formatNumber(n: number): string {
  return n.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}
