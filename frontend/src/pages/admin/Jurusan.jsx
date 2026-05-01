import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiX, FiCheckCircle, FiAlertCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../../services/api';
import '../guru/PaketUjian.css';
import './Jurusan.css';

const AdminJurusan = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [kodeProdi, setKodeProdi] = useState('');
  const [namaProdi, setNamaProdi] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Modal state untuk form tambah
  const [showAddModal, setShowAddModal] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingKodeProdi, setEditingKodeProdi] = useState('');
  const [editingNamaProdi, setEditingNamaProdi] = useState('');

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  const filteredItems = useMemo(() => {
    return items.filter(j => 
      j.namaProdi.toLowerCase().includes(search.toLowerCase()) || 
      j.kodeProdi.toLowerCase().includes(search.toLowerCase())
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
      const res = await api.get('/admin/jurusan');
      setItems(res.data.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal memuat data jurusan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenAddModal = () => {
    setKodeProdi('');
    setNamaProdi('');
    setError('');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setKodeProdi('');
    setNamaProdi('');
    setError('');
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!kodeProdi.trim() || !namaProdi.trim()) return;

    // Show confirmation modal
    setConfirmAction('create');
    setConfirmData({ 
      kodeProdi: kodeProdi.trim(),
      namaProdi: namaProdi.trim() 
    });
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (confirmAction === 'create') {
      setSaving(true);
      setError('');
      try {
        await api.post('/admin/jurusan', { 
          kodeProdi: confirmData.kodeProdi,
          namaProdi: confirmData.namaProdi 
        });
        handleCloseAddModal();
        await load();
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmData(null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Gagal menambah jurusan');
        setShowConfirmModal(false);
      } finally {
        setSaving(false);
      }
    } else if (confirmAction === 'delete') {
      setSaving(true);
      setError('');
      try {
        await api.delete(`/admin/jurusan/${confirmData.id}`);
        await load();
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmData(null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Gagal menghapus jurusan');
        setShowConfirmModal(false);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmData(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingKodeProdi(item.kodeProdi || '');
    setEditingNamaProdi(item.namaProdi || '');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingKodeProdi('');
    setEditingNamaProdi('');
  };

  const saveEdit = async () => {
    if (!editingKodeProdi.trim() || !editingNamaProdi.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/jurusan/${editingId}`, { 
        kodeProdi: editingKodeProdi.trim(),
        namaProdi: editingNamaProdi.trim() 
      });
      cancelEdit();
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal mengubah jurusan');
    } finally {
      setSaving(false);
    }
  };

  const remove = (item) => {
    setConfirmAction('delete');
    setConfirmData({ id: item.id, namaProdi: item.namaProdi });
    setShowConfirmModal(true);
  };

  return (
    <div className="admin-jurusan-page">
      <div className="jurusan-header">
        <div>
          <h1 className="jurusan-title">
            <span className="title-text">Jurusan</span>
            <span className="title-badge">Admin</span>
          </h1>
          <p className="jurusan-subtitle">Kelola data jurusan (hanya nama jurusan)</p>
        </div>
        <div className="jurusan-meta">
          <div className="meta-card">
            <div className="meta-label">Total</div>
            <div className="meta-value">{count}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="jurusan-alert" role="alert">
          {error}
        </div>
      )}

      <div className="jurusan-card">
        <div className="jurusan-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 className="jurusan-card-title">Daftar Jurusan</h2>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Cari prodi..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <button className="btn-add-jurusan" onClick={handleOpenAddModal} disabled={saving}>
            <FiPlus className="btn-icon" />
            <span>Tambah Jurusan</span>
          </button>
        </div>

        {loading ? (
          <div className="jurusan-empty">Loading...</div>
        ) : items.length === 0 ? (
          <div className="jurusan-empty">Belum ada jurusan</div>
        ) : (
          <div className="jurusan-table-wrap">
            <style>{`
               .clickable-row:hover { background-color: #f8fafc !important; }
            `}</style>
            <table className="jurusan-table">
              <thead>
                <tr>
                  <th style={{ width: '200px' }}>Kode Prodi</th>
                  <th>Nama Prodi</th>
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
                            placeholder="Kode Prodi"
                            value={editingKodeProdi}
                            onChange={(e) => setEditingKodeProdi(e.target.value.toUpperCase())}
                            disabled={saving}
                            maxLength={20}
                            required
                            style={{ margin: 0, width: '100%' }}
                          />
                        ) : (
                          <div style={{ fontWeight: '700', color: '#1e293b', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                            {item.kodeProdi}
                          </div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        {isEditing ? (
                          <input
                            className="input small"
                            placeholder="Nama Prodi"
                            value={editingNamaProdi}
                            onChange={(e) => setEditingNamaProdi(e.target.value)}
                            disabled={saving}
                            maxLength={100}
                            style={{ margin: 0, width: '100%' }}
                          />
                        ) : (
                          <div style={{ fontWeight: '600', color: '#334155' }}>
                            {item.namaProdi}
                          </div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {isEditing ? (
                            <>
                              <button className="btn-action primary" type="button" onClick={saveEdit} disabled={saving || !editingKodeProdi.trim() || !editingNamaProdi.trim()} title="Simpan" style={{ background: '#10b981', color: 'white' }}>
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
                              <button className="btn-action btn-delete" type="button" onClick={() => remove(item)} disabled={saving} title="Hapus">
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

      {/* Add Jurusan Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Tambah Jurusan Baru</h3>
              <button className="modal-close" onClick={handleCloseAddModal} disabled={saving}>
                <FiX />
              </button>
            </div>
            <form className="jurusan-form" onSubmit={onCreate}>
              <div className="modal-body">
                {error && (
                  <div className="jurusan-alert" style={{ marginTop: 0, marginBottom: '1rem' }}>
                    <FiAlertCircle style={{ marginRight: '8px' }} />
                    {error}
                  </div>
                )}
                <div className="form-group">
                  <div className="field-wrapper">
                    <label className="label" htmlFor="modal-kodeProdi">
                      <span className="label-text">Kode Prodi</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="modal-kodeProdi"
                        className="input"
                        placeholder="Contoh: TKJ, RPL, MM"
                        value={kodeProdi}
                        onChange={(e) => setKodeProdi(e.target.value.toUpperCase())}
                        disabled={saving}
                        maxLength={20}
                        required
                        autoComplete="off"
                      />
                      <div className="input-underline"></div>
                    </div>
                    <p className="field-hint">Singkatan/kode prodi (maksimal 20 karakter)</p>
                  </div>

                  <div className="field-wrapper">
                    <label className="label" htmlFor="modal-namaProdi">
                      <span className="label-text">Nama Prodi</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="modal-namaProdi"
                        className="input"
                        placeholder="Contoh: Teknik Komputer dan Jaringan"
                        value={namaProdi}
                        onChange={(e) => setNamaProdi(e.target.value)}
                        disabled={saving}
                        maxLength={100}
                        required
                        autoComplete="off"
                      />
                      <div className="input-underline"></div>
                    </div>
                    <p className="field-hint">Maksimal 100 karakter</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="modal-btn modal-btn-cancel"
                  type="button"
                  onClick={handleCloseAddModal}
                  disabled={saving}
                >
                  <FiX className="modal-btn-icon" />
                  <span>Batal</span>
                </button>
                <button
                  className="modal-btn modal-btn-confirm modal-btn-primary"
                  type="submit"
                  disabled={saving || !kodeProdi.trim() || !namaProdi.trim()}
                >
                  {saving ? (
                    <>
                      <span className="spinner-small"></span>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="modal-btn-icon" />
                      <span>Tambah Jurusan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm">
              <div className="modal-confirm-header">
                <div className={`modal-confirm-icon-box ${confirmAction === 'create' ? 'success' : 'danger'}`}>
                  {confirmAction === 'create' ? <FiCheckCircle className="modal-icon" /> : <FiAlertCircle className="modal-icon" />}
                </div>
                <h3 className="modal-confirm-title">
                  {confirmAction === 'create' ? 'Tambah Jurusan?' : 'Hapus Jurusan?'}
                </h3>
              </div>
              <div className="modal-confirm-body">
                <div className="modal-confirm-text">
                  {confirmAction === 'create' ? (
                    <>
                      Yakin ingin menambah prodi <span className="modal-confirm-item">{confirmData?.namaProdi}</span> dengan kode <span className="modal-confirm-item">{confirmData?.kodeProdi}</span>?
                    </>
                  ) : (
                    <>
                      Yakin ingin menghapus prodi <span className="modal-confirm-item">{confirmData?.namaProdi}</span>?
                    </>
                  )}
                </div>
                {confirmAction === 'delete' && (
                  <div className="modal-confirm-warning">
                    <FiAlertCircle /> Tindakan ini tidak dapat dibatalkan.
                  </div>
                )}
              </div>
              <div className="modal-confirm-footer">
                <button className="btn btn-secondary" onClick={handleCancelConfirm} disabled={saving}>
                  <FiX /> Batal
                </button>
                <button 
                  className={`btn ${confirmAction === 'create' ? 'primary' : 'btn-danger'}`} 
                  onClick={handleConfirm} 
                  disabled={saving}
                >
                  {saving ? (
                    'Memproses...'
                  ) : (
                    <>
                      {confirmAction === 'create' ? <FiCheckCircle /> : <FiTrash2 />} 
                      {confirmAction === 'create' ? 'Ya, Tambahkan' : 'Ya, Hapus'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJurusan;


