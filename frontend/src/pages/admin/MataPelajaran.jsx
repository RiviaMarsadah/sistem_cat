import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiX, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';
import './MataPelajaran.css';

const KATEGORI_OPTIONS = [
  { value: 'prodi', label: 'Prodi (Jurusan)' },
  { value: 'muatan_lokal', label: 'Muatan Lokal' },
];

export default function MataPelajaran() {
  const [items, setItems] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [namaMapel, setNamaMapel] = useState('');
  const [kodeMapel, setKodeMapel] = useState('');
  const [kategori, setKategori] = useState('prodi');
  const [jurusanId, setJurusanId] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editNamaMapel, setEditNamaMapel] = useState('');
  const [editKodeMapel, setEditKodeMapel] = useState('');
  const [editKategori, setEditKategori] = useState('prodi');
  const [editJurusanId, setEditJurusanId] = useState('');

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  const count = useMemo(() => items.length, [items.length]);

  const loadJurusan = async () => {
    try {
      const res = await api.get('/admin/jurusan');
      setJurusanList(res.data?.data || []);
    } catch (e) {
      console.error('Load jurusan error:', e);
    }
  };

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
    loadJurusan();
  }, []);

  useEffect(() => {
    load();
  }, []);

  const resetAddForm = () => {
    setNamaMapel('');
    setKodeMapel('');
    setKategori('prodi');
    setJurusanId('');
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
    if (kategori === 'prodi' && !jurusanId) {
      setError('Pilih prodi/jurusan untuk kategori Prodi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/mata-pelajaran', {
        namaMapel: namaMapel.trim(),
        kodeMapel: kodeMapel.trim() || null,
        kategori,
        jurusanId: kategori === 'prodi' ? Number(jurusanId) : null,
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
    setEditKategori(item.kategori || 'prodi');
    setEditJurusanId(item.jurusanId != null ? String(item.jurusanId) : '');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNamaMapel('');
    setEditKodeMapel('');
    setEditKategori('prodi');
    setEditJurusanId('');
  };

  const saveEdit = async () => {
    if (!editNamaMapel.trim()) return;
    if (editKategori === 'prodi' && !editJurusanId) {
      setError('Pilih prodi/jurusan untuk kategori Prodi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/mata-pelajaran/${editingId}`, {
        namaMapel: editNamaMapel.trim(),
        kodeMapel: editKodeMapel.trim() || null,
        kategori: editKategori,
        jurusanId: editKategori === 'prodi' ? Number(editJurusanId) : null,
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
          <p className="mapel-subtitle">Kelola mata pelajaran dengan kategori Prodi atau Muatan Lokal</p>
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
          <h2 className="mapel-card-title">Daftar Mata Pelajaran</h2>
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
          <div className="mapel-table">
            <div className="mapel-row mapel-row-head">
              <div className="col-nama">Nama Mapel</div>
              <div className="col-kode">Kode</div>
              <div className="col-kategori">Kategori</div>
              <div className="col-prodi">Prodi / Jurusan</div>
              <div className="col-actions">Aksi</div>
            </div>
            {items.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <div key={item.id} className="mapel-row">
                  <div className="col-nama">
                    {isEditing ? (
                      <input
                        className="input small"
                        value={editNamaMapel}
                        onChange={(e) => setEditNamaMapel(e.target.value)}
                        placeholder="Nama mata pelajaran"
                        disabled={saving}
                        maxLength={100}
                      />
                    ) : (
                      <div className="nama-text">{item.namaMapel}</div>
                    )}
                  </div>
                  <div className="col-kode">
                    {isEditing ? (
                      <input
                        className="input small"
                        value={editKodeMapel}
                        onChange={(e) => setEditKodeMapel(e.target.value)}
                        placeholder="Kode (opsional)"
                        disabled={saving}
                        maxLength={20}
                      />
                    ) : (
                      <div className="kode-text">{item.kodeMapel || '–'}</div>
                    )}
                  </div>
                  <div className="col-kategori">
                    {isEditing ? (
                      <select
                        className="input small"
                        value={editKategori}
                        onChange={(e) => setEditKategori(e.target.value)}
                        disabled={saving}
                      >
                        {KATEGORI_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`badge badge-${item.kategori}`}>
                        {KATEGORI_OPTIONS.find((o) => o.value === item.kategori)?.label || item.kategori}
                      </span>
                    )}
                  </div>
                  <div className="col-prodi">
                    {isEditing ? (
                      editKategori === 'prodi' ? (
                        <select
                          className="input small"
                          value={editJurusanId}
                          onChange={(e) => setEditJurusanId(e.target.value)}
                          disabled={saving}
                        >
                          <option value="">Pilih prodi yang sudah ada</option>
                          {jurusanList.map((j) => (
                            <option key={j.id} value={j.id}>{j.nama}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="muted">Muatan Lokal</span>
                      )
                    ) : (
                      <div className="prodi-text">
                        {item.kategori === 'prodi' && item.jurusan
                          ? item.jurusan.nama
                          : item.kategori === 'muatan_lokal'
                            ? 'Muatan Lokal'
                            : '–'}
                      </div>
                    )}
                  </div>
                  <div className="col-actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-save"
                          onClick={saveEdit}
                          disabled={saving || !editNamaMapel.trim() || (editKategori === 'prodi' && !editJurusanId)}
                        >
                          <FiSave />
                          <span>Simpan</span>
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={cancelEdit} disabled={saving}>
                          <FiX />
                          <span>Batal</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="btn btn-edit" onClick={() => startEdit(item)} disabled={saving}>
                          <FiEdit2 />
                          <span>Edit</span>
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => openDeleteConfirm(item)} disabled={saving}>
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

      {/* Modal Tambah */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
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
                <div className="form-group">
                  <label className="label">
                    <span className="label-text">Kategori</span>
                    <span className="label-required">*</span>
                  </label>
                  <div className="kategori-options">
                    {KATEGORI_OPTIONS.map((o) => (
                      <label key={o.value} className="radio-label">
                        <input
                          type="radio"
                          name="kategori"
                          value={o.value}
                          checked={kategori === o.value}
                          onChange={(e) => setKategori(e.target.value)}
                          disabled={saving}
                        />
                        <span>{o.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {kategori === 'prodi' && (
                  <div className="form-group">
                    <label className="label">
                      <span className="label-text">Prodi / Jurusan</span>
                      <span className="label-required">*</span>
                    </label>
                    <select
                      className="input"
                      value={jurusanId}
                      onChange={(e) => setJurusanId(e.target.value)}
                      disabled={saving}
                      required={kategori === 'prodi'}
                    >
                      <option value="">Pilih dari prodi yang sudah ada di database</option>
                      {jurusanList.map((j) => (
                        <option key={j.id} value={j.id}>{j.nama} ({j.idJurusan})</option>
                      ))}
                    </select>
                    <p className="field-hint">Daftar diambil dari data Jurusan yang sudah diinput di menu Jurusan.</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-btn modal-btn-cancel" onClick={closeAddModal} disabled={saving}>
                  <FiX className="modal-btn-icon" />
                  <span>Batal</span>
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-confirm modal-btn-primary"
                  disabled={saving || !namaMapel.trim() || (kategori === 'prodi' && !jurusanId)}
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
        <div className="modal-overlay" onClick={closeConfirmModal}>
          <div className="modal-container modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Konfirmasi Hapus</h3>
              <button type="button" className="modal-close" onClick={closeConfirmModal} disabled={saving}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <p>Yakin ingin menghapus mata pelajaran <strong>{confirmData.namaMapel}</strong>?</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-btn modal-btn-cancel" onClick={closeConfirmModal} disabled={saving}>
                Batal
              </button>
              <button
                type="button"
                className="modal-btn modal-btn-danger"
                onClick={handleConfirmDelete}
                disabled={saving}
              >
                {saving ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
