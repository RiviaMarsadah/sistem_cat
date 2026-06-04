import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FiSearch, FiTrash2, FiAlertCircle, FiCheckCircle, FiX, 
  FiClock, FiBookOpen, FiUser, FiInfo, FiChevronLeft, FiChevronRight,
  FiDownload, FiChevronDown
} from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './Siswa.css';
import './User.css'; // Re-use common premium layouts

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

const UjianSiswa = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [totalAllCount, setTotalAllCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Filter States
  const [filterJadwalList, setFilterJadwalList] = useState([]);
  const [filterMapelList, setFilterMapelList] = useState([]);
  const [filterKelasList, setFilterKelasList] = useState([]);

  const [selectedJadwal, setSelectedJadwal] = useState('all');
  const [selectedMapel, setSelectedMapel] = useState('all');
  const [selectedKelas, setSelectedKelas] = useState('all');

  // Searchable Jadwal Dropdown States
  const [jadwalSearch, setJadwalSearch] = useState('');
  const [jadwalDropOpen, setJadwalDropOpen] = useState(false);
  const jadwalDropRef = useRef(null);

  // Searchable Mapel Dropdown States
  const [mapelSearch, setMapelSearch] = useState('');
  const [mapelDropOpen, setMapelDropOpen] = useState(false);
  const mapelDropRef = useRef(null);

  // Searchable Kelas Dropdown States
  const [kelasSearch, setKelasSearch] = useState('');
  const [kelasDropOpen, setKelasDropOpen] = useState(false);
  const kelasDropRef = useRef(null);

  // Filter schedules by search query
  const filteredJadwals = useMemo(() => {
    const query = jadwalSearch.toLowerCase().trim();
    if (!query) return filterJadwalList;
    return filterJadwalList.filter(j => 
      (j.nama || '').toLowerCase().includes(query)
    );
  }, [filterJadwalList, jadwalSearch]);

  // Selected schedule details for displaying in the select input box
  const selectedJadwalDetails = useMemo(() => {
    if (selectedJadwal === 'all') return null;
    return filterJadwalList.find(j => String(j.id) === String(selectedJadwal));
  }, [filterJadwalList, selectedJadwal]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (jadwalDropRef.current && !jadwalDropRef.current.contains(e.target)) {
        setJadwalDropOpen(false);
      }
      if (mapelDropRef.current && !mapelDropRef.current.contains(e.target)) {
        setMapelDropOpen(false);
      }
      if (kelasDropRef.current && !kelasDropRef.current.contains(e.target)) {
        setKelasDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMapels = useMemo(() => {
    if (selectedJadwal === 'all') return filterMapelList;
    const selectedOpt = filterJadwalList.find(o => o.id === selectedJadwal);
    if (!selectedOpt) return filterMapelList;
    const activeMapelIds = new Set(selectedOpt.schedules.map(s => s.mataPelajaranId).filter(Boolean));
    return filterMapelList.filter(m => activeMapelIds.has(m.id));
  }, [selectedJadwal, filterJadwalList, filterMapelList]);

  // Search Mapel Options
  const filteredMapelsSearch = useMemo(() => {
    const query = mapelSearch.toLowerCase().trim();
    if (!query) return filteredMapels;
    return filteredMapels.filter(m => 
      (m.namaMapel || '').toLowerCase().includes(query)
    );
  }, [filteredMapels, mapelSearch]);

  const selectedMapelDetails = useMemo(() => {
    if (selectedMapel === 'all') return null;
    return filterMapelList.find(m => String(m.id) === String(selectedMapel));
  }, [filterMapelList, selectedMapel]);

  const filteredKelas = useMemo(() => {
    if (selectedJadwal === 'all') return filterKelasList;
    const selectedOpt = filterJadwalList.find(o => o.id === selectedJadwal);
    if (!selectedOpt) return filterKelasList;
    const activeKelasIds = new Set(
      selectedOpt.schedules.flatMap(s => s.kelasJadwal || []).map(kj => kj.kelas?.id || kj.kelasId).filter(Boolean)
    );
    return filterKelasList.filter(k => activeKelasIds.has(k.id));
  }, [selectedJadwal, filterJadwalList, filterKelasList]);

  // Search Kelas Options
  const filteredKelasSearch = useMemo(() => {
    const query = kelasSearch.toLowerCase().trim();
    if (!query) return filteredKelas;
    return filteredKelas.filter(k => 
      getNamaKelasDisplay(k).toLowerCase().includes(query)
    );
  }, [filteredKelas, kelasSearch]);

  const selectedKelasDetails = useMemo(() => {
    if (selectedKelas === 'all') return null;
    return filterKelasList.find(k => String(k.id) === String(selectedKelas));
  }, [filterKelasList, selectedKelas]);

  useEffect(() => {
    if (selectedJadwal !== 'all') {
      const mapelIds = new Set(filteredMapels.map(m => String(m.id)));
      if (selectedMapel !== 'all' && !mapelIds.has(String(selectedMapel))) {
        setSelectedMapel('all');
      }
      const kelasIds = new Set(filteredKelas.map(k => String(k.id)));
      if (selectedKelas !== 'all' && !kelasIds.has(String(selectedKelas))) {
        setSelectedKelas('all');
      }
    }
  }, [selectedJadwal, filteredMapels, filteredKelas, selectedMapel, selectedKelas]);

  // Belum Mengerjakan States
  const [showBelumMengerjakanModal, setShowBelumMengerjakanModal] = useState(false);
  const [belumMengerjakanList, setBelumMengerjakanList] = useState([]);
  const [loadingBelumMengerjakan, setLoadingBelumMengerjakan] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const isBelumMengerjakanDisabled = selectedJadwal === 'all' || selectedMapel === 'all' || selectedKelas === 'all';

  const handleOpenBelumMengerjakan = async () => {
    setShowBelumMengerjakanModal(true);
    setLoadingBelumMengerjakan(true);
    try {
      const queryParams = new URLSearchParams({
        jadwalUjianId: selectedJadwal,
        mapelId: selectedMapel,
        kelasId: selectedKelas
      }).toString();
      const res = await api.get(`/admin/ujian-siswa/belum-mengerjakan?${queryParams}`);
      if (res.data.success) {
        setBelumMengerjakanList(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat data siswa belum mengerjakan', 'error');
    } finally {
      setLoadingBelumMengerjakan(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      showToast('Sedang menyiapkan file Excel...', 'info');
      const queryParams = new URLSearchParams({
        search,
        jadwalUjianId: selectedJadwal,
        mapelId: selectedMapel,
        kelasId: selectedKelas
      }).toString();

      const response = await api.get(`/admin/ujian-siswa/export?${queryParams}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Rekap_Ujian_Siswa_Admin.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showToast('File Excel berhasil diunduh!', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Gagal mengekspor data ujian siswa', 'error');
    }
  };

  // Pagination states
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Helper paginasi ala Guru
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

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Status modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusItem, setStatusItem] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const fetchFilterOptions = async () => {
    try {
      const [resJadwal, resMapel, resKelas] = await Promise.all([
        api.get('/admin/guru-data/jadwal'),
        api.get('/admin/mata-pelajaran'),
        api.get('/admin/kelas')
      ]);

      if (resJadwal.data.success) {
        const jadwals = resJadwal.data.data || [];
        const uniquePeriods = {};
        const customJadwals = [];

        jadwals.forEach(j => {
          if (j.periodeId !== null) {
            const pId = j.periodeId;
            if (!uniquePeriods[pId]) {
              uniquePeriods[pId] = {
                id: `periode-${pId}`,
                nama: j.periode?.nama || j.nama,
                isPeriode: true,
                periodeId: pId,
                mulai: j.periode?.mulai || j.mulai,
                schedules: []
              };
            }
            uniquePeriods[pId].schedules.push(j);
          } else {
            customJadwals.push({
              id: String(j.id),
              nama: j.nama,
              isPeriode: false,
              mulai: j.mulai,
              schedules: [j]
            });
          }
        });

        const groupedJadwals = [
          ...Object.values(uniquePeriods),
          ...customJadwals
        ];

        // Sort by 'mulai' descending (newest first)
        groupedJadwals.sort((a, b) => {
          const dateA = a.mulai ? new Date(a.mulai) : new Date(0);
          const dateB = b.mulai ? new Date(b.mulai) : new Date(0);
          return dateB - dateA;
        });
        setFilterJadwalList(groupedJadwals);
      }
      if (resMapel.data.success) {
        const mapels = resMapel.data.data || [];
        mapels.sort((a, b) => a.namaMapel.localeCompare(b.namaMapel));
        setFilterMapelList(mapels);
      }
      if (resKelas.data.success) {
        const kelasList = resKelas.data.data || [];
        kelasList.sort((a, b) => getNamaKelasDisplay(a).localeCompare(getNamaKelasDisplay(b)));
        setFilterKelasList(kelasList);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        jadwalUjianId: selectedJadwal,
        mapelId: selectedMapel,
        kelasId: selectedKelas
      }).toString();

      const res = await api.get(`/admin/ujian-siswa?${queryParams}`);
      if (res.data.success) {
        setItems(res.data.data || []);
        if (res.data.totalCount !== undefined) {
          setTotalAllCount(res.data.totalCount);
        }
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal memuat data ujian siswa', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedJadwal, selectedMapel, selectedKelas]);



  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await api.delete(`/admin/ujian-siswa/${selectedItem.id}`);
      if (res.data.success) {
        showToast(res.data.message || 'Data ujian siswa berhasil dihapus', 'success');
        setShowDeleteModal(false);
        setSelectedItem(null);
        await loadData();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal menghapus data ujian siswa', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openStatusModal = (item, nextStatus) => {
    setStatusItem(item);
    setNewStatus(nextStatus);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/admin/ujian-siswa/${statusItem.id}/status`, { status: newStatus });
      if (res.data.success) {
        showToast(res.data.message || 'Status ujian siswa berhasil diperbarui', 'success');
        setShowStatusModal(false);
        setStatusItem(null);
        await loadData();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal mengubah status ujian siswa', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusSelect = (item, val) => {
    if (val === item.status) return;
    openStatusModal(item, val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'selesai':
        return <span className="status-badge status-aktif" style={{ background: '#FDE8E8', color: '#9B1C1C' }}>Selesai</span>;
      case 'berlangsung':
        return <span className="status-badge" style={{ background: '#DEF7EC', color: '#03543F' }}>Berlangsung</span>;
      case 'waiting':
        return <span className="status-badge" style={{ background: '#FDF6B2', color: '#723B10' }}>Menunggu</span>;
      default:
        return <span className="status-badge status-nonaktif">{status}</span>;
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    if (currentPage === 9999) return items;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  useEffect(() => {
    if (currentPage !== 9999 && currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [items, totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedJadwal, selectedMapel, selectedKelas]);

  return (
    <div className="admin-siswa-page">
      <div className="user-header">
        <div>
          <h1 className="user-title">
            <span className="title-text">Management Ujian Siswa</span>
            <span className="title-badge">Admin</span>
          </h1>
          <p className="user-subtitle">Pemantauan real-time status pengerjaan, sisa waktu, dan hasil ujian siswa.</p>
        </div>
        <div className="user-meta">
          <div className="meta-card">
            <div className="meta-label">Total Ujian</div>
            <div className="meta-value">{totalAllCount}</div>
          </div>
        </div>
      </div>



      <div className="user-card">
        <div className="user-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 className="user-card-title">Daftar Progres Ujian</h2>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Cari nama, NIS, kelas, atau ujian..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
                style={{ minWidth: '320px' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ 
              fontSize: '0.85rem', 
              color: '#475569', 
              fontWeight: '500',
              background: '#f1f5f9',
              padding: '0 12px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              boxSizing: 'border-box'
            }}>
              Data: <strong style={{ color: '#0f172a' }}>{items.length}</strong>
            </span>
            <button 
              onClick={handleExportExcel} 
              className="btn-add-user" 
              style={{ 
                background: '#10B981', 
                borderColor: '#10B981',
                color: '#ffffff',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                margin: 0
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.borderColor = '#059669'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.borderColor = '#10B981'; }}
            >
              <FiDownload /> Export Excel
            </button>
          </div>
        </div>

        {/* Row for filters */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr auto', 
          gap: '1rem', 
          padding: '0 1.25rem 1.25rem 1.25rem', 
          borderBottom: '1px solid #f1f5f9',
          marginBottom: '1rem',
          alignItems: 'end'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }} ref={jadwalDropRef}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Jadwal Ujian</label>
            <div style={{ position: 'relative', width: '100%' }}>
              {/* Display Box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#334155',
                  gap: '8px',
                  minHeight: '38px',
                  boxSizing: 'border-box'
                }}
                onClick={() => { setJadwalDropOpen(o => !o); setJadwalSearch(''); }}
              >
                <FiSearch size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                {jadwalDropOpen ? (
                  <input
                    autoFocus
                    type="text"
                    value={jadwalSearch}
                    onChange={(e) => { e.stopPropagation(); setJadwalSearch(e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Cari Jadwal..."
                    style={{
                      border: 'none',
                      outline: 'none',
                      flex: 1,
                      fontSize: '0.875rem',
                      color: '#334155',
                      background: 'transparent',
                      padding: 0
                    }}
                  />
                ) : (
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedJadwal === 'all' ? 'Semua Ujian' : (selectedJadwalDetails?.nama || 'Pilih Jadwal Ujian...')}
                  </span>
                )}
                {jadwalDropOpen && jadwalSearch ? (
                  <FiX size={14} style={{ color: '#94a3b8', cursor: 'pointer', flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); setJadwalSearch(''); }} />
                ) : (
                  <FiChevronDown size={14} style={{ color: '#94a3b8', flexShrink: 0, transform: jadwalDropOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                )}
              </div>

              {/* Dropdown Options List */}
              {jadwalDropOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  zIndex: 99,
                  maxHeight: '260px',
                  overflowY: 'auto',
                  marginTop: '4px'
                }}>
                  {/* Option "Semua Ujian" */}
                  <div
                    onClick={() => { setSelectedJadwal('all'); setJadwalDropOpen(false); setJadwalSearch(''); }}
                    style={{
                      padding: '6px 12px',
                      cursor: 'pointer',
                      background: selectedJadwal === 'all' ? '#f1f5f9' : 'transparent',
                      fontWeight: selectedJadwal === 'all' ? '600' : 'normal',
                      fontSize: '0.85rem',
                      color: '#334155',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => { if (selectedJadwal !== 'all') e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { if (selectedJadwal !== 'all') e.currentTarget.style.background = 'transparent'; }}
                  >
                    Semua Ujian
                  </div>

                  {filteredJadwals.length === 0 ? (
                    <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
                      Tidak ada jadwal yang cocok
                    </div>
                  ) : (
                    filteredJadwals.map((j) => {
                      const isSelected = String(j.id) === String(selectedJadwal);
                      return (
                        <div
                          key={j.id}
                          onClick={() => { setSelectedJadwal(j.id); setJadwalDropOpen(false); setJadwalSearch(''); }}
                          style={{
                            padding: '6px 12px',
                            cursor: 'pointer',
                            background: isSelected ? '#f1f5f9' : 'transparent',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div style={{ fontWeight: isSelected ? '600' : 'normal', fontSize: '0.85rem', color: '#334155' }}>
                            {j.nama}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }} ref={mapelDropRef}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Mata Pelajaran</label>
            <div style={{ position: 'relative', width: '100%' }}>
              {/* Display Box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#334155',
                  gap: '8px',
                  minHeight: '38px',
                  boxSizing: 'border-box'
                }}
                onClick={() => { setMapelDropOpen(o => !o); setMapelSearch(''); }}
              >
                <FiSearch size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                {mapelDropOpen ? (
                  <input
                    autoFocus
                    type="text"
                    value={mapelSearch}
                    onChange={(e) => { e.stopPropagation(); setMapelSearch(e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Cari Mapel..."
                    style={{
                      border: 'none',
                      outline: 'none',
                      flex: 1,
                      fontSize: '0.875rem',
                      color: '#334155',
                      background: 'transparent',
                      padding: 0
                    }}
                  />
                ) : (
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedMapel === 'all' ? 'Semua Mata Pelajaran' : (selectedMapelDetails?.namaMapel || 'Pilih Mata Pelajaran...')}
                  </span>
                )}
                {mapelDropOpen && mapelSearch ? (
                  <FiX size={14} style={{ color: '#94a3b8', cursor: 'pointer', flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); setMapelSearch(''); }} />
                ) : (
                  <FiChevronDown size={14} style={{ color: '#94a3b8', flexShrink: 0, transform: mapelDropOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                )}
              </div>

              {/* Dropdown Options List */}
              {mapelDropOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  zIndex: 99,
                  maxHeight: '260px',
                  overflowY: 'auto',
                  marginTop: '4px'
                }}>
                  {/* Option "Semua Mata Pelajaran" */}
                  <div
                    onClick={() => { setSelectedMapel('all'); setMapelDropOpen(false); setMapelSearch(''); }}
                    style={{
                      padding: '6px 12px',
                      cursor: 'pointer',
                      background: selectedMapel === 'all' ? '#f1f5f9' : 'transparent',
                      fontWeight: selectedMapel === 'all' ? '600' : 'normal',
                      fontSize: '0.85rem',
                      color: '#334155',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => { if (selectedMapel !== 'all') e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { if (selectedMapel !== 'all') e.currentTarget.style.background = 'transparent'; }}
                  >
                    Semua Mata Pelajaran
                  </div>

                  {filteredMapelsSearch.length === 0 ? (
                    <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
                      Tidak ada mapel yang cocok
                    </div>
                  ) : (
                    filteredMapelsSearch.map((m) => {
                      const isSelected = String(m.id) === String(selectedMapel);
                      return (
                        <div
                          key={m.id}
                          onClick={() => { setSelectedMapel(m.id); setMapelDropOpen(false); setMapelSearch(''); }}
                          style={{
                            padding: '6px 12px',
                            cursor: 'pointer',
                            background: isSelected ? '#f1f5f9' : 'transparent',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div style={{ fontWeight: isSelected ? '600' : 'normal', fontSize: '0.85rem', color: '#334155' }}>
                            {m.namaMapel}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }} ref={kelasDropRef}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Kelas</label>
            <div style={{ position: 'relative', width: '100%' }}>
              {/* Display Box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#334155',
                  gap: '8px',
                  minHeight: '38px',
                  boxSizing: 'border-box'
                }}
                onClick={() => { setKelasDropOpen(o => !o); setKelasSearch(''); }}
              >
                <FiSearch size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                {kelasDropOpen ? (
                  <input
                    autoFocus
                    type="text"
                    value={kelasSearch}
                    onChange={(e) => { e.stopPropagation(); setKelasSearch(e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Cari Kelas..."
                    style={{
                      border: 'none',
                      outline: 'none',
                      flex: 1,
                      fontSize: '0.875rem',
                      color: '#334155',
                      background: 'transparent',
                      padding: 0
                    }}
                  />
                ) : (
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedKelas === 'all' ? 'Semua Kelas' : (getNamaKelasDisplay(selectedKelasDetails) || 'Pilih Kelas...')}
                  </span>
                )}
                {kelasDropOpen && kelasSearch ? (
                  <FiX size={14} style={{ color: '#94a3b8', cursor: 'pointer', flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); setKelasSearch(''); }} />
                ) : (
                  <FiChevronDown size={14} style={{ color: '#94a3b8', flexShrink: 0, transform: kelasDropOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                )}
              </div>

              {/* Dropdown Options List */}
              {kelasDropOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  zIndex: 99,
                  maxHeight: '260px',
                  overflowY: 'auto',
                  marginTop: '4px'
                }}>
                  {/* Option "Semua Kelas" */}
                  <div
                    onClick={() => { setSelectedKelas('all'); setKelasDropOpen(false); setKelasSearch(''); }}
                    style={{
                      padding: '6px 12px',
                      cursor: 'pointer',
                      background: selectedKelas === 'all' ? '#f1f5f9' : 'transparent',
                      fontWeight: selectedKelas === 'all' ? '600' : 'normal',
                      fontSize: '0.75rem',
                      color: '#334155',
                      transition: 'background 0.15s',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    onMouseEnter={(e) => { if (selectedKelas !== 'all') e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { if (selectedKelas !== 'all') e.currentTarget.style.background = 'transparent'; }}
                  >
                    Semua Kelas
                  </div>

                  {filteredKelasSearch.length === 0 ? (
                    <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center' }}>
                      Tidak ada kelas yang cocok
                    </div>
                  ) : (
                    filteredKelasSearch.map((k) => {
                      const isSelected = String(k.id) === String(selectedKelas);
                      return (
                        <div
                          key={k.id}
                          onClick={() => { setSelectedKelas(k.id); setKelasDropOpen(false); setKelasSearch(''); }}
                          style={{
                            padding: '6px 12px',
                            cursor: 'pointer',
                            background: isSelected ? '#f1f5f9' : 'transparent',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div style={{ 
                            fontWeight: isSelected ? '600' : 'normal', 
                            fontSize: '0.75rem', 
                            color: '#334155',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {getNamaKelasDisplay(k)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

           <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px',
              position: 'relative'
            }}
            onMouseEnter={() => {
              if (isBelumMengerjakanDisabled) {
                setShowTooltip(true);
              }
            }}
            onMouseLeave={() => {
              setShowTooltip(false);
            }}
          >
            <button
              type="button"
              disabled={isBelumMengerjakanDisabled}
              onClick={handleOpenBelumMengerjakan}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: isBelumMengerjakanDisabled ? 'not-allowed' : 'pointer',
                background: isBelumMengerjakanDisabled ? '#cbd5e1' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                border: '1px solid',
                borderColor: isBelumMengerjakanDisabled ? '#cbd5e1' : '#1d4ed8',
                color: isBelumMengerjakanDisabled ? '#94a3b8' : '#ffffff',
                boxShadow: isBelumMengerjakanDisabled ? 'none' : '0 2px 4px rgba(29, 78, 216, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '38px',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                pointerEvents: isBelumMengerjakanDisabled ? 'none' : 'auto'
              }}
            >
              <FiUser /> Siswa Belum Mengerjakan
            </button>

            {showTooltip && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                right: '0',
                marginBottom: '8px',
                background: '#1e293b',
                color: '#ffffff',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                zIndex: 10,
                pointerEvents: 'none',
                opacity: 1,
                transition: 'opacity 0.15s ease'
              }}>
                Pilih Ujian, Mapel, dan Kelas Untuk di Cek
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '24px',
                  width: '8px',
                  height: '8px',
                  background: '#1e293b',
                  transform: 'rotate(45deg) translateY(-4px)',
                  pointerEvents: 'none'
                }} />
              </div>
            )}
          </div>
        </div>

        {loading && items.length === 0 ? (
          <div className="user-empty">Memuat data...</div>
        ) : items.length === 0 ? (
          <div className="user-empty">Tidak ada data ujian siswa ditemukan</div>
        ) : (
          <div className="siswa-table-wrap">
            <table className="siswa-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '200px' }}>Nama Ujian</th>
                  <th style={{ minWidth: '150px' }}>Mapel</th>
                  <th style={{ minWidth: '180px' }}>Siswa</th>
                  <th>Kelas</th>
                  <th className="text-center">Status</th>
                  <th>Nilai</th>
                  <th className="text-center">Benar</th>
                  <th className="text-center">Salah</th>
                  <th className="text-center">Kosong</th>
                  <th className="text-center">Ragu-Ragu</th>
                  <th>Mulai</th>
                  <th>Selesai</th>
                  <th className="text-center" style={{ width: '80px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{item.jadwalUjian?.nama || 'Ujian Terhapus'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500', color: '#475569' }}>
                        {item.jadwalUjian?.mataPelajaran?.namaMapel || '-'}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '700', color: '#1E40AF' }}>
                          {item.siswa?.user?.namaLengkap || 'Siswa Terhapus'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                          NIS: {item.siswa?.nis || '-'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="kelas-badge" style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        {getNamaKelasDisplay(item.siswa?.kelas)}
                      </div>
                    </td>
                    <td className="text-center">
                      {item.status === 'berlangsung' ? (
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusSelect(item, e.target.value)}
                          disabled={saving}
                          className="status-select-premium"
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #DEF7EC',
                            background: '#DEF7EC',
                            color: '#03543F',
                            fontWeight: '700',
                            cursor: 'pointer',
                            outline: 'none',
                            fontSize: '0.75rem'
                          }}
                        >
                          <option value="berlangsung">Berlangsung</option>
                          <option value="selesai">Selesai</option>
                        </select>
                      ) : (
                        getStatusBadge(item.status)
                      )}
                    </td>
                    <td style={{ fontWeight: '800', fontSize: '1rem', color: Number(item.nilaiAkhir) >= 75 ? '#16A34A' : '#DC2626' }}>
                      {Number(item.nilaiAkhir).toFixed(1)}
                    </td>
                    <td className="text-center" style={{ fontWeight: '600', color: '#16A34A' }}>{item.benar}</td>
                    <td className="text-center" style={{ fontWeight: '600', color: '#DC2626' }}>{item.salah}</td>
                    <td className="text-center" style={{ color: '#64748b' }}>{item.kosong}</td>
                    <td className="text-center" style={{ fontWeight: '600', color: '#D97706' }}>{item.raguRagu}</td>
                    <td style={{ fontSize: '0.8rem' }}>{formatDate(item.mulaiPada)}</td>
                    <td style={{ fontSize: '0.8rem' }}>{formatDate(item.selesaiPada)}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button 
                          className="btn-action-admin danger" 
                          onClick={() => openDeleteModal(item)} 
                          disabled={saving || item.status === 'berlangsung'}
                          title={item.status === 'berlangsung' ? "Tidak bisa menghapus sesi yang sedang berlangsung" : "Hapus Hasil & Jawaban Ujian"}
                          style={{
                            cursor: item.status === 'berlangsung' ? 'not-allowed' : 'pointer',
                            opacity: item.status === 'berlangsung' ? 0.5 : 1
                          }}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items.length > 0 && (
          <div className="table-pagination">
            <span className="table-pagination-info">
              Menampilkan {currentPage === 9999 ? 1 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {currentPage === 9999 ? items.length : Math.min(currentPage * ITEMS_PER_PAGE, items.length)} dari {items.length} ujian siswa
            </span>
            <div className="table-pagination-controls">
              <button
                type="button"
                className="table-pagination-btn"
                disabled={currentPage === 9999 || currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Sebelumnya
              </button>
              <div className="table-pagination-pages">
                {currentPage === 9999 ? (
                  <button
                    type="button"
                    className="table-pagination-page active"
                    onClick={() => setCurrentPage(1)}
                  >
                    Tampilkan Per Halaman
                  </button>
                ) : (
                  getPaginationPages(totalPages, currentPage).map(item =>
                    item.type === 'ellipsis' ? (
                      <span key={`ellipsis-${item.key}`} className="table-pagination-ellipsis">…</span>
                    ) : (
                      <button
                        key={item.value}
                        type="button"
                        className={`table-pagination-page ${item.value === currentPage ? 'active' : ''}`}
                        onClick={() => setCurrentPage(item.value)}
                      >
                        {item.value}
                      </button>
                    )
                  )
                )}
              </div>
              <button
                type="button"
                className="table-pagination-btn"
                disabled={currentPage === 9999 || currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Berikutnya
              </button>
              {currentPage !== 9999 && (
                <button
                  type="button"
                  className="table-pagination-btn show-all"
                  onClick={() => setCurrentPage(9999)}
                >
                  Tampilkan Semua
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm">
              <div className="modal-confirm-header">
                <div className="modal-confirm-icon-box danger">
                  <FiAlertCircle className="modal-icon" />
                </div>
                <h3 className="modal-confirm-title">Hapus Ujian Siswa?</h3>
              </div>
              <div className="modal-confirm-body">
                <div className="modal-confirm-text">
                  Yakin ingin menghapus data progres ujian dari siswa <span className="modal-confirm-item">{selectedItem?.siswa?.user?.namaLengkap}</span> pada ujian <span className="modal-confirm-item">{selectedItem?.jadwalUjian?.nama}</span>?
                </div>
                <div className="modal-confirm-warning" style={{ marginTop: '1rem', padding: '10px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#991B1B', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <FiInfo style={{ flexShrink: 0 }} /> 
                  <span><strong>PERINGATAN:</strong> Tindakan ini akan menghapus permanen seluruh riwayat jawaban beserta lembar koreksi siswa untuk ujian ini!</span>
                </div>
              </div>
              <div className="modal-confirm-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={saving}>
                  <FiX /> Batal
                </button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                  {saving ? 'Memproses...' : <><FiTrash2 /> Ya, Hapus Permanen</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Update Status Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm">
              <div className="modal-confirm-header">
                <div className="modal-confirm-icon-box primary" style={{ background: '#E1EFFE', color: '#1C64F2' }}>
                  <FiInfo className="modal-icon" />
                </div>
                <h3 className="modal-confirm-title">Ubah Status Ujian?</h3>
              </div>
              <div className="modal-confirm-body">
                <div className="modal-confirm-text">
                  Yakin ingin mengubah status progres ujian siswa <span className="modal-confirm-item">{statusItem?.siswa?.user?.namaLengkap}</span> menjadi <strong>{newStatus === 'selesai' ? 'SELESAI' : 'BERLANGSUNG'}</strong>?
                </div>
                {newStatus === 'selesai' && (
                  <div className="modal-confirm-warning" style={{ marginTop: '1rem', padding: '10px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#991B1B', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <FiAlertCircle style={{ flexShrink: 0 }} /> 
                    <span><strong>PENTING:</strong> Mengubah status menjadi SELESAI akan menutup pengerjaan siswa dan secara otomatis mengkalkulasi nilai akhir mereka berdasarkan jawaban yang tersimpan saat ini!</span>
                  </div>
                )}
                {newStatus === 'berlangsung' && (
                  <div className="modal-confirm-warning" style={{ marginTop: '1rem', padding: '10px', background: '#FDF6B2', border: '1px solid #FDE8A8', borderRadius: '8px', color: '#723B10', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <FiClock style={{ flexShrink: 0 }} /> 
                    <span><strong>INFO:</strong> Mengaktifkan kembali status menjadi BERLANGSUNG akan mengizinkan siswa masuk kembali ke sesi pengerjaan ujian.</span>
                  </div>
                )}
              </div>
              <div className="modal-confirm-footer">
                <button className="btn btn-secondary" onClick={() => setShowStatusModal(false)} disabled={saving}>
                  <FiX /> Batal
                </button>
                <button className="btn btn-primary" style={{ background: '#1E40AF', color: 'white' }} onClick={handleUpdateStatus} disabled={saving}>
                  {saving ? 'Memproses...' : <><FiCheckCircle /> Konfirmasi</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up Modal Siswa Belum Mengerjakan */}
      {showBelumMengerjakanModal && (
        <div className="modal-overlay" onClick={() => setShowBelumMengerjakanModal(false)}>
          <div className="modal-container" style={{ maxWidth: '850px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', width: '100%', background: '#ffffff', borderRadius: '16px', textAlign: 'left' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                width: '100%', 
                marginBottom: '20px', 
                borderBottom: '1px solid #f1f5f9', 
                paddingBottom: '12px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#EFF6FF', color: '#1D4ED8', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiUser size={20} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>Siswa Belum Mengerjakan</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowBelumMengerjakanModal(false)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="modal-confirm-body" style={{ maxHeight: '400px', overflowY: 'auto', width: '100%', textAlign: 'left' }}>
                {loadingBelumMengerjakan ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Memuat data...</div>
                ) : belumMengerjakanList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#16A34A', fontWeight: '600' }}>
                    Semua siswa yang terdaftar telah mengikuti sesi ujian ini!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ 
                      background: '#eff6ff', 
                      border: '1px solid #bfdbfe', 
                      borderRadius: '10px', 
                      padding: '16px 20px', 
                      fontSize: '0.9rem',
                      color: '#1e293b',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: '0 1px 3px rgba(37, 99, 235, 0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', color: '#1e40af', width: '130px', display: 'inline-block' }}>Ujian / Periode:</span>
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{filterJadwalList.find(o => o.id === selectedJadwal)?.nama || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', color: '#1e40af', width: '130px', display: 'inline-block' }}>Mata Pelajaran:</span>
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{filterMapelList.find(o => String(o.id) === String(selectedMapel))?.namaMapel || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', color: '#1e40af', width: '130px', display: 'inline-block' }}>Kelas:</span>
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{getNamaKelasDisplay(filterKelasList.find(o => String(o.id) === String(selectedKelas)))}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '4px', marginTop: '4px' }}>
                      Ditemukan <strong>{belumMengerjakanList.length}</strong> siswa yang belum memiliki catatan pengerjaan:
                    </p>
                    <div>
                      <table className="siswa-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '8px 12px', fontSize: '0.8rem', textAlign: 'left', width: '35%' }}>Nama</th>
                            <th style={{ padding: '8px 12px', fontSize: '0.8rem', textAlign: 'left', width: '45%' }}>Email</th>
                            <th style={{ padding: '8px 12px', fontSize: '0.8rem', textAlign: 'left', width: '20%' }}>NISN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {belumMengerjakanList.map((item) => (
                            <tr key={`${item.siswa.id}-${item.jadwalUjian.id}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 12px', fontSize: '0.85rem', fontWeight: '700', color: '#1E40AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.siswa.user.namaLengkap}>
                                {item.siswa.user.namaLengkap}
                              </td>
                              <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.siswa.user.email || '-'}>
                                {item.siswa.user.email || '-'}
                              </td>
                              <td style={{ padding: '8px 12px', fontSize: '0.85rem', fontFamily: 'monospace', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.siswa.nis || '-'}>
                                {item.siswa.nis || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="modal-confirm-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowBelumMengerjakanModal(false)}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UjianSiswa;
