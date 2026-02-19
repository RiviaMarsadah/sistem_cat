import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';
import './Jurusan.css';

const AdminJurusan = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [idJurusan, setIdJurusan] = useState('');
  const [nama, setNama] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Modal state untuk form tambah
  const [showAddModal, setShowAddModal] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingIdJurusan, setEditingIdJurusan] = useState('');
  const [editingNama, setEditingNama] = useState('');

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

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
    setIdJurusan('');
    setNama('');
    setError('');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setIdJurusan('');
    setNama('');
    setError('');
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!idJurusan.trim() || !nama.trim()) return;

    // Show confirmation modal
    setConfirmAction('create');
    setConfirmData({ 
      idJurusan: idJurusan.trim(),
      nama: nama.trim() 
    });
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (confirmAction === 'create') {
      setSaving(true);
      setError('');
      try {
        await api.post('/admin/jurusan', { 
          idJurusan: confirmData.idJurusan,
          nama: confirmData.nama 
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
    setEditingIdJurusan(item.idJurusan || '');
    setEditingNama(item.nama);
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingIdJurusan('');
    setEditingNama('');
  };

  const saveEdit = async () => {
    if (!editingIdJurusan.trim() || !editingNama.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/jurusan/${editingId}`, { 
        idJurusan: editingIdJurusan.trim(),
        nama: editingNama.trim() 
      });
      cancelEdit();
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal mengubah jurusan');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    // Show confirmation modal
    setConfirmAction('delete');
    setConfirmData({ id: item.id, nama: item.nama });
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
          <h2 className="jurusan-card-title">Daftar Jurusan</h2>
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
          <div className="jurusan-table">
            <div className="jurusan-row jurusan-row-head">
              <div className="col-id">ID</div>
              <div className="col-name">Nama</div>
              <div className="col-actions">Aksi</div>
            </div>

            {items.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <div key={item.id} className="jurusan-row">
                  <div className="col-id">
                    {isEditing ? (
                      <input
                        className="input small"
                        placeholder="ID Jurusan"
                        value={editingIdJurusan}
                        onChange={(e) => setEditingIdJurusan(e.target.value.toUpperCase())}
                        disabled={saving}
                        maxLength={20}
                        required
                      />
                    ) : (
                      <div className="id-text">{item.idJurusan}</div>
                    )}
                  </div>
                  <div className="col-name">
                    {isEditing ? (
                      <input
                        className="input small"
                        placeholder="Nama Jurusan"
                        value={editingNama}
                        onChange={(e) => setEditingNama(e.target.value)}
                        disabled={saving}
                        maxLength={100}
                      />
                    ) : (
                      <div className="name-text">{item.nama}</div>
                    )}
                  </div>

                  <div className="col-actions">
                    {isEditing ? (
                      <>
                        <button className="btn" type="button" onClick={saveEdit} disabled={saving || !editingIdJurusan.trim() || !editingNama.trim()}>
                          <FiSave />
                          <span>Simpan</span>
                        </button>
                        <button className="btn ghost" type="button" onClick={cancelEdit} disabled={saving}>
                          <FiX />
                          <span>Batal</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn" type="button" onClick={() => startEdit(item)} disabled={saving}>
                          <FiEdit2 />
                          <span>Edit</span>
                        </button>
                        <button className="btn danger" type="button" onClick={() => remove(item)} disabled={saving}>
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

      {/* Add Jurusan Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseAddModal}>
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
                    <label className="label" htmlFor="modal-idJurusan">
                      <span className="label-text">ID Jurusan</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="modal-idJurusan"
                        className="input"
                        placeholder="Contoh: TKJ, RPL, MM"
                        value={idJurusan}
                        onChange={(e) => setIdJurusan(e.target.value.toUpperCase())}
                        disabled={saving}
                        maxLength={20}
                        required
                        autoComplete="off"
                      />
                      <div className="input-underline"></div>
                    </div>
                    <p className="field-hint">Singkatan/kode jurusan (maksimal 20 karakter)</p>
                  </div>

                  <div className="field-wrapper">
                    <label className="label" htmlFor="modal-namaJurusan">
                      <span className="label-text">Nama Jurusan</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="modal-namaJurusan"
                        className="input"
                        placeholder="Contoh: Teknik Komputer dan Jaringan"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
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
                  disabled={saving || !idJurusan.trim() || !nama.trim()}
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
                {confirmAction === 'create' ? 'Tambah Jurusan?' : 'Hapus Jurusan?'}
              </h3>
            </div>
            <div className="modal-body">
              <p className="modal-message">
              {confirmAction === 'create' ? (
                <>
                  Apakah Anda yakin ingin menambah jurusan{' '}
                  <strong>"{confirmData?.nama}"</strong>
                  {' '}dengan ID <strong>"{confirmData?.idJurusan}"</strong>?
                </>
              ) : (
                  <>
                    Apakah Anda yakin ingin menghapus jurusan{' '}
                    <strong>"{confirmData?.nama}"</strong>?
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

export default AdminJurusan;


