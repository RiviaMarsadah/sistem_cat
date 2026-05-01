import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiX, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../../services/api';
import '../guru/PaketUjian.css';
import './User.css';

const AdminUser = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const count = useMemo(() => items.length, [items.length]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/user');
      setItems(res.data.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal memuat data user');
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
    setError('');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setEmail('');
    setNamaLengkap('');
    setError('');
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!email.trim() || !namaLengkap.trim()) return;

    setSaving(true);
    setError('');
    try {
      await api.post('/admin/user', {
        email: email.trim().toLowerCase(),
        namaLengkap: namaLengkap.trim(),
        role: 'admin',
        status: 'aktif'
      });
      handleCloseAddModal();
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menambah user');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (confirmAction === 'delete') {
      setSaving(true);
      setError('');
      try {
        await api.delete(`/admin/user/${confirmData.id}`);
        await load();
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmData(null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Gagal menghapus user');
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
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddModal(false);
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!editingEmail.trim() || !editingNamaLengkap.trim()) return;
    
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/user/${editingId}`, {
        email: editingEmail.trim().toLowerCase(),
        namaLengkap: editingNamaLengkap.trim(),
        status: editingStatus
      });
      cancelEdit();
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal mengubah user');
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

      {error && (
        <div className="user-alert" role="alert">
          {error}
        </div>
      )}

      <div className="user-card">
        <div className="user-card-header">
          <h2 className="user-card-title">Daftar User</h2>
          <button className="btn-add-user" onClick={handleOpenAddModal} disabled={saving}>
            <FiPlus className="btn-icon" />
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
                {items.map((item) => (
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
                        <button className="btn-action primary" type="button" onClick={() => startEdit(item)} disabled={saving} title="Edit">
                          <FiEdit2 />
                        </button>
                        <button className="btn-action btn-delete" type="button" onClick={() => remove(item)} disabled={saving || item.googleLinked} title="Hapus">
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
            <div className="modal-header">
              <div className="modal-icon-wrapper modal-icon-danger">
                <FiAlertCircle className="modal-icon" />
              </div>
              <h3 className="modal-title">Hapus User Admin?</h3>
            </div>
            <div className="modal-body">
              <p className="modal-message">
                Apakah Anda yakin ingin menghapus user <strong>"{confirmData?.email}"</strong> ({confirmData?.namaLengkap})?
                <br />
                <span className="modal-warning">Tindakan ini tidak dapat dibatalkan. Akun ini tidak akan bisa login lagi.</span>
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowConfirmModal(false)} disabled={saving}>
                <FiX className="modal-btn-icon" />
                <span>Batal</span>
              </button>
              <button
                className="modal-btn modal-btn-confirm modal-btn-danger"
                onClick={handleConfirm}
                disabled={saving}
              >
                {saving ? 'Memproses...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUser;
