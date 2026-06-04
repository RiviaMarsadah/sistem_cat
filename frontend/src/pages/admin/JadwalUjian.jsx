import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { FiPlus, FiTrash2, FiClock, FiCalendar, FiBook, FiCheckCircle, FiXCircle, FiX, FiShield, FiChevronRight, FiArrowLeft, FiEdit2, FiAlertCircle, FiChevronLeft, FiRefreshCw, FiPackage } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import '../guru/PaketUjian.css';
import './JadwalUjian.css';
import './User.css';

// ── Helper: format mm:ss dari milliseconds ──────────────────────────────────
function formatCountdown(ms) {
  if (ms <= 0) return '00:00';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Helper: apakah suatu jadwal jatuh hari ini? ─────────────────────────────
function isToday(jadwal) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const mulai   = new Date(jadwal.mulai);
  const selesai = new Date(jadwal.selesai);
  return mulai <= endOfDay && selesai >= startOfDay;
}

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

export default function JadwalUjianAdmin() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // View State logic
  const [activePeriodeId, setActivePeriodeId] = useState(null);
  const [periodes, setPeriodes] = useState([]);

  // Confirm Modal (Jadwal)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  
  // Modal Periode Actions
  const [showConfirmPeriodeModal, setShowConfirmPeriodeModal] = useState(false);
  const [confirmPeriodeData, setConfirmPeriodeData] = useState(null);
  const [showEditPeriodeModal, setShowEditPeriodeModal] = useState(false);
  const [editPeriodeData, setEditPeriodeData] = useState({ id: '', nama: '', mulai: '', selesai: '', semester: 'Gasal', tahunAjaran: '' });

  // Edit Jadwal State
  const [showEditJadwalModal, setShowEditJadwalModal] = useState(false);
  const [masterMapel, setMasterMapel] = useState([]);
  const [editJadwalData, setEditJadwalData] = useState({
    id: '',
    mulai: '',
    selesai: '',
    durasi: 90,
    ruangan: '',
    opsiKeamanan: false,
    mataPelajaranId: ''
  });

  // ── Token countdown state ─────────────────────────────────────────────────
  // tokenMap: { [jadwalId]: { token, tokenCheckOut } }
  const [tokenMap, setTokenMap]         = useState({});
  const [msUntilRegen, setMsUntilRegen] = useState(0);
  const countdownRef                     = useRef(null); // setInterval handle
  const pollRef                          = useRef(null); // polling handle

  // ── Pilih Paket Soal Modal ────────────────────────────────────────────────
  const [showPaketModal, setShowPaketModal]       = useState(false);
  const [paketModalJadwal, setPaketModalJadwal]   = useState(null);  // jadwal yang sedang dipilih
  const [availablePakets, setAvailablePakets]     = useState([]);
  const [loadingPakets, setLoadingPakets]         = useState(false);
  const [selectedPaketId, setSelectedPaketId]     = useState('');
  const [savingPaket, setSavingPaket]             = useState(false);
  const [paketSearch, setPaketSearch]             = useState('');

  const [detailKelasFilter, setDetailKelasFilter] = useState('all');
  const [detailTanggalFilter, setDetailTanggalFilter] = useState('all');

  useEffect(() => {
    setDetailKelasFilter('all');
    setDetailTanggalFilter('all');
  }, [activePeriodeId]);

  const filteredPeriodes = useMemo(() => {
    return periodes.filter(p => 
      p.nama.toLowerCase().includes(search.toLowerCase()) || 
      p.semester.toLowerCase().includes(search.toLowerCase()) ||
      p.tahunAjaran.toLowerCase().includes(search.toLowerCase())
    );
  }, [periodes, search]);

  const totalPages = itemsPerPage === 0 ? 1 : Math.ceil(filteredPeriodes.length / itemsPerPage);
  
  const paginatedPeriodes = useMemo(() => {
    if (itemsPerPage === 0) return filteredPeriodes;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPeriodes.slice(start, start + itemsPerPage);
  }, [filteredPeriodes, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resJadwal, resPeriode, resMapel] = await Promise.all([
        api.get('/admin/jadwal-ujian/admin'),
        api.get('/admin/periode'),
        api.get('/admin/mata-pelajaran')
      ]);
      setItems(resJadwal.data?.data || []);
      const fetchedPeriodes = resPeriode.data?.data || [];
      setPeriodes(fetchedPeriodes);
      setMasterMapel(resMapel.data?.data || []);
    } catch (e) {
      showToast('Gagal memuat data jadwal. ' + (e?.response?.data?.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Token polling: ambil token terbaru + start countdown ──────────────────
  const fetchTodayTokens = useCallback(async () => {
    try {
      const res = await api.get('/admin/jadwal-ujian/today-tokens');
      if (res.data?.success) {
        setTokenMap(res.data.data.tokens || {});
        const ms = res.data.data.msUntilNextRegen || 0;
        setMsUntilRegen(ms);

        // Reset countdown ticker
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
          setMsUntilRegen(prev => {
            if (prev <= 1000) {
              // Token sudah habis masa slot-nya — refresh data jadwal + token
              clearInterval(countdownRef.current);
              loadData();
              fetchTodayTokens();
              return 0;
            }
            return prev - 1000;
          });
        }, 1000);
      }
    } catch (_) {
      // Diam-diam, tidak ganggu UX
    }
  }, []);

  useEffect(() => {
    loadData();
    fetchTodayTokens();

    // Polling setiap 30 detik untuk sinkronisasi jika tab lama / jaringan lambat
    pollRef.current = setInterval(fetchTodayTokens, 30_000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (pollRef.current)      clearInterval(pollRef.current);
    };
  }, [fetchTodayTokens]);

  const handleBuatWizard = () => {
     navigate('/admin/jadwal-ujian/wizard');
  };


  const confirmDelete = (item) => {
    setConfirmData(item);
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await api.delete(`/admin/jadwal-ujian/${confirmData.id}`);
      showToast(res.data.message || 'Jadwal berhasil dihapus', 'success');
      setShowConfirmModal(false);
      await loadData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal menghapus jadwal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditJadwal = (j) => {
    const startLocal = j.mulai ? new Date(j.mulai) : new Date();
    const offsetStart = startLocal.getTimezoneOffset() * 60000;
    const localStartISO = new Date(startLocal.getTime() - offsetStart).toISOString().substring(0, 16);

    const endLocal = j.selesai ? new Date(j.selesai) : new Date();
    const offsetEnd = endLocal.getTimezoneOffset() * 60000;
    const localEndISO = new Date(endLocal.getTime() - offsetEnd).toISOString().substring(0, 16);

    setEditJadwalData({
      id: j.id,
      mulai: localStartISO,
      selesai: localEndISO,
      durasi: j.durasi || 90,
      ruangan: j.ruangan || '',
      opsiKeamanan: j.opsiKeamanan || false,
      mataPelajaranId: j.mataPelajaranId || ''
    });
    setShowEditJadwalModal(true);
  };

  const handleEditJadwalFieldChange = (field, value) => {
    setEditJadwalData(prev => {
      let updated = { ...prev, [field]: value };
      if (field === 'mulai' || field === 'durasi') {
        const start = new Date(updated.mulai);
        if (!isNaN(start.getTime())) {
          const end = new Date(start.getTime() + Number(updated.durasi) * 60000);
          const offset = end.getTimezoneOffset() * 60000;
          const localEnd = new Date(end.getTime() - offset);
          updated.selesai = localEnd.toISOString().substring(0, 16);
        }
      }
      return updated;
    });
  };

  const submitEditJadwal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/jadwal-ujian/${editJadwalData.id}`, {
        mulai: editJadwalData.mulai,
        selesai: editJadwalData.selesai,
        durasi: Number(editJadwalData.durasi),
        ruangan: editJadwalData.ruangan,
        opsiKeamanan: editJadwalData.opsiKeamanan,
        mataPelajaranId: Number(editJadwalData.mataPelajaranId)
      });
      showToast('Jadwal berhasil diperbarui', 'success');
      setShowEditJadwalModal(false);
      await loadData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal memperbarui jadwal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEditPeriode = (p, e) => {
    e.stopPropagation();
    setEditPeriodeData({ 
        id: p.id, 
        nama: p.nama, 
        mulai: new Date(p.mulai).toISOString().split('T')[0], 
        selesai: new Date(p.selesai).toISOString().split('T')[0], 
        semester: p.semester, 
        tahunAjaran: p.tahunAjaran 
    });
    setShowEditPeriodeModal(true);
  };

  const submitEditPeriode = async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
          const res = await api.put(`/admin/periode/${editPeriodeData.id}`, editPeriodeData);
          showToast("Periode berhasil diperbarui", 'success');
          setShowEditPeriodeModal(false);
          await loadData();
      } catch (err) {
          showToast(err?.response?.data?.message || "Gagal memperbarui periode", 'error');
      } finally {
          setSaving(false);
      }
  };

  const confirmDeletePeriode = (p) => {
    setConfirmPeriodeData(p);
    setShowConfirmPeriodeModal(true);
  };

  const handleDeletePeriode = async () => {
    setSaving(true);
    try {
      const res = await api.delete(`/admin/periode/${confirmPeriodeData.id}`);
      showToast("Periode berhasil dihapus", 'success');
      setShowConfirmPeriodeModal(false);
      await loadData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal menghapus periode', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Paket Soal Modal Handlers ─────────────────────────────────────────────
  const openPaketModal = async (jadwal, e) => {
    e.stopPropagation();
    setPaketModalJadwal(jadwal);
    setSelectedPaketId(jadwal.paketUjianId ? String(jadwal.paketUjianId) : '');
    setPaketSearch('');
    setShowPaketModal(true);
    setLoadingPakets(true);
    try {
      const res = await api.get(`/admin/jadwal-ujian/${jadwal.id}/available-pakets`);
      setAvailablePakets(res.data?.data || []);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal memuat daftar paket soal', 'error');
      setShowPaketModal(false);
    } finally {
      setLoadingPakets(false);
    }
  };

  const closePaketModal = () => {
    setShowPaketModal(false);
    setPaketModalJadwal(null);
    setAvailablePakets([]);
    setPaketSearch('');
  };

  const submitSetPaket = async () => {
    if (!paketModalJadwal) return;
    setSavingPaket(true);
    try {
      const payload = selectedPaketId ? { paketUjianId: Number(selectedPaketId) } : { paketUjianId: null };
      const res = await api.put(`/admin/jadwal-ujian/${paketModalJadwal.id}/set-paket`, payload);
      showToast(res.data.message || 'Paket soal berhasil disimpan', 'success');
      closePaketModal();
      await loadData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal menyimpan paket soal', 'error');
    } finally {
      setSavingPaket(false);
    }
  };

  const renderListPeriode = () => {
    if (loading && periodes.length === 0) return <div className="paket-ujian-loading">Memuat periode...</div>;

    
    return (
      <div className="user-card" style={{ marginTop: '1.5rem' }}>
        <div className="user-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 className="user-card-title">Daftar Periode Ujian</h2>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Cari periode..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <button className="btn-add-user" onClick={handleBuatWizard} disabled={saving}>
            <FiPlus />
            <span>Jadwal Ujian</span>
          </button>
        </div>

        <div className="paket-ujian-table-wrap">
        <table className="paket-ujian-table">
          <thead>
            <tr>
              <th>Periode Ujian</th>
              <th>Semester & Tahun Ajaran</th>
              <th>Waktu Pelaksanaan</th>
              <th>Total Jadwal Ujian</th>
              <th>Kiosk Mode</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPeriodes.map(p => {
               const periodItems = items.filter(j => String(j.periodeId) === String(p.id));
               const isKioskActive = periodItems.some(j => j.opsiKeamanan === true);

               return (
                 <tr key={p.id} onClick={() => setActivePeriodeId(p.id)} style={{ cursor: 'pointer', transition: 'background 0.2s' }} className="clickable-row">
                   <td>
                     <div style={{fontWeight: '700', color: '#1e293b'}}>{p.nama}</div>
                   </td>
                   <td>
                     <div style={{fontWeight: '600', color: '#334155'}}>{p.semester} - {p.tahunAjaran}</div>
                   </td>
                   <td>
                     <div style={{fontSize: '0.85rem', color: '#64748b'}}>
                       <FiCalendar style={{marginRight: '4px', verticalAlign: 'text-bottom'}}/> 
                       {new Date(p.mulai).toLocaleDateString('id-ID')} s/d {new Date(p.selesai).toLocaleDateString('id-ID')}
                     </div>
                   </td>
                   <td>
                     <div style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', color: '#2563eb', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem'}}>
                        {p._count?.jadwalUjians || periodItems.length} Sesi Terjadwal
                     </div>
                   </td>
                   <td>
                      {isKioskActive ? (
                         <span style={{ fontSize: '0.7rem', background: '#d1fae5', color: '#059669', padding: '4px 8px', borderRadius: '4px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FiShield /> AKTIF
                         </span>
                      ) : (
                         <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#94a3b8', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
                            NONAKTIF
                         </span>
                      )}
                   </td>
                   <td>
                     <div style={{ display: 'flex', gap: '8px' }}>
                       <button className="btn-action primary" onClick={(e) => openEditPeriode(p, e)} title="Edit Periode" style={{ background: '#3b82f6', color: 'white' }}>
                          <FiEdit2 />
                       </button>
                       <button className="btn-action btn-delete" onClick={(e) => { e.stopPropagation(); confirmDeletePeriode(p); }} title="Hapus Periode">
                          <FiTrash2 />
                       </button>
                     </div>
                   </td>
                 </tr>
               )
            })}
          </tbody>
        </table>
        </div>

        {filteredPeriodes.length > 0 && (
          <div className="pagination-container" style={{ padding: '1rem' }}>
            <div className="pagination-info">
              Menampilkan <strong>{itemsPerPage === 0 ? filteredPeriodes.length : Math.min(filteredPeriodes.length, (currentPage - 1) * itemsPerPage + 1)}</strong> - <strong>{itemsPerPage === 0 ? filteredPeriodes.length : Math.min(filteredPeriodes.length, currentPage * itemsPerPage)}</strong> dari <strong>{filteredPeriodes.length}</strong> data
            </div>
            <div className="pagination-controls">
              <button 
                className="btn-pagination" 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || itemsPerPage === 0}
              >
                <FiChevronLeft />
              </button>
              
              {itemsPerPage !== 0 && Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button 
                      key={page} 
                      className={`btn-pagination ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} style={{ color: '#94a3b8' }}>...</span>;
                }
                return null;
              })}

              <button 
                className="btn-pagination" 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || itemsPerPage === 0}
              >
                <FiChevronRight />
              </button>

              <button 
                className={`pagination-show-all ${itemsPerPage === 0 ? 'active' : ''}`}
                onClick={() => setItemsPerPage(itemsPerPage === 0 ? 20 : 0)}
              >
                {itemsPerPage === 0 ? 'Batasi 20' : 'Tampilkan Semua'}
              </button>
            </div>
          </div>
        )}

        {periodes.length === 0 && (
          <div className="user-empty" style={{ padding: '3rem 0' }}>
            Belum ada periode ujian. Silakan buat jadwal baru melalui tombol di atas.
          </div>
        )}
      </div>
    );
  };

  const renderDetailPeriode = () => {
    const periode = periodes.find(p => p.id === activePeriodeId);
    if (!periode) return null;

    // Get all schedules under the active period to extract unique options
    const periodSchedules = items.filter(j => String(j.periodeId) === String(activePeriodeId));

    // Extract unique Kelas
    const uniqueClasses = [];
    const seenClasses = new Set();
    periodSchedules.forEach(j => {
      if (j.kelasJadwal) {
        j.kelasJadwal.forEach(kj => {
          if (kj.kelas) {
            const kId = kj.kelas.id;
            if (!seenClasses.has(kId)) {
              seenClasses.add(kId);
              uniqueClasses.push(kj.kelas);
            }
          }
        });
      }
    });
    uniqueClasses.sort((a, b) => getNamaKelasDisplay(a).localeCompare(getNamaKelasDisplay(b)));

    // Extract unique Dates
    const uniqueDates = [];
    const seenDates = new Set();
    periodSchedules.forEach(j => {
      if (j.mulai) {
        const dateObj = new Date(j.mulai);
        const localYear = dateObj.getFullYear();
        const localMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
        const localDay = String(dateObj.getDate()).padStart(2, '0');
        const localDateStr = `${localYear}-${localMonth}-${localDay}`;

        if (!seenDates.has(localDateStr)) {
          seenDates.add(localDateStr);
          const label = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
          uniqueDates.push({
            value: localDateStr,
            label,
            time: dateObj.getTime()
          });
        }
      }
    });
    uniqueDates.sort((a, b) => a.time - b.time);

    // Apply filtering to active period schedules
    let filteredItems = [...periodSchedules].sort((a, b) => new Date(a.mulai) - new Date(b.mulai));
    
    if (detailKelasFilter !== 'all') {
      filteredItems = filteredItems.filter(j => 
        j.kelasJadwal && j.kelasJadwal.some(kj => String(kj.kelasId) === String(detailKelasFilter))
      );
    }

    if (detailTanggalFilter !== 'all') {
      filteredItems = filteredItems.filter(j => {
        if (!j.mulai) return false;
        const dateObj = new Date(j.mulai);
        const localYear = dateObj.getFullYear();
        const localMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
        const localDay = String(dateObj.getDate()).padStart(2, '0');
        const localDateStr = `${localYear}-${localMonth}-${localDay}`;
        return localDateStr === detailTanggalFilter;
      });
    }
    
    // Check if Kiosk mode is active in any of the scheduled items
    const isKioskActive = filteredItems.some(j => j.opsiKeamanan === true);

    return (
      <div className="periode-detail-view" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
        <button onClick={() => setActivePeriodeId(null)} style={{ background: 'none', border: 'none', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', marginBottom: '1.5rem', padding: 0, fontSize: '0.95rem' }}>
          <FiArrowLeft /> Kembali ke Daftar Periode
        </button>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', border: '1px solid #e2e8f0' }}>Tahun {periode?.tahunAjaran}</span>
              <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', border: '1px solid #e2e8f0' }}>Semester {periode?.semester}</span>
              {isKioskActive && (
                <span style={{ background: '#d1fae5', color: '#059669', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiShield /> KIOSK MODE AKTIF
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.75rem', letterSpacing: '-0.5px', color: '#1e293b' }}>{periode?.nama}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                <FiCalendar /> Berlangsung: {new Date(periode?.mulai).toLocaleDateString('id-ID', { dateStyle: 'long' })} &mdash; {new Date(periode?.selesai).toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </div>
          </div>
          
          {/* Decorative Background */}
          <FiCalendar style={{ position: 'absolute', right: '-20px', top: '-20px', fontSize: '180px', opacity: '0.03', transform: 'rotate(15deg)', color: '#3b82f6' }} />
        </div>

        {/* Row for filters */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          padding: '1.25rem', 
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Filter Kelas</label>
            <select
              value={detailKelasFilter}
              onChange={(e) => setDetailKelasFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '0.875rem',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">Semua Kelas</option>
              {uniqueClasses.map((k) => (
                <option key={k.id} value={k.id}>{getNamaKelasDisplay(k)}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 250px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Filter Hari / Tanggal</label>
            <select
              value={detailTanggalFilter}
              onChange={(e) => setDetailTanggalFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '0.875rem',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">Semua Tanggal</option>
              {uniqueDates.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="paket-ujian-table-wrap">
        {loading ? (
          <div className="paket-ujian-loading">Memuat data jadwal...</div>
        ) : filteredItems.length === 0 ? (
          <table className="paket-ujian-table">
            <tbody>
              <tr><td className="empty-row" colSpan={6}>Belum ada sesi jadwal di dalam periode ini.</td></tr>
            </tbody>
          </table>
        ) : (
            <table className="paket-ujian-table">
             <thead>
               <tr>
                 <th className="text-left">Hari dan Tanggal Ujian</th>
                 <th className="text-left">Waktu Ujian</th>
                 <th className="text-center">Kelas</th>
                 <th className="text-center">Ruangan</th>
                 <th className="text-center">Token IN / OUT</th>
                 <th className="text-left">Mata Pelajaran</th>
                 <th className="text-center">Status Paket</th>
                 <th className="text-center">Aksi</th>
               </tr>
             </thead>
             <tbody>
               {filteredItems.map((j, idx) => {
                 const tglObj = new Date(j.mulai);
                 const hariTanggal = tglObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                 const waktuMulai = tglObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
                 const waktuSelesai = new Date(j.selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
                 const isEven = idx % 2 === 1;
                 const rowClass = isEven ? 'session-row-even' : 'session-row-odd';
                 // Token live: dari tokenMap jika ujian hari ini, fallback ke data DB
                 const todayTok        = tokenMap[j.id];
                 const displayToken    = todayTok?.token        ?? j.token;
                 const displayTokenOut = todayTok?.tokenCheckOut ?? j.tokenCheckOut;
                 const jadwalHariIni   = isToday(j);

                 return (
                 <tr key={j.id} className={rowClass}>
                   <td className="text-left">
                     <div style={{fontWeight: '600', color: '#1e293b'}}>
                       {hariTanggal}
                     </div>
                   </td>
                   <td className="text-left">
                     <div style={{fontSize: '0.9rem', color: '#334155'}}>
                         <FiClock style={{marginRight: '0.25rem', verticalAlign: 'text-bottom'}} />
                         {waktuMulai} - {waktuSelesai}
                         <div style={{fontSize: '0.75rem', color: '#64748b', marginTop: '2px'}}>({j.durasi} Menit)</div>
                     </div>
                   </td>
                   <td className="text-center">
                     <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
                       {j.kelasJadwal && j.kelasJadwal.length > 0 ? (
                         j.kelasJadwal.length === 1 ? (
                           <span 
                             className="mapel-badge" 
                             style={{ 
                               background: '#eff6ff', 
                               color: '#1e40af', 
                               border: '1px solid #bfdbfe', 
                               fontWeight: '700', 
                               padding: '6px 12px', 
                               borderRadius: '12px', 
                               fontSize: '0.85rem',
                               display: 'inline-block',
                               whiteSpace: 'nowrap',
                               textAlign: 'center',
                               lineHeight: '1.2'
                             }}
                           >
                             {getNamaKelasDisplay(j.kelasJadwal[0].kelas)}
                           </span>
                         ) : (
                           <div className="class-tooltip-container">
                             <span 
                               className="mapel-badge" 
                               style={{ 
                                 background: '#eff6ff', 
                                 color: '#1e40af', 
                                 border: '1px solid #bfdbfe', 
                                 fontWeight: '700', 
                                 padding: '4px 12px', 
                                 borderRadius: '20px', 
                                 fontSize: '0.85rem',
                                 cursor: 'pointer'
                               }}
                             >
                               {j.kelasJadwal.length} Kelas
                             </span>
                             <div className={`class-tooltip-bubble ${j.kelasJadwal.length > 10 ? 'scrollable' : ''}`}>
                               <div style={{ 
                                 display: 'grid', 
                                 gridTemplateColumns: j.kelasJadwal.length === 1 ? '1fr' : 'repeat(2, 1fr)', 
                                 gap: '8px', 
                                 width: 'max-content'
                               }}>
                                 {j.kelasJadwal.map((kj, idx2) => (
                                   <span key={idx2} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'center', lineHeight: '1.3' }}>
                                     {getNamaKelasDisplay(kj.kelas)}
                                   </span>
                                 ))}
                               </div>
                             </div>
                           </div>
                         )
                       ) : (
                         <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>-</span>
                       )}
                     </div>
                   </td>
                   <td className="text-center">
                     <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '600' }}>
                       {j.ruangan || '-'}
                     </span>
                   </td>
                   <td className="text-center">
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
                           border: `1px solid ${msUntilRegen < 60000 ? '#fed7aa' : '#bae6fd'}`,
                           borderRadius: '6px', padding: '3px 8px',
                           fontSize: '0.7rem', fontWeight: '600',
                           color: msUntilRegen < 60000 ? '#c2410c' : '#0369a1'
                         }}>
                           <FiRefreshCw size={10} />
                           <span>Regen: {formatCountdown(msUntilRegen)}</span>
                         </div>
                       )}
                     </div>
                   </td>
                   <td className="text-left">
                     <div className="user-role-badge status-aktif" style={{display: 'inline-flex', whiteSpace: 'nowrap'}}>
                         <FiBook style={{marginRight: '0.25rem'}} />
                         {j.mataPelajaran?.namaMapel}
                     </div>
                   </td>
                   <td className="text-center">
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
                    </td>
                   <td className="text-center">
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button className="btn-action primary" style={{ background: "#3b82f6", color: "white" }} onClick={() => handleEditJadwal(j)} title="Edit Jadwal">
                            <FiEdit2 />
                          </button>
                          <button className="btn-action btn-delete" onClick={() => confirmDelete(j)} title="Hapus Jadwal">
                            <FiTrash2 />
                          </button>
                        </div>
                   </td>
                 </tr>
                 )
               })}
             </tbody>
           </table>
        )}
        </div>
      </div>
    );
  };

  return (
    <div className="user-page" style={{ padding: '0 20px 20px 20px' }}>
      <div className="user-header">
        <div>
          <h1 className="user-title">
            <span className="title-text">Jadwal Ujian</span>
            <span className="title-badge">Admin</span>
          </h1>
          <p className="user-subtitle">Manajemen kalender periode ujian aktif dan slot waktu pelaksanaan tes.</p>
        </div>
        <div className="user-meta">
          <div className="meta-card">
            <div className="meta-label">Total</div>
            <div className="meta-value">{periodes.length}</div>
          </div>
        </div>
      </div>



      {activePeriodeId === null ? renderListPeriode() : renderDetailPeriode()}

      {/* Edit Periode Modal */}
      {showEditPeriodeModal && (
        <div className="modal-overlay">
          <div className="modal-container modal-form">
            <div className="modal-header">
              <h3 className="modal-title">Edit Periode Ujian</h3>
              <button className="modal-close" onClick={() => setShowEditPeriodeModal(false)}><FiX /></button>
            </div>
            <form onSubmit={submitEditPeriode}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="label">Judul Periode <span className="label-required">*</span></label>
                  <input className="input" required value={editPeriodeData.nama} onChange={(e) => setEditPeriodeData({...editPeriodeData, nama: e.target.value})} />
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                   <div className="form-group">
                      <label className="label">Tahun Ajaran <span className="label-required">*</span></label>
                      <select className="input" required value={editPeriodeData.tahunAjaran} onChange={(e) => setEditPeriodeData({...editPeriodeData, tahunAjaran: e.target.value})}>
                        {Array.from({length: 15}, (_, i) => 2020 + i).map(year => (
                           <option key={year} value={`${year}/${year + 1}`}>{year}/{year + 1}</option>
                        ))}
                      </select>
                   </div>
                   <div className="form-group">
                      <label className="label">Semester <span className="label-required">*</span></label>
                      <select className="input" required value={editPeriodeData.semester} onChange={(e) => setEditPeriodeData({...editPeriodeData, semester: e.target.value})}>
                         <option value="Gasal">Gasal</option>
                         <option value="Genap">Genap</option>
                      </select>
                   </div>
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                   <div className="form-group">
                      <label className="label">Tgl Mulai Ujian <span className="label-required">*</span></label>
                      <input type="date" className="input" required value={editPeriodeData.mulai} onChange={(e) => setEditPeriodeData({...editPeriodeData, mulai: e.target.value})} />
                   </div>
                   <div className="form-group">
                      <label className="label">Tgl Selesai Ujian <span className="label-required">*</span></label>
                      <input type="date" className="input" required value={editPeriodeData.selesai} onChange={(e) => setEditPeriodeData({...editPeriodeData, selesai: e.target.value})} />
                   </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowEditPeriodeModal(false)}>Batal</button>
                <button type="submit" className="modal-btn modal-btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conform Delete Jadwal Sesi */}
      {showConfirmModal && confirmData && (
        <div className="modal-overlay">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm">
              <div className="modal-confirm-header">
                <div className="modal-confirm-icon-box danger">
                  <FiAlertCircle className="modal-icon" />
                </div>
                <h3 className="modal-confirm-title">Hapus Sesi Jadwal?</h3>
              </div>
              <div className="modal-confirm-body">
                <div className="modal-confirm-text">
                  Yakin ingin menghapus jadwal pada <span className="modal-confirm-item">{new Date(confirmData.mulai).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>?
                </div>
                <div className="modal-confirm-warning">
                  <FiAlertCircle /> Tindakan ini tidak dapat dibatalkan. Seluruh record ujian siswa di jadwal ini akan ikut terhapus.
                </div>
              </div>
              <div className="modal-confirm-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)} disabled={saving}>
                  <FiX /> Batal
                </button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                  {saving ? 'Menghapus...' : <><FiTrash2 /> Ya, Hapus</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conform Delete Periode */}
      {showConfirmPeriodeModal && confirmPeriodeData && (
        <div className="modal-overlay">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm">
              <div className="modal-confirm-header">
                <div className="modal-confirm-icon-box danger">
                  <FiAlertCircle className="modal-icon" />
                </div>
                <h3 className="modal-confirm-title">Hapus Periode Ujian?</h3>
              </div>
              <div className="modal-confirm-body">
                <div className="modal-confirm-text">
                  Yakin ingin menghapus periode <span className="modal-confirm-item">{confirmPeriodeData.nama}</span>?
                </div>
                <div className="modal-confirm-warning">
                  <FiAlertCircle /> PERHATIAN: Seluruh data jadwal sesi dan hasil ujian siswa dalam periode ini akan terhapus permanen!
                </div>
              </div>
              <div className="modal-confirm-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirmPeriodeModal(false)} disabled={saving}>
                  <FiX /> Batal
                </button>
                <button className="btn btn-danger" onClick={handleDeletePeriode} disabled={saving}>
                  {saving ? 'Menghapus...' : <><FiTrash2 /> Ya, Hapus Semua</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Jadwal Ujian */}
      {showEditJadwalModal && (
        <div className="modal-overlay">
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <form onSubmit={submitEditJadwal}>
              <div className="modal-header">
                <h3>Edit Detail Jadwal Ujian</h3>
                <button type="button" className="modal-close" onClick={() => setShowEditJadwalModal(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="label">Mata Pelajaran <span className="label-required">*</span></label>
                  <select 
                    className="input" 
                    required 
                    value={editJadwalData.mataPelajaranId} 
                    onChange={(e) => handleEditJadwalFieldChange('mataPelajaranId', e.target.value)}
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {masterMapel.map(m => (
                      <option key={m.id} value={m.id}>{m.namaMapel} ({m.kodeMapel || '-'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="label">Ruangan <span className="label-required">*</span></label>
                    <input 
                      type="text" 
                      className="input" 
                      required 
                      placeholder="Misal: Lab 1" 
                      value={editJadwalData.ruangan} 
                      onChange={(e) => handleEditJadwalFieldChange('ruangan', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Durasi (Menit) <span className="label-required">*</span></label>
                    <input 
                      type="number" 
                      className="input" 
                      required 
                      min="10" 
                      value={editJadwalData.durasi} 
                      onChange={(e) => handleEditJadwalFieldChange('durasi', parseInt(e.target.value) || 0)} 
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="label">Waktu Mulai <span className="label-required">*</span></label>
                    <input 
                      type="datetime-local" 
                      className="input" 
                      required 
                      value={editJadwalData.mulai} 
                      onChange={(e) => handleEditJadwalFieldChange('mulai', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Waktu Selesai (Otomatis)</label>
                    <div className="input" style={{ background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', minHeight: '42px', fontSize: '0.9rem', fontWeight: '500' }}>
                      {editJadwalData.selesai ? editJadwalData.selesai.replace('T', ' ') : '—'}
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '12px 16px', borderRadius: '10px', marginTop: '4px' }}>
                  <input 
                    type="checkbox" 
                    id="editJadwalKiosk" 
                    checked={editJadwalData.opsiKeamanan} 
                    onChange={(e) => handleEditJadwalFieldChange('opsiKeamanan', e.target.checked)} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="editJadwalKiosk" style={{ fontSize: '0.9rem', color: '#0369a1', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                    Aktifkan Kiosk Mode (Keamanan Mobile / Browser Terkunci)
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowEditJadwalModal(false)}>Batal</button>
                <button type="submit" className="modal-btn modal-btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Pilih / Ganti Paket Soal ────────────────────────────────── */}
      {showPaketModal && (
        <div className="modal-overlay" onClick={closePaketModal}>
          <div
            className="modal-container"
            style={{ maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ margin: 0 }}>
                  <FiPackage style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Pilih Paket Soal
                </h3>
                {paketModalJadwal && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    Jadwal: <strong>{paketModalJadwal.mataPelajaran?.namaMapel}</strong>
                  </p>
                )}
              </div>
              <button className="modal-close" onClick={closePaketModal}><FiX /></button>
            </div>

            {/* Search */}
            <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <input
                type="text"
                placeholder="Cari paket soal atau nama guru..."
                value={paketSearch}
                onChange={(e) => setPaketSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                autoFocus
              />
            </div>

            {/* List paket */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1.5rem' }}>
              {loadingPakets ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Memuat paket soal...</div>
              ) : availablePakets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  Belum ada paket soal untuk mata pelajaran ini.
                </div>
              ) : (
                <>
                  {/* Opsi lepas paket */}
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                    background: selectedPaketId === '' ? '#fef2f2' : 'transparent',
                    border: selectedPaketId === '' ? '1px solid #fecaca' : '1px solid transparent',
                    marginBottom: '8px', transition: 'all 0.15s'
                  }}>
                    <input
                      type="radio"
                      name="paketSelect"
                      value=""
                      checked={selectedPaketId === ''}
                      onChange={() => setSelectedPaketId('')}
                      style={{ accentColor: '#ef4444' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', color: '#b91c1c', fontSize: '0.85rem' }}>Lepas Paket Soal</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Jadwal akan kembali ke status "Belum Diisi Paket"</div>
                    </div>
                  </label>

                  {availablePakets
                    .filter(p => {
                      if (!paketSearch.trim()) return true;
                      const q = paketSearch.toLowerCase();
                      return (
                        p.nama?.toLowerCase().includes(q) ||
                        p.guru?.user?.namaLengkap?.toLowerCase().includes(q) ||
                        p.tipeUjian?.toLowerCase().includes(q)
                      );
                    })
                    .map((p) => {
                      const isSelected = selectedPaketId === String(p.id);
                      return (
                        <label key={p.id} style={{
                          display: 'flex', alignItems: 'flex-start', gap: '12px',
                          padding: '12px', borderRadius: '10px', cursor: 'pointer',
                          background: isSelected ? '#eff6ff' : '#fafafa',
                          border: isSelected ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                          marginBottom: '8px', transition: 'all 0.15s'
                        }}>
                          <input
                            type="radio"
                            name="paketSelect"
                            value={String(p.id)}
                            checked={isSelected}
                            onChange={() => setSelectedPaketId(String(p.id))}
                            style={{ marginTop: '2px', accentColor: '#3b82f6' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.9rem', marginBottom: '2px' }}>{p.nama}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                                👨‍🏫 {p.guru?.user?.namaLengkap || 'Guru'}
                              </span>
                              <span style={{ fontSize: '0.72rem', background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                                📝 {p._count?.soalPaket || 0} Soal
                              </span>
                              <span style={{ fontSize: '0.72rem', background: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                                {p.tipeUjian}
                              </span>
                              <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                                Tingkat {p.tingkat}
                              </span>
                            </div>
                          </div>
                        </label>
                      );
                    })
                  }
                </>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="modal-btn modal-btn-cancel" onClick={closePaketModal}>Batal</button>
              <button
                type="button"
                className="modal-btn modal-btn-primary"
                onClick={submitSetPaket}
                disabled={savingPaket || loadingPakets}
              >
                {savingPaket ? 'Menyimpan...' : (selectedPaketId ? 'Pasang Paket Soal' : 'Lepas Paket')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS spin keyframe untuk ikon countdown */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

