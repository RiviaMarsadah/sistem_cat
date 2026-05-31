import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiCheck, FiSave, FiAlertCircle, FiSettings, FiList, FiClock, FiShield } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './JadwalWizard.css';

export default function JadwalWizard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showConfirmDeleteSessionModal, setShowConfirmDeleteSessionModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('cat_wizard_step');
    return saved ? Number(saved) : 1;
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Step 1: Periode
  const [periodes, setPeriodes] = useState([]);
  const [isNewPeriode, setIsNewPeriode] = useState(() => {
    const saved = localStorage.getItem('cat_wizard_is_new_periode');
    return saved ? saved === 'true' : false;
  });
  const [selectedPeriodeId, setSelectedPeriodeId] = useState(() => {
    return localStorage.getItem('cat_wizard_selected_periode_id') || '';
  });
  
  // New Periode Data
  const [periodeNama, setPeriodeNama] = useState(() => {
    return localStorage.getItem('cat_wizard_periode_nama') || '';
  });
  const [periodeSemester, setPeriodeSemester] = useState(() => {
    return localStorage.getItem('cat_wizard_periode_semester') || 'Gasal';
  });
  const [periodeTahun, setPeriodeTahun] = useState(() => {
    return localStorage.getItem('cat_wizard_periode_tahun') || '2026/2027';
  });
  const [periodeMulai, setPeriodeMulai] = useState(() => {
    return localStorage.getItem('cat_wizard_periode_mulai') || '';
  });
  const [periodeSelesai, setPeriodeSelesai] = useState(() => {
    return localStorage.getItem('cat_wizard_periode_selesai') || '';
  });

  // Step 2 & 3: Master Data
  const [masterJurusan, setMasterJurusan] = useState([]);
  const [masterKelas, setMasterKelas] = useState([]);
  const [masterMapel, setMasterMapel] = useState([]);

  // Step 2 Selections
  const [selectedJurusans, setSelectedJurusans] = useState([]);
  
  // Step 3 Selections
  const [selectedKelas, setSelectedKelas] = useState(() => {
    const saved = localStorage.getItem('cat_wizard_selected_kelas');
    return saved ? JSON.parse(saved) : [];
  });

  // Step 4 Settings
  const [globalKioskMode, setGlobalKioskMode] = useState(() => {
    const saved = localStorage.getItem('cat_wizard_global_kiosk');
    return saved ? saved === 'true' : true;
  });
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('cat_wizard_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const getTingkatLabel = (tingkat) => {
    const map = {
      'tingkat_10': '10',
      'tingkat_11': '11',
      'tingkat_12': '12',
      'X': '10',
      'XI': '11',
      'XII': '12',
      'ALUMNI': 'Alumni',
      'KI': 'KI'
    };
    return map[tingkat] || tingkat;
  };

  const getNamaKelasDisplay = (kelas) => {
    if (!kelas) return '-';
    const tingkatLabel = getTingkatLabel(kelas.tingkat);
    const prodiLabel = kelas.jurusan?.namaProdi || '';
    const romanTingkat = kelas.tingkat || '';
    const kodeProdi = kelas.jurusan?.kodeProdi || '';
    return `${tingkatLabel} ${prodiLabel} (${romanTingkat} ${kodeProdi})`;
  };

  // Synchronize wizard states to localStorage
  useEffect(() => {
    localStorage.setItem('cat_wizard_step', String(currentStep));
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem('cat_wizard_is_new_periode', String(isNewPeriode));
  }, [isNewPeriode]);

  useEffect(() => {
    localStorage.setItem('cat_wizard_selected_periode_id', selectedPeriodeId);
  }, [selectedPeriodeId]);

  useEffect(() => {
    localStorage.setItem('cat_wizard_periode_nama', periodeNama);
  }, [periodeNama]);

  useEffect(() => {
    localStorage.setItem('cat_wizard_periode_semester', periodeSemester);
  }, [periodeSemester]);

  useEffect(() => {
    localStorage.setItem('cat_wizard_periode_tahun', periodeTahun);
  }, [periodeTahun]);

  useEffect(() => {
    localStorage.setItem('cat_wizard_periode_mulai', periodeMulai);
  }, [periodeMulai]);

  useEffect(() => {
    localStorage.setItem('cat_wizard_periode_selesai', periodeSelesai);
  }, [periodeSelesai]);

  useEffect(() => {
    localStorage.setItem('cat_wizard_selected_kelas', JSON.stringify(selectedKelas));
  }, [selectedKelas]);

  useEffect(() => {
    localStorage.setItem('cat_wizard_global_kiosk', String(globalKioskMode));
  }, [globalKioskMode]);

  useEffect(() => {
    localStorage.setItem('cat_wizard_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Clean all local storage wizard states
  const clearWizardStorage = () => {
    localStorage.removeItem('cat_wizard_step');
    localStorage.removeItem('cat_wizard_is_new_periode');
    localStorage.removeItem('cat_wizard_selected_periode_id');
    localStorage.removeItem('cat_wizard_periode_nama');
    localStorage.removeItem('cat_wizard_periode_semester');
    localStorage.removeItem('cat_wizard_periode_tahun');
    localStorage.removeItem('cat_wizard_periode_mulai');
    localStorage.removeItem('cat_wizard_periode_selesai');
    localStorage.removeItem('cat_wizard_selected_kelas');
    localStorage.removeItem('cat_wizard_global_kiosk');
    localStorage.removeItem('cat_wizard_sessions');
  };

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
       if (selectedKelas.length === 0) {
         showToast('Pilih minimal satu kelas.', 'error');
         return;
       }
       // Prepare slots for Step 3
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
    } else if (currentStep === 3) {
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
             const className = getNamaKelasDisplay(masterKelas.find(k => String(k.id) === String(cls.kelasId)));
             showToast(`Pilih Mata Pelajaran untuk ${className} di Sesi ${sess.id}.`, 'error');
             return;
           }
           if (!cls.ruangan || !cls.ruangan.trim()) {
             const className = getNamaKelasDisplay(masterKelas.find(k => String(k.id) === String(cls.kelasId)));
             showToast(`Tentukan ruangan ujian untuk ${className} di Sesi ${sess.id}.`, 'error');
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
    const relevant = masterKelas.filter(k => k.tingkat !== 'ALUMNI');
    setSelectedKelas(relevant.map(k => String(k.id)));
  };

  // Step 4 Handlers (Sessions)
  const addEmptySession = () => {
    let defaultMulai = '';
    let defaultSelesai = '';
    const defaultDurasi = 90;

    if (sessions.length > 0) {
      const lastSession = sessions[sessions.length - 1];
      if (lastSession && lastSession.selesai) {
        defaultMulai = lastSession.selesai;
        const start = new Date(defaultMulai);
        if (!isNaN(start.getTime())) {
          const end = new Date(start.getTime() + defaultDurasi * 60000);
          const offset = end.getTimezoneOffset() * 60000;
          const localEnd = new Date(end.getTime() - offset);
          defaultSelesai = localEnd.toISOString().substring(0, 16);
        }
      }
    }

    if (!defaultMulai) {
      let baseDate = new Date().toISOString().split('T')[0];
      if (isNewPeriode && periodeMulai) {
         baseDate = periodeMulai;
      } else if (!isNewPeriode && selectedPeriodeId) {
         const p = periodes.find(per => String(per.id) === String(selectedPeriodeId));
         if (p && p.mulai) {
            baseDate = new Date(p.mulai).toISOString().split('T')[0];
         }
      }
      defaultMulai = `${baseDate}T07:30`;
      defaultSelesai = `${baseDate}T09:00`;
    }

    const nextId = sessions.length > 0 ? Math.max(...sessions.map(s => s.id)) + 1 : 1;
    
    setSessions([...sessions, {
      id: nextId,
      mulai: defaultMulai,
      durasi: defaultDurasi,
      selesai: defaultSelesai,
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
        if (field === 'mulai') {
          const oldDateStr = s.mulai ? s.mulai.split('T')[0] : '';
          const newDateStr = value ? value.split('T')[0] : '';
          if (oldDateStr && newDateStr && oldDateStr !== newDateStr) {
            // Date changed! Force start time to 07:30
            updated.mulai = `${newDateStr}T07:30`;
          }
        }
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
  
  const triggerRemoveSession = (session) => {
    setSessionToDelete(session);
    setShowConfirmDeleteSessionModal(true);
  };

  const handleConfirmDeleteSession = () => {
    if (sessionToDelete) {
      setSessions(prev => prev.filter(s => s.id !== sessionToDelete.id));
      setShowConfirmDeleteSessionModal(false);
      setSessionToDelete(null);
      showToast('Sesi berhasil dihapus', 'success');
    }
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

  const bulkApplyRuangan = (sessionId, ruangan) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          classSettings: s.classSettings.map(c => ({ ...c, ruangan }))
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
        // Find set of unique (mapelId, ruangan) in this session with normalized trimming
        const uniqueConfigs = [];
        sess.classSettings.forEach(cs => {
          const trimmedRuangan = cs.ruangan ? cs.ruangan.trim() : '';
          const normalizedRuangan = trimmedRuangan.toLowerCase();
          const configStr = `${cs.mapelId}-${normalizedRuangan}`;
          
          if (!uniqueConfigs.find(u => u.key === configStr)) {
            uniqueConfigs.push({ 
              key: configStr, 
              mapelId: cs.mapelId, 
              ruangan: trimmedRuangan, 
              kelasIds: [] 
            });
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
      clearWizardStorage();
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
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', width: '100%' }}>
             <button className="back-link" style={{ margin: 0 }} onClick={() => navigate('/admin/jadwal-ujian')}>&larr; Kembali ke Daftar Jadwal</button>
             <button 
               type="button" 
               className="btn-secondary" 
               style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', background: '#fff', color: '#64748b', fontWeight: '600', transition: 'all 0.2s' }}
               onClick={() => setShowResetModal(true)}
               onMouseEnter={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#334155'; }}
               onMouseLeave={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#64748b'; }}
             >
               🔄 Reset Wizard
             </button>
           </div>
           <h2>Penjadwalan Terpusat</h2>
           <p>Langkah terpandu pembuatan jadwal ujian massal berdasarkan prodi dan kelas.</p>
        </div>

        <div className="stepper">
           {[
             {num: 1, label: 'Periode'},
             {num: 2, label: 'Pilih Kelas'},
             {num: 3, label: 'Tentukan Waktu & Kelas'},
             {num: 4, label: 'Tinjauan'}
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

          {/* STEP 2: PILIH KELAS */}
           {currentStep === 2 && (
              <div className="step-panel">
                <h3>Langkah 2: Pilih Kelas Peserta</h3>
                <p className="hint">Pilih kelas yang akan mengikuti ujian (Alumni otomatis dikecualikan).</p>
                <div className="action-row">
                  <button className="btn-small" onClick={selectAllKelasFilter}>Pilih Semua</button>
                  <button className="btn-small btn-ghost" onClick={() => setSelectedKelas([])}>Hapus Pilihan</button>
                </div>
                
                <div className="kelas-groups-container" style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                  {masterJurusan.map(jurusan => {
                     const classesInJurusan = masterKelas.filter(k => String(k.jurusanId) === String(jurusan.id) && k.tingkat !== 'ALUMNI');
                     if (classesInJurusan.length === 0) return null;
                     
                     return (
                        <div key={jurusan.id} className="kelas-group">
                           <h4 style={{marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e2e8f0', color: '#1e293b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700'}}>
                             <span style={{background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', color: 'white', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px'}}>
                                {jurusan?.kodeProdi || 'PRODI'}
                             </span>
                             {jurusan?.namaProdi || 'Program Studi'}
                           </h4>
                           <div className="kelas-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {classesInJurusan.map(k => {
                                const isSelected = selectedKelas.includes(String(k.id));
                                return (
                                  <label 
                                    key={k.id} 
                                    className={`kelas-list-item ${isSelected ? 'selected' : ''}`}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '12px',
                                      padding: '12px 18px',
                                      background: isSelected ? '#f0f7ff' : '#ffffff',
                                      border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      boxShadow: isSelected ? '0 2px 4px rgba(59, 130, 246, 0.05)' : 'none'
                                    }}
                                  >
                                     <input 
                                       type="checkbox" 
                                       checked={isSelected} 
                                       onChange={() => toggleKelas(String(k.id))}
                                       style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }}
                                     />
                                     <span style={{ fontSize: '0.95rem', fontWeight: isSelected ? '700' : '500', color: isSelected ? '#1e40af' : '#334155' }}>
                                        {getNamaKelasDisplay(k)}
                                     </span>
                                  </label>
                                );
                              })}
                           </div>
                        </div>
                     );
                  })}
                </div>
              </div>
           )}

           {/* STEP 4: SESSION SCHEDULING */}
          {currentStep === 3 && (
             <div className="step-panel step-fullscreen">
               <div className="step4-header">
                 <div>
                   <h3>Langkah 3: Rancangan Distribusi Sesi Ujian</h3>
                   <p className="hint">Tentukan jadwal untuk tiap sesi. Setiap sesi secara otomatis berisi seluruh kelas yang Anda pilih pada Langkah 2.</p>
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
                          <button className="btn-remove-session" title="Hapus Sesi" onClick={() => triggerRemoveSession(sess)}>
                           ✕
                         </button>
                      </div>

                      {/* Bulk Actions Bar */}
                      <div className="session-bulk-actions">
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', flexGrow: 1 }}>
                          {/* Bulk Mapel */}
                          <div className="bulk-group">
                            <span className="bulk-label">Mapel Sesi:</span>
                            <select 
                              className="wizard-input bulk-select" 
                              onChange={(e) => {
                                if (e.target.value) {
                                  bulkApplyMapel(sess.id, e.target.value);
                                  e.target.value = "";
                                }
                              }}
                            >
                              <option value="">-- Mapel untuk Semua Kelas --</option>
                              {masterMapel.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.namaMapel} ({m.kodeMapel || '-'})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Bulk Ruangan */}
                          <div className="bulk-group">
                            <span className="bulk-label">Ruangan Sesi:</span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', maxWidth: '280px' }}>
                              <input 
                                type="text"
                                placeholder="Misal: Lab Komputer"
                                className="wizard-input"
                                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', borderRadius: '8px' }}
                                id={`bulk-ruangan-${sess.id}`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = e.target.value.trim();
                                    if (val) {
                                      bulkApplyRuangan(sess.id, val);
                                      showToast(`Ruangan "${val}" diterapkan ke semua kelas di Sesi ${sess.id}`, 'success');
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className="btn-small"
                                style={{ padding: '6px 12px', whiteSpace: 'nowrap', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                onClick={() => {
                                  const input = document.getElementById(`bulk-ruangan-${sess.id}`);
                                  if (input) {
                                    const val = input.value.trim();
                                    if (val) {
                                      bulkApplyRuangan(sess.id, val);
                                      showToast(`Ruangan "${val}" diterapkan ke semua kelas di Sesi ${sess.id}`, 'success');
                                    } else {
                                      showToast('Masukkan nama ruangan terlebih dahulu', 'error');
                                    }
                                  }
                                }}
                              >
                                Terapkan
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="session-meta">
                          <span className="kelas-count-badge">
                            🏫 {sess.classSettings.length} Kelas Terdaftar
                          </span>
                        </div>
                      </div>

                     {/* Class Settings Grid */}
                     <div className="session-class-grid">
                       <div className="class-grid-header">
                         <div className="col-kelas">Kelas</div>
                         <div className="col-mapel">Mata  <span className="col-required">*</span></div>
                         <div className="col-ruangan">Ruangan <span className="col-required">*</span></div>
                       </div>
                       <div className="class-rows">
                         {sess.classSettings.map((cls, cIdx) => {
                           const kInfo = masterKelas.find(k => String(k.id) === String(cls.kelasId));
                           const hasMapel = !!cls.mapelId;
                           const hasRuangan = !!cls.ruangan && !!cls.ruangan.trim();
                           const isDone = hasMapel && hasRuangan;
                           return (
                             <div key={cls.kelasId} className={`class-row ${isDone ? 'row-done' : 'row-empty'}`}>
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
                                   className={`wizard-input row-input ${!hasRuangan ? 'input-empty' : ''}`}
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
          {currentStep === 4 && (
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

          {currentStep < 4 ? (
             <button className="btn-wizard-nav next" onClick={handleNextStep}>Selanjutnya <FiChevronRight /></button>
          ) : (
             <button className="btn-wizard-nav finish" onClick={handleGenerate} disabled={saving}>
               {saving ? 'Memproses Data...' : <><FiSave /> Publish Jadwal</>}
             </button>
          )}
       </div>

      {/* Custom Reset Confirmation Modal */}
      {showResetModal && (
        <div className="wizard-modal-overlay">
          <div className="wizard-modal-container">
            <div className="wizard-modal-header">
              <div className="wizard-modal-icon-title">
                <div className="wizard-modal-alert-icon">
                  <FiAlertCircle size={28} />
                </div>
                <h3>Konfirmasi Reset</h3>
              </div>
              <button className="wizard-modal-close" onClick={() => setShowResetModal(false)}>&times;</button>
            </div>
            <div className="wizard-modal-body">
              <p>Apakah Anda yakin ingin menyetel ulang (reset) semua isian formulir?</p>
              <p className="wizard-modal-subtext">Semua progres penjadwalan Anda yang tersimpan dalam penyimpanan lokal akan dihapus secara permanen.</p>
            </div>
            <div className="wizard-modal-footer">
              <button 
                className="btn-modal-cancel" 
                onClick={() => setShowResetModal(false)}
              >
                Batal
              </button>
              <button 
                className="btn-modal-confirm" 
                onClick={() => {
                  clearWizardStorage();
                  setShowResetModal(false);
                  window.location.reload();
                }}
              >
                Ya, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Session Confirmation Modal */}
      {showConfirmDeleteSessionModal && sessionToDelete && (
        <div className="wizard-modal-overlay">
          <div className="wizard-modal-container">
            <div className="wizard-modal-header">
              <div className="wizard-modal-icon-title">
                <div className="wizard-modal-alert-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
                  <FiAlertCircle size={28} />
                </div>
                <h3>Hapus Sesi Ujian</h3>
              </div>
              <button className="wizard-modal-close" onClick={() => {
                setShowConfirmDeleteSessionModal(false);
                setSessionToDelete(null);
              }}>&times;</button>
            </div>
            <div className="wizard-modal-body">
              <p>Apakah Anda yakin ingin menghapus <strong>Sesi {sessionToDelete.id}</strong>?</p>
              {sessionToDelete.mulai && (
                <p className="wizard-modal-subtext" style={{ marginTop: '6px', fontWeight: '500' }}>
                  Waktu Mulai: {sessionToDelete.mulai.replace('T', ' ')} ({sessionToDelete.durasi} Menit)
                </p>
              )}
              <p className="wizard-modal-subtext" style={{ color: '#ef4444', fontWeight: '500', marginTop: '8px' }}>
                Seluruh pengaturan mata pelajaran dan ruangan kelas untuk sesi ini akan dihapus secara permanen dari draf.
              </p>
            </div>
            <div className="wizard-modal-footer">
              <button 
                className="btn-modal-cancel" 
                onClick={() => {
                  setShowConfirmDeleteSessionModal(false);
                  setSessionToDelete(null);
                }}
              >
                Batal
              </button>
              <button 
                className="btn-modal-confirm" 
                style={{ background: '#ef4444' }}
                onClick={handleConfirmDeleteSession}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
