import { useEffect, useState } from 'react';
import { FiCalendar, FiClock, FiBook, FiCheckCircle, FiXCircle, FiX, FiAlertCircle, FiPlus, FiLink, FiShield, FiTrash2, FiEdit2 } from 'react-icons/fi';
import api from '../../services/api';
import './GuruTheme.css';
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
  const [searchPaket, setSearchPaket] = useState('');
  
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Pagination per tab
  const ITEMS_PER_PAGE = 10;
  const [currentPageOfficial, setCurrentPageOfficial] = useState(1);
  const [currentPageCustom, setCurrentPageCustom] = useState(1);

  const getPaginated = (data, page) => {
    const tp = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
    const dp = Math.min(Math.max(1, page), tp);
    const si = (dp - 1) * ITEMS_PER_PAGE;
    return { data: data.slice(si, si + ITEMS_PER_PAGE), tp, dp, si };
  };
  const { data: paginatedOfficial, tp: tpOfficial, dp: dpOfficial, si: siOfficial } = getPaginated(officialJadwal, currentPageOfficial);
  const { data: paginatedCustom, tp: tpCustom, dp: dpCustom, si: siCustom } = getPaginated(customJadwal, currentPageCustom);

  function getPaginationPages(tp, cp) {
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => ({ type: 'page', value: i + 1 }));
    const delta = 1;
    let result = [{ type: 'page', value: 1 }];
    if (cp - delta > 2) result.push({ type: 'ellipsis', key: 'left' });
    for (let i = Math.max(2, cp - delta); i <= Math.min(tp - 1, cp + delta); i++) result.push({ type: 'page', value: i });
    if (cp + delta < tp - 1) result.push({ type: 'ellipsis', key: 'right' });
    result.push({ type: 'page', value: tp });
    return result;
  }

  const renderPagination = (total, tp, dp, setPage, page) => (
    total > 0 && (
      <div className="table-pagination">
        <span className="table-pagination-info">Menampilkan {(page === 1 ? 0 : (page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} dari {total} jadwal</span>
        <div className="table-pagination-controls">
          <button type="button" className="table-pagination-btn" disabled={dp <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Sebelumnya</button>
          <div className="table-pagination-pages">
            {getPaginationPages(tp, dp).map((item) =>
              item.type === 'ellipsis' ? <span key={`ellipsis-${item.key}`} className="table-pagination-ellipsis">…</span> :
              <button key={item.value} type="button" className={`table-pagination-page ${item.value === dp ? 'active' : ''}`} onClick={() => setPage(item.value)}>{item.value}</button>
            )}
          </div>
          <button type="button" className="table-pagination-btn" disabled={dp >= tp} onClick={() => setPage(p => Math.min(tp, p + 1))}>Berikutnya</button>
          <button type="button" className="table-pagination-btn show-all" onClick={() => setPage(9999)}>Tampilkan Semua</button>
        </div>
      </div>
    )
  );
  
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

  // HANDLER OFFICIAL EXAMS -----------------------------
  const handleOpenPilihPaket = (jdwlId) => {
    setActiveJadwalId(jdwlId);
    setSearchPaket('');
    setShowPilihPaketModal(true);
  };

  const handleLinkPaket = async (paketId) => {
    setSaving(true);
    try {
      const res = await api.put(`/guru/jadwal-ujian/official/${activeJadwalId}/paket`, { paketUjianId: paketId });
      setSuccess(res.data.message);
      setShowPilihPaketModal(false);
      fetchData(); //mengambil data terbaru
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
    setNama(j.nama);
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
    e.preventDefault(); //menghapus settingan default browser
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
    <div className="guru-page jadwal-page">
      <div className="guru-header guru-header-card">
        <div>
          <h1 className="guru-title">
            <span className="guru-title-text">Jadwal Ujian</span>
            <span className="guru-title-badge">Guru</span>
          </h1>
          <p className="guru-subtitle">Lihat jadwal resmi dari Admin dan kelola ulangan harian secara mandiri.</p>
        </div>
        <div className="guru-meta">
          <div className="guru-meta-card">
            <div className="guru-meta-label">Total Jadwal</div>
            <div className="guru-meta-value">{activeTab === 'official' ? officialJadwal.length : customJadwal.length}</div>
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

      <div className="guru-card">
         <div className="guru-card-header">
           <h2 className="guru-card-title">
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

                {paginatedOfficial.map((j) => (
                  <div key={j.id} className="jadwal-row">
                    <div className="col-main">
                      <div className="jadwal-nama">
                        {j.nama}
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
                        {j.mataPelajaran?.namaMapel}
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
            {renderPagination(officialJadwal.length, tpOfficial, dpOfficial, setCurrentPageOfficial, currentPageOfficial)}
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

                 {paginatedCustom.map((j) => (
                   <div key={j.id} className="jadwal-row">
                      <div className="col-main">
                        <div className="jadwal-nama">{j.nama}</div>
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
                           {j.mataPelajaran?.namaMapel}
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
             {renderPagination(customJadwal.length, tpCustom, dpCustom, setCurrentPageCustom, currentPageCustom)}
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
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{marginBottom: '0.75rem', fontSize: '0.9rem', color: '#64748b'}}>Hanya paket berstatus Siap Ujian yang akan ditampilkan di sini.</p>
                  <input
                    type="text"
                    className="input"
                    placeholder="Cari paket ujian..."
                    value={searchPaket}
                    onChange={(e) => setSearchPaket(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  />
                </div>
                {(() => {
                  const jadwalAktif = officialJadwal.find(j => j.id === activeJadwalId) || customJadwal.find(j => j.id === activeJadwalId);
                  const filteredPakets = myPakets.filter(p => 
                    (jadwalAktif ? String(p.mataPelajaran?.id) === String(jadwalAktif.mataPelajaranId) : true) &&
                    p.nama.toLowerCase().includes(searchPaket.toLowerCase())
                  );

                  if (filteredPakets.length === 0) {
                     return <div className="user-alert" style={{textAlign: 'center'}}>Tidak ada paket ujian yang ditemukan untuk mata pelajaran ini.</div>;
                  }

                  return (
                     <div style={{ display: 'grid', gap: '1rem' }}>
                       {filteredPakets.map(p => (
                          <div
                             key={p.id}
                             onClick={() => !saving && handleLinkPaket(p.id)}
                             style={{
                               padding: '1.25rem',
                               border: '1px solid #e2e8f0',
                               borderRadius: '12px',
                               background: '#f8fafc',
                               cursor: saving ? 'not-allowed' : 'pointer',
                               transition: 'all 0.18s ease',
                               opacity: saving ? 0.6 : 1,
                             }}
                             onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.12)'; } }}
                             onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                           >
                             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                               <strong style={{display: 'block', color: '#0f172a', whiteSpace: 'normal', overflowWrap: 'break-word'}}>{p.nama}</strong>
                               {p.guru?.user?.namaLengkap && (
                                 <span style={{fontSize: '0.7rem', padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', color: '#475569', whiteSpace: 'nowrap', marginLeft: '8px'}}>Oleh: {p.guru.user.namaLengkap}</span>
                               )}
                             </div>
                             <span style={{fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '4px'}}>
                               {p.mataPelajaran?.namaMapel} • {p._count?.soalPaket || 0} Soal
                             </span>
                          </div>
                       ))}
                     </div>
                  );
                })()}
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
                          {myPakets.filter(p => String(p.mataPelajaranId) === String(mataPelajaranId)).map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
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
                           // Prioritas: namaKelas (dari DB) > build manual
                           const tingkatLabel = { X: '10', XI: '11', XII: '12', ALUMNI: 'Alumni', KI: 'KI' }[k.tingkat] || k.tingkat;
                           const kName = k.namaKelas
                             || `${tingkatLabel} ${k.jurusan?.kodeProdi || ''} ${k.inisial || ''}`.replace(/\s+$/, '');
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
