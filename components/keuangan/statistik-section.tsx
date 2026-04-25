"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { BarChart3, PieChartIcon, TrendingUp } from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

interface MonthlyStat {
  month: string
  year: number
  income: number
  expense: number
  balance: number
}

interface ExpenseCategory {
  name: string
  value: number
}

interface KasStat {
  kelas_id: string
  kelas_name: string
  total_santri: number
  paid_santri: number
  unpaid_santri: number
  percentage: number
  total_amount: number
  paid_amount: number
}

interface StatistikSectionProps {
  monthlyStats: MonthlyStat[]
  expenseByCategory: ExpenseCategory[]
  kasStats: KasStat[]
  formatRupiah: (amount: number) => string
}

export function StatistikSection({
  monthlyStats,
  expenseByCategory,
  kasStats,
  formatRupiah,
}: StatistikSectionProps) {
  return (
    <div className="space-y-6">
      {/* Grafik Pemasukan vs Pengeluaran */}
      <Card className="bg-card/50 border-white/20 p-6">
        <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Pemasukan vs Pengeluaran (6 Bulan Terakhir)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px' 
                }}
                formatter={(value: number) => formatRupiah(value)}
              />
              <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Saldo & Kategori */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-white/20 p-6">
          <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tren Saldo
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px' 
                  }}
                  formatter={(value: number) => formatRupiah(value)}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  name="Saldo" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  dot={{ fill: '#06b6d4' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-card/50 border-white/20 p-6">
          <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Kategori Pengeluaran
          </h3>
          {expenseByCategory.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px' 
                    }}
                    formatter={(value: number) => formatRupiah(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Belum ada data pengeluaran</p>
          )}
        </Card>
      </div>

      {/* Ringkasan Kas */}
      <Card className="bg-card/50 border-white/20 p-6">
        <h3 className="font-semibold text-primary mb-4">Ringkasan Kas per Kelas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/20">
              <tr className="text-left text-muted-foreground">
                <th className="pb-3">Kelas</th>
                <th className="pb-3">Santri</th>
                <th className="pb-3">Lunas</th>
                <th className="pb-3">Belum</th>
                <th className="pb-3">Progress</th>
                <th className="pb-3 text-right">Total Kas</th>
              </tr>
            </thead>
            <tbody>
              {kasStats.map((stat) => (
                <tr key={stat.kelas_id} className="border-b border-white/10">
                  <td className="py-3 font-medium">Kelas {stat.kelas_name}</td>
                  <td className="py-3">{stat.total_santri}</td>
                  <td className="py-3 text-green-400">{stat.paid_santri}</td>
                  <td className="py-3 text-yellow-400">{stat.unpaid_santri}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs">{stat.percentage}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-semibold">{formatRupiah(stat.paid_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}