const fs = require('fs');
const filePath = 'd:/FILE TUGAS AKHIR/~APLIKASI/Website CAT/frontend/src/pages/admin/JadwalUjian.jsx';

let content = fs.readFileSync(filePath, 'utf8');
let patchCount = 0;

function patch(oldStr, newStr, label) {
  if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    console.log(`✅ Patch "${label}" applied`);
    patchCount++;
  } else {
    console.error(`❌ Patch "${label}" NOT FOUND`);
    process.exitCode = 1;
  }
}

// ── PATCH 1: Add token vars in the map callback ───────────────────────────
patch(
  `                 const isEven = idx % 2 === 1;\n                 const rowClass = isEven ? 'session-row-even' : 'session-row-odd';\n \n                 return (`,
  `                 const isEven = idx % 2 === 1;\n                 const rowClass = isEven ? 'session-row-even' : 'session-row-odd';\n                 // Token live: dari tokenMap jika ujian hari ini, fallback ke data DB\n                 const todayTok        = tokenMap[j.id];\n                 const displayToken    = todayTok?.token        ?? j.token;\n                 const displayTokenOut = todayTok?.tokenCheckOut ?? j.tokenCheckOut;\n                 const jadwalHariIni   = isToday(j);\n\n                 return (`,
  'Add token vars'
);

// ── PATCH 2: Replace token IN button (j.token -> displayToken + countdown) ─
const OLD_TOKEN_CELL = `                   <td className="text-center">
                     <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                       <button 
                         type="button"
                         onClick={() => {
                           navigator.clipboard.writeText(j.token);
                           showToast('Token Check-In disalin: ' + j.token, 'success');
                         }}
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
                         onMouseEnter={(e) => { e.currentTarget.style.background = '#d1fae5'; }}
                         onMouseLeave={(e) => { e.currentTarget.style.background = '#ecfdf5'; }}
                       >
                         <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#065f46', marginRight: '2px' }}>IN:</span>
                         <span>{j.token || '-'}</span>
                       </button>
                       <button 
                         type="button"
                         onClick={() => {
                           navigator.clipboard.writeText(j.tokenCheckOut);
                           showToast('Token Check-Out disalin: ' + j.tokenCheckOut, 'success');
                         }}
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
                         onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                         onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                       >
                         <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#991b1b', marginRight: '2px' }}>OUT:</span>
                         <span>{j.tokenCheckOut || '-'}</span>
                       </button>
                     </div>
                   </td>`;

const NEW_TOKEN_CELL = `                   <td className="text-center">
                     <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                       {/* Token IN */}
                       <button 
                         type="button"
                         onClick={() => {
                           navigator.clipboard.writeText(displayToken);
                           showToast('Token Check-In disalin: ' + displayToken, 'success');
                         }}
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
                         onMouseEnter={(e) => { e.currentTarget.style.background = '#d1fae5'; }}
                         onMouseLeave={(e) => { e.currentTarget.style.background = '#ecfdf5'; }}
                       >
                         <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#065f46', marginRight: '2px' }}>IN:</span>
                         <span>{displayToken || '-'}</span>
                       </button>
                       {/* Token OUT */}
                       <button 
                         type="button"
                         onClick={() => {
                           navigator.clipboard.writeText(displayTokenOut);
                           showToast('Token Check-Out disalin: ' + displayTokenOut, 'success');
                         }}
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
                         onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                         onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                       >
                         <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#991b1b', marginRight: '2px' }}>OUT:</span>
                         <span>{displayTokenOut || '-'}</span>
                       </button>
                       {/* Countdown timer — hanya untuk ujian hari ini */}
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

patch(OLD_TOKEN_CELL, NEW_TOKEN_CELL, 'Token cell with countdown');

// ── PATCH 3: Status Paket — add pilih/ganti paket button ──────────────────
const OLD_PAKET_CELL = `                   <td className="text-center">
                      {j.paketUjianId ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <span className="user-status-badge status-aktif" style={{ whiteSpace: 'nowrap' }}>
                            <FiCheckCircle /> Siap Ujian
                          </span>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={j.paketUjian?.nama}>
                            {j.paketUjian?.nama}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                            Oleh: {j.paketUjian?.guru?.user?.namaLengkap || 'Admin'}
                          </div>
                        </div>
                      ) : (
                        <span className="user-status-badge status-nonaktif" style={{whiteSpace: 'nowrap'}}>
                          <FiXCircle /> Belum Diisi Paket
                        </span>
                      )}
                    </td>`;

const NEW_PAKET_CELL = `                   <td className="text-center">
                      {j.paketUjianId ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <span className="user-status-badge status-aktif" style={{ whiteSpace: 'nowrap' }}>
                            <FiCheckCircle /> Siap Ujian
                          </span>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={j.paketUjian?.nama}>
                            {j.paketUjian?.nama}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                            Oleh: {j.paketUjian?.guru?.user?.namaLengkap || 'Admin'}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => openPaketModal(j, e)}
                            style={{ fontSize: '0.7rem', color: '#6366f1', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontWeight: '600', marginTop: '2px' }}
                          >
                            Ganti Paket
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <span className="user-status-badge status-nonaktif" style={{whiteSpace: 'nowrap'}}>
                            <FiXCircle /> Belum Diisi Paket
                          </span>
                          <button
                            type="button"
                            onClick={(e) => openPaketModal(j, e)}
                            style={{ fontSize: '0.75rem', color: '#fff', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FiPackage size={12} /> Pilih Paket Soal
                          </button>
                        </div>
                      )}
                    </td>`;

patch(OLD_PAKET_CELL, NEW_PAKET_CELL, 'Status paket with modal button');

// Write result
if (process.exitCode !== 1) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`\n✅ File updated successfully. ${patchCount} patches applied.`);
} else {
  console.error('\n❌ Some patches failed. File NOT saved.');
}
