import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import useStore from '../store/useStore'
import Navbar from '../components/Navbar'
import DeckCard from '../components/DeckCard'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444']

export default function Dashboard() {
  const { user, decks, stats, fetchDecks, fetchStats, createDeck, deleteDeck } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [newDeck, setNewDeck] = useState({ title: '', description: '', color: '#6366f1' })
  const navigate = useNavigate()

  useEffect(() => {
    fetchDecks()
    fetchStats()
  }, [])

  const handleCreate = async e => {
    e.preventDefault()
    if (!newDeck.title.trim()) return toast.error('Nhập tên bộ từ!')
    try {
      await createDeck(newDeck)
      setShowForm(false)
      setNewDeck({ title: '', description: '', color: '#6366f1' })
      toast.success('Tạo bộ từ thành công! 🎉')
    } catch { toast.error('Tạo thất bại, thử lại!') }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Xóa bộ từ này?')) return
    await deleteDeck(id)
    toast.success('Đã xóa')
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      {/* Hero banner */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 py-10 relative">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                Chào buổi{' '}
                {new Date().getHours() < 12 ? 'sáng' : new Date().getHours() < 18 ? 'chiều' : 'tối'},{' '}
                <span className="text-indigo-400">{user?.full_name?.split(' ').pop()}!</span> 👋
              </h1>
              <p className="text-white/50 mt-1">Sẵn sàng học từ vựng hôm nay chưa?</p>
            </div>
            {/* Streak badge */}
            {stats?.streak > 0 && (
              <div className="ml-auto flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-2xl px-4 py-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="text-orange-300 font-bold text-lg leading-none">{stats.streak}</div>
                  <div className="text-orange-400/70 text-xs">ngày liên tiếp</div>
                </div>
              </div>
            )}
          </div>

          {/* Quick stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { label: 'Tổng từ', value: stats.total_cards, icon: '📚', color: 'text-blue-400' },
                { label: 'Đã thuộc', value: stats.mastered, icon: '✅', color: 'text-green-400' },
                { label: 'Đang học', value: stats.learning, icon: '📖', color: 'text-yellow-400' },
                { label: 'Từ mới', value: stats.new, icon: '✨', color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="card-glass px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-white/40 text-xs">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Decks section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Bộ từ của bạn ({decks.length})</h2>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <span className="text-lg">+</span> Tạo bộ từ
          </button>
        </div>

        {/* Create form modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="card-glass p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-5">Tạo bộ từ mới</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Tên bộ từ *</label>
                    <input className="input-field" placeholder="VD: TOEIC 600 từ" required
                      value={newDeck.title} onChange={e => setNewDeck(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Mô tả</label>
                    <input className="input-field" placeholder="VD: Từ vựng TOEIC Part 5, 6, 7"
                      value={newDeck.description} onChange={e => setNewDeck(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Màu sắc</label>
                    <div className="flex gap-2">
                      {COLORS.map(c => (
                        <button key={c} type="button"
                          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${newDeck.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ background: c }} onClick={() => setNewDeck(f => ({ ...f, color: c }))}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Hủy</button>
                    <button type="submit" className="btn-primary flex-1">Tạo bộ từ</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deck grid */}
        {decks.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-lg">Bạn chưa có bộ từ nào</p>
            <p className="text-sm mt-1">Tạo bộ từ đầu tiên để bắt đầu học!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck, i) => (
              <DeckCard key={deck.id} deck={deck} index={i}
                onClick={() => navigate(`/deck/${deck.id}`)}
                onDelete={e => handleDelete(deck.id, e)}
                onStudy={e => { e.stopPropagation(); navigate(`/study/${deck.id}`) }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
