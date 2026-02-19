import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';
import './Kelas.css';

const AdminKelas = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [tingkat, setTingkat] = useState('');
  const [jurusanId, setJurusanId] = useState('');
  const [inisial, setInisial] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Modal state untuk form tambah
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editingTingkat, setEditingTingkat] = useState('');
  const [editingJurusanId, setEditingJurusanId] = useState('');
  const [editingInisial, setEditingInisial] = useState('');

  // Jurusan list for dropdown
  const [jurusanList, setJurusanList] = useState([]);
  const [loadingJurusan, setLoadingJurusan] = useState(true);

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  const count = useMemo(() => items.length, [items.length]);

  // Load jurusan list
  const loadJurusan = async () => {
    setLoadingJurusan(true);
    try {
      const res = await api.get('/admin/jurusan');
      setJurusanList(res.data.data || []);
    } catch (e) {
      console.error('Failed to load jurusan:', e);
    } finally {
      setLoadingJurusan(false);
    }
  };

  // Load kelas list
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/kelas');
      setItems(res.data.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJurusan();
    load();
  }, []);

  const handleOpenAddModal = () => {
    setTingkat('');
    setJurusanId('');
    setInisial('');
    setError('');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setTingkat('');
    setJurusanId('');
    setInisial('');
    setError('');
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!tingkat || !jurusanId || !inisial.trim()) return;

    // Show confirmation modal
    const selectedJurusan = jurusanList.find(j => j.id === parseInt(jurusanId));
    setConfirmAction('create');
    setConfirmData({ 
      tingkat,
      jurusanId: parseInt(jurusanId),
      jurusanNama: selectedJurusan?.nama || '',
      inisial: inisial.trim().toUpperCase()
    });
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (confirmAction === 'create') {
      setSaving(true);
      setError('');
      try {
        await api.post('/admin/kelas', { 
          tingkat: confirmData.tingkat,
          jurusanId: confirmData.jurusanId,
          inisial: confirmData.inisial
        });
        handleCloseAddModal();
        await load();
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmData(null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Gagal menambah kelas');
        setShowConfirmModal(false);
      } finally {
        setSaving(false);
      }
    } else if (confirmAction === 'delete') {
      setSaving(true);
      setError('');
      try {
        await api.delete(`/admin/kelas/${confirmData.id}`);
        await load();
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmData(null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Gagal menghapus kelas');
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
    setEditingTingkat(item.tingkat || '');
    setEditingJurusanId(item.jurusanId?.toString() || '');
    setEditingInisial(item.inisial || '');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTingkat('');
    setEditingJurusanId('');
    setEditingInisial('');
  };

  const saveEdit = async () => {
    if (!editingTingkat || !editingJurusanId || !editingInisial.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/kelas/${editingId}`, { 
        tingkat: editingTingkat,
        jurusanId: parseInt(editingJurusanId),
        inisial: editingInisial.trim().toUpperCase()
      });
      cancelEdit();
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal mengubah kelas');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    // Show confirmation modal
    setConfirmAction('delete');
    setConfirmData({ 
      id: item.id,
      tingkat: item.tingkat,
      jurusanNama: item.jurusan?.nama || '',
      inisial: item.inisial
    });
    setShowConfirmModal(true);
  };

  const getTingkatLabel = (tingkat) => {
    const map = { X: '10', XI: '11', XII: '12' };
    return map[tingkat] || tingkat;
  };

  const getNamaKelasDisplay = (item) => {
    if (!item.tingkat || !item.jurusan || !item.inisial) return '-';
    return `${getTingkatLabel(item.tingkat)} ${item.jurusan.idJurusan} ${item.inisial}`;
  };

  return (
    <div className="admin-kelas-page">
      <div className="kelas-header">
        <div>
          <h1 className="kelas-title">
            <span className="title-text">Kelas</span>
            <span className="title-badge">Admin</span>
          </h1>
          <p className="kelas-subtitle">Kelola data kelas (Tingkat, Jurusan, dan Inisial)</p>
        </div>
        <div className="kelas-meta">
          <div className="meta-card">
            <div className="meta-label">Total</div>
            <div className="meta-value">{count}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="kelas-alert" role="alert">
          {error}
        </div>
      )}

      <div className="kelas-card">
        <div className="kelas-card-header">
          <h2 className="kelas-card-title">Daftar Kelas</h2>
          <button className="btn-add-kelas" onClick={handleOpenAddModal} disabled={saving}>
            <FiPlus className="btn-icon" />
            <span>Tambah Kelas</span>
          </button>
        </div>

        {loading ? (
          <div className="kelas-empty">Loading...</div>
        ) : items.length === 0 ? (
          <div className="kelas-empty">Belum ada kelas</div>
        ) : (
          <div className="kelas-table">
            <div className="kelas-row kelas-row-head">
              <div className="col-nama">Nama Kelas</div>
              <div className="col-tingkat">Tingkat</div>
              <div className="col-jurusan">Jurusan</div>
              <div className="col-inisial">Inisial</div>
              <div className="col-actions">Aksi</div>
            </div>

            {items.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <div key={item.id} className="kelas-row">
                  <div className="col-nama">
                    {isEditing ? (
                      <div className="nama-preview">
                        {editingTingkat && editingJurusanId && editingInisial.trim() 
                          ? getNamaKelasDisplay({ 
                              tingkat: editingTingkat, 
                              inisial: editingInisial.trim(), 
                              jurusan: jurusanList.find(j => j.id === parseInt(editingJurusanId)) 
                            })
                          : 'Preview akan muncul setelah semua field diisi'
                        }
                      </div>
                    ) : (
                      <div className="nama-text">{getNamaKelasDisplay(item)}</div>
                    )}
                  </div>
                  <div className="col-tingkat">
                    {isEditing ? (
                      <select
                        className="input small"
                        value={editingTingkat}
                        onChange={(e) => setEditingTingkat(e.target.value)}
                        disabled={saving}
                        required
                      >
                        <option value="">Pilih</option>
                        <option value="X">10</option>
                        <option value="XI">11</option>
                        <option value="XII">12</option>
                      </select>
                    ) : (
                      <div className="tingkat-text">{getTingkatLabel(item.tingkat)}</div>
                    )}
                  </div>
                  <div className="col-jurusan">
                    {isEditing ? (
                      <select
                        className="input small"
                        value={editingJurusanId}
                        onChange={(e) => setEditingJurusanId(e.target.value)}
                        disabled={saving}
                        required
                      >
                        <option value="">Pilih Jurusan</option>
                        {jurusanList.map((jurusan) => (
                          <option key={jurusan.id} value={jurusan.id}>
                            {jurusan.idJurusan} - {jurusan.nama}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="jurusan-text">
                        {item.jurusan ? `${item.jurusan.idJurusan} - ${item.jurusan.nama}` : '-'}
                      </div>
                    )}
                  </div>
                  <div className="col-inisial">
                    {isEditing ? (
                      <input
                        className="input small"
                        placeholder="Inisial"
                        value={editingInisial}
                        onChange={(e) => setEditingInisial(e.target.value.toUpperCase())}
                        disabled={saving}
                        maxLength={10}
                        required
                      />
                    ) : (
                      <div className="inisial-text">{item.inisial}</div>
                    )}
                  </div>

                  <div className="col-actions">
                    {isEditing ? (
                      <>
                        <button className="btn" type="button" onClick={saveEdit} disabled={saving || !editingTingkat || !editingJurusanId || !editingInisial.trim()}>
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

      {/* Add Kelas Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseAddModal}>
          <div className="modal-container modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Tambah Kelas Baru</h3>
              <button className="modal-close" onClick={handleCloseAddModal} disabled={saving}>
                <FiX />
              </button>
            </div>
            <form className="kelas-form" onSubmit={onCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <div className="field-wrapper">
                    <label className="label" htmlFor="modal-tingkat">
                      <span className="label-text">Tingkat</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <select
                        id="modal-tingkat"
                        className="input"
                        value={tingkat}
                        onChange={(e) => setTingkat(e.target.value)}
                        disabled={saving || loadingJurusan}
                        required
                      >
                        <option value="">Pilih Tingkat</option>
                        <option value="X">10</option>
                        <option value="XI">11</option>
                        <option value="XII">12</option>
                      </select>
                      <div className="input-underline"></div>
                    </div>
                  </div>

                  <div className="field-wrapper">
                    <label className="label" htmlFor="modal-jurusanId">
                      <span className="label-text">Jurusan</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <select
                        id="modal-jurusanId"
                        className="input"
                        value={jurusanId}
                        onChange={(e) => setJurusanId(e.target.value)}
                        disabled={saving || loadingJurusan}
                        required
                      >
                        <option value="">Pilih Jurusan</option>
                        {jurusanList.map((jurusan) => (
                          <option key={jurusan.id} value={jurusan.id}>
                            {jurusan.idJurusan} - {jurusan.nama}
                          </option>
                        ))}
                      </select>
                      <div className="input-underline"></div>
                    </div>
                    {loadingJurusan && (
                      <p className="field-hint">Memuat data jurusan...</p>
                    )}
                  </div>

                  <div className="field-wrapper">
                    <label className="label" htmlFor="modal-inisial">
                      <span className="label-text">Inisial</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="modal-inisial"
                        className="input"
                        placeholder="Contoh: A, B, C atau 1, 2, 3"
                        value={inisial}
                        onChange={(e) => setInisial(e.target.value.toUpperCase())}
                        disabled={saving}
                        maxLength={10}
                        required
                        autoComplete="off"
                      />
                      <div className="input-underline"></div>
                    </div>
                    <p className="field-hint">Huruf atau angka (maksimal 10 karakter)</p>
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
                  disabled={saving || !tingkat || !jurusanId || !inisial.trim()}
                >
                  {saving ? (
                    <>
                      <span className="spinner-small"></span>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="modal-btn-icon" />
                      <span>Tambah Kelas</span>
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
                {confirmAction === 'create' ? 'Tambah Kelas?' : 'Hapus Kelas?'}
              </h3>
            </div>
            <div className="modal-body">
              <p className="modal-message">
                {confirmAction === 'create' ? (
                  <>
                    Apakah Anda yakin ingin menambah kelas{' '}
                    <strong>"{getTingkatLabel(confirmData?.tingkat)} {confirmData?.jurusanNama} {confirmData?.inisial}"</strong>?
                  </>
                ) : (
                  <>
                    Apakah Anda yakin ingin menghapus kelas{' '}
                    <strong>"{getTingkatLabel(confirmData?.tingkat)} {confirmData?.jurusanNama} {confirmData?.inisial}"</strong>?
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

export default AdminKelas;

