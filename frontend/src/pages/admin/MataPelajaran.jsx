import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiX, FiCheckCircle, FiAlertCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import '../guru/PaketUjian.css';
import './MataPelajaran.css';


export default function MataPelajaran() {
  const { showToast } = useToast();
  const ITEMS_PER_PAGE = 20;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
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

  const [showAddModal, setShowAddModal] = useState(false);
  const [namaMapel, setNamaMapel] = useState('');
  const [kodeMapel, setKodeMapel] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editNamaMapel, setEditNamaMapel] = useState('');
  const [editKodeMapel, setEditKodeMapel] = useState('');

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  const filteredItems = useMemo(() => {
    return items.filter(m => 
      m.namaMapel.toLowerCase().includes(search.toLowerCase()) || 
      (m.kodeMapel && m.kodeMapel.toLowerCase().includes(search.toLowerCase()))
    );
  }, [items, search]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  
  const paginatedItems = useMemo(() => {
    if (currentPage === 9999) return filteredItems;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  useEffect(() => {
    if (currentPage !== 9999 && currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredItems, totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const count = useMemo(() => items.length, [items.length]);


  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/mata-pelajaran');
      setItems(res.data?.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal memuat mata pelajaran', 'error');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    load();
  }, []);

  const resetAddForm = () => {
    setNamaMapel('');
    setKodeMapel('');
  };

  const openAddModal = () => {
    resetAddForm();
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetAddForm();
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!namaMapel.trim()) return;
    setSaving(true);
    try {
      await api.post('/admin/mata-pelajaran', {
        namaMapel: namaMapel.trim(),
        kodeMapel: kodeMapel.trim() || null,
      });
      showToast('Mata pelajaran berhasil ditambahkan', 'success');
      closeAddModal();
      await load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal menambah mata pelajaran', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditNamaMapel(item.namaMapel || '');
    setEditKodeMapel(item.kodeMapel || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNamaMapel('');
    setEditKodeMapel('');
  };

  const saveEdit = async () => {
    if (!editNamaMapel.trim()) return;
    setSaving(true);
    try {
      await api.put(`/admin/mata-pelajaran/${editingId}`, {
        namaMapel: editNamaMapel.trim(),
        kodeMapel: editKodeMapel.trim() || null,
      });
      showToast('Mata pelajaran berhasil diperbarui', 'success');
      cancelEdit();
      await load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal mengubah mata pelajaran', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (item) => {
    setConfirmData({ id: item.id, namaMapel: item.namaMapel });
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmData) return;
    setSaving(true);
    try {
      await api.delete(`/admin/mata-pelajaran/${confirmData.id}`);
      showToast('Mata pelajaran berhasil dihapus', 'success');
      await load();
      setShowConfirmModal(false);
      setConfirmData(null);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal menghapus mata pelajaran', 'error');
    } finally {
      setSaving(false);
    }
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmData(null);
  };

  return (
    <div className="mapel-page">
      <div className="mapel-header">
        <div>
          <h1 className="mapel-title">
            <span className="title-text">Mata Pelajaran</span>
            <span className="title-badge">Admin</span>
          </h1>
          <p className="mapel-subtitle">Manajemen daftar mata pelajaran kurikulum dan kategori bidang studi.</p>
        </div>
        <div className="mapel-meta">
          <div className="meta-card">
            <div className="meta-label">Total</div>
            <div className="meta-value">{count}</div>
          </div>
        </div>
      </div>



      <div className="mapel-card">
        <div className="mapel-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 className="mapel-card-title">Daftar Mata Pelajaran</h2>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Cari mapel..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <button type="button" className="btn-add-mapel" onClick={openAddModal} disabled={saving}>
            <FiPlus />
            <span>Tambah Mata Pelajaran</span>
          </button>
        </div>

        {loading ? (
          <div className="mapel-empty">Memuat...</div>
        ) : items.length === 0 ? (
          <div className="mapel-empty">Belum ada mata pelajaran. Klik &quot;Tambah Mata Pelajaran&quot;.</div>
        ) : (
          <div className="mapel-table-wrap">
            <style>{`
               .clickable-row:hover { background-color: #f8fafc !important; }
            `}</style>
            <table className="mapel-table">
              <thead>
                <tr>
                  <th>Nama Mapel</th>
                  <th>Kode Mapel</th>
                  <th style={{ width: '120px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className="clickable-row">
                      <td style={{ verticalAlign: 'middle' }}>
                        {isEditing ? (
                          <input
                            className="input small"
                            value={editNamaMapel}
                            onChange={(e) => setEditNamaMapel(e.target.value)}
                            placeholder="Nama mata pelajaran"
                            disabled={saving}
                            maxLength={100}
                            style={{ margin: 0, width: '100%' }}
                          />
                        ) : (
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.namaMapel}</div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        {isEditing ? (
                          <input
                            className="input small"
                            value={editKodeMapel}
                            onChange={(e) => setEditKodeMapel(e.target.value)}
                            placeholder="Kode"
                            disabled={saving}
                            maxLength={20}
                            style={{ margin: 0, width: '100%' }}
                          />
                        ) : (
                          <div style={{ fontFamily: 'monospace', fontWeight: '600' }}>{item.kodeMapel || '-'}</div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {isEditing ? (
                            <>
                              <button className="btn-action primary" type="button" onClick={saveEdit} disabled={saving || !editNamaMapel.trim()} title="Simpan" style={{ background: '#10b981', color: 'white' }}>
                                <FiSave />
                              </button>
                              <button className="btn-action" type="button" onClick={cancelEdit} disabled={saving} title="Batal" style={{ background: '#64748b', color: 'white' }}>
                                <FiX />
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="btn-action primary" type="button" onClick={() => startEdit(item)} disabled={saving} title="Edit" style={{ background: '#3b82f6', color: 'white' }}>
                                <FiEdit2 />
                              </button>
                              <button className="btn-action btn-delete" type="button" onClick={() => openDeleteConfirm(item)} disabled={saving} title="Hapus">
                                <FiTrash2 />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredItems.length > 0 && (
          <div className="table-pagination">
            <span className="table-pagination-info">
              Menampilkan {currentPage === 9999 ? 1 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {currentPage === 9999 ? filteredItems.length : Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} dari {filteredItems.length} mata pelajaran
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

      {/* Modal Tambah */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Tambah Mata Pelajaran</h3>
              <button type="button" className="modal-close" onClick={closeAddModal} disabled={saving}>
                <FiX />
              </button>
            </div>
            <form className="mapel-form" onSubmit={handleSubmitAdd}>
              <div className="modal-body">

                <div className="form-group">
                  <label className="label">
                    <span className="label-text">Nama Mata Pelajaran</span>
                    <span className="label-required">*</span>
                  </label>
                  <input
                    className="input"
                    value={namaMapel}
                    onChange={(e) => setNamaMapel(e.target.value)}
                    placeholder="Contoh: Matematika, Bahasa Indonesia"
                    disabled={saving}
                    maxLength={100}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Kode (opsional)</label>
                  <input
                    className="input"
                    value={kodeMapel}
                    onChange={(e) => setKodeMapel(e.target.value)}
                    placeholder="Contoh: MAT, BIN"
                    disabled={saving}
                    maxLength={20}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-btn modal-btn-cancel" onClick={closeAddModal} disabled={saving}>
                  <FiX className="modal-btn-icon" />
                  <span>Batal</span>
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-confirm modal-btn-primary"
                  disabled={saving || !namaMapel.trim()}
                >
                  {saving ? (
                    <>
                      <span className="spinner-small" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="modal-btn-icon" />
                      <span>Tambah Mata Pelajaran</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {showConfirmModal && confirmData && (
        <div className="modal-overlay">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm">
              <div className="modal-confirm-header">
                <div className="modal-confirm-icon-box danger">
                  <FiAlertCircle className="modal-icon" />
                </div>
                <h3 className="modal-confirm-title">Hapus Mata Pelajaran?</h3>
              </div>
              <div className="modal-confirm-body">
                <div className="modal-confirm-text">
                  Yakin ingin menghapus mata pelajaran <span className="modal-confirm-item">{confirmData.namaMapel}</span>?
                </div>
                <div className="modal-confirm-warning">
                  <FiAlertCircle /> Tindakan ini tidak dapat dibatalkan.
                </div>
              </div>
              <div className="modal-confirm-footer">
                <button className="btn btn-secondary" onClick={closeConfirmModal} disabled={saving}>
                  <FiX /> Batal
                </button>
                <button className="btn btn-danger" onClick={handleConfirmDelete} disabled={saving}>
                  {saving ? 'Menghapus...' : <><FiTrash2 /> Ya, Hapus</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
