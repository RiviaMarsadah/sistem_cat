const fs = require('fs');
const filePath = 'd:/FILE TUGAS AKHIR/~APLIKASI/Website CAT/frontend/src/pages/admin/AdminGuruJadwal.jsx';
let content = fs.readFileSync(filePath, 'utf8');
let patchCount = 0;

function patch(oldStr, newStr, label) {
  if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    console.log(`✅ Patch "${label}" applied`);
    patchCount++;
  } else {
    console.error(`❌ Patch "${label}" NOT FOUND`);
    const idx = content.indexOf(oldStr.substring(0, 30));
    if (idx >= 0) console.log('  Nearest match at:', idx);
    process.exitCode = 1;
  }
}

// ── PATCH 1: Add imports ───────────────────────────────────────────────────
patch(
  `import { useEffect, useState, useMemo } from 'react';\nimport { FiBook, FiCalendar, FiClock, FiShield, FiUser, FiCopy } from 'react-icons/fi';`,
  `import { useEffect, useState, useMemo, useCallback, useRef } from 'react';\nimport { FiBook, FiCalendar, FiClock, FiShield, FiUser, FiCopy, FiRefreshCw } from 'react-icons/fi';\n\n// ── Helper: format mm:ss dari milliseconds ──\nfunction formatCountdown(ms) {\n  if (ms <= 0) return '00:00';\n  const totalSec = Math.ceil(ms / 1000);\n  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');\n  const s = (totalSec % 60).toString().padStart(2, '0');\n  return \`\${m}:\${s}\`;\n}\n\nfunction isToday(jadwal) {\n  const now = new Date();\n  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);\n  const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);\n  return new Date(jadwal.mulai) <= endOfDay && new Date(jadwal.selesai) >= startOfDay;\n}`,
  'Imports + helpers'
);

// ── PATCH 2: Add token state & polling in component ────────────────────────
patch(
  `export default function AdminGuruJadwal() {\n  const { showToast } = useToast();\n  const [loading, setLoading] = useState(true);\n  const [schedules, setSchedules] = useState([]);\n  const [searchCustom, setSearchCustom] = useState('');\n  const [currentPageCustom, setCurrentPageCustom] = useState(1);`,
  `export default function AdminGuruJadwal() {\n  const { showToast } = useToast();\n  const [loading, setLoading]     = useState(true);\n  const [schedules, setSchedules] = useState([]);\n  const [searchCustom, setSearchCustom]       = useState('');\n  const [currentPageCustom, setCurrentPageCustom] = useState(1);\n  // Token countdown\n  const [tokenMap, setTokenMap]         = useState({});\n  const [msUntilRegen, setMsUntilRegen] = useState(0);\n  const countdownRef = useRef(null);\n  const pollRef      = useRef(null);`,
  'Add token state'
);

// ── PATCH 3: Replace fetchData + useEffect with enhanced version ───────────
patch(
  `  const fetchData = async () => {\n    setLoading(true);\n    try {\n      const res = await api.get('/admin/guru-data/jadwal');\n      // Only display custom exams scheduled by teachers (marked as custom or has a non-null creator)\n      const allSchedules = res.data?.data || [];\n      const customOnly = allSchedules.filter(j => j.kategori === 'custom' || j.guruId !== null);\n      setSchedules(customOnly);\n    } catch (err) {\n      showToast('Gagal memuat data jadwal guru. ' + (err?.response?.data?.message || ''), 'error');\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  useEffect(() => {\n    fetchData();\n  }, []);`,
  `  const fetchData = async () => {\n    setLoading(true);\n    try {\n      const res = await api.get('/admin/guru-data/jadwal');\n      const allSchedules = res.data?.data || [];\n      const customOnly = allSchedules.filter(j => j.kategori === 'custom' || j.guruId !== null);\n      setSchedules(customOnly);\n    } catch (err) {\n      showToast('Gagal memuat data jadwal guru. ' + (err?.response?.data?.message || ''), 'error');\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  const fetchTodayTokens = useCallback(async () => {\n    try {\n      const res = await api.get('/admin/jadwal-ujian/today-tokens');\n      if (res.data?.success) {\n        setTokenMap(res.data.data.tokens || {});\n        const ms = res.data.data.msUntilNextRegen || 0;\n        setMsUntilRegen(ms);\n        if (countdownRef.current) clearInterval(countdownRef.current);\n        countdownRef.current = setInterval(() => {\n          setMsUntilRegen(prev => {\n            if (prev <= 1000) {\n              clearInterval(countdownRef.current);\n              fetchData();\n              fetchTodayTokens();\n              return 0;\n            }\n            return prev - 1000;\n          });\n        }, 1000);\n      }\n    } catch (_) {}\n  }, []);\n\n  useEffect(() => {\n    fetchData();\n    fetchTodayTokens();\n    pollRef.current = setInterval(fetchTodayTokens, 30_000);\n    return () => {\n      if (countdownRef.current) clearInterval(countdownRef.current);\n      if (pollRef.current)      clearInterval(pollRef.current);\n    };\n  }, [fetchTodayTokens]);`,
  'Enhanced useEffect with token polling'
);

// ── PATCH 4: Add token vars in the custom map loop ─────────────────────────
// Find the map loop and add vars
const oldMap = `                   return (
                    <tr key={j.id} className={rowClass}>
                      <td className="text-left">
                        <div style={{ fontWeight: '700', color: '#1e293b' }}>
                          {j.nama}`;
const newMap = `                   const todayTok        = tokenMap[j.id];
                   const displayToken    = todayTok?.token        ?? j.token;
                   const displayTokenOut = todayTok?.tokenCheckOut ?? j.tokenCheckOut;
                   const jadwalHariIni   = isToday(j);

                   return (
                    <tr key={j.id} className={rowClass}>
                      <td className="text-left">
                        <div style={{ fontWeight: '700', color: '#1e293b' }}>
                          {j.nama}`;
patch(oldMap, newMap, 'Add token vars in custom map');

// ── PATCH 5: Replace token buttons in custom table ─────────────────────────
const oldTokens = `                      <td className="text-center">
                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                          <button 
                            type="button"
                            onClick={() => handleCopyToken(j.token, 'Check-In')}
                            title="Klik untuk menyalin Token Check-In"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              gap: '6px', 
                              background: '#ecfdf5', 
                              color: '#047857', 
                              border: '1px solid #a7f3d0', 
                              padding: '5px 12px', 
                              borderRadius: '8px', 
                              fontSize: '0.8rem', 
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              width: '105px'
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#065f46', marginRight: '2px' }}>IN:</span>
                            <span>{j.token || '-'}</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleCopyToken(j.tokenCheckOut, 'Check-Out')}
                            title="Klik untuk menyalin Token Check-Out"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              gap: '6px', 
                              background: '#fef2f2', 
                              color: '#b91c1c', 
                              border: '1px solid #fecaca', 
                              padding: '5px 12px', 
                              borderRadius: '8px', 
                              fontSize: '0.8rem', 
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              width: '105px'
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#991b1b', marginRight: '2px' }}>OUT:</span>
                            <span>{j.tokenCheckOut || '-'}</span>
                          </button>
                        </div>
                      </td>`;

const newTokens = `                      <td className="text-center">
                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <button 
                            type="button"
                            onClick={() => handleCopyToken(displayToken, 'Check-In')}
                            title="Klik untuk menyalin Token Check-In"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              gap: '6px', 
                              background: '#ecfdf5', 
                              color: '#047857', 
                              border: '1px solid #a7f3d0', 
                              padding: '5px 12px', 
                              borderRadius: '8px', 
                              fontSize: '0.8rem', 
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              width: '112px'
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#065f46', marginRight: '2px' }}>IN:</span>
                            <span>{displayToken || '-'}</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleCopyToken(displayTokenOut, 'Check-Out')}
                            title="Klik untuk menyalin Token Check-Out"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              gap: '6px', 
                              background: '#fef2f2', 
                              color: '#b91c1c', 
                              border: '1px solid #fecaca', 
                              padding: '5px 12px', 
                              borderRadius: '8px', 
                              fontSize: '0.8rem', 
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              width: '112px'
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#991b1b', marginRight: '2px' }}>OUT:</span>
                            <span>{displayTokenOut || '-'}</span>
                          </button>
                          {jadwalHariIni && (
                            <div style={{ 
                              display: 'flex', alignItems: 'center', gap: '4px',
                              marginTop: '2px',
                              background: msUntilRegen < 60000 ? '#fff7ed' : '#f0f9ff',
                              border: \`1px solid \${msUntilRegen < 60000 ? '#fed7aa' : '#bae6fd'}\`,
                              borderRadius: '6px', padding: '3px 8px',
                              fontSize: '0.7rem', fontWeight: '600',
                              color: msUntilRegen < 60000 ? '#c2410c' : '#0369a1'
                            }}>
                              <FiRefreshCw size={10} />
                              <span>Regen: {formatCountdown(msUntilRegen)}</span>
                            </div>
                          )}
                        </div>
                      </td>`;

patch(oldTokens, newTokens, 'Token buttons with countdown');

// ── PATCH 6: Add style tag and close ──────────────────────────────────────
patch(
  `    </div>\n  );\n}\n`,
  `    <style>{\`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\`}</style>\n    </div>\n  );\n}\n`,
  'Add spin keyframe'
);

if (process.exitCode !== 1) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`\n✅ AdminGuruJadwal.jsx updated. ${patchCount} patches applied.`);
} else {
  console.error('\n❌ Some patches failed. File NOT saved.');
}
