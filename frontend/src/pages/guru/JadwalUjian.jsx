import { useEffect, useState } from 'react';
import { FiCalendar, FiClock, FiBook, FiCheckCircle, FiXCircle, FiX, FiAlertCircle, FiPlus, FiLink, FiShield, FiTrash2, FiEdit2 } from 'react-icons/fi';
import api from '../../services/api';
import './JadwalUjian.css';

export default function JadwalUjianGuru() {
  const [activeTab, setActiveTab] = useState('official'); // 'official' | 'custom'

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Data states
  const [officialJadwal, setOfficialJadwal] = useState([]);
  const [customJadwal, setCustomJadwal] = useState([]);
  const [myPakets, setMyPakets] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [mapelList, setMapelList] = useState([]);

  // Modals Data
  const [showPilihPaketModal, setShowPilihPaketModal] = useState(false);
  const [activeJadwalId, setActiveJadwalId] = useState(null);
  
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null for create mode
  
  // Custom Form fields
  const [nama, setNama] = useState('');
  const [mataPelajaranId, setMataPelajaranId] = useState('');
  const [paketUjianId, setPaketUjianId] = useState('');
  const [mulai, setMulai] = useState('');
  const [selesai, setSelesai] = useState('');
  const [durasi, setDurasi] = useState(60);
  const [opsiKeamanan, setOpsiKeamanan] = useState(true);
  const [selectedKelas, setSelectedKelas] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resOff, resCust, resPak, resKel, resMap] = await Promise.all([
        api.get('/guru/jadwal-ujian/official'),
        api.get('/guru/jadwal-ujian/custom'),
        api.get('/guru/paket-ujian'),
        api.get('/guru/kelas'),
        api.get('/guru/mata-pelajaran')
      ]);
      setOfficialJadwal(resOff.data?.data || []);
      setCustomJadwal(resCust.data?.data || []);
      setMyPakets(resPak.data?.data || []);
      setKelasList(resKel.data?.data || []);
      setMapelList(resMap.data?.data || []);
    } catch(err) {
      setError('Gagal memuat data. ' + (err?.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData() }, []);
  useEffect(() => {
    if(error || success) {
      const timer = setTimeout(() => { setError(''); setSuccess(''); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const cleanNamaUjian = (rawName) => (rawName || '').replace(/^\[Custom\]\s*/i, '');

  // HANDLER OFFICIAL EXAMS -----------------------------
  const handleOpenPilihPaket = (jdwlId) => {
    setActiveJadwalId(jdwlId);
    setShowPilihPaketModal(true);
  };

  const handleLinkPaket = async (paketId) => {
    setSaving(true);
    try {
      const res = await api.put(`/guru/jadwal-ujian/official/${activeJadwalId}/paket`, { paketUjianId: paketId });
      setSuccess(res.data.message);
      setShowPilihPaketModal(false);
      fetchData();
    } catch(err) {
      setError(err?.response?.data?.message || 'Gagal menautkan paket.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlinkPaket = async (jdwlId) => {
    if(!window.confirm("Yakin ingin menghapus tautan paket soal dari jadwal ini?")) return;
    setSaving(true);
    try {
       const res = await api.delete(`/guru/jadwal-ujian/official/${jdwlId}/paket`);
       setSuccess(res.data.message);
       fetchData();
    } catch(err) {
       setError(err?.response?.data?.message || 'Gagal melepas paket.');
    } finally {
       setSaving(false);
    }
  };


  // HANDLERS CUSTOM EXAMS -----------------------------
  const toggleKelas = (idStr) => {
    if(selectedKelas.includes(idStr)) {
      setSelectedKelas(selectedKelas.filter(k => k !== idStr));
    } else {
      setSelectedKelas([...selectedKelas, idStr]);
    }
  };

  const openAddCustom = () => {
    setEditingId(null);
    setNama('');
    setMataPelajaranId('');
    setPaketUjianId('');
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    setMulai(`${dateStr}T00:00`);
    setSelesai(`${dateStr}T23:59`);
    
    setDurasi(60);
    setOpsiKeamanan(true);
    setSelectedKelas([]);
    setShowAddCustomModal(true);
  };

  const openEditCustom = (j) => {
    setEditingId(j.id);
    setNama(j.nama.replace("[Custom] ", ""));
    setMataPelajaranId(j.mataPelajaranId);
    setPaketUjianId(j.paketUjianId);
    
    const formatForInput = (dateStr) => {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setMulai(formatForInput(j.mulai));
    setSelesai(formatForInput(j.selesai));
    setDurasi(j.durasi);
    setOpsiKeamanan(j.opsiKeamanan);
    setSelectedKelas((j.kelasJadwal || []).map(kj => String(kj.kelasId)));
    setShowAddCustomModal(true);
  };

  const handleSaveCustom = async (e) => {
    e.preventDefault();
    if(!nama || !mataPelajaranId || !paketUjianId || !mulai || !selesai || selectedKelas.length === 0) {
       setError('Mohon isi semua data, termasuk kelas peserta.'); return;
    }
    setSaving(true);
    try {
      const payload = {
        nama, mataPelajaranId: Number(mataPelajaranId), paketUjianId: Number(paketUjianId),
        mulai, selesai, durasi: Number(durasi), opsiKeamanan, kelasIds: selectedKelas.map(Number)
      };

      if (editingId) {
        const res = await api.put(`/guru/jadwal-ujian/custom/${editingId}`, payload);
        setSuccess(res.data.message);
      } else {
        const res = await api.post('/guru/jadwal-ujian/custom', payload);
        setSuccess(res.data.message);
      }
      
      setShowAddCustomModal(false);
      fetchData();
      setActiveTab('custom');
    } catch(err) {
       setError(err?.response?.data?.message || 'Gagal menyimpan ulangan custom.');
    } finally {
       setSaving(false);
    }
  };

  const deleteCustomExam = async (id) => {
    if(!window.confirm("Yakin ingin menghapus ulangan ini?")) return;
    setSaving(true);
    try {
       const res = await api.delete(`/guru/jadwal-ujian/custom/${id}`);
       setSuccess(res.data.message);
       fetchData();
    } catch(err) {
       setError(err?.response?.data?.message || 'Gagal menghapus ulangan.');
    } finally {
       setSaving(false);
    }
  };


  return (
    <div className="admin-user-page">
      <div className="user-header">
        <div>
          <h1 className="user-title">
            <span className="title-text">Jadwal Ujian</span>
            <span className="title-badge">Guru</span>
          </h1>
          <p className="user-subtitle">Lihat jadwal resmi dari Admin dan kelola ulangan harian secara mandiri.</p>
        </div>
        <div className="user-meta">
          <div className="meta-card">
            <div className="meta-label">Total Jadwal</div>
            <div className="meta-value">{activeTab === 'official' ? officialJadwal.length : customJadwal.length}</div>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <button 
           className={`tab-button official ${activeTab === 'official' ? 'active' : ''}`}
           onClick={() => setActiveTab('official')}
        >
          <FiBook /> Jadwal Pusat (Resmi Admin)
        </button>
        <button 
           className={`tab-button custom ${activeTab === 'custom' ? 'active' : ''}`}
           onClick={() => setActiveTab('custom')}
        >
          <FiPlus /> Ujian Mandiri (Custom Guru)
        </button>
      </div>

      {error && (
        <div className="user-alert" role="alert">
           {error}
        </div>
      )}

      {success && <div className="user-alert success" role="alert">{success}</div>}

      <div className="user-card">
         <div className="user-card-header">
           <h2 className="user-card-title">
             {activeTab === 'official' ? 'Daftar Jadwal Resmi' : 'Daftar Ulangan Custom'}
           </h2>
           {activeTab === 'custom' && (
             <button className="btn-add-user" onClick={openAddCustom} disabled={saving}>
               <FiPlus className="btn-plus" />
               <span>Buat Ulangan Mandiri</span>
             </button>
           )}
         </div>

        {loading ? (
          <div className="loading-state">Memuat data jadwal...</div>
        ) : activeTab === 'official' ? (
          <div className="jadwal-table official-table">
            {officialJadwal.length === 0 ? (
               <div className="empty-state">Belum ada jadwal resmi dari Admin.</div>
            ) : (
              <>
                <div className="jadwal-row jadwal-row-head">
                  <div>Nama Ujian</div>
                  <div>Token Akses</div>
                  <div>Paket Soal</div>
                  <div>Kelas & Waktu</div>
                  <div>Keamanan</div>
                  <div>Aksi</div>
                </div>

                {officialJadwal.map((j) => (
                  <div key={j.id} className="jadwal-row">
                    <div className="col-main">
                      <div className="jadwal-nama">
                        {cleanNamaUjian(j.nama)}
                      </div>
                      <div className="jadwal-meta-info">
                        <FiClock size={12} /> Durasi: <strong>{j.durasi} Menit</strong>
                      </div>
                    </div>

                    <div className="col-tokens">
                      <div className="token-box in">
                        <span>IN</span>
                        <span className="token-value">{j.token}</span>
                      </div>
                      <div className="token-box out">
                        <span>OUT</span>
                        <span className="token-value">{j.tokenCheckOut}</span>
                      </div>
                    </div>

                    <div className="col-mapel-paket">
                      <div className="mapel-badge">
                        <FiBook size={12} /> {j.mataPelajaran?.namaMapel}
                      </div>
                      <div className="paket-badge">
                        {j.paketUjianId ? (
                           j.paketUjian?.guruId === myPakets?.[0]?.guruId ? ( 
                             <span className="paket-owner own">• Milik Anda</span>
                           ) : (
                             <span className="paket-owner other">• Guru Lain</span>
                           )
                        ) : (
                           <span className="paket-owner empty">• Belum Diisi</span>
                        )}
                      </div>
                    </div>

                    <div className="col-kelas-waktu">
                       <div className="kelas-count">{j.kelasJadwal?.length || 0} Kelas Peserta</div>
                       <div className="waktu-info">
                         <div className="waktu-stack">
                           <span>Mulai: {formatDate(j.mulai)}</span>
                           <span>Selesai: {formatDate(j.selesai)}</span>
                         </div>
                       </div>
                    </div>

                    <div>
                      {j.opsiKeamanan ? (
                        <span className="status-badge aktif"><FiShield /> Kiosk On</span>
                      ) : (
                        <span className="status-badge warning"><FiXCircle /> Kiosk Off</span>
                      )}
                    </div>

                    <div className="col-actions">
                       {j.paketUjianId && j.paketUjian?.guruId === myPakets?.[0]?.guruId ? (
                           <button className="btn-action danger with-label" onClick={() => handleUnlinkPaket(j.id)} disabled={saving} title="Lepas Paket">
                             <FiXCircle /> <span>Lepas</span>
                           </button>
                       ) : !j.paketUjianId ? (
                           <button className="btn-action primary with-label" onClick={() => handleOpenPilihPaket(j.id)} disabled={saving}>
                             <FiLink /> <span>Isi Paket</span>
                           </button>
                       ) : null}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          /* CUSTOM TAB */
          <div className="jadwal-table custom-table">
             {customJadwal.length === 0 ? (
               <div className="empty-state">Anda belum membuat ulangan mandiri.</div>
             ) : (
               <>
                 <div className="jadwal-row jadwal-row-head">
                    <div>Nama Ulangan</div>
                    <div>Token Akses</div>
                    <div>Paket Soal</div>
                    <div>Kelas & Waktu</div>
                    <div>Keamanan</div>
                    <div>Aksi</div>
                 </div>

                 {customJadwal.map((j) => (
                   <div key={j.id} className="jadwal-row">
                      <div className="col-main">
                        <div className="jadwal-nama">{cleanNamaUjian(j.nama)}</div>
                        <div className="jadwal-meta-info">
                          <FiClock size={12} /> Durasi: <strong>{j.durasi} Menit</strong>
                        </div>
                      </div>

                      <div className="col-tokens">
                        <div className="token-box in">
                          <span>IN</span>
                          <span className="token-value">{j.token}</span>
                        </div>
                        <div className="token-box out">
                          <span>OUT</span>
                          <span className="token-value">{j.tokenCheckOut}</span>
                        </div>
                      </div>

                      <div className="col-mapel-paket">
                         <div className="mapel-badge">
                           <FiBook size={12} /> {j.mataPelajaran?.namaMapel}
                         </div>
                         <div className="paket-badge">
                           {j.paketUjian?.nama}
                         </div>
                      </div>

                      <div className="col-kelas-waktu">
                         <div className="kelas-count">{j.kelasJadwal?.length || 0} Kelas Peserta</div>
                         <div className="waktu-info">
                            <div className="waktu-stack">
                              <span>Mulai: {formatDate(j.mulai)}</span>
                              <span>Selesai: {formatDate(j.selesai)}</span>
                            </div>
                         </div>
                      </div>

                      <div>
                        {j.opsiKeamanan ? (
                           <span className="status-badge aktif"><FiShield /> Kiosk On</span>
                        ) : (
                           <span className="status-badge warning"><FiXCircle /> Kiosk Off</span>
                        )}
                      </div>

                      <div className="col-actions">
                        <button className="btn-action primary" onClick={() => openEditCustom(j)} disabled={saving} title="Edit Ulangan">
                          <FiEdit2 />
                        </button>
                        <button className="btn-action danger" onClick={() => deleteCustomExam(j.id)} disabled={saving} title="Hapus Ulangan">
                          <FiTrash2 />
                        </button>
                      </div>
                   </div>
                 ))}
               </>
             )}
          </div>
        )}
      </div>

      {/* MODAL PILIH PAKET UNTUK JADWAL RESMI */}
      {showPilihPaketModal && (
         <div className="modal-overlay">
           <div className="modal-container">
             <div className="modal-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0'}}>
                <h3 className="modal-title">Pilih Paket Soal Anda</h3>
                <button className="modal-close" onClick={() => setShowPilihPaketModal(false)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'}}><FiX size={20} /></button>
             </div>
             <div className="modal-body" style={{maxHeight:'50vh', overflowY:'auto', padding: '1.5rem 2rem'}}>
                <p style={{marginBottom: '1.5rem', fontSize: '0.9rem', color: '#64748b'}}>Hanya paket berstatus Siap Ujian yang akan ditampilkan di sini.</p>
                {myPakets.filter(p => !p.draft).length === 0 ? (
                   <div className="user-alert" style={{textAlign: 'center'}}>Anda belum memiliki paket ujian siap pakai.</div>
                ) : (
                   <div style={{ display: 'grid', gap: '1rem' }}>
                     {myPakets.map(p => (
                        <div key={p.id} style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                           <div>
                             <strong style={{display: 'block', color: '#0f172a'}}>{p.nama}</strong>
                             <span style={{fontSize: '0.8rem', color: '#64748b'}}>{p.mataPelajaran?.namaMapel} • {p.jumlahSoal || 0} Soal</span>
                           </div>
                           <button className="btn-action success" onClick={() => handleLinkPaket(p.id)} disabled={saving}>Tautkan</button>
                        </div>
                     ))}
                   </div>
                )}
             </div>
           </div>
         </div>
      )}

      {/* MODAL BUAT UJIAN CUSTOM */}
      {showAddCustomModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{maxWidth: '600px'}}>
             <div className="modal-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0'}}>
               <h3 className="modal-title">{editingId ? 'Edit Ulangan Mandiri' : 'Buat Ulangan Mandiri'}</h3>
               <button type="button" className="modal-close" onClick={() => setShowAddCustomModal(false)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'}}><FiX size={20} /></button>
             </div>
             <form className="user-form" onSubmit={handleSaveCustom}>
               <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1.5rem 2rem' }}>
                 <div className="form-group" style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                    <div className="field-wrapper" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      <label className="label" style={{fontWeight: '600', fontSize: '0.9rem'}}>Judul Ulangan <span className="label-required" style={{color: '#ef4444'}}>*</span></label>
                      <input className="input" style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0'}} placeholder="Misal: Ulangan Harian Bab 1" value={nama} onChange={(e) => setNama(e.target.value)} required />
                    </div>

                    <div className="field-wrapper" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      <label className="label" style={{fontWeight: '600', fontSize: '0.9rem'}}>Mata Pelajaran <span className="label-required" style={{color: '#ef4444'}}>*</span></label>
                      <select className="input" style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0'}} value={mataPelajaranId} onChange={(e) => setMataPelajaranId(e.target.value)} required>
                         <option value="">Pilih Mapel...</option>
                         {mapelList.map((m) => <option key={m.id} value={m.id}>{m.namaMapel}</option>)}
                      </select>
                    </div>

                    <div className="field-wrapper" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      <label className="label" style={{fontWeight: '600', fontSize: '0.9rem'}}>Pilih Paket Ujian Anda <span className="label-required" style={{color: '#ef4444'}}>*</span></label>
                      <select className="input" style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0'}} value={paketUjianId} onChange={(e) => setPaketUjianId(e.target.value)} required>
                         <option value="">Pilih Paket...</option>
                         {myPakets.filter(p => p.mataPelajaranId === Number(mataPelajaranId)).map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                      </select>
                      <p className="field-hint" style={{fontSize: '0.75rem', color: '#64748b'}}>Hanya paket dengan mapel terkait yang muncul.</p>
                    </div>

                    <div className="form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                      <div className="field-wrapper" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                        <label className="label" style={{fontWeight: '600', fontSize: '0.9rem'}}>Waktu Mulai <span className="label-required" style={{color: '#ef4444'}}>*</span></label>
                        <input type="datetime-local" className="input" style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0'}} value={mulai} onChange={(e) => setMulai(e.target.value)} required />
                      </div>
                      <div className="field-wrapper" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                        <label className="label" style={{fontWeight: '600', fontSize: '0.9rem'}}>Waktu Selesai <span className="label-required" style={{color: '#ef4444'}}>*</span></label>
                        <input type="datetime-local" className="input" style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0'}} value={selesai} onChange={(e) => setSelesai(e.target.value)} required />
                      </div>
                    </div>

                     <div className="field-wrapper" style={{ marginTop: '0.5rem' }}>
                       <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: opsiKeamanan ? '#ecfdf5' : '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: `1px solid ${opsiKeamanan ? '#10b981' : '#e2e8f0'}`, cursor: 'pointer' }}>
                         <input type="checkbox" checked={opsiKeamanan} onChange={(e) => setOpsiKeamanan(e.target.checked)} style={{transform: 'scale(1.5)', marginInline: '5px'}}/>
                         <div>
                            <span style={{ fontWeight: 'bold', color: opsiKeamanan ? '#10b981' : '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FiShield /> Aktifkan Opsi Keamanan Kiosk Mode
                            </span>
                            <p style={{fontSize: '0.75rem', color: '#64748b', margin: 0, fontWeight: 'normal'}}>Mencegah aplikasi keluar/pindah aplikasi saat ujian berlangsung.</p>
                         </div>
                       </label>
                    </div>

                    <div className="field-wrapper" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      <label className="label" style={{fontWeight: '600', fontSize: '0.9rem'}}>Durasi Pengerjaan (Menit) <span className="label-required" style={{color: '#ef4444'}}>*</span></label>
                      <input type="number" min="1" className="input" style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0'}} value={durasi} onChange={(e) => setDurasi(e.target.value)} required />
                    </div>

                    <div className="field-wrapper" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      <label className="label" style={{fontWeight: '600', fontSize: '0.9rem'}}>Pilih Kelas <span className="label-required" style={{color: '#ef4444'}}>*</span></label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                         {kelasList.map(k => {
                           const tLabel = k.tingkat === 'X' ? '10' : k.tingkat === 'XI' ? '11' : '12';
                           const kName = `${tLabel} ${k.jurusan?.idJurusan || ''} ${k.inisial}`;
                           return (
                             <label key={k.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'all 0.2s' }}>
                               <input type="checkbox" checked={selectedKelas.includes(String(k.id))} onChange={() => toggleKelas(String(k.id))} style={{transform: 'scale(1.2)'}}/>
                               <span style={{ fontSize: '0.9rem', color: '#334155' }}>{kName}</span>
                             </label>
                           );
                         })}
                      </div>
                    </div>
                 </div>
               </div>
               <div className="modal-footer" style={{padding: '1.5rem 2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
                  <button type="button" className="btn-action" onClick={() => setShowAddCustomModal(false)} style={{padding: '0.75rem 1.5rem', borderRadius: '10px'}}>Batal</button>
                  <button type="submit" className="btn-action success" style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' }} disabled={saving}>
                    {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Buat Ujian Mandiri'}
                  </button>
               </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}
