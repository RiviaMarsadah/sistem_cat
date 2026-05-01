import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiX, FiCheckCircle, FiAlertCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../../services/api';
import '../guru/PaketUjian.css';
import './MataPelajaran.css';


export default function MataPelajaran() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

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

  const totalPages = itemsPerPage === 0 ? 1 : Math.ceil(filteredItems.length / itemsPerPage);
  
  const paginatedItems = useMemo(() => {
    if (itemsPerPage === 0) return filteredItems;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const count = useMemo(() => items.length, [items.length]);


  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/mata-pelajaran');
      setItems(res.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal memuat mata pelajaran');
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
    setError('');
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
    setError('');
    try {
      await api.post('/admin/mata-pelajaran', {
        namaMapel: namaMapel.trim(),
        kodeMapel: kodeMapel.trim() || null,
      });
      closeAddModal();
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menambah mata pelajaran');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditNamaMapel(item.namaMapel || '');
    setEditKodeMapel(item.kodeMapel || '');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNamaMapel('');
    setEditKodeMapel('');
  };

  const saveEdit = async () => {
    if (!editNamaMapel.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/mata-pelajaran/${editingId}`, {
        namaMapel: editNamaMapel.trim(),
        kodeMapel: editKodeMapel.trim() || null,
      });
      cancelEdit();
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal mengubah mata pelajaran');
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
    setError('');
    try {
      await api.delete(`/admin/mata-pelajaran/${confirmData.id}`);
      await load();
      setShowConfirmModal(false);
      setConfirmData(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menghapus mata pelajaran');
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
          <p className="mapel-subtitle">Kelola mata pelajaran</p>
        </div>
        <div className="mapel-meta">
          <div className="meta-card">
            <div className="meta-label">Total</div>
            <div className="meta-value">{count}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mapel-alert" role="alert">
          {error}
        </div>
      )}

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
            <FiPlus className="btn-icon" />
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
          <div className="pagination-container">
            <div className="pagination-info">
              Menampilkan <strong>{itemsPerPage === 0 ? filteredItems.length : Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)}</strong> - <strong>{itemsPerPage === 0 ? filteredItems.length : Math.min(filteredItems.length, currentPage * itemsPerPage)}</strong> dari <strong>{filteredItems.length}</strong> data
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
                {error && (
                  <div className="mapel-alert" style={{ marginTop: 0, marginBottom: '1.5rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiAlertCircle />
                    {error}
                  </div>
                )}
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
