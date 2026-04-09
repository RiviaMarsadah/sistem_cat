import { useEffect, useState } from 'react';
import { FiPlus, FiTrash2, FiClock, FiCalendar, FiBook, FiCheckCircle, FiXCircle, FiX, FiAlertCircle, FiShield } from 'react-icons/fi';
import api from '../../services/api';
import '../guru/PaketUjian.css'; // Recycle PaketUjian CSS layout
import './JadwalUjian.css';

export default function JadwalUjianAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null means create mode

  // Lists for dropdowns
  const [mapelList, setMapelList] = useState([]);
  const [kelasList, setKelasList] = useState([]);

  // Form State
  const [nama, setNama] = useState('');
  const [mataPelajaranId, setMataPelajaranId] = useState('');
  const [mulai, setMulai] = useState('');
  const [selesai, setSelesai] = useState('');
  const [durasi, setDurasi] = useState(60);
  const [opsiKeamanan, setOpsiKeamanan] = useState(true);
  const [selectedKelas, setSelectedKelas] = useState([]); // array of id strings

  // Confirm Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resJadwal, resMapel, resKelas] = await Promise.all([
        api.get('/admin/jadwal-ujian/admin'),
        api.get('/admin/mata-pelajaran'),
        api.get('/admin/kelas')
      ]);
      setItems(resJadwal.data?.data || []);
      setMapelList(resMapel.data?.data || []);
      setKelasList(resKelas.data?.data || []);
    } catch (e) {
      setError('Gagal memuat jadwal. ' + (e?.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const openAddModal = () => {
    setEditingId(null);
    setNama('');
    setMataPelajaranId('');
    
    // Set default times: Today 00:00 to 23:59
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    setMulai(`${dateStr}T00:00`);
    setSelesai(`${dateStr}T23:59`);
    
    setDurasi(60);
    setOpsiKeamanan(true);
    setSelectedKelas([]);
    setShowAddModal(true);
  };

  const openEditModal = (j) => {
    setEditingId(j.id);
    setNama(j.nama);
    setMataPelajaranId(j.mataPelajaranId);
    
    // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatForInput = (dateStr) => {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setMulai(formatForInput(j.mulai));
    setSelesai(formatForInput(j.selesai));
    setDurasi(j.durasi);
    setOpsiKeamanan(j.opsiKeamanan);
    setSelectedKelas((j.kelasJadwal || []).map(kj => String(kj.kelasId)));
    setShowAddModal(true);
  };

  const toggleKelas = (idStr) => {
    if (selectedKelas.includes(idStr)) {
      setSelectedKelas(selectedKelas.filter(k => k !== idStr));
    } else {
      setSelectedKelas([...selectedKelas, idStr]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nama || !mataPelajaranId || !mulai || !selesai || selectedKelas.length === 0) {
      setError('Lengkapi semua data, termasuk kelas.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nama, 
        mataPelajaranId: Number(mataPelajaranId), 
        mulai, 
        selesai, 
        durasi: Number(durasi), 
        opsiKeamanan,
        kelasIds: selectedKelas.map(Number)
      };

      if (editingId) {
        const res = await api.put(`/admin/jadwal-ujian/${editingId}`, payload);
        setSuccess(res.data.message);
      } else {
        const res = await api.post('/admin/jadwal-ujian', payload);
        setSuccess(res.data.message);
      }
      
      setShowAddModal(false);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menyimpan jadwal');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item) => {
    setConfirmData(item);
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await api.delete(`/admin/jadwal-ujian/${confirmData.id}`);
      setShowConfirmModal(false);
      setSuccess(res.data.message);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menghapus jadwal');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="paket-ujian-page">
      <div className="paket-ujian-header">
        <div>
          <h1 className="page-title">
            <span className="title-text">Jadwal Ujian</span>
            <span className="title-badge admin-title-badge">Admin</span>
          </h1>
          <p className="page-subtitle">Buat kerangka jadwal resmi untuk simulasi ujian.</p>
        </div>
        <button className="btn-tambah" onClick={openAddModal} disabled={saving}>
          <FiPlus className="btn-plus" /> Buat Jadwal Baru
        </button>
      </div>

      {error && <div className="paket-ujian-error">{error}</div>}
      {success && <div className="paket-ujian-error admin-success-alert">{success}</div>}

      <div className="paket-ujian-table-wrap">
        {loading ? (
          <div className="paket-ujian-loading">Memuat data jadwal...</div>
        ) : items.length === 0 ? (
          <table className="paket-ujian-table">
            <tbody>
              <tr><td className="empty-row" colSpan={6}>Belum ada jadwal yang dibuat.<br/>Siswa tidak dapat ujian sebelum Anda membuat jadwalnya di sini.</td></tr>
            </tbody>
          </table>
        ) : (
          <table className="paket-ujian-table">
             <thead>
               <tr>
                 <th>Informasi Ujian</th>
                 <th>Mata Pelajaran</th>
                 <th>Kelas & Waktu</th>
                 <th>Token Akses (IN/OUT)</th>
                 <th>Status</th>
                 <th>Aksi</th>
               </tr>
             </thead>
             <tbody>
               {items.map((j) => (
                 <tr key={j.id}>
                    <td>
                      <div className="user-main-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {j.nama}
                        {j.opsiKeamanan && (
                          <span title="Kiosk Mode Aktif" style={{ display: 'inline-flex', alignItems: 'center', color: '#059669', background: '#d1fae5', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>
                             <FiShield style={{marginRight: '3px'}}/> KIOSK
                          </span>
                        )}
                      </div>
                      <div style={{fontSize: '0.8rem', color: '#64748b', marginTop: '4px'}}>
                        Durasi: <strong>{j.durasi} Min</strong>
                      </div>
                    </td>
                    <td>
                      <div className="user-role-badge status-aktif" style={{display: 'inline-flex'}}>
                         <FiBook style={{marginRight: '0.25rem'}} />
                         {j.mataPelajaran?.namaMapel}
                      </div>
                    </td>
                    <td>
                      <div style={{fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem'}}>
                         {j.kelasJadwal?.length || 0} Kelas Terdaftar
                      </div>
                      <div style={{fontSize: '0.75rem', color: '#475569'}}>
                         <FiClock style={{marginRight: '0.25rem', verticalAlign: 'text-bottom'}} />
                         {formatDate(j.mulai)}
                         <br/> s/d <br/> 
                         {formatDate(j.selesai)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.9rem', 
                          background: '#f1f5f9', 
                          padding: '0.3rem 0.6rem', 
                          borderRadius: '6px', 
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          textAlign: 'center'
                        }}>
                           IN: <strong style={{fontSize: '1.1rem'}}>{j.token}</strong>
                        </div>
                        <div style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.9rem', 
                          background: '#fee2e2', 
                          color: '#991b1b', 
                          padding: '0.3rem 0.6rem', 
                          borderRadius: '6px',
                          border: '1px solid #fecaca',
                          textAlign: 'center'
                        }}>
                           OUT: <strong style={{fontSize: '1.1rem'}}>{j.tokenCheckOut}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      {j.paketUjianId ? (
                        <span className="user-status-badge status-aktif">
                          <FiCheckCircle /> Siap Ujian
                        </span>
                      ) : (
                        <span className="user-status-badge status-nonaktif">
                          <FiXCircle /> Belum Diisi Paket
                        </span>
                      )}
                    </td>
                    <td>
                       <div style={{ display: 'flex', gap: '8px' }}>
                         <button className="btn-action" onClick={() => openEditModal(j)} title="Edit Jadwal" style={{background: '#3b82f6', color: 'white'}}>
                            <FiCalendar />
                         </button>
                         <button className="btn-action btn-delete" onClick={() => confirmDelete(j)} title="Hapus Jadwal">
                            <FiTrash2 />
                         </button>
                       </div>
                    </td>
                 </tr>
               ))}
             </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container modal-form">
             <div className="modal-header">
               <h3 className="modal-title">{editingId ? 'Edit Jadwal Resmi' : 'Buat Jadwal Resmi Baru'}</h3>
               <button type="button" className="modal-close" onClick={() => setShowAddModal(false)}>
                 <FiX />
               </button>
             </div>
             <form className="user-form" onSubmit={handleSave}>
               <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                 <div className="form-group">
                    <div className="field-wrapper">
                      <label className="label">Nama Ujian <span className="label-required">*</span></label>
                      <input className="input" placeholder="Misal: PAS Ganjil 2024" value={nama} onChange={(e) => setNama(e.target.value)} required />
                    </div>

                    <div className="field-wrapper">
                      <label className="label">Mata Pelajaran <span className="label-required">*</span></label>
                      <select className="input" value={mataPelajaranId} onChange={(e) => setMataPelajaranId(e.target.value)} required>
                         <option value="">Pilih Mapel...</option>
                         {mapelList.map((m) => <option key={m.id} value={m.id}>{m.namaMapel}</option>)}
                      </select>
                    </div>

                    <div className="form-row">
                      <div className="field-wrapper">
                        <label className="label">Waktu Mulai <span className="label-required">*</span></label>
                        <input type="datetime-local" className="input" value={mulai} onChange={(e) => setMulai(e.target.value)} required />
                      </div>
                      <div className="field-wrapper">
                        <label className="label">Waktu Selesai <span className="label-required">*</span></label>
                        <input type="datetime-local" className="input" value={selesai} onChange={(e) => setSelesai(e.target.value)} required />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="field-wrapper">
                        <label className="label">Durasi Pengerjaan (Menit) <span className="label-required">*</span></label>
                        <input type="number" min="10" className="input" value={durasi} onChange={(e) => setDurasi(e.target.value)} required />
                        <p className="field-hint">Batas waktu ujian.</p>
                      </div>
                      <div className="field-wrapper">
                         <label className="label">Kiosk Mode (Anti-Curang)</label>
                         <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', cursor: 'pointer' }}>
                           <input type="checkbox" checked={opsiKeamanan} onChange={(e) => setOpsiKeamanan(e.target.checked)} style={{transform: 'scale(1.2)'}} />
                           <span style={{ fontSize: '0.9rem', color: '#475569' }}>Aktifkan Kunci Layar</span>
                         </label>
                      </div>
                    </div>

                    <div className="field-wrapper">
                      <label className="label">Kelas Peserta Ujian <span className="label-required">*</span></label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                         {kelasList.map(k => {
                           const tLabel = k.tingkat === 'X' ? '10' : k.tingkat === 'XI' ? '11' : '12';
                           const kName = `${tLabel} ${k.jurusan?.idJurusan || ''} ${k.inisial}`;
                           return (
                             <label key={k.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                               <input type="checkbox" checked={selectedKelas.includes(String(k.id))} onChange={() => toggleKelas(String(k.id))} />
                               <span style={{ fontSize: '0.9rem' }}>{kName}</span>
                             </label>
                           );
                         })}
                      </div>
                    </div>
                 </div>
               </div>
               <div className="modal-footer">
                  <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowAddModal(false)}>Batal</button>
                  <button type="submit" className="modal-btn modal-btn-confirm modal-btn-primary" disabled={saving}>
                    {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Buat Jadwal'}
                  </button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* Conform Delete */}
      {showConfirmModal && confirmData && (
        <div className="modal-overlay">
          <div className="modal-container modal-confirm">
             <div className="modal-header">
               <h3 className="modal-title">Hapus Jadwal?</h3>
               <button className="modal-close" onClick={() => setShowConfirmModal(false)}><FiX /></button>
             </div>
             <div className="modal-body">
               Apakah Anda yakin menghapus <strong>"{confirmData.nama}"</strong>? Seluruh record ujian siswa (jika ada) di jadwal ini juga akan terhapus.
             </div>
             <div className="modal-footer">
               <button className="modal-btn modal-btn-cancel" onClick={() => setShowConfirmModal(false)}>Batal</button>
               <button className="modal-btn modal-btn-danger" onClick={handleDelete} disabled={saving}>
                 {saving ? 'Menghapus...' : 'Hapus Jadwal'}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
