import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function StudySummary({ results, total, deckId, deck }) {
  const { again = 0, hard = 0, easy = 0 } = results
  const accuracy = total > 0 ? Math.round((easy / total) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-green-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />

      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
        className="w-full max-w-md card-glass p-8 text-center relative">

        <div className="text-6xl mb-4">{accuracy >= 70 ? '🎉' : accuracy >= 40 ? '💪' : '📖'}</div>
        <h2 className="text-2xl font-bold mb-1">Hoàn thành phiên học!</h2>
        <p className="text-white/40">{deck?.title}</p>

        {/* Accuracy ring */}
        <div className="my-6 flex items-center justify-center">
          <div className="relative">
            <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
              <motion.circle cx="60" cy="60" r="50" fill="none"
                stroke={accuracy >= 70 ? '#22c55e' : accuracy >= 40 ? '#eab308' : '#ef4444'} strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - accuracy / 100) }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{accuracy}%</span>
              <span className="text-white/40 text-xs">chính xác</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Quên rồi', value: again, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'Mơ hồ', value: hard, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
            { label: 'Đã nhớ', value: easy, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl py-3 border ${s.bg}`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Link to={`/study/${deckId}`} className="btn-secondary flex-1 text-center">Học lại</Link>
          <Link to={`/deck/${deckId}`} className="btn-primary flex-1 text-center">Xem bộ từ</Link>
        </div>
        <Link to="/" className="block text-center text-white/30 hover:text-white/60 text-sm mt-4 transition-colors">← Về trang chủ</Link>
      </motion.div>
    </div>
  )
}
