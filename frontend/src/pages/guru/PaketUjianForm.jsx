import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './PaketUjian.css';

const isImageFile = (str) => typeof str === 'string' && str.trim().endsWith('.webp');

const TINGKAT_OPTIONS = [
  { value: 'X', label: '10' },
  { value: 'XI', label: '11' },
  { value: 'XII', label: '12' },
  { value: 'SEMUA', label: 'Semua Tingkat' },
];

const TIPE_OPTIONS = [
  { value: 'UH', label: 'UH' },
  { value: 'UTS', label: 'UTS' },
  { value: 'UAS', label: 'UAS' },
  { value: 'Lainnya', label: 'Lainnya' },
];

const KATEGORI_OPTIONS = [
  { value: 'pilgan', label: 'Pilihan Ganda Sederhana' },
  { value: 'pilgan_kompleks', label: 'Pilihan Ganda Kompleks' },
  { value: 'pilgan_kategori', label: 'Pilihan Ganda Kategori' },
];

function tingkatToDisplay(t) {
  if (t === 'X') return '10';
  if (t === 'XI') return '11';
  if (t === 'XII') return '12';
  if (t === 'SEMUA') return 'Semua';
  return t;
}

export default function PaketUjianForm() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [mapelList, setMapelList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [nama, setNama] = useState('');
  const [mataPelajaranId, setMataPelajaranId] = useState('');
  const [tingkat, setTingkat] = useState('SEMUA');
  const [tipeUjian, setTipeUjian] = useState('UH');
  const [bankSoalIds, setBankSoalIds] = useState([]);

  const [soalList, setSoalList] = useState([]);
  const [soalLoading, setSoalLoading] = useState(false);
  const [filterTingkat, setFilterTingkat] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterKoleksi, setFilterKoleksi] = useState('');
  const [koleksiList, setKoleksiList] = useState([]);
  const [bankSoalDefaults, setBankSoalDefaults] = useState(null);
  const [allQuestionsCache, setAllQuestionsCache] = useState({});
  const [showSelectedModal, setShowSelectedModal] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [mapelRes, jurusanRes, koleksiRes] = await Promise.all([
          api.get('/guru/mata-pelajaran'),
          api.get('/guru/jurusan'),
          api.get('/guru/bank-soal-koleksi'),
        ]);
        setMapelList(mapelRes.data?.data || []);
        setJurusanList(jurusanRes.data?.data || []);
        setKoleksiList(koleksiRes.data?.data || []);
      } catch (e) {
        console.error('Load options error:', e);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/guru/paket-ujian/${id}`);
        const row = res.data?.data;
        if (!row) {
          navigate('/guru/paket-ujian', { replace: true });
          return;
        }
        setNama(row.nama || '');
        setMataPelajaranId(row.mataPelajaranId ?? '');
        setTingkat(row.tingkat || 'SEMUA');
        setTipeUjian(row.tipeUjian || 'UH');
        const ids = [];
        const initialCache = {};
        (row.soalPaket || []).forEach((sp) => {
          ids.push(sp.bankSoalId);
          if (sp.bankSoal) {
            initialCache[sp.bankSoalId] = sp.bankSoal;
          }
        });
        setBankSoalIds(ids);
        setAllQuestionsCache((prev) => ({ ...prev, ...initialCache }));
      } catch (e) {
        setFormError(e?.response?.data?.message || 'Gagal memuat paket ujian');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, navigate]);

  const handleKoleksiChange = async (koleksiId) => {
    setFilterKoleksi(koleksiId);
    if (!koleksiId) {
      setBankSoalDefaults(null);
      return;
    }

    try {
      const res = await api.get(`/guru/bank-soal?bankSoalKoleksiId=${koleksiId}`);
      const list = res.data?.data || [];
      if (list.length > 0) {
        const first = list[0];
        const defaults = {
          mataPelajaranId: String(first.mataPelajaranId),
          tingkat: first.tingkat,
          jurusanId: first.jurusanId != null ? String(first.jurusanId) : ''
        };
        setBankSoalDefaults(defaults);
        setMataPelajaranId(defaults.mataPelajaranId);
        setTingkat(defaults.tingkat);
        setFilterTingkat(defaults.tingkat);
        setFilterJurusan(defaults.jurusanId);
      }
    } catch (e) {
      console.error('Failed to auto-adjust from bank soal selection:', e);
    }
  };

  const loadSoal = async () => {
    if (!mataPelajaranId) {
      setSoalList([]);
      return;
    }
    setSoalLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('mataPelajaranId', mataPelajaranId);
      if (filterTingkat) params.set('tingkat', filterTingkat);
      if (filterJurusan !== '') params.set('jurusanId', filterJurusan);
      if (filterKategori) params.set('kategoriSoal', filterKategori);
      if (filterKoleksi) params.set('bankSoalKoleksiId', filterKoleksi);
      const res = await api.get(`/guru/bank-soal?${params.toString()}`);
      const list = res.data?.data || [];
      setSoalList(list);
      setAllQuestionsCache((prev) => {
        const next = { ...prev };
        list.forEach((s) => {
          next[s.id] = s;
        });
        return next;
      });
    } catch (e) {
      setSoalList([]);
    } finally {
      setSoalLoading(false);
    }
  };

  useEffect(() => {
    loadSoal();
  }, [mataPelajaranId, filterTingkat, filterJurusan, filterKategori, filterKoleksi]);

  // Sync filterTingkat when tingkat changes
  useEffect(() => {
    setFilterTingkat(tingkat === 'SEMUA' ? '' : tingkat);
  }, [tingkat]);

  // Auto-reset Bank Soal selection if it is filtered out by Mapel or Tingkat changes
  useEffect(() => {
    if (filterKoleksi) {
      const selectedCol = koleksiList.find((k) => String(k.id) === String(filterKoleksi));
      if (selectedCol) {
        const matchesMapel = !mataPelajaranId || selectedCol.bankSoal?.some(
          (s) => String(s.mataPelajaranId) === String(mataPelajaranId)
        );
        let matchesTingkat = true;
        if (tingkat && tingkat !== 'SEMUA') {
          matchesTingkat = selectedCol.bankSoal?.some(
            (s) => String(s.mataPelajaranId) === String(mataPelajaranId) && (s.tingkat === tingkat || s.tingkat === 'SEMUA')
          );
        }
        if (!matchesMapel || !matchesTingkat) {
          setFilterKoleksi('');
          setBankSoalDefaults(null);
        }
      }
    }
  }, [mataPelajaranId, tingkat, filterKoleksi, koleksiList]);

  const toggleSoal = (soalId) => {
    setBankSoalIds((prev) =>
      prev.includes(soalId) ? prev.filter((x) => x !== soalId) : [...prev, soalId]
    );
  };

  const selectAllSoal = () => {
    const ids = soalList.map((s) => s.id);
    setBankSoalIds((prev) => {
      const set = new Set([...prev, ...ids]);
      return Array.from(set);
    });
  };

  const clearAllSelections = () => {
    setBankSoalIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nama.trim()) {
      showToast('Nama paket wajib diisi.', 'error');
      return;
    }
    if (!mataPelajaranId) {
      showToast('Mata pelajaran wajib dipilih.', 'error');
      return;
    }

    const payload = {
      nama: nama.trim(),
      mataPelajaranId: Number(mataPelajaranId),
      tingkat,
      tipeUjian,
      bankSoalIds,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/guru/paket-ujian/${id}`, payload);
      } else {
        await api.post('/guru/paket-ujian', payload);
      }
      showToast('Paket ujian berhasil disimpan', 'success');
      navigate('/guru/paket-ujian');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal menyimpan paket ujian', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredKoleksiList = (koleksiList || []).filter((k) => {
    if (!mataPelajaranId) return true;
    const matchesMapel = k.bankSoal?.some(
      (s) => String(s.mataPelajaranId) === String(mataPelajaranId)
    );
    if (!matchesMapel) return false;
    if (tingkat && tingkat !== 'SEMUA') {
      const matchesTingkat = k.bankSoal?.some(
        (s) => String(s.mataPelajaranId) === String(mataPelajaranId) && (s.tingkat === tingkat || s.tingkat === 'SEMUA')
      );
      return matchesTingkat;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="paket-ujian-page">
        <div className="paket-ujian-loading">Memuat data paket ujian...</div>
      </div>
    );
  }

  return (
    <div className="paket-ujian-page paket-ujian-form-page">
      <div className="paket-ujian-form-header">
        <button type="button" className="btn-back" onClick={() => navigate('/guru/paket-ujian')}>
          <FiArrowLeft /> Kembali ke Daftar
        </button>
        <h1 className="page-title guru-title">
          <span className="title-text">{isEdit ? 'Edit Paket Ujian' : 'Buat Paket Ujian'}</span>
          <span className="title-badge guru-badge">Guru</span>
        </h1>
        <p className="page-subtitle">
          {isEdit ? 'Ubah data paket dan soal' : 'Isi nama, mapel, tingkat, tipe ujian, lalu pilih soal dari bank soal.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="paket-ujian-form paket-ujian-form-full">

        <div className="form-section">
          <h3 className="form-section-title">Data Paket</h3>
          <div className="form-row two-cols">
            <div className="form-group">
              <label>Nama Paket Ujian *</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: UTS Matematika X 2024"
                required
              />
            </div>
            <div className="form-group">
              <label>Mata Pelajaran *</label>
              <select value={mataPelajaranId} onChange={(e) => setMataPelajaranId(e.target.value)} required>
                <option value="">Pilih Mapel</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.id}>{m.namaMapel} ({m.kodeMapel || '-'})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row two-cols">
            <div className="form-group">
              <label>Tingkat (Kelas) *</label>
              <select value={tingkat} onChange={(e) => setTingkat(e.target.value)} required>
                {TINGKAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tipe Ujian *</label>
              <select value={tipeUjian} onChange={(e) => setTipeUjian(e.target.value)} required>
                {TIPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section form-section-full">
          <h3 className="form-section-title">Pilih Soal dari Bank Soal</h3>
          <p className="form-section-desc">Filter soal lalu centang soal yang akan dimasukkan ke paket.</p>
          <div className="soal-picker-filters">
            <div className="filter-group bank-soal-contrast-wrap" style={{ 
              border: '2px solid #2563eb', 
              borderRadius: '12px', 
              padding: '10px 14px', 
              backgroundColor: '#f0f7ff',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -2px rgba(37, 99, 235, 0.1)',
              transition: 'all 0.2s',
              minWidth: '220px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ 
                  color: '#1e3a8a', 
                  fontWeight: '700', 
                  fontSize: '0.95rem',
                  margin: 0
                }}>
                  Nama Bank Soal
                </label>
                {filterKoleksi && (
                  <button
                    type="button"
                    onClick={() => handleKoleksiChange('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      padding: 0,
                      marginLeft: 'auto'
                    }}
                  >
                    Bersihkan
                  </button>
                )}
              </div>
              <select 
                value={filterKoleksi} 
                onChange={(e) => handleKoleksiChange(e.target.value)}
                style={{
                  margin: 0,
                  border: '1.5px solid #3b82f6',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#1e3a8a',
                  fontWeight: '600',
                  padding: '8px 12px',
                  outline: 'none',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                <option value="">Semua Bank Soal</option>
                {filteredKoleksiList.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
              {bankSoalDefaults && (
                (mataPelajaranId !== bankSoalDefaults.mataPelajaranId ||
                 tingkat !== bankSoalDefaults.tingkat ||
                 filterJurusan !== bankSoalDefaults.jurusanId) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMataPelajaranId(bankSoalDefaults.mataPelajaranId);
                      setTingkat(bankSoalDefaults.tingkat);
                      setFilterTingkat(bankSoalDefaults.tingkat);
                      setFilterJurusan(bankSoalDefaults.jurusanId);
                    }}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '6px 10px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    🔄 Sinkronkan Ulang Form
                  </button>
                )
              )}
            </div>
            <div className="filter-group">
              <label>Tingkat</label>
              <select value={filterTingkat} onChange={(e) => setFilterTingkat(e.target.value)}>
                <option value="">Semua</option>
                {TINGKAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Prodi</label>
              <select value={filterJurusan} onChange={(e) => setFilterJurusan(e.target.value)}>
                <option value="">Semua Prodi</option>
                {jurusanList.map((j) => (
                  <option key={j.id} value={j.id}>{j.namaProdi}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Kategori Soal</label>
              <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}>
                <option value="">Semua</option>
                {KATEGORI_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="soal-picker-table-wrap">
            <div className="soal-picker-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="soal-picker-count" style={{ fontSize: '1rem', color: '#1e293b' }}>
                  Terpilih: <strong style={{ color: '#2563eb', fontSize: '1.1rem' }}>{bankSoalIds.length}</strong> soal
                </span>
                {bankSoalIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSelectedModal(true)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                  >
                    🔍 Tampilkan Soal Terpilih
                  </button>
                )}
              </div>
              <div className="soal-picker-buttons" style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={selectAllSoal}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                >
                  ✓ Centang Semua (di filter)
                </button>
                {bankSoalIds.length > 0 && (
                  <button 
                    type="button" 
                    onClick={clearAllSelections}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(239, 68, 68, 0.2)',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                  >
                    ✗ Hapus Semua Pilihan
                  </button>
                )}
              </div>
            </div>
            {soalLoading ? (
              <div className="soal-picker-loading">Memuat soal...</div>
            ) : soalList.length === 0 ? (
              <div className="soal-picker-empty">
                {!mataPelajaranId
                  ? 'Pilih Mata Pelajaran pada bagian "Data Paket" di atas terlebih dahulu untuk memuat daftar soal.'
                  : 'Tidak ada soal. Sesuaikan filter atau tambah soal di Bank Soal.'}
              </div>
            ) : (
              <table className="soal-picker-table">
                <thead>
                  <tr>
                    <th className="col-check"><span className="sr-only">Pilih</span></th>
                    <th>No</th>
                    <th>Kategori</th>
                    <th>Soal</th>
                    <th>Gambar</th>
                    <th>Jawaban A</th>
                    <th>Jawaban B</th>
                    <th>Jawaban C</th>
                    <th>Jawaban D</th>
                    <th>Jawaban E</th>
                    <th>Kunci Jawaban</th>
                  </tr>
                </thead>
                <tbody>
                  {soalList.map((soal, idx) => (
                    <tr
                      key={soal.id}
                      className={bankSoalIds.includes(soal.id) ? 'row-selected' : ''}
                      onClick={() => toggleSoal(soal.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSoal(soal.id); } }}
                    >
                      <td className="col-check" onClick={(e) => e.stopPropagation()}>
                        <label className="cell-check-label">
                          <input
                            type="checkbox"
                            checked={bankSoalIds.includes(soal.id)}
                            onChange={() => toggleSoal(soal.id)}
                          />
                        </label>
                      </td>
                      <td>{idx + 1}</td>
                      <td>
                        <span className={`badge badge-${soal.kategoriSoal}`}>
                          {KATEGORI_OPTIONS.find((k) => k.value === soal.kategoriSoal)?.label || soal.kategoriSoal}
                        </span>
                      </td>
                      <td className="cell-soal-preview" style={{ maxWidth: '200px' }}>
                        {soal.soal ? (soal.soal.length > 50 ? soal.soal.slice(0, 50) + '…' : soal.soal) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Pernyataan)</span>}
                      </td>
                      <td>
                        {soal.gambar ? (
                          <img 
                            src={soal.gambar.endsWith('.webp') ? `http://localhost:3000/uploads/${soal.gambar}` : soal.gambar} 
                            alt="Soal" 
                            style={{ maxHeight: '40px', borderRadius: '4px', maxWidth: '80px', objectFit: 'contain' }} 
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>-</span>
                        )}
                      </td>
                      <td>
                        {isImageFile(soal.kolomA) ? (
                          <img src={`http://localhost:3000/uploads/${soal.kolomA}`} alt="Opsi A" style={{ maxHeight: '40px', borderRadius: '4px' }} onClick={(e) => e.stopPropagation()} />
                        ) : (
                          soal.kolomA || '-'
                        )}
                      </td>
                      <td>
                        {isImageFile(soal.kolomB) ? (
                          <img src={`http://localhost:3000/uploads/${soal.kolomB}`} alt="Opsi B" style={{ maxHeight: '40px', borderRadius: '4px' }} onClick={(e) => e.stopPropagation()} />
                        ) : (
                          soal.kolomB || '-'
                        )}
                      </td>
                      <td>
                        {isImageFile(soal.kolomC) ? (
                          <img src={`http://localhost:3000/uploads/${soal.kolomC}`} alt="Opsi C" style={{ maxHeight: '40px', borderRadius: '4px' }} onClick={(e) => e.stopPropagation()} />
                        ) : (
                          soal.kolomC || '-'
                        )}
                      </td>
                      <td>
                        {isImageFile(soal.kolomD) ? (
                          <img src={`http://localhost:3000/uploads/${soal.kolomD}`} alt="Opsi D" style={{ maxHeight: '40px', borderRadius: '4px' }} onClick={(e) => e.stopPropagation()} />
                        ) : (
                          soal.kolomD || '-'
                        )}
                      </td>
                      <td>
                        {isImageFile(soal.kolomE) ? (
                          <img src={`http://localhost:3000/uploads/${soal.kolomE}`} alt="Opsi E" style={{ maxHeight: '40px', borderRadius: '4px' }} onClick={(e) => e.stopPropagation()} />
                        ) : (
                          soal.kolomE || '-'
                        )}
                      </td>
                      <td>
                        <span className="badge badge-pilgan">
                          {soal.jawaban}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="form-actions-full">
          <button type="button" className="btn-secondary" onClick={() => navigate('/guru/paket-ujian')}>
            Batal
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Paket Ujian'}
          </button>
        </div>
      </form>

      {/* Selected Questions Modal Overlay */}
      {showSelectedModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: '700' }}>
                  Daftar Soal Terpilih ({bankSoalIds.length})
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Berikut adalah seluruh soal yang saat ini terpilih untuk dimasukkan ke Paket Ujian.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSelectedModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  lineHeight: '1'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
              >
                ×
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1,
              backgroundColor: '#f1f5f9'
            }}>
              {bankSoalIds.map(id => allQuestionsCache[id]).filter(Boolean).length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#64748b',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  Belum ada data soal terpilih yang termuat di cache. Silakan centang soal di bawah.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {bankSoalIds.map(id => allQuestionsCache[id]).filter(Boolean).map((soal, idx) => (
                    <div key={soal.id} style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      padding: '18px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          backgroundColor: '#eff6ff',
                          color: '#1d4ed8',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '4px 8px',
                          borderRadius: '6px'
                        }}>
                          Soal #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSoal(soal.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            padding: '2px 6px'
                          }}
                        >
                          Hapus Pilihan
                        </button>
                      </div>

                      {/* Soal text & image */}
                      <div style={{ color: '#1e293b', fontSize: '0.95rem', fontWeight: '500', lineHeight: '1.5' }}>
                        {soal.soal || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Pernyataan)</span>}
                      </div>

                      {soal.gambar && (
                        <div style={{ marginTop: '4px' }}>
                          <img
                            src={soal.gambar.endsWith('.webp') ? `http://localhost:3000/uploads/${soal.gambar}` : soal.gambar}
                            alt="Soal"
                            style={{ maxHeight: '120px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          />
                        </div>
                      )}

                      {/* Options Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: '8px',
                        marginTop: '4px',
                        backgroundColor: '#f8fafc',
                        padding: '12px',
                        borderRadius: '8px'
                      }}>
                        {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                          const val = soal[`kolom${opt}`];
                          const isCorrect = soal.jawaban === opt;
                          return val ? (
                            <div key={opt} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '0.85rem',
                              color: '#334155',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: isCorrect ? '#ecfdf5' : '#ffffff',
                              border: isCorrect ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                            }}>
                              <strong style={{
                                color: isCorrect ? '#047857' : '#64748b',
                                minWidth: '20px'
                              }}>
                                {opt}.
                              </strong>
                              <div style={{ flex: 1 }}>
                                {isImageFile(val) ? (
                                  <img src={`http://localhost:3000/uploads/${val}`} alt={`Opsi ${opt}`} style={{ maxHeight: '40px', borderRadius: '4px' }} />
                                ) : (
                                  val
                                )}
                              </div>
                              {isCorrect && (
                                <span style={{
                                  marginLeft: 'auto',
                                  fontSize: '0.75rem',
                                  color: '#059669',
                                  fontWeight: '700'
                                }}>
                                  Kunci Jawaban
                                </span>
                              )}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: '#f8fafc'
            }}>
              <button
                type="button"
                onClick={() => setShowSelectedModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#64748b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
