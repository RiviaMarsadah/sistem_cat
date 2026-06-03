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
    process.exitCode = 1;
  }
}

// ── PATCH: Replace token buttons ─────────────────────────────────────────
const oldTokens = `                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
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
                        </div>`;

const newTokens = `                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
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
                        </div>`;

patch(oldTokens, newTokens, 'Token buttons with countdown');

// ── PATCH: spin keyframe & close ───────────────────────────────────────────
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
