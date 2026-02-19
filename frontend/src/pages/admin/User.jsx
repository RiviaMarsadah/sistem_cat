import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiX, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../../services/api';
import './User.css';

const AdminUser = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state (untuk modal tambah)
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Modal state untuk form tambah
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editingEmail, setEditingEmail] = useState('');
  const [editingPassword, setEditingPassword] = useState('');
  const [editingRole, setEditingRole] = useState('');
  const [editingNamaLengkap, setEditingNamaLengkap] = useState('');
  const [editingStatus, setEditingStatus] = useState('aktif');
  const [editingShowPassword, setEditingShowPassword] = useState(false);
  const [editingGoogleLinked, setEditingGoogleLinked] = useState(false);

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
    setEmail('');
    setRole('');
    setNamaLengkap('');
    setError('');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEmail('');
    setRole('');
    setNamaLengkap('');
    setError('');
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!email.trim() || !role || !namaLengkap.trim()) return;

    // Show confirmation modal
    setConfirmAction('create');
    setConfirmData({ 
      email: email.trim(),
      password: null, // Tidak perlu password untuk master data
      role,
      namaLengkap: namaLengkap.trim(),
      status: 'aktif' // Default aktif
    });
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (confirmAction === 'create') {
      setSaving(true);
      setError('');
      try {
        await api.post('/admin/user', confirmData);
        handleCloseAddModal();
        await load();
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmData(null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Gagal menambah user');
        setShowConfirmModal(false);
      } finally {
        setSaving(false);
      }
    } else if (confirmAction === 'delete') {
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

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmData(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingEmail(item.email);
    setEditingPassword('');
    setEditingRole(item.role);
    setEditingNamaLengkap(item.namaLengkap);
    setEditingStatus(item.status);
    setEditingGoogleLinked(item.googleLinked || false);
    setEditingShowPassword(false);
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingEmail('');
    setEditingPassword('');
    setEditingRole('');
    setEditingNamaLengkap('');
    setEditingStatus('aktif');
    setEditingGoogleLinked(false);
  };

  const saveEdit = async () => {
    if (!editingEmail.trim() || !editingRole || !editingNamaLengkap.trim()) return;
    setSaving(true);
    setError('');
    try {
      const updateData = {
        email: editingEmail.trim(),
        role: editingRole,
        namaLengkap: editingNamaLengkap.trim(),
        status: editingStatus
      };
      
      // Only include password if provided
      if (editingPassword.trim()) {
        updateData.password = editingPassword.trim();
      }

      await api.put(`/admin/user/${editingId}`, updateData);
      cancelEdit();
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal mengubah user');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    // Show confirmation modal
    setConfirmAction('delete');
    setConfirmData({ 
      id: item.id,
      email: item.email,
      namaLengkap: item.namaLengkap
    });
    setShowConfirmModal(true);
  };

  const getRoleLabel = (role) => {
    const map = { admin: 'Admin', guru: 'Guru', siswa: 'Siswa' };
    return map[role] || role;
  };

  const getStatusBadge = (status) => {
    return status === 'aktif' ? 'status-aktif' : 'status-nonaktif';
  };

  return (
    <div className="admin-user-page">
      <div className="user-header">
        <div>
          <h1 className="user-title">
            <span className="title-text">Management User</span>
            <span className="title-badge">Admin</span>
          </h1>
          <p className="user-subtitle">Kelola data user master (email, role, status)</p>
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
          <div className="user-table">
            <div className="user-row user-row-head">
              <div className="col-email">Email</div>
              <div className="col-nama">Nama Lengkap</div>
              <div className="col-role">Role</div>
              <div className="col-status">Status</div>
              <div className="col-actions">Aksi</div>
            </div>

            {items.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <div key={item.id} className="user-row">
                  <div className="col-email">
                    {isEditing ? (
                      <input
                        type="email"
                        className="input small"
                        placeholder="Email"
                        value={editingEmail}
                        onChange={(e) => setEditingEmail(e.target.value.toLowerCase())}
                        disabled={saving}
                        maxLength={100}
                        required
                      />
                    ) : (
                      <div className="email-text">{item.email}</div>
                    )}
                  </div>
                  <div className="col-nama">
                    {isEditing ? (
                      <input
                        className="input small"
                        placeholder="Nama Lengkap"
                        value={editingNamaLengkap}
                        onChange={(e) => setEditingNamaLengkap(e.target.value)}
                        disabled={saving}
                        maxLength={100}
                        required
                      />
                    ) : (
                      <div className="nama-text">{item.namaLengkap}</div>
                    )}
                  </div>
                  <div className="col-role">
                    {isEditing ? (
                      <select
                        className="input small"
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value)}
                        disabled={saving}
                        required
                      >
                        <option value="">Pilih</option>
                        <option value="admin">Admin</option>
                        <option value="guru">Guru</option>
                        <option value="siswa">Siswa</option>
                      </select>
                    ) : (
                      <div className="role-badge">{getRoleLabel(item.role)}</div>
                    )}
                  </div>
                  <div className="col-status">
                    {isEditing ? (
                      <select
                        className="input small"
                        value={editingStatus}
                        onChange={(e) => setEditingStatus(e.target.value)}
                        disabled={saving}
                      >
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Nonaktif</option>
                      </select>
                    ) : (
                      <span className={`status-badge ${getStatusBadge(item.status)}`}>
                        {item.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    )}
                  </div>

                  <div className="col-actions">
                    {isEditing ? (
                      <div className="edit-actions-wrapper">
                        {editingGoogleLinked && (
                          <div className="google-linked-hint">
                            <span>Google Linked - Password tidak dapat diubah</span>
                          </div>
                        )}
                        {!editingGoogleLinked && (
                          <div className="password-edit-wrapper">
                            <div className="input-wrapper password-wrapper">
                              <input
                                type={editingShowPassword ? 'text' : 'password'}
                                className="input small"
                                placeholder="Password baru (kosongkan jika tidak diubah)"
                                value={editingPassword}
                                onChange={(e) => setEditingPassword(e.target.value)}
                                disabled={saving}
                                maxLength={255}
                              />
                              <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setEditingShowPassword(!editingShowPassword)}
                                disabled={saving}
                              >
                                {editingShowPassword ? <FiEyeOff /> : <FiEye />}
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="action-buttons">
                          <button className="btn" type="button" onClick={saveEdit} disabled={saving || !editingEmail.trim() || !editingRole || !editingNamaLengkap.trim()}>
                            <FiSave />
                            <span>Simpan</span>
                          </button>
                          <button className="btn ghost" type="button" onClick={cancelEdit} disabled={saving}>
                            <FiX />
                            <span>Batal</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button className="btn" type="button" onClick={() => startEdit(item)} disabled={saving}>
                          <FiEdit2 />
                          <span>Edit</span>
                        </button>
                        <button className="btn danger" type="button" onClick={() => remove(item)} disabled={saving || item.googleLinked}>
                          <FiTrash2 />
                          <span>Hapus</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseAddModal}>
          <div className="modal-container modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Tambah User Baru</h3>
              <button className="modal-close" onClick={handleCloseAddModal} disabled={saving}>
                <FiX />
              </button>
            </div>
            <form className="user-form" onSubmit={onCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <div className="field-wrapper">
                    <label className="label" htmlFor="modal-email">
                      <span className="label-text">Email</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="modal-email"
                        type="email"
                        className="input"
                        placeholder="Contoh: user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.toLowerCase())}
                        disabled={saving}
                        maxLength={100}
                        required
                        autoComplete="off"
                      />
                      <div className="input-underline"></div>
                    </div>
                  </div>

                  <div className="field-wrapper">
                    <label className="label" htmlFor="modal-namaLengkap">
                      <span className="label-text">Nama Lengkap</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="modal-namaLengkap"
                        className="input"
                        placeholder="Contoh: John Doe"
                        value={namaLengkap}
                        onChange={(e) => setNamaLengkap(e.target.value)}
                        disabled={saving}
                        maxLength={100}
                        required
                        autoComplete="off"
                      />
                      <div className="input-underline"></div>
                    </div>
                    <p className="field-hint">Maksimal 100 karakter</p>
                  </div>

                  <div className="field-wrapper">
                    <label className="label" htmlFor="modal-role">
                      <span className="label-text">Role</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <select
                        id="modal-role"
                        className="input"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        disabled={saving}
                        required
                      >
                        <option value="">Pilih Role</option>
                        <option value="admin">Admin</option>
                        <option value="guru">Guru</option>
                        <option value="siswa">Siswa</option>
                      </select>
                      <div className="input-underline"></div>
                    </div>
                  </div>

                  <div className="field-info">
                    <p className="info-text">Status akan otomatis diatur menjadi <strong>Aktif</strong></p>
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
                  disabled={saving || !email.trim() || !role || !namaLengkap.trim()}
                >
                  {saving ? (
                    <>
                      <span className="spinner-small"></span>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="modal-btn-icon" />
                      <span>Tambah User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={handleCancelConfirm}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className={`modal-icon-wrapper ${
                confirmAction === 'create' ? 'modal-icon-success' : 'modal-icon-danger'
              }`}>
                {confirmAction === 'create' ? (
                  <FiCheckCircle className="modal-icon" />
                ) : (
                  <FiAlertCircle className="modal-icon" />
                )}
              </div>
              <h3 className="modal-title">
                {confirmAction === 'create' ? 'Tambah User?' : 'Hapus User?'}
              </h3>
            </div>
            <div className="modal-body">
              <p className="modal-message">
                {confirmAction === 'create' ? (
                  <>
                    Apakah Anda yakin ingin menambah user{' '}
                    <strong>"{confirmData?.email}"</strong> ({confirmData?.namaLengkap}) dengan role{' '}
                    <strong>"{getRoleLabel(confirmData?.role)}"</strong>?
                  </>
                ) : (
                  <>
                    Apakah Anda yakin ingin menghapus user{' '}
                    <strong>"{confirmData?.email}"</strong> ({confirmData?.namaLengkap})?
                    <br />
                    <span className="modal-warning">Tindakan ini tidak dapat dibatalkan.</span>
                  </>
                )}
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={handleCancelConfirm}
                disabled={saving}
              >
                <FiX className="modal-btn-icon" />
                <span>Batal</span>
              </button>
              <button
                className={`modal-btn modal-btn-confirm ${
                  confirmAction === 'create' ? 'modal-btn-primary' : 'modal-btn-danger'
                }`}
                onClick={handleConfirm}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-small"></span>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    {confirmAction === 'create' ? (
                      <>
                        <FiCheckCircle className="modal-btn-icon" />
                        <span>Ya, Tambahkan</span>
                      </>
                    ) : (
                      <>
                        <FiTrash2 className="modal-btn-icon" />
                        <span>Ya, Hapus</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUser;

