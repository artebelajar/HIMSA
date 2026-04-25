// Fungsi konversi Masehi ke Hijriyah
export function getHijriDate(date: Date): { day: number; month: string; monthIndex: number; year: number } {
  const d = date.getDate()
  const m = date.getMonth() + 1
  const y = date.getFullYear()
  
  let a = Math.floor((14 - m) / 12)
  let yy = y + 4800 - a
  let mm = m + 12 * a - 3
  let jd = d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045
  
  let l = jd - 1948440 + 10632
  let n = Math.floor((l - 1) / 10631)
  l = l - 10631 * n + 354
  let j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238)
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29
  
  let hijriMonth = Math.floor((24 * l) / 709)
  let hijriDay = l - Math.floor((709 * hijriMonth) / 24)
  let hijriYear = 30 * n + j - 30
  
  if (hijriDay < 1) { hijriMonth--; hijriDay = 30 + hijriDay }
  if (hijriMonth < 1) { hijriMonth = 12; hijriYear-- }
  if (hijriMonth > 12) { hijriMonth = 1; hijriYear++ }
  
  const hijriMonths = [
    'Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir',
    'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Sya\'ban',
    'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah'
  ]
  
  return { 
    day: Math.floor(hijriDay), 
    month: hijriMonths[Math.floor(hijriMonth) - 1] || '', 
    monthIndex: Math.floor(hijriMonth),
    year: Math.floor(hijriYear) 
  }
}

export interface IslamicEvent {
  name: string
  hijriDay: number
  hijriMonth: number
  description: string
  color: string
  icon: string
}

export const ISLAMIC_EVENTS: IslamicEvent[] = [
  { name: 'Tahun Baru Islam', hijriDay: 1, hijriMonth: 1, description: '1 Muharram', color: 'text-amber-400', icon: '🌙' },
  { name: 'Puasa Asyura', hijriDay: 10, hijriMonth: 1, description: '10 Muharram', color: 'text-amber-400', icon: '🤲' },
  { name: 'Maulid Nabi', hijriDay: 12, hijriMonth: 3, description: '12 Rabiul Awal', color: 'text-green-400', icon: '🌟' },
  { name: 'Isra Mi\'raj', hijriDay: 27, hijriMonth: 7, description: '27 Rajab', color: 'text-purple-400', icon: '✨' },
  { name: 'Nisfu Sya\'ban', hijriDay: 15, hijriMonth: 8, description: '15 Sya\'ban', color: 'text-blue-400', icon: '🌕' },
  { name: 'Awal Ramadhan', hijriDay: 1, hijriMonth: 9, description: '1 Ramadhan', color: 'text-amber-400', icon: '🌙' },
  { name: 'Nuzulul Quran', hijriDay: 17, hijriMonth: 9, description: '17 Ramadhan', color: 'text-amber-400', icon: '📖' },
  { name: 'Idul Fitri', hijriDay: 1, hijriMonth: 10, description: '1 Syawal', color: 'text-green-400', icon: '🎉' },
  { name: 'Puasa Arafah', hijriDay: 9, hijriMonth: 12, description: '9 Dzulhijjah', color: 'text-amber-400', icon: '🕋' },
  { name: 'Idul Adha', hijriDay: 10, hijriMonth: 12, description: '10 Dzulhijjah', color: 'text-red-400', icon: '🐑' },
]

export const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir',
  'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Sya\'ban',
  'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah'
]