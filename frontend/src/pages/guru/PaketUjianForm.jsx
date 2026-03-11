import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import api from '../../services/api';
import './PaketUjian.css';

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
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multi_choice', label: 'Multi Choice' },
  { value: 'benar_salah', label: 'Benar/Salah' },
];

function tingkatToDisplay(t) {
  if (t === 'X') return '10';
  if (t === 'XI') return '11';
  if (t === 'XII') return '12';
  if (t === 'SEMUA') return 'Semua';
  return t;
}

export default function PaketUjianForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [mapelList, setMapelList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [nama, setNama] = useState('');
  const [mataPelajaranId, setMataPelajaranId] = useState('');
  const [tingkat, setTingkat] = useState('X');
  const [tipeUjian, setTipeUjian] = useState('UH');
  const [tokenCheckIn, setTokenCheckIn] = useState('');
  const [tokenCheckOut, setTokenCheckOut] = useState('');
  const [bankSoalIds, setBankSoalIds] = useState([]);

  const [soalList, setSoalList] = useState([]);
  const [soalLoading, setSoalLoading] = useState(false);
  const [filterMapel, setFilterMapel] = useState('');
  const [filterTingkat, setFilterTingkat] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [mapelRes, jurusanRes] = await Promise.all([
          api.get('/guru/mata-pelajaran'),
          api.get('/guru/jurusan'),
        ]);
        setMapelList(mapelRes.data?.data || []);
        setJurusanList(jurusanRes.data?.data || []);
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
        setTingkat(row.tingkat || 'X');
        setTipeUjian(row.tipeUjian || 'UH');
        setTokenCheckIn(row.tokenCheckIn || '');
        setTokenCheckOut(row.tokenCheckOut || '');
        const ids = (row.soalPaket || []).map((sp) => sp.bankSoalId);
        setBankSoalIds(ids);
      } catch (e) {
        setFormError(e?.response?.data?.message || 'Gagal memuat paket ujian');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, navigate]);

  const loadSoal = async () => {
    setSoalLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterMapel) params.set('mataPelajaranId', filterMapel);
      if (filterTingkat) params.set('tingkat', filterTingkat);
      if (filterJurusan !== '') params.set('jurusanId', filterJurusan);
      if (filterKategori) params.set('kategoriSoal', filterKategori);
      const res = await api.get(`/guru/bank-soal?${params.toString()}`);
      setSoalList(res.data?.data || []);
    } catch (e) {
      setSoalList([]);
    } finally {
      setSoalLoading(false);
    }
  };

  useEffect(() => {
    loadSoal();
  }, [filterMapel, filterTingkat, filterJurusan, filterKategori]);

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

  const clearAllSoal = () => {
    const ids = soalList.map((s) => s.id);
    setBankSoalIds((prev) => prev.filter((x) => !ids.includes(x)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!nama.trim()) {
      setFormError('Nama paket wajib diisi.');
      return;
    }
    if (!mataPelajaranId) {
      setFormError('Mata pelajaran wajib dipilih.');
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
        const res = await api.post('/guru/paket-ujian', payload);
        setTokenCheckIn(res.data?.data?.tokenCheckIn || '');
        setTokenCheckOut(res.data?.data?.tokenCheckOut || '');
      }
      navigate('/guru/paket-ujian');
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Gagal menyimpan paket ujian');
    } finally {
      setSaving(false);
    }
  };

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
        {formError && <div className="form-error">{formError}</div>}

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
                  <option key={m.id} value={m.id}>{m.namaMapel}</option>
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
          {(tokenCheckIn || tokenCheckOut) && (
            <div className="form-row two-cols token-row">
              <div className="form-group">
                <label>Token Check-in (6 digit)</label>
                <input type="text" value={tokenCheckIn} readOnly className="token-input" />
              </div>
              <div className="form-group">
                <label>Token Checkout (6 digit)</label>
                <input type="text" value={tokenCheckOut} readOnly className="token-input" />
              </div>
            </div>
          )}
        </div>

        <div className="form-section form-section-full">
          <h3 className="form-section-title">Pilih Soal dari Bank Soal</h3>
          <p className="form-section-desc">Filter soal lalu centang soal yang akan dimasukkan ke paket.</p>
          <div className="soal-picker-filters">
            <div className="filter-group">
              <label>Mapel</label>
              <select value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)}>
                <option value="">Semua Mapel</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.id}>{m.namaMapel}</option>
                ))}
              </select>
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
                  <option key={j.id} value={j.id}>{j.nama}</option>
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
            <div className="soal-picker-actions">
              <span className="soal-picker-count">Terpilih: <strong>{bankSoalIds.length}</strong> soal</span>
              <div className="soal-picker-buttons">
                <button type="button" className="btn-secondary" onClick={selectAllSoal}>Centang Semua (di filter)</button>
                <button type="button" className="btn-secondary" onClick={clearAllSoal}>Hapus Centang (di filter)</button>
              </div>
            </div>
            {soalLoading ? (
              <div className="soal-picker-loading">Memuat soal...</div>
            ) : soalList.length === 0 ? (
              <div className="soal-picker-empty">Tidak ada soal. Sesuaikan filter atau tambah soal di Bank Soal.</div>
            ) : (
              <table className="soal-picker-table">
                <thead>
                  <tr>
                    <th className="col-check"><span className="sr-only">Pilih</span></th>
                    <th>No</th>
                    <th>Mapel</th>
                    <th>Tingkat</th>
                    <th>Prodi</th>
                    <th>Kategori</th>
                    <th>Soal / Pernyataan</th>
                    <th>Jawaban</th>
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
                      <td>{soal.mataPelajaran?.namaMapel}</td>
                      <td>{tingkatToDisplay(soal.tingkat)}</td>
                      <td>{soal.jurusan ? soal.jurusan.nama : 'Semua Prodi'}</td>
                      <td>
                        <span className={`badge badge-${soal.kategoriSoal}`}>
                          {KATEGORI_OPTIONS.find((k) => k.value === soal.kategoriSoal)?.label || soal.kategoriSoal}
                        </span>
                      </td>
                      <td className="cell-soal-preview">
                        {soal.soal ? soal.soal.slice(0, 80) + (soal.soal.length > 80 ? '…' : '') : '(Pernyataan di kolom A-F)'}
                      </td>
                      <td>{soal.jawaban}</td>
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
    </div>
  );
}
