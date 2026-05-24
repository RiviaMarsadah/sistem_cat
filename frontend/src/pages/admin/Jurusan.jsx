import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiX, FiCheckCircle, FiAlertCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import '../guru/PaketUjian.css';
import './Jurusan.css';

const AdminJurusan = () => {
  const { showToast } = useToast();
  const ITEMS_PER_PAGE = 20;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const res = await api.get('/admin/jurusan');
      setItems(res.data.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal memuat data jurusan', 'error');
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
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setKodeProdi('');
    setNamaProdi('');
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
      try {
        await api.post('/admin/jurusan', { 
          kodeProdi: confirmData.kodeProdi,
          namaProdi: confirmData.namaProdi 
        });
        showToast('Jurusan berhasil ditambahkan', 'success');
        handleCloseAddModal();
        await load();
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmData(null);
      } catch (err) {
        showToast(err?.response?.data?.message || 'Gagal menambah jurusan', 'error');
        setShowConfirmModal(false);
      } finally {
        setSaving(false);
      }
    } else if (confirmAction === 'delete') {
      setSaving(true);
      try {
        await api.delete(`/admin/jurusan/${confirmData.id}`);
        showToast('Jurusan berhasil dihapus', 'success');
        await load();
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmData(null);
      } catch (err) {
        showToast(err?.response?.data?.message || 'Gagal menghapus jurusan', 'error');
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
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingKodeProdi('');
    setEditingNamaProdi('');
  };

  const saveEdit = async () => {
    if (!editingKodeProdi.trim() || !editingNamaProdi.trim()) return;
    setSaving(true);
    try {
      await api.put(`/admin/jurusan/${editingId}`, { 
        kodeProdi: editingKodeProdi.trim(),
        namaProdi: editingNamaProdi.trim() 
      });
      showToast('Jurusan berhasil diperbarui', 'success');
      cancelEdit();
      await load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal mengubah jurusan', 'error');
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
          <p className="jurusan-subtitle">Manajemen data program studi (jurusan) dan pemetaan kompetensi keahlian.</p>
        </div>
        <div className="jurusan-meta">
          <div className="meta-card">
            <div className="meta-label">Total</div>
            <div className="meta-value">{count}</div>
          </div>
        </div>
      </div>



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
            <FiPlus />
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
          <div className="table-pagination">
            <span className="table-pagination-info">
              Menampilkan {currentPage === 9999 ? 1 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {currentPage === 9999 ? filteredItems.length : Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} dari {filteredItems.length} jurusan
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


