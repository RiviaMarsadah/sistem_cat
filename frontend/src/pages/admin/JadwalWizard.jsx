import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiCheck, FiSave, FiAlertCircle, FiSettings, FiList, FiClock, FiShield } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './JadwalWizard.css';

export default function JadwalWizard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Step 1: Periode
  const [periodes, setPeriodes] = useState([]);
  const [isNewPeriode, setIsNewPeriode] = useState(false);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
  
  // New Periode Data
  const [periodeNama, setPeriodeNama] = useState('');
  const [periodeSemester, setPeriodeSemester] = useState('Gasal');
  const [periodeTahun, setPeriodeTahun] = useState('2026/2027');
  const [periodeMulai, setPeriodeMulai] = useState('');
  const [periodeSelesai, setPeriodeSelesai] = useState('');

  // Step 2 & 3: Master Data
  const [masterJurusan, setMasterJurusan] = useState([]);
  const [masterKelas, setMasterKelas] = useState([]);
  const [masterMapel, setMasterMapel] = useState([]);

  // Step 2 Selections
  const [selectedJurusans, setSelectedJurusans] = useState([]);
  
  // Step 3 Selections
  const [selectedKelas, setSelectedKelas] = useState([]);

  // Step 4 Settings
  const [globalKioskMode, setGlobalKioskMode] = useState(true);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    setLoading(true);
    try {
      const [resPer, resJur, resKel, resMap] = await Promise.all([
        api.get('/admin/periode'),
        api.get('/admin/jurusan'),
        api.get('/admin/kelas'),
        api.get('/admin/mata-pelajaran')
      ]);
      setPeriodes(resPer.data.data || []);
      setMasterJurusan(resJur.data.data || []);
      setMasterKelas(resKel.data.data || []);
      setMasterMapel(resMap.data.data || []);
    } catch(err) {
      showToast('Gagal mengambil data master', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    // Validation before next
    if (currentStep === 1) {
      if (isNewPeriode) {
        if (!periodeNama || !periodeMulai || !periodeSelesai || !periodeSemester || !periodeTahun) {
          showToast('Mohon lengkapi semua isian periode baru.', 'error');
          return;
        }
      } else {
        if (!selectedPeriodeId) {
          showToast('Silakan pilih periode yang ada atau buat periode baru.', 'error');
          return;
        }
      }
    } else if (currentStep === 2) {
      if (selectedJurusans.length === 0) {
        showToast('Pilih minimal satu program studi/jurusan.', 'error');
        return;
      }
      // Keep only selectedKelas that belong to currently selected jurusans
      const availableClassIds = masterKelas
        .filter(k => selectedJurusans.includes(String(k.jurusanId)))
        .map(k => String(k.id));
      setSelectedKelas(prev => prev.filter(id => availableClassIds.includes(id)));
    } else if (currentStep === 3) {
       if (selectedKelas.length === 0) {
         showToast('Pilih minimal satu kelas.', 'error');
         return;
       }
       // Prepare slots for Step 4
       if (sessions.length === 0) {
          addEmptySession();
       } else {
          // Synchronize existing sessions' classSettings with current selectedKelas
          setSessions(prev => prev.map(s => {
            const updatedClassSettings = selectedKelas.map(kId => {
              const existing = s.classSettings.find(c => String(c.kelasId) === String(kId));
              return existing || { kelasId: kId, mapelId: '', ruangan: '' };
            });
            return {
              ...s,
              classSettings: updatedClassSettings
            };
          }));
       }
    } else if (currentStep === 4) {
      if (sessions.length === 0) {
         showToast('Tentukan minimal satu sesi ujian.', 'error');
         return;
      }
      for (const sess of sessions) {
        if (!sess.mulai || !sess.durasi) {
          showToast('Tentukan waktu mulai dan durasi untuk tiap sesi.', 'error');
          return;
        }
        for (const cls of sess.classSettings) {
           if (!cls.mapelId) {
             const className = masterKelas.find(k => String(k.id) === String(cls.kelasId))?.inisial || 'Kelas';
             showToast(`Pilih Mata Pelajaran untuk ${className} di Sesi ${sess.id}.`, 'error');
             return;
           }
        }
      }
    }

    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Step 2 Toggles
  const toggleJurusan = (id) => {
    setSelectedJurusans(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllJurusan = () => {
    setSelectedJurusans(masterJurusan.map(j => String(j.id)));
  };
  const deselectAllJurusan = () => setSelectedJurusans([]);

  // Step 3 Toggles
  const toggleKelas = (id) => {
    setSelectedKelas(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  
  const selectAllKelasFilter = () => {
    const relevant = masterKelas.filter(k => selectedJurusans.includes(String(k.jurusanId)));
    setSelectedKelas(relevant.map(k => String(k.id)));
  };

  // Step 4 Handlers (Sessions)
  const addEmptySession = () => {
    let baseDate = new Date().toISOString().split('T')[0];
    
    if (isNewPeriode && periodeMulai) {
       baseDate = periodeMulai;
    } else if (!isNewPeriode && selectedPeriodeId) {
       const p = periodes.find(per => String(per.id) === String(selectedPeriodeId));
       if (p && p.mulai) {
          baseDate = new Date(p.mulai).toISOString().split('T')[0];
       }
    }

    const nextId = sessions.length > 0 ? Math.max(...sessions.map(s => s.id)) + 1 : 1;
    
    setSessions([...sessions, {
      id: nextId,
      mulai: `${baseDate}T07:30`,
      durasi: 90,
      selesai: `${baseDate}T09:00`,
      classSettings: selectedKelas.map(kId => ({
        kelasId: kId,
        mapelId: '',
        ruangan: ''
      }))
    }]);
  };
  
  const updateSession = (id, field, value) => {
    setSessions(prev => prev.map(s => {
      if (s.id === id) {
        let updated = { ...s, [field]: value };
        if (field === 'mulai' || field === 'durasi') {
           // Auto calc selesai
           const start = new Date(updated.mulai);
           if (!isNaN(start.getTime())) {
             const end = new Date(start.getTime() + updated.durasi * 60000);
             // Format back to YYYY-MM-DDTHH:MM
             const offset = end.getTimezoneOffset() * 60000;
             const localEnd = new Date(end.getTime() - offset);
             updated.selesai = localEnd.toISOString().substring(0, 16);
           }
        }
        return updated;
      }
      return s;
    }));
  };
  
  const removeSession = (id) => {
     setSessions(prev => prev.filter(s => s.id !== id));
  };

  const updateClassInSession = (sessionId, kelasId, field, value) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          classSettings: s.classSettings.map(c => 
            String(c.kelasId) === String(kelasId) ? { ...c, [field]: value } : c
          )
        };
      }
      return s;
    }));
  };

  const bulkApplyMapel = (sessionId, mapelId) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          classSettings: s.classSettings.map(c => ({ ...c, mapelId }))
        };
      }
      return s;
    }));
  };


  // Final Submit
  const handleGenerate = async () => {
    setSaving(true);
    
    try {
      let finalPeriodeId = selectedPeriodeId;
      
      // If new periode, create hit first
      if (isNewPeriode) {
        const perRes = await api.post('/admin/periode', {
           nama: periodeNama, mulai: periodeMulai, selesai: periodeSelesai, semester: periodeSemester, tahunAjaran: periodeTahun
        });
        finalPeriodeId = perRes.data.data.id;
      }

      // Generate schedules
      // Group by Mapel+Ruangan+Waktu inside sessions to optimize backend calls
      const payloadSlots = [];
      
      for (const sess of sessions) {
        // Find set of unique (mapelId, ruangan) in this session
        const uniqueConfigs = [];
        sess.classSettings.forEach(cs => {
          const configStr = `${cs.mapelId}-${cs.ruangan}`;
          if (!uniqueConfigs.find(u => u.key === configStr)) {
            uniqueConfigs.push({ key: configStr, mapelId: cs.mapelId, ruangan: cs.ruangan, kelasIds: [] });
          }
          uniqueConfigs.find(u => u.key === configStr).kelasIds.push(cs.kelasId);
        });

        uniqueConfigs.forEach(cfg => {
          payloadSlots.push({
            mapelId: cfg.mapelId,
            ruangan: cfg.ruangan,
            mulai: sess.mulai,
            selesai: sess.selesai,
            durasi: sess.durasi,
            opsiKeamanan: globalKioskMode,
            kelasIds: cfg.kelasIds
          });
        });
      }

      await api.post('/admin/jadwal-ujian/bulk-generate', {
         periodeId: finalPeriodeId,
         slots: payloadSlots
      });

      showToast('Jadwal berhasil digenerate', 'success');
      navigate('/admin/jadwal-ujian');

    } catch (err) {
      showToast('Terjadi kesalahan saat memproses jadwal: ' + (err?.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };


  if (loading) return <div style={{padding: '2rem'}}>Memuat Form Wizard...</div>;

  return (
    <div className="wizard-page">
       <div className="wizard-header">
          <button className="back-link" onClick={() => navigate('/admin/jadwal-ujian')}>&larr; Kembali ke Daftar Jadwal</button>
          <h2>Penjadwalan Terpusat</h2>
          <p>Ikuti langkah-langkah berikut untuk meng-generate jadwal ujian skalabel secara tertib.</p>
       </div>

       <div className="stepper">
          {[
            {num: 1, label: 'Periode'},
            {num: 2, label: 'Prodi'},
            {num: 3, label: 'Kelas'},
            {num: 4, label: 'Tentukan Waktu & Kelas'},
            {num: 5, label: 'Tinjauan'}
          ].map((step) => (
             <div key={step.num} className={`step-item ${currentStep === step.num ? 'active' : currentStep > step.num ? 'completed' : ''}`}>
                <div className="step-circle">{currentStep > step.num ? <FiCheck /> : step.num}</div>
                <div className="step-label">{step.label}</div>
             </div>
          ))}
       </div>

       <div className="wizard-content">
          {/* STEP 1: PERIODE */}
          {currentStep === 1 && (
             <div className="step-panel">
               <h3>Langkah 1: Tetapkan Masa Periode Ujian</h3>
               
               <div className="period-toggle">
                  <label className="radio-label">
                    <input type="radio" checked={!isNewPeriode} onChange={() => setIsNewPeriode(false)} />
                    Pilih Periode yang Sudah Ada
                  </label>
                  <label className="radio-label">
                    <input type="radio" checked={isNewPeriode} onChange={() => setIsNewPeriode(true)} />
                    Buat Periode Baru
                  </label>
               </div>

               <div className="safety-option-card slide-in">
                  <div className="option-header">
                     <FiShield size={24} color="#3b82f6" />
                     <div>
                        <strong>Mode Keamanan (Kiosk Mode)</strong>
                        <p className="hint" style={{marginBottom: 0}}>Jika aktif, siswa hanya bisa mengerjakan ujian melalui aplikasi Mobile (Kiosk) atau Browser TERKUNCI.</p>
                     </div>
                  </div>
                  <div className="toggle-switch">
                     <input type="checkbox" id="kiosk-toggle" checked={globalKioskMode} onChange={(e) => setGlobalKioskMode(e.target.checked)} />
                     <label htmlFor="kiosk-toggle"></label>
                  </div>
               </div>

               {!isNewPeriode ? (
                 <div className="form-group slide-in">
                    <label>Daftar Periode Tersedia</label>
                    <select className="wizard-input" value={selectedPeriodeId} onChange={(e) => setSelectedPeriodeId(e.target.value)}>
                       <option value="">-- Pilih Periode Ujian --</option>
                       {periodes.map(p => <option key={p.id} value={p.id}>{p.nama} ({p.tahunAjaran} - {p.semester})</option>)}
                    </select>
                    {periodes.length === 0 && <p className="hint">Tidak ada periode. Silakan buat periode baru.</p>}
                 </div>
               ) : (
                 <div className="form-grid slide-in">
                    <div className="form-group span-full">
                       <label>Judul Periode</label>
                       <input className="wizard-input" placeholder="Contoh: Penilaian Tengah Semester Tahun 2024" value={periodeNama} onChange={(e) => setPeriodeNama(e.target.value)} />
                    </div>
                    <div className="form-group">
                       <label>Tahun Ajaran</label>
                       <select className="wizard-input" value={periodeTahun} onChange={(e) => setPeriodeTahun(e.target.value)}>
                          {Array.from({length: 31}, (_, i) => 2020 + i).map(year => (
                             <option key={year} value={`${year}/${year + 1}`}>{year}/{year + 1}</option>
                          ))}
                       </select>
                    </div>
                    <div className="form-group">
                       <label>Semester</label>
                       <select className="wizard-input" value={periodeSemester} onChange={(e) => setPeriodeSemester(e.target.value)}>
                          <option value="Gasal">Gasal</option>
                          <option value="Genap">Genap</option>
                       </select>
                    </div>
                    <div className="form-group">
                       <label>Perkiraan Tanggal Mulai Ujian</label>
                       <input type="date" className="wizard-input" value={periodeMulai} onChange={(e) => setPeriodeMulai(e.target.value)} />
                    </div>
                    <div className="form-group">
                       <label>Perkiraan Tanggal Selesai Ujian</label>
                       <input type="date" className="wizard-input" value={periodeSelesai} onChange={(e) => setPeriodeSelesai(e.target.value)} />
                    </div>
                 </div>
               )}
             </div>
          )}

          {/* STEP 2: PRODI */}
          {currentStep === 2 && (
             <div className="step-panel">
               <h3>Langkah 2: Pilih Program Studi (Jurusan)</h3>
               <p className="hint">Pilih jurusan mana saja yang akan mengikuti masa ujian di periode ini.</p>
               <div className="action-row">
                 <button className="btn-small" onClick={selectAllJurusan}>Pilih Semua</button>
                 <button className="btn-small btn-ghost" onClick={deselectAllJurusan}>Hapus Pilihan</button>
               </div>
               <div className="grid-list">
                 {masterJurusan.map(j => (
                    <label key={j.id} className={`selection-card ${selectedJurusans.includes(String(j.id)) ? 'selected' : ''}`}>
                       <input type="checkbox" checked={selectedJurusans.includes(String(j.id))} onChange={() => toggleJurusan(String(j.id))} />
                       <div className="details">
                          <strong>{j.kodeProdi}</strong>
                          <span>{j.namaProdi}</span>
                       </div>
                    </label>
                 ))}
               </div>
             </div>
          )}

          {/* STEP 3: KELAS */}
          {currentStep === 3 && (
             <div className="step-panel">
               <h3>Langkah 3: Pilih Kelas Peserta</h3>
               <p className="hint">Pilih kelas yang akan mengikuti ujian. Daftar sudah dikelompokkan berdasarkan program studi yang Anda pilih di Langkah 2.</p>
               <div className="action-row">
                 <button className="btn-small" onClick={selectAllKelasFilter}>Pilih Semua</button>
                 <button className="btn-small btn-ghost" onClick={() => setSelectedKelas([])}>Hapus Pilihan</button>
               </div>
               
               <div className="kelas-groups-container" style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                 {selectedJurusans.map(jurusanId => {
                    const jurusan = masterJurusan.find(j => String(j.id) === String(jurusanId));
                    const classesInJurusan = masterKelas.filter(k => String(k.jurusanId) === String(jurusanId));
                    if (classesInJurusan.length === 0) return null;
                    
                    return (
                       <div key={jurusanId} className="kelas-group">
                          <h4 style={{marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e2e8f0', color: '#1e293b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700'}}>
                            <span style={{background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', color: 'white', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px'}}>
                               {jurusan?.kodeProdi || 'PRODI'}
                            </span>
                            {jurusan?.namaProdi || 'Program Studi'}
                          </h4>
                          <div className="grid-list">
                            {classesInJurusan.map(k => {
                               const tLabel = k.tingkat === 'X' ? 'Kelas 10' : k.tingkat === 'XI' ? 'Kelas 11' : 'Kelas 12';
                               return (
                                 <label key={k.id} className={`selection-card ${selectedKelas.includes(String(k.id)) ? 'selected' : ''}`}>
                                    <input type="checkbox" checked={selectedKelas.includes(String(k.id))} onChange={() => toggleKelas(String(k.id))} />
                                    <div className="details">
                                       <strong>{tLabel} {k.jurusan?.kodeProdi} {k.inisial}</strong>
                                    </div>
                                 </label>
                               );
                            })}
                          </div>
                       </div>
                    );
                 })}
               </div>
               {selectedJurusans.length === 0 && (
                 <div className="empty-state" style={{marginTop: '2rem'}}>
                    Anda belum memilih program studi. Mundur ke Langkah 2 terlebih dahulu.
                 </div>
               )}
             </div>
          )}


          {/* STEP 4: SESSION SCHEDULING */}
          {currentStep === 4 && (
             <div className="step-panel step-fullscreen">
               <div className="step4-header">
                 <div>
                   <h3>Langkah 4: Rancangan Distribusi Sesi Ujian</h3>
                   <p className="hint">Tentukan jadwal untuk tiap sesi. Setiap sesi secara otomatis berisi seluruh kelas yang Anda pilih pada Langkah 3.</p>
                 </div>
                 <button className="btn-add-slot" onClick={addEmptySession}>
                   <span>＋</span> Tambah Sesi Ujian
                 </button>
               </div>

               <div className="sessions-container">
                 {sessions.map((sess, sIdx) => (
                   <div key={sess.id} className="session-card slide-in">

                     {/* Session Header */}
                     <div className="session-card-header">
                       <div className="session-badge">
                         <span className="session-number">{sess.id}</span>
                         <span className="session-label">Sesi Ujian</span>
                       </div>

                       <div className="session-time-inputs">
                         <div className="time-group">
                           <label className="time-label">
                             <span className="time-label-icon">🕐</span> Waktu Mulai
                           </label>
                           <input
                             type="datetime-local"
                             value={sess.mulai}
                             onChange={(e) => updateSession(sess.id, 'mulai', e.target.value)}
                             className="wizard-input time-input"
                           />
                         </div>

                         <div className="time-group">
                           <label className="time-label">
                             <span className="time-label-icon">⏱</span> Durasi (Menit)
                           </label>
                           <input
                             type="number"
                             min="10"
                             value={sess.durasi}
                             onChange={(e) => updateSession(sess.id, 'durasi', parseInt(e.target.value) || 0)}
                             className="wizard-input time-input durasi-input"
                           />
                         </div>

                         <div className="time-group">
                           <label className="time-label">
                             <span className="time-label-icon">✅</span> Waktu Selesai
                           </label>
                           <div className="selesai-display">
                             {sess.selesai ? sess.selesai.replace('T', ' ') : '—'}
                           </div>
                         </div>
                       </div>

                       <button className="btn-remove-session" title="Hapus Sesi" onClick={() => removeSession(sess.id)}>
                         ✕
                       </button>
                     </div>


                     {/* Class Settings Grid */}
                     <div className="session-class-grid">
                       <div className="class-grid-header">
                         <div className="col-kelas">Kelas</div>
                         <div className="col-mapel">Mata Pelajaran <span className="col-required">*</span></div>
                         <div className="col-ruangan">Ruangan <span className="col-optional">(Opsional)</span></div>
                       </div>
                       <div className="class-rows">
                         {sess.classSettings.map((cls, cIdx) => {
                           const kInfo = masterKelas.find(k => String(k.id) === String(cls.kelasId));
                           const hasMapel = !!cls.mapelId;
                           return (
                             <div key={cls.kelasId} className={`class-row ${hasMapel ? 'row-done' : 'row-empty'}`}>
                               <div className="col-kelas">
                                 <div className="kelas-badge">
                                   <span className="kelas-tingkat">{kInfo?.tingkat}</span>
                                   <span className="kelas-name">{kInfo?.jurusan?.kodeProdi} – {kInfo?.inisial}</span>
                                 </div>
                               </div>
                               <div className="col-mapel">
                                 <select
                                   value={cls.mapelId}
                                   onChange={(e) => updateClassInSession(sess.id, cls.kelasId, 'mapelId', e.target.value)}
                                   className={`wizard-input row-input ${!hasMapel ? 'input-empty' : ''}`}
                                 >
                                   <option value="">— Pilih Mata Pelajaran —</option>
                                   {masterMapel.map(m => <option key={m.id} value={m.id}>{m.namaMapel} ({m.kodeMapel || '-'})</option>)}
                                 </select>
                               </div>
                               <div className="col-ruangan">
                                 <input
                                   type="text"
                                   placeholder="Misal: Lab 1 / Ruang 12"
                                   value={cls.ruangan}
                                   onChange={(e) => updateClassInSession(sess.id, cls.kelasId, 'ruangan', e.target.value)}
                                   className="wizard-input row-input"
                                 />
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>

                   </div>
                 ))}

                 {sessions.length === 0 && (
                   <div className="empty-state">
                     <div className="empty-icon">🗓️</div>
                     <h4>Belum ada sesi ujian</h4>
                     <p>Klik tombol <strong>"Tambah Sesi Ujian"</strong> di atas untuk mulai menyusun jadwal distribusi ujian per sesi.</p>
                   </div>
                 )}
               </div>
             </div>
          )}

          {/* STEP 5: TINJAUAN */}
          {currentStep === 5 && (
             <div className="step-panel">
               <h3>Tinjauan Akhir sebelum Meng-Generate Data</h3>
               <div className="summary-box">
                  <div className="sum-item">
                     <strong>Periode:</strong> 
                     <span>{isNewPeriode ? `${periodeNama} (${periodeTahun} / ${periodeSemester})` : periodes.find(p=>p.id===Number(selectedPeriodeId))?.nama}</span>
                  </div>
                  <div className="sum-item">
                     <strong>Total Sesi Ujian:</strong> {sessions.length} Sesi
                  </div>
                  <div className="sum-item">
                     <strong>Total Jadwal yang Akan Dibuat:</strong> {sessions.length * selectedKelas.length} (per Kelas per Sesi)
                  </div>
                  <div className="sum-item">
                     <strong>Mode Keamanan:</strong> {globalKioskMode ? 'AKTIF (Kiosk Mode)' : 'Non-Aktif (Bebas)'}
                  </div>
               </div>
               
               <div className="summary-alert">
                 <FiAlertCircle size={24} />
                 <div>
                   <p><strong>Peringatan!</strong> Jika Anda menekan Generate, seluruh rancangan jadwal akan di-push ke database dan terlihat di dashboard Guru & Siswa.</p>
                 </div>
               </div>
             </div>
          )}
       </div>

       <div className="wizard-footer">
          {currentStep > 1 ? (
             <button className="btn-wizard-nav back" onClick={handlePrevStep} disabled={saving}><FiChevronLeft /> Sebelumnya</button>
          ) : <div></div>}

          {currentStep < 5 ? (
             <button className="btn-wizard-nav next" onClick={handleNextStep}>Selanjutnya <FiChevronRight /></button>
          ) : (
             <button className="btn-wizard-nav finish" onClick={handleGenerate} disabled={saving}>
               {saving ? 'Memproses Data...' : <><FiSave /> Publish Jadwal</>}
             </button>
          )}
       </div>
    </div>
  );
}
