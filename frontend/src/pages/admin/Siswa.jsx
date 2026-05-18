import { useEffect, useMemo, useState, useRef } from 'react';
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiX, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff, FiUsers, FiUpload, FiDownload, FiFileText, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../../services/api';
import '../guru/PaketUjian.css';
import './Siswa.css';
import './User.css'; // Reuse common styles

const AdminSiswa = () => {
  const [items, setItems] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const fileInputRef = useRef(null);

  // Form state (Shared for Add/Edit Modal)
  const [editingId, setEditingId] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [kelasId, setKelasId] = useState('');
  const [status, setStatus] = useState('aktif');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // New API fields
  const [jk, setJk] = useState('L');
  const [foto, setFoto] = useState('default.jpg');
  const [tempatLahir, setTempatLahir] = useState('');
  const [tglLahir, setTglLahir] = useState('');
  const [agama, setAgama] = useState('');
  const [nohp, setNohp] = useState('');
  const [provinsi, setProvinsi] = useState('');
  const [kabupaten, setKabupaten] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [desa, setDesa] = useState('');
  const [alamat, setAlamat] = useState('');
  const [idAngkatan, setIdAngkatan] = useState('');
  
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

  const filteredItems = useMemo(() => {
    return items.filter(s => 
      s.user.namaLengkap.toLowerCase().includes(search.toLowerCase()) || 
      s.user.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.nis && s.nis.toLowerCase().includes(search.toLowerCase())) ||
      (s.nisn && s.nisn.toLowerCase().includes(search.toLowerCase())) ||
      (s.kelas?.namaKelas && s.kelas.namaKelas.toLowerCase().includes(search.toLowerCase()))
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

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resSiswa, resKelas] = await Promise.all([
        api.get('/admin/siswa'),
        api.get('/admin/kelas')
      ]);
      setItems(resSiswa.data.data || []);
      setKelasList(resKelas.data.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal memuat data');
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
    setNis('');
    setNisn('');
    setKelasId('');
    setStatus('aktif');
    setJk('L');
    setFoto('default.jpg');
    setTempatLahir('');
    setTglLahir('');
    setAgama('');
    setNohp('');
    setProvinsi('');
    setKabupaten('');
    setKecamatan('');
    setDesa('');
    setAlamat('');
    setIdAngkatan('');
    setError('');
    setShowFormModal(true);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEmail(item.user.email);
    setPassword('');
    setNamaLengkap(item.user.namaLengkap);
    setNis(item.nis || '');
    setNisn(item.nisn || '');
    setKelasId(item.kelasId || '');
    setStatus(item.user.status);
    setJk(item.jk || 'L');
    setFoto(item.foto || 'default.jpg');
    setTempatLahir(item.tempat_lahir || '');
    setTglLahir(item.tgl_lahir || '');
    setAgama(item.agama || '');
    setNohp(item.nohp || '');
    setProvinsi(item.provinsi || '');
    setKabupaten(item.kabupaten || '');
    setKecamatan(item.kecamatan || '');
    setDesa(item.desa || '');
    setAlamat(item.alamat || '');
    setIdAngkatan(item.id_angkatan || '');
    setError('');
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingId(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !namaLengkap.trim() || !kelasId) return;

    setSaving(true);
    setError('');
    try {
      const data = {
        email: email.trim().toLowerCase(),
        namaLengkap: namaLengkap.trim(),
        nis: nis.trim() || null,
        nisn: nisn.trim() || null,
        kelasId: parseInt(kelasId),
        status,
        jk,
        tempat_lahir: tempatLahir,
        tgl_lahir: tglLahir,
        agama,
        nohp,
        provinsi,
        kabupaten,
        kecamatan,
        desa,
        alamat,
        id_angkatan: idAngkatan ? parseInt(idAngkatan) : null
      };

      if (!editingId && password.trim()) data.password = password.trim();
      if (editingId && password.trim()) data.password = password.trim();

      if (editingId) {
        await api.put(`/admin/siswa/${editingId}`, data);
      } else {
        await api.post('/admin/siswa', data);
      }
      
      handleCloseFormModal();
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menyimpan data');
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
      const res = await api.post('/admin/siswa/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        setSuccess(res.data.message);
        setImportResults(res.data);
        await loadData();
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal mengimport data');
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
      await api.delete(`/admin/siswa/${confirmData.id}`);
      setShowConfirmModal(false);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menghapus data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-siswa-page">
      <div className="user-header">
        <div>
          <h1 className="user-title">
            <span className="title-text">Management Siswa</span>
            <span className="title-badge">Admin</span>
          </h1>
          <p className="user-subtitle">Kelola data siswa terpadu (Akun & Identitas)</p>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 className="user-card-title">Daftar Siswa</h2>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Cari siswa..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="action-buttons">
            <button className="btn" onClick={handleOpenImportModal} disabled={saving}>
              <FiUpload /> <span>Import Excel</span>
            </button>
            <button className="btn-add-user" onClick={handleOpenAddModal} disabled={saving}>
              <FiPlus />
              <span>Tambah Siswa</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="user-empty">Memuat data...</div>
        ) : items.length === 0 ? (
          <div className="user-empty">Belum ada data siswa</div>
        ) : (
          <div className="siswa-table-wrap">
            <table className="siswa-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th style={{ minWidth: '250px' }}>Nama</th>
                  <th>Email</th>
                  <th>NISN</th>
                  <th>NIS</th>
                  <th style={{ minWidth: '220px' }}>Kelas</th>
                  <th style={{ minWidth: '150px' }}>Angkatan</th>

                  <th>JK</th>
                  <th>Tempat Lahir</th>
                  <th>Tgl Lahir</th>
                  <th>Agama</th>
                  <th>No HP</th>
                  <th>Provinsi</th>
                  <th>Kabupaten</th>
                  <th>Kecamatan</th>
                  <th>Desa</th>
                  <th>Alamat</th>
                  <th className="text-center">Status</th>
                  <th style={{ width: '120px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="text-center">
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        color: '#475569'
                      }}>
                        {item.foto && item.foto !== 'default.jpg' ? 'IMG' : (item.user.namaLengkap?.charAt(0) || 'S')}
                      </div>
                    </td>
                    <td style={{ fontWeight: '600' }}>{item.user.namaLengkap}</td>
                    <td>{item.user.email}</td>
                    <td style={{ fontFamily: 'monospace' }}>{item.nisn || '-'}</td>
                    <td style={{ fontFamily: 'monospace' }}>{item.nis || '-'}</td>
                    <td>
                      <div className="kelas-badge" style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '700', display: 'inline-block' }}>
                        {item.kelas?.tingkat} {item.kelas?.jurusan?.namaProdi || 'N/A'}
                      </div>
                    </td>

                    <td>{item.angkatan?.namaAngkatan || '-'}</td>
                    <td>{item.jk === 'L' ? 'L' : item.jk === 'P' ? 'P' : '-'}</td>
                    <td>{item.tempat_lahir || '-'}</td>
                    <td>{item.tgl_lahir || '-'}</td>
                    <td>{item.agama || '-'}</td>
                    <td>{item.nohp || '-'}</td>
                    <td>{item.provinsi || '-'}</td>
                    <td>{item.kabupaten || '-'}</td>
                    <td>{item.kecamatan || '-'}</td>
                    <td>{item.desa || '-'}</td>
                    <td title={item.alamat} style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.alamat || '-'}
                    </td>
                    <td>
                      <span className={`status-badge ${item.user.status === 'aktif' ? 'status-aktif' : 'status-nonaktif'}`}>
                        {item.user.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-action-admin primary" onClick={() => startEdit(item)} disabled={saving} title="Edit">
                          <FiEdit2 />
                        </button>
                        <button className="btn-action-admin danger" onClick={() => remove(item)} disabled={saving} title="Hapus">
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

      {/* Unified Form Modal (Add/Edit) */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-container modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
              <button className="modal-close" onClick={handleCloseFormModal} disabled={saving}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="user-alert error" style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiAlertCircle />
                    {error}
                  </div>
                )}
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
                      <label className="label">NIS</label>
                      <input 
                        className="input" 
                        value={nis} 
                        onChange={(e) => setNis(e.target.value.replace(/\D/g, ''))} 
                        placeholder="Hanya angka"
                        disabled={saving} 
                      />
                    </div>
                    <div className="field-wrapper">
                      <label className="label">NISN</label>
                      <input 
                        className="input" 
                        value={nisn} 
                        onChange={(e) => setNisn(e.target.value.replace(/\D/g, ''))} 
                        placeholder="Hanya angka"
                        disabled={saving} 
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field-wrapper">
                      <label className="label">Kelas *</label>
                      <select className="input" value={kelasId} onChange={(e) => setKelasId(e.target.value)} required disabled={saving}>
                        <option value="">Pilih Kelas</option>
                        {kelasList.map(k => {
                          const tingkatLabel = { X: '10', XI: '11', XII: '12', ALUMNI: 'ALUMNI', KI: 'KI' }[k.tingkat] || k.tingkat;
                          const kName = `${tingkatLabel} ${k.jurusan?.kodeProdi || ''} ${k.inisial || ''}`.replace(/\s+$/, '');
                          return (
                            <option key={k.id} value={k.id}>{kName}</option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="field-wrapper">
                      <label className="label">Jenis Kelamin</label>
                      <select className="input" value={jk} onChange={(e) => setJk(e.target.value)} disabled={saving}>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field-wrapper">
                      <label className="label">Tempat Lahir</label>
                      <input className="input" value={tempatLahir} onChange={(e) => setTempatLahir(e.target.value)} disabled={saving} />
                    </div>
                    <div className="field-wrapper">
                      <label className="label">Tanggal Lahir</label>
                      <input className="input" type="date" value={tglLahir} onChange={(e) => setTglLahir(e.target.value)} disabled={saving} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field-wrapper">
                      <label className="label">Agama</label>
                      <input className="input" value={agama} onChange={(e) => setAgama(e.target.value)} disabled={saving} />
                    </div>
                    <div className="field-wrapper">
                      <label className="label">No HP</label>
                      <input 
                        className="input" 
                        value={nohp} 
                        onChange={(e) => setNohp(e.target.value.replace(/\D/g, ''))} 
                        placeholder="Hanya angka"
                        disabled={saving} 
                      />
                    </div>
                  </div>

                  <div className="form-group-title" style={{ margin: '1rem 0 0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#64748b' }}>Alamat Lengkap</div>
                  
                  <div className="form-row">
                    <div className="field-wrapper">
                      <label className="label">Provinsi</label>
                      <input className="input" value={provinsi} onChange={(e) => setProvinsi(e.target.value)} disabled={saving} />
                    </div>
                    <div className="field-wrapper">
                      <label className="label">Kabupaten</label>
                      <input className="input" value={kabupaten} onChange={(e) => setKabupaten(e.target.value)} disabled={saving} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field-wrapper">
                      <label className="label">Kecamatan</label>
                      <input className="input" value={kecamatan} onChange={(e) => setKecamatan(e.target.value)} disabled={saving} />
                    </div>
                    <div className="field-wrapper">
                      <label className="label">Desa</label>
                      <input className="input" value={desa} onChange={(e) => setDesa(e.target.value)} disabled={saving} />
                    </div>
                  </div>

                  <div className="field-wrapper">
                    <label className="label">Alamat Jalan</label>
                    <textarea className="input" style={{ minHeight: '80px', padding: '10px' }} value={alamat} onChange={(e) => setAlamat(e.target.value)} disabled={saving}></textarea>
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
              <div className="modal-footer">
                <button type="button" className="modal-btn modal-btn-cancel" onClick={handleCloseFormModal} disabled={saving}>Batal</button>
                <button type="submit" className="modal-btn modal-btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah Siswa')}
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
              <h3 className="modal-title">Import Siswa dari Excel</h3>
              <button className="modal-close" onClick={() => setShowImportModal(false)} disabled={saving}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="import-instruction">
                <h4>Petunjuk Import:</h4>
                <ol>
                  <li>Gunakan template Excel yang sudah disediakan.</li>
                  <li>Kolom <strong>namaLengkap</strong>, <strong>email</strong>, dan <strong>namaKelas</strong> wajib diisi.</li>
                  <li>Pastikan <strong>namaKelas</strong> sesuai dengan data kelas di sistem (contoh: "X RPL 1").</li>
                  <li>Email yang sudah terdaftar akan otomatis dilewati (skip).</li>
                </ol>
                <a href={`${import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'}/public/templates/template_siswa.xlsx`} className="btn-download-template" download>
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
            <div className="modal-confirm">
              <div className="modal-confirm-header">
                <div className="modal-confirm-icon-box danger">
                  <FiAlertCircle className="modal-icon" />
                </div>
                <h3 className="modal-confirm-title">Hapus Siswa?</h3>
              </div>
              <div className="modal-confirm-body">
                <div className="modal-confirm-text">
                  Yakin ingin menghapus siswa <span className="modal-confirm-item">{confirmData?.namaLengkap}</span>?
                </div>
                <div className="modal-confirm-warning">
                  <FiAlertCircle /> Tindakan ini tidak dapat dibatalkan. Seluruh data nilai siswa ini akan terhapus.
                </div>
              </div>
              <div className="modal-confirm-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)} disabled={saving}>
                  <FiX /> Batal
                </button>
                <button className="btn btn-danger" onClick={handleConfirmDelete} disabled={saving}>
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

export default AdminSiswa;
