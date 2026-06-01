import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiX, FiCheckCircle, FiAlertCircle, FiChevronLeft, FiChevronRight, FiUsers } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import '../guru/PaketUjian.css';
import './Kelas.css';

const getTingkatLabel = (tingkat) => {
  const map = { X: '10', XI: '11', XII: '12', ALUMNI: 'ALUMNI', KI: 'KI' };
  return map[tingkat] || tingkat;
};

const getNamaKelasDisplay = (item) => {
  if (!item.tingkat || !item.jurusan || !item.inisial) return '-';
  const kode = item.jurusan.kodeProdi || '';
  return `${getTingkatLabel(item.tingkat)} ${kode} ${item.inisial}`;
};

const AdminKelas = () => {
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

  // Student popup modal states
  const [showSiswaModal, setShowSiswaModal] = useState(false);
  const [siswaLoading, setSiswaLoading] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [siswaList, setSiswaList] = useState([]);
  const [siswaSearch, setSiswaSearch] = useState('');
  const [allSiswaList, setAllSiswaList] = useState([]);

  const filteredItems = useMemo(() => {
    return items.filter(k => {
      const namaKelas = getNamaKelasDisplay(k).toLowerCase();
      const jurusan = k.jurusan?.nama?.toLowerCase() || '';
      const query = search.toLowerCase();
      return namaKelas.includes(query) || jurusan.includes(query);
    });
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
    try {
      const [resKelas, resSiswa] = await Promise.all([
        api.get('/admin/kelas'),
        api.get('/admin/siswa')
      ]);
      setItems(resKelas.data.data || []);
      setAllSiswaList(resSiswa.data.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal memuat data kelas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJurusan();
    load();
  }, []);

  const openSiswaModal = async (kelasItem) => {
    setSelectedKelas(kelasItem);
    setShowSiswaModal(true);
    setSiswaLoading(true);
    setSiswaSearch('');
    try {
      const res = await api.get('/admin/siswa');
      const allSiswa = res.data.data || [];
      setAllSiswaList(allSiswa);
      const filtered = allSiswa.filter(s => s.kelasId === kelasItem.id);
      setSiswaList(filtered);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal memuat daftar siswa', 'error');
    } finally {
      setSiswaLoading(false);
    }
  };

  const filteredSiswa = useMemo(() => {
    let result = siswaList;
    if (siswaSearch.trim()) {
      const query = siswaSearch.toLowerCase();
      result = siswaList.filter(s => 
        s.user.namaLengkap.toLowerCase().includes(query) ||
        s.user.email.toLowerCase().includes(query) ||
        (s.nis && s.nis.toLowerCase().includes(query)) ||
        (s.nisn && s.nisn.toLowerCase().includes(query))
      );
    }
    // Urutkan per abjad (A-Z) berdasarkan namaLengkap
    return [...result].sort((a, b) => {
      const nameA = (a.user?.namaLengkap || '').toLowerCase();
      const nameB = (b.user?.namaLengkap || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [siswaList, siswaSearch]);

  const handleOpenAddModal = () => {
    setTingkat('');
    setJurusanId('');
    setInisial('');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setTingkat('');
    setJurusanId('');
    setInisial('');
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!tingkat || !jurusanId || !inisial.trim()) return;

    setSaving(true);
    try {
      await api.post('/admin/kelas', {
        tingkat,
        jurusanId: parseInt(jurusanId),
        inisial: inisial.trim().toUpperCase()
      });
      showToast('Kelas berhasil ditambahkan', 'success');
      handleCloseAddModal();
      await load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal menambah kelas', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (confirmAction === 'delete') {
      setSaving(true);
      try {
        await api.delete(`/admin/kelas/${confirmData.id}`);
        showToast('Kelas berhasil dihapus', 'success');
        await load();
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmData(null);
      } catch (err) {
        showToast(err?.response?.data?.message || 'Gagal menghapus kelas', 'error');
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
    try {
      await api.put(`/admin/kelas/${editingId}`, { 
        tingkat: editingTingkat,
        jurusanId: parseInt(editingJurusanId),
        inisial: editingInisial.trim().toUpperCase()
      });
      showToast('Kelas berhasil diperbarui', 'success');
      cancelEdit();
      await load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal mengubah kelas', 'error');
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


  return (
    <div className="admin-kelas-page">
      <div className="kelas-header">
        <div>
          <h1 className="kelas-title">
            <span className="title-text">Kelas</span>
            <span className="title-badge">Admin</span>
          </h1>
          <p className="kelas-subtitle">Manajemen data kelas, pembagian rombongan belajar, dan pemetaan tingkat kelas.</p>
        </div>
        <div className="kelas-meta">
          <div className="meta-card">
            <div className="meta-label">Total</div>
            <div className="meta-value">{count}</div>
          </div>
        </div>
      </div>



      <div className="kelas-card">
        <div className="kelas-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 className="kelas-card-title">Daftar Kelas</h2>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Cari kelas..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <button className="btn-add-kelas" onClick={handleOpenAddModal} disabled={saving}>
            <FiPlus />
            <span>Tambah Kelas</span>
          </button>
        </div>

        {loading ? (
          <div className="kelas-empty">Loading...</div>
        ) : items.length === 0 ? (
          <div className="kelas-empty">Belum ada kelas</div>
        ) : (
          <div className="kelas-table-wrap">
            <style>{`
               .clickable-row:hover { background-color: #f8fafc !important; }
               .kelas-table th.text-center,
               .kelas-table td.text-center {
                 text-align: center !important;
               }
            `}</style>
            <table className="kelas-table">
              <thead>
                <tr>
                  <th>Tingkat</th>
                  <th>Jurusan</th>
                  <th>Inisial</th>
                  <th className="text-center" style={{ width: '100px' }}>Siswa</th>
                  <th className="text-center" style={{ width: '150px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className="clickable-row">
                      <td style={{ verticalAlign: 'middle' }}>
                        {isEditing ? (
                          <select
                            className="input small"
                            value={editingTingkat}
                            onChange={(e) => setEditingTingkat(e.target.value)}
                            disabled={saving}
                            required
                            style={{ margin: 0, width: '100%' }}
                          >
                            <option value="">Pilih</option>
                            <option value="X">10</option>
                            <option value="XI">11</option>
                            <option value="XII">12</option>
                            <option value="ALUMNI">Alumni</option>
                            <option value="KI">KI</option>
                          </select>
                        ) : (
                          <div className="tingkat-text">{getTingkatLabel(item.tingkat)}</div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        {isEditing ? (
                          <select
                            className="input small"
                            value={editingJurusanId}
                            onChange={(e) => setEditingJurusanId(e.target.value)}
                            disabled={saving}
                            required
                            style={{ margin: 0, width: '100%' }}
                          >
                            <option value="">Pilih Jurusan</option>
                            {jurusanList.map((jurusan) => (
                              <option key={jurusan.id} value={jurusan.id}>
                                {jurusan.kodeProdi} - {jurusan.namaProdi}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="jurusan-text">
                            {item.jurusan ? `${item.jurusan.kodeProdi} - ${item.jurusan.namaProdi}` : '-'}
                          </div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        {isEditing ? (
                          <input
                            className="input small"
                            placeholder="Inisial"
                            value={editingInisial}
                            onChange={(e) => setEditingInisial(e.target.value.toUpperCase())}
                            disabled={saving}
                            maxLength={10}
                            required
                            style={{ margin: 0, width: '100%' }}
                          />
                        ) : (
                          <div className="inisial-text">{item.inisial}</div>
                        )}
                      </td>
                      <td className="text-center" style={{ verticalAlign: 'middle' }}>
                        <span style={{ 
                          fontWeight: '700', 
                          color: '#4f46e5', 
                          background: '#e0e7ff', 
                          padding: '4px 10px', 
                          borderRadius: '999px',
                          fontSize: '0.85rem'
                        }}>
                          {allSiswaList.filter(s => s.kelasId === item.id).length}
                        </span>
                      </td>
                      <td className="text-center" style={{ verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {isEditing ? (
                            <>
                              <button className="btn-action primary" type="button" onClick={saveEdit} disabled={saving || !editingTingkat || !editingJurusanId || !editingInisial.trim()} title="Simpan" style={{ background: '#10b981', color: 'white' }}>
                                <FiSave />
                              </button>
                              <button className="btn-action" type="button" onClick={cancelEdit} disabled={saving} title="Batal" style={{ background: '#64748b', color: 'white' }}>
                                <FiX />
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="btn-action" type="button" onClick={() => openSiswaModal(item)} disabled={saving} title="Daftar Siswa" style={{ background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', width: 'auto', borderRadius: '6px' }}>
                                <FiUsers />
                                <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>List</span>
                              </button>
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
              {currentPage === 9999 ? filteredItems.length : Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} dari {filteredItems.length} kelas
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

      {/* Add Kelas Modal */}
      {showAddModal && (
        <div className="modal-overlay">
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
                        <option value="X">10 (Kelas X)</option>
                        <option value="XI">11 (Kelas XI)</option>
                        <option value="XII">12 (Kelas XII)</option>
                        <option value="ALUMNI">Alumni</option>
                        <option value="KI">KI (Keterampilan)</option>
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
                            {jurusan.kodeProdi} - {jurusan.namaProdi}
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

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm">
              <div className="modal-confirm-header">
                <div className={`modal-confirm-icon-box danger`}>
                  <FiAlertCircle className="modal-icon" />
                </div>
                <h3 className="modal-confirm-title">Hapus Kelas?</h3>
              </div>
              <div className="modal-confirm-body">
                <div className="modal-confirm-text">
                  Yakin ingin menghapus kelas <span className="modal-confirm-item">{getTingkatLabel(confirmData?.tingkat)} {confirmData?.jurusanNama} {confirmData?.inisial}</span>?
                </div>
                <div className="modal-confirm-warning">
                  <FiAlertCircle /> Tindakan ini tidak dapat dibatalkan.
                </div>
              </div>
              <div className="modal-confirm-footer">
                <button className="btn btn-secondary" onClick={handleCancelConfirm} disabled={saving}>
                  <FiX /> Batal
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleConfirm}
                  disabled={saving}
                >
                  {saving ? (
                    'Memproses...'
                  ) : (
                    <>
                      <FiTrash2 />
                      Ya, Hapus
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student List Modal Popup */}
      {showSiswaModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-container modal-form" style={{ maxWidth: '650px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiUsers style={{ color: '#8b5cf6' }} />
                <span>Siswa Kelas: {selectedKelas ? getNamaKelasDisplay(selectedKelas) : ''}</span>
              </h3>
              <button className="modal-close" onClick={() => setShowSiswaModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem 2rem' }}>
              <div className="search-box" style={{ width: '100%', marginBottom: '1.25rem' }}>
                <input 
                  type="text" 
                  placeholder="Cari nama, email, NIS, atau NISN siswa..." 
                  value={siswaSearch}
                  onChange={(e) => setSiswaSearch(e.target.value)}
                  className="input"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '8px', 
                    border: '2px solid #e2e8f0',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#ffffff' }}>
                {siswaLoading ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="spinner" style={{ borderColor: '#e2e8f0', borderTopColor: '#8b5cf6', width: '28px', height: '28px' }}></span>
                    <span>Memuat data siswa...</span>
                  </div>
                ) : filteredSiswa.length === 0 ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    {siswaSearch ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Belum ada siswa terdaftar di kelas ini'}
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>No</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Nama</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Identitas</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>JK</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSiswa.map((siswa, idx) => (
                        <tr key={siswa.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{siswa.user.namaLengkap}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{siswa.user.email}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#475569' }}>
                            <div>NIS: {siswa.nis || '-'}</div>
                            <div>NISN: {siswa.nisn || '-'}</div>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: '#475569', fontWeight: '600' }}>{siswa.jk || '-'}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              background: siswa.user.status === 'aktif' ? '#dcfce7' : '#fee2e2',
                              color: siswa.user.status === 'aktif' ? '#15803d' : '#b91c1c',
                              textTransform: 'capitalize'
                            }}>
                              {siswa.user.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '1.25rem 2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', marginTop: 0 }}>
              <button className="btn" type="button" onClick={() => setShowSiswaModal(false)} style={{ background: '#64748b', color: 'white', border: 'none', borderRadius: '8px' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKelas;

