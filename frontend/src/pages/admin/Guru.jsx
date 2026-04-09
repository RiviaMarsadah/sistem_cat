import { useEffect, useMemo, useState, useRef } from 'react';
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiX, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff, FiUsers, FiUpload, FiDownload, FiFileText } from 'react-icons/fi';
import api from '../../services/api';
import './Guru.css';
import './User.css'; // Reuse common styles

const AdminGuru = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Form state (Shared for Add/Edit Modal)
  const [editingId, setEditingId] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nip, setNip] = useState('');
  const [status, setStatus] = useState('aktif');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Import state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Confirm state
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  const count = useMemo(() => items.length, [items.length]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/guru');
      setItems(res.data.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal memuat data guru');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Handlers for Form Modal
  const handleOpenAddModal = () => {
    setEditingId(null);
    setEmail('');
    setPassword('');
    setNamaLengkap('');
    setNip('');
    setStatus('aktif');
    setError('');
    setShowFormModal(true);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEmail(item.user.email);
    setPassword('');
    setNamaLengkap(item.user.namaLengkap);
    setNip(item.nip || '');
    setStatus(item.user.status);
    setError('');
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingId(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !namaLengkap.trim()) return;

    setSaving(true);
    setError('');
    try {
      const data = {
        email: email.trim().toLowerCase(),
        namaLengkap: namaLengkap.trim(),
        nip: nip.trim() || null,
        status
      };

      if (!editingId && password.trim()) data.password = password.trim();
      if (editingId && password.trim()) data.password = password.trim();

      if (editingId) {
        await api.put(`/admin/guru/${editingId}`, data);
      } else {
        await api.post('/admin/guru', data);
      }
      
      handleCloseFormModal();
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menyimpan data guru');
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Import
  const handleOpenImportModal = () => {
    setSelectedFile(null);
    setImportResults(null);
    setError('');
    setShowImportModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    } else {
      setError('Hanya file Excel (.xlsx, .xls) yang diperbolehkan');
    }
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const handleImportSubmit = async () => {
    if (!selectedFile) return;

    setSaving(true);
    setError('');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/admin/guru/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        setSuccess(res.data.message);
        setShowImportModal(false);
        setSelectedFile(null);
        await loadData();
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal mengimport data guru');
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Delete
  const remove = (item) => {
    setConfirmAction('delete');
    setConfirmData({ 
      id: item.id,
      namaLengkap: item.user.namaLengkap
    });
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/admin/guru/${confirmData.id}`);
      setShowConfirmModal(false);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menghapus data guru');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-guru-page">
      <div className="user-header">
        <div>
          <h1 className="user-title">
            <span className="title-text">Management Guru</span>
            <span className="title-badge">Guru</span>
          </h1>
          <p className="user-subtitle">Kelola data guru pengajar (Akun & Identitas)</p>
        </div>
        <div className="user-meta">
          <div className="meta-card">
            <div className="meta-label">Total Guru</div>
            <div className="meta-value">{count}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="user-alert" role="alert">
          <FiAlertCircle /> <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="user-success" role="alert">
          <FiCheckCircle /> <span>{success}</span>
        </div>
      )}

      <div className="user-card">
        <div className="user-card-header">
          <h2 className="user-card-title">Daftar Guru</h2>
          <div className="action-buttons">
            <button className="btn" onClick={handleOpenImportModal} disabled={saving}>
              <FiUpload /> <span>Import Excel</span>
            </button>
            <button className="btn-add-user" onClick={handleOpenAddModal} disabled={saving}>
              <FiPlus className="btn-icon" />
              <span>Tambah Guru</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="user-empty">Memuat data guru...</div>
        ) : items.length === 0 ? (
          <div className="user-empty">Belum ada data guru</div>
        ) : (
          <div className="user-table">
            <div className="user-row user-row-head">
              <div className="col-identitas">Identitas & Akun</div>
              <div className="col-nip">NIP</div>
              <div className="col-status">Status</div>
              <div className="col-actions">Aksi</div>
            </div>

            {items.map((item) => (
              <div key={item.id} className="user-row">
                <div className="col-identitas">
                  <div className="identitas-wrapper">
                    <div className="nama-text">{item.user.namaLengkap}</div>
                    <div className="email-text">{item.user.email}</div>
                  </div>
                </div>
                <div className="col-nip">
                  <div className="nip-text">{item.nip || '-'}</div>
                </div>
                <div className="col-status">
                  <span className={`status-badge ${item.user.status === 'aktif' ? 'status-aktif' : 'status-nonaktif'}`}>
                    {item.user.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div className="col-actions">
                  <button className="btn" onClick={() => startEdit(item)} disabled={saving}>
                    <FiEdit2 /> <span>Edit</span>
                  </button>
                  <button className="btn danger" onClick={() => remove(item)} disabled={saving}>
                    <FiTrash2 /> <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unified Form Modal (Add/Edit) */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-container modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Data Guru' : 'Tambah Guru Baru'}</h3>
              <button className="modal-close" onClick={handleCloseFormModal} disabled={saving}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <div className="field-wrapper">
                    <label className="label">Nama Lengkap *</label>
                    <input className="input" value={namaLengkap} onChange={(e) => setNamaLengkap(e.target.value)} required disabled={saving} />
                  </div>
                  <div className="form-row">
                    <div className="field-wrapper">
                      <label className="label">Email *</label>
                      <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={saving} />
                    </div>
                    {!editingId && (
                      <div className="field-wrapper">
                        <label className="label">Password (Opsional)</label>
                        <div className="input-wrapper password-wrapper">
                          <input className="input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} disabled={saving} />
                          <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="form-row">
                    <div className="field-wrapper">
                      <label className="label">NIP</label>
                      <input className="input" value={nip} onChange={(e) => setNip(e.target.value)} disabled={saving} />
                    </div>
                    {editingId && (
                      <div className="field-wrapper">
                        <label className="label">Status Akun</label>
                        <div className="toggle-wrapper">
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked={status === 'aktif'} 
                              onChange={(e) => setStatus(e.target.checked ? 'aktif' : 'nonaktif')}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                          <span className="toggle-label-text">{status === 'aktif' ? 'Aktif' : 'Nonaktif'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-btn modal-btn-cancel" onClick={handleCloseFormModal} disabled={saving}>Batal</button>
                <button type="submit" className="modal-btn modal-btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah Guru')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-container modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Import Guru dari Excel</h3>
              <button className="modal-close" onClick={() => setShowImportModal(false)} disabled={saving}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="import-instruction">
                <h4>Petunjuk Import:</h4>
                <ol>
                  <li>Gunakan template Excel yang sudah disediakan.</li>
                  <li>Kolom <strong>namaLengkap</strong> dan <strong>email</strong> wajib diisi.</li>
                  <li>Email yang sudah terdaftar akan otomatis dilewati (skip).</li>
                </ol>
                <a href={`${import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'}/public/templates/template_guru.xlsx`} className="btn-download-template" download>
                  <FiDownload /> Unduh Template Excel
                </a>
              </div>

              {!importResults ? (
                <>
                  <div 
                    className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
                    onClick={triggerFileInput}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" hidden />
                    <FiUpload className="file-upload-icon" />
                    <span className="file-upload-text">
                      Pilih atau drop file Excel di sini
                    </span>
                    <span className="file-upload-subtext">Hanya file .xlsx atau .xls</span>
                  </div>

                  {selectedFile && (
                    <div className="selected-file-info">
                      <FiFileText className="file-info-icon" />
                      <div className="file-details">
                        <span className="file-name">{selectedFile.name}</span>
                        <span className="file-upload-subtext">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                      </div>
                      <button className="btn-remove-file" onClick={() => setSelectedFile(null)}>
                        <FiX />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="import-results">
                  <div className="result-item">
                    <span className="result-label">Berhasil</span>
                    <span className="result-val text-success">{importResults.details.successCount}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Dilewati (Email Ganda)</span>
                    <span className="result-val text-warning">{importResults.details.skipCount}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Gagal (Data Tidak Valid)</span>
                    <span className="result-val text-danger">{importResults.details.errorCount}</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">{importResults.message}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowImportModal(false)} disabled={saving}>
                {importResults ? 'Tutup' : 'Batal'}
              </button>
              {!importResults && (
                <button className="modal-btn modal-btn-primary" onClick={handleImportSubmit} disabled={saving || !selectedFile}>
                  {saving ? 'Memproses...' : 'Mulai Import'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-wrapper modal-icon-danger">
                <FiAlertCircle className="modal-icon" />
              </div>
              <h3 className="modal-title">Hapus Guru?</h3>
            </div>
            <div className="modal-body text-center">
              <p>Apakah Anda yakin ingin menghapus guru <strong>{confirmData?.namaLengkap}</strong>?</p>
              <p className="modal-warning">Data akun dan seluruh paket ujian guru ini akan terhapus permanen.</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowConfirmModal(false)} disabled={saving}>Batal</button>
              <button className="modal-btn modal-btn-danger" onClick={handleConfirmDelete} disabled={saving}>
                {saving ? 'Memproses...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGuru;
