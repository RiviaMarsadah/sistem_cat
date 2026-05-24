import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiX, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import '../guru/PaketUjian.css';
import './User.css';

const AdminUser = () => {
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

  // Form state (untuk modal tambah)
  const [email, setEmail] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Modal state untuk form tambah
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editingEmail, setEditingEmail] = useState('');
  const [editingNamaLengkap, setEditingNamaLengkap] = useState('');
  const [editingStatus, setEditingStatus] = useState('aktif');

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  const filteredItems = useMemo(() => {
    return items.filter(u => 
      u.namaLengkap.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase())
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
      const res = await api.get('/admin/user');
      setItems(res.data.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal memuat data user', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null); // Ensure creation mode
    setEmail('');
    setNamaLengkap('');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setEmail('');
    setNamaLengkap('');
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!email.trim() || !namaLengkap.trim()) return;

    setSaving(true);
    try {
      await api.post('/admin/user', {
        email: email.trim().toLowerCase(),
        namaLengkap: namaLengkap.trim(),
        role: 'admin',
        status: 'aktif'
      });
      showToast('Admin berhasil ditambahkan', 'success');
      handleCloseAddModal();
      await load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal menambah user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (confirmAction === 'delete') {
      setSaving(true);
      try {
        await api.delete(`/admin/user/${confirmData.id}`);
        showToast('Admin berhasil dihapus', 'success');
        await load();
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmData(null);
      } catch (err) {
        showToast(err?.response?.data?.message || 'Gagal menghapus user', 'error');
        setShowConfirmModal(false);
      } finally {
        setSaving(false);
      }
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingEmail(item.email);
    setEditingNamaLengkap(item.namaLengkap);
    setEditingStatus(item.status);
    setShowAddModal(true); 
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddModal(false);
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!editingEmail.trim() || !editingNamaLengkap.trim()) return;
    
    setSaving(true);
    try {
      await api.put(`/admin/user/${editingId}`, {
        email: editingEmail.trim().toLowerCase(),
        namaLengkap: editingNamaLengkap.trim(),
        status: editingStatus
      });
      showToast('Admin berhasil diperbarui', 'success');
      cancelEdit();
      await load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal mengubah user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    setConfirmAction('delete');
    setConfirmData({ 
      id: item.id,
      email: item.email,
      namaLengkap: item.namaLengkap
    });
    setShowConfirmModal(true);
  };

  const getStatusBadge = (status) => {
    return status === 'aktif' ? 'status-aktif' : 'status-nonaktif';
  };

  return (
    <div className="admin-user-page">
      <div className="user-header">
        <div>
          <h1 className="user-title">
            <span className="title-text">Manajemen Admin</span>
            <span className="title-badge">Admin</span>
          </h1>
          <p className="user-subtitle">Kelola data akun administrator sistem</p>
        </div>
        <div className="user-meta">
          <div className="meta-card">
            <div className="meta-label">Total</div>
            <div className="meta-value">{count}</div>
          </div>
        </div>
      </div>



      <div className="user-card">
        <div className="user-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 className="user-card-title">Daftar User</h2>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Cari admin..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <button className="btn-add-user" onClick={handleOpenAddModal} disabled={saving}>
            <FiPlus />
            <span>Tambah User</span>
          </button>
        </div>

        {loading ? (
          <div className="user-empty">Loading...</div>
        ) : items.length === 0 ? (
          <div className="user-empty">Belum ada user</div>
        ) : (
          <div className="user-table-wrap">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nama Lengkap</th>
                  <th className="text-center">Status</th>
                  <th style={{ width: '120px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="email-text" style={{ fontFamily: 'monospace', fontWeight: '600' }}>{item.email}</div>
                    </td>
                    <td>
                      <div className="nama-text" style={{ fontWeight: '700', color: '#1e293b' }}>{item.namaLengkap}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(item.status)}`}>
                        {item.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-action-admin primary" type="button" onClick={() => startEdit(item)} disabled={saving} title="Edit">
                          <FiEdit2 />
                        </button>
                        <button className="btn-action-admin danger" type="button" onClick={() => remove(item)} disabled={saving || item.googleLinked} title="Hapus">
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

        {filteredItems.length > 0 && (
          <div className="table-pagination">
            <span className="table-pagination-info">
              Menampilkan {currentPage === 9999 ? 1 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {currentPage === 9999 ? filteredItems.length : Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} dari {filteredItems.length} user
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

      {/* Unified User Modal (Add & Edit) */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit User Admin' : 'Tambah User Admin'}</h3>
              <button className="modal-close" onClick={editingId ? cancelEdit : handleCloseAddModal} disabled={saving}>
                <FiX />
              </button>
            </div>
            <form className="user-form" onSubmit={editingId ? onSave : onCreate}>
              <div className="modal-body">

                <div className="form-group">
                  <div className="field-wrapper">
                    <label className="label">
                      <span className="label-text">Nama Lengkap</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        className="input"
                        placeholder="Contoh: John Doe"
                        value={editingId ? editingNamaLengkap : namaLengkap}
                        onChange={(e) => editingId ? setEditingNamaLengkap(e.target.value) : setNamaLengkap(e.target.value)}
                        disabled={saving}
                        maxLength={100}
                        required
                        autoComplete="off"
                      />
                      <div className="input-underline"></div>
                    </div>
                  </div>

                  <div className="field-wrapper">
                    <label className="label">
                      <span className="label-text">Email</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        type="email"
                        className="input"
                        placeholder="user@example.com"
                        value={editingId ? editingEmail : email}
                        onChange={(e) => editingId ? setEditingEmail(e.target.value.toLowerCase()) : setEmail(e.target.value.toLowerCase())}
                        disabled={saving}
                        maxLength={100}
                        required
                        autoComplete="off"
                      />
                      <div className="input-underline"></div>
                    </div>
                  </div>

                  {editingId && (
                    <div className="field-wrapper">
                      <label className="label">Status Akun</label>
                      <div className="toggle-wrapper">
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={editingStatus === 'aktif'} 
                            onChange={(e) => setEditingStatus(e.target.checked ? 'aktif' : 'nonaktif')}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span className="toggle-label-text">
                          {editingStatus === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </div>
                  )}

                  {!editingId && (
                    <div className="field-info">
                      <p className="info-text">Akun baru otomatis diatur sebagai <strong>Aktif</strong>. Admin dapat login via Google SSO.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="modal-btn modal-btn-cancel"
                  type="button"
                  onClick={editingId ? cancelEdit : handleCloseAddModal}
                  disabled={saving}
                >
                  <FiX className="modal-btn-icon" />
                  <span>Batal</span>
                </button>
                <button
                  className="modal-btn modal-btn-confirm modal-btn-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-small"></span>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="modal-btn-icon" />
                      <span>{editingId ? 'Simpan Perubahan' : 'Tambah User'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Hapus) */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm">
              <div className="modal-confirm-header">
                <div className="modal-confirm-icon-box danger">
                  <FiAlertCircle className="modal-icon" />
                </div>
                <h3 className="modal-confirm-title">Hapus User Admin?</h3>
              </div>
              <div className="modal-confirm-body">
                <div className="modal-confirm-text">
                  Yakin ingin menghapus user <span className="modal-confirm-item">{confirmData?.email}</span>?
                </div>
                <div className="modal-confirm-warning">
                  <FiAlertCircle /> Tindakan ini tidak dapat dibatalkan.
                </div>
              </div>
              <div className="modal-confirm-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)} disabled={saving}>
                  <FiX /> Batal
                </button>
                <button className="btn btn-danger" onClick={handleConfirm} disabled={saving}>
                  {saving ? 'Memproses...' : <><FiTrash2 /> Ya, Hapus</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUser;
