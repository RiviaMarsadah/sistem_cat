import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  FiPlus, FiTrash2, FiEdit2, FiSave, FiX, FiCalendar, 
  FiSearch, FiAlertCircle, FiCheckCircle 
} from 'react-icons/fi';
import './Angkatan.css';

const Angkatan = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state untuk modal tambah
  const [namaAngkatan, setNamaAngkatan] = useState('');
  const [tahunAngkatan, setTahunAngkatan] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editNama, setEditNama] = useState('');
  const [editTahun, setEditTahun] = useState('');

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/angkatan');
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      setError('Gagal memuat data angkatan');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/angkatan', {
        namaAngkatan,
        tahunAngkatan: Number(tahunAngkatan)
      });
      setShowAddModal(false);
      setNamaAngkatan('');
      setTahunAngkatan(new Date().getFullYear());
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambah angkatan');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditNama(item.namaAngkatan);
    setEditTahun(item.tahunAngkatan);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNama('');
    setEditTahun('');
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/angkatan/${editingId}`, {
        namaAngkatan: editNama,
        tahunAngkatan: Number(editTahun)
      });
      setEditingId(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui angkatan');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/admin/angkatan/${selectedItem.id}`);
      setShowDeleteModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus angkatan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-angkatan-page">
      <div className="angkatan-header">
        <div className="header-info">
          <h1 className="angkatan-title">
            <span className="title-text">Data Angkatan</span>
          </h1>
          <p className="angkatan-subtitle">Manajemen data angkatan siswa</p>
        </div>
        <button className="btn-add-user" onClick={() => setShowAddModal(true)}>
          <FiPlus /> Tambah Angkatan
        </button>
      </div>

      {error && (
        <div className="user-alert">
          <FiAlertCircle /> {error}
        </div>
      )}

      <div className="user-card">
        <div className="angkatan-table-wrap">
          <table className="angkatan-table">
            <thead>
              <tr>
                <th>Nama Angkatan</th>
                <th className="text-center">Tahun</th>
                <th style={{ width: '120px' }} className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" className="text-center">Memuat data...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="3" className="text-center">Belum ada data angkatan</td></tr>
              ) : (
                items.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id}>
                      <td style={{ verticalAlign: 'middle' }}>
                        {isEditing ? (
                          <input 
                            className="input small"
                            value={editNama}
                            onChange={(e) => setEditNama(e.target.value)}
                          />
                        ) : (
                          <div className="name-text">{item.namaAngkatan}</div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'middle' }} className="text-center">
                        {isEditing ? (
                          <input 
                            type="number"
                            className="input small"
                            value={editTahun}
                            onChange={(e) => setEditTahun(e.target.value)}
                          />
                        ) : (
                          <span className="status-badge status-aktif">
                            {item.tahunAngkatan}
                          </span>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {isEditing ? (
                            <>
                              <button className="btn-action-admin primary" onClick={saveEdit} disabled={saving}>
                                <FiSave />
                              </button>
                              <button className="btn-action-admin" onClick={cancelEdit} disabled={saving}>
                                <FiX />
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="btn-action-admin primary" onClick={() => startEdit(item)} title="Edit">
                                <FiEdit2 />
                              </button>
                              <button className="btn-action-admin danger" onClick={() => openDeleteModal(item)} title="Hapus">
                                <FiTrash2 />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container small">
            <div className="modal-header">
              <h3>Tambah Angkatan</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="field-wrapper">
                  <label className="label">Nama Angkatan</label>
                  <input 
                    className="input"
                    placeholder="Contoh: Angkatan 2024"
                    value={namaAngkatan}
                    onChange={(e) => setNamaAngkatan(e.target.value)}
                    required
                  />
                </div>
                <div className="field-wrapper">
                  <label className="label">Tahun</label>
                  <input 
                    type="number"
                    className="input"
                    value={tahunAngkatan}
                    onChange={(e) => setTahunAngkatan(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm">
              <div className="modal-confirm-header">
                <div className="modal-confirm-icon-box danger">
                  <FiAlertCircle className="modal-icon" />
                </div>
                <h3 className="modal-confirm-title">Hapus Angkatan?</h3>
              </div>
              <div className="modal-confirm-body">
                <div className="modal-confirm-text">
                  Yakin ingin menghapus angkatan <span className="modal-confirm-item">{selectedItem?.namaAngkatan}</span>?
                </div>
                <div className="modal-confirm-warning">
                  <FiAlertCircle /> Tindakan ini tidak dapat dibatalkan.
                </div>
              </div>
              <div className="modal-confirm-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={saving}>
                  <FiX /> Batal
                </button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                  {saving ? 'Menghapus...' : <><FiTrash2 /> Ya, Hapus</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Angkatan;
