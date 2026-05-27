import { defineStore } from 'pinia'
import { SALES_DATA, MS_STOCK, CARD_TX, STAFF_DATA, ADVANCE_DATA, METER_DATA } from '@/data/salesData.js'

export const useSalesStore = defineStore('sales', {
  state: () => ({
    sales: SALES_DATA,
    msStock: MS_STOCK,
    cardTx: CARD_TX,
    staff: STAFF_DATA,
    advances: ADVANCE_DATA,
    meters: METER_DATA,
    period: 'April 2026',
    stationName: 'Kailas Petromines',
    stationSub: 'HP Fuel Station · Khopoli',
  }),
  getters: {
    totalRevenue: (s) => s.sales.reduce((a, r) => a + r.revenue, 0),
    totalMS:      (s) => s.sales.reduce((a, r) => a + r.ms, 0),
    totalHSD:     (s) => s.sales.reduce((a, r) => a + r.hsd, 0),
    totalSpeed:   (s) => s.sales.reduce((a, r) => a + r.speed, 0),
    totalCash:    (s) => s.sales.reduce((a, r) => a + r.cash, 0),
    totalPhone:   (s) => s.sales.reduce((a, r) => a + r.phonepay, 0),
    totalCard:    (s) => s.sales.reduce((a, r) => a + r.card, 0),
    totalExp:     (s) => s.sales.reduce((a, r) => a + r.exp, 0),
    totalCredit:  (s) => s.sales.reduce((a, r) => a + r.credit, 0),
    avgDailyRevenue: (s) => s.sales.reduce((a, r) => a + r.revenue, 0) / s.sales.length,
    maxDayRevenue: (s) => Math.max(...s.sales.map(r => r.revenue)),
    maxDayDate:   (s) => s.sales.reduce((a, r) => r.revenue > a.revenue ? r : a, s.sales[0]).date,
    totalPayroll: (s) => s.staff.reduce((a, r) => a + r.salary, 0),
    totalAdvances:(s) => s.staff.reduce((a, r) => a + r.advance, 0),
    staffNames:   () => ['Ajay','Santosh','Ayaz','Rizwan','Rehan','Kartik','Komal','Tanmay','Vanshika'],
  }
})
