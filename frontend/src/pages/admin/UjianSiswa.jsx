import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiSearch, FiTrash2, FiAlertCircle, FiCheckCircle, FiX, 
  FiClock, FiBookOpen, FiUser, FiInfo, FiChevronLeft, FiChevronRight,
  FiDownload
} from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './Siswa.css';
import './User.css'; // Re-use common premium layouts

const UjianSiswa = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const handleExportExcel = async () => {
    try {
      showToast('Sedang menyiapkan file Excel...', 'info');
      const response = await api.get(`/admin/ujian-siswa/export?search=${encodeURIComponent(search)}`, {
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

  useEffect(() => {
    loadData();
  }, [search]); // Re-fetch on search update

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/ujian-siswa?search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setItems(res.data.data || []);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal memuat data ujian siswa', 'error');
    } finally {
      setLoading(false);
    }
  };



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
  }, [search]);

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
            <div className="meta-value">{items.length}</div>
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
          <button 
            onClick={handleExportExcel} 
            className="btn-add-user" 
            style={{ 
              background: '#10B981', 
              borderColor: '#10B981',
              color: '#ffffff',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.borderColor = '#059669'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.borderColor = '#10B981'; }}
          >
            <FiDownload /> Export Excel
          </button>
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
                  <th style={{ minWidth: '180px' }}>Siswa</th>
                  <th>Kelas</th>
                  <th style={{ minWidth: '200px' }}>Nama Ujian</th>
                  <th>Nilai</th>
                  <th className="text-center">Benar</th>
                  <th className="text-center">Salah</th>
                  <th className="text-center">Kosong</th>
                  <th className="text-center">Ragu-Ragu</th>
                  <th className="text-center">Status</th>
                  <th>Mulai</th>
                  <th>Selesai</th>
                  <th className="text-center" style={{ width: '80px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id}>
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
                      <div className="kelas-badge" style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                        {item.siswa?.kelas?.tingkat} {item.siswa?.kelas?.jurusan?.namaProdi || ''} {item.siswa?.kelas?.inisial || ''}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{item.jadwalUjian?.nama || 'Ujian Terhapus'}</div>
                    </td>
                    <td style={{ fontWeight: '800', fontSize: '1rem', color: Number(item.nilaiAkhir) >= 75 ? '#16A34A' : '#DC2626' }}>
                      {Number(item.nilaiAkhir).toFixed(1)}
                    </td>
                    <td className="text-center" style={{ fontWeight: '600', color: '#16A34A' }}>{item.benar}</td>
                    <td className="text-center" style={{ fontWeight: '600', color: '#DC2626' }}>{item.salah}</td>
                    <td className="text-center" style={{ color: '#64748b' }}>{item.kosong}</td>
                    <td className="text-center" style={{ fontWeight: '600', color: '#D97706' }}>{item.raguRagu}</td>
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
    </div>
  );
};

export default UjianSiswa;
