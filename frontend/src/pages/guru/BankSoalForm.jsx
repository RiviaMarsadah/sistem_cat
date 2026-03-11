import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiArrowLeft } from 'react-icons/fi';
import api from '../../services/api';
import './BankSoal.css';

const KATEGORI_OPTIONS = [
  { value: 'single_choice', label: 'Single Choice (Pilihan Ganda)' },
  { value: 'multi_choice', label: 'Multi Choice (Banyak Jawaban Benar)' },
  { value: 'benar_salah', label: 'Pernyataan Benar/Salah' },
];

const KOLOM_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const TINGKAT_OPTIONS = [
  { value: '10', api: 'X', label: '10' },
  { value: '11', api: 'XI', label: '11' },
  { value: '12', api: 'XII', label: '12' },
  { value: '0', api: 'SEMUA', label: 'Semua Tingkat' },
];

const emptyKolom = () => ({ A: '', B: '', C: '', D: '', E: '', F: '' });

function displayToTingkatApi(v) {
  if (v === '10') return 'X';
  if (v === '11') return 'XI';
  if (v === '12') return 'XII';
  if (v === '0') return 'SEMUA';
  return v;
}
function apiToTingkatDisplay(t) {
  if (t === 'X') return '10';
  if (t === 'XI') return '11';
  if (t === 'XII') return '12';
  if (t === 'SEMUA') return '0';
  return t;
}

export default function BankSoalForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [mapelList, setMapelList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [mataPelajaranId, setMataPelajaranId] = useState('');
  const [tingkat, setTingkat] = useState('10');
  const [jurusanId, setJurusanId] = useState('');
  const [kategoriSoal, setKategoriSoal] = useState('single_choice');
  const [soal, setSoal] = useState('');
  const [kolom, setKolom] = useState(emptyKolom());
  const [jawaban, setJawaban] = useState({ single: '', multi: [], benarSalah: emptyKolom() });
  const [gambar, setGambar] = useState('');

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
        const res = await api.get(`/guru/bank-soal/${id}`);
        const row = res.data?.data;
        if (!row) {
          navigate('/guru/bank-soal', { replace: true });
          return;
        }
        setMataPelajaranId(row.mataPelajaranId ?? '');
        setTingkat(apiToTingkatDisplay(row.tingkat) ?? '10');
        setJurusanId(row.jurusanId != null ? String(row.jurusanId) : '');
        setKategoriSoal(row.kategoriSoal || 'single_choice');
        setSoal(row.soal || '');
        setKolom({
          A: row.kolomA || '',
          B: row.kolomB || '',
          C: row.kolomC || '',
          D: row.kolomD || '',
          E: row.kolomE || '',
          F: row.kolomF || '',
        });
        setGambar(row.gambar || '');
        if (row.kategoriSoal === 'single_choice') {
          setJawaban((j) => ({ ...j, single: row.jawaban || '' }));
        } else if (row.kategoriSoal === 'multi_choice') {
          setJawaban((j) => ({ ...j, multi: (row.jawaban || '').split(',').map((s) => s.trim()).filter(Boolean) }));
        } else {
          const parts = (row.jawaban || '').split(',').map((s) => s.trim().toUpperCase());
          const k = { A: row.kolomA || '', B: row.kolomB || '', C: row.kolomC || '', D: row.kolomD || '', E: row.kolomE || '', F: row.kolomF || '' };
          const filledLetters = KOLOM_LABELS.filter((l) => k[l]?.trim());
          const bs = emptyKolom();
          filledLetters.forEach((l, i) => { bs[l] = parts[i] === 'S' ? 'S' : 'B'; });
          setJawaban((j) => ({ ...j, benarSalah: bs }));
        }
      } catch (e) {
        setFormError(e?.response?.data?.message || 'Gagal memuat data soal');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, navigate]);

  const buildJawabanValue = () => {
    if (kategoriSoal === 'single_choice') return jawaban.single;
    if (kategoriSoal === 'multi_choice') return jawaban.multi.sort().join(',');
    if (kategoriSoal === 'benar_salah') {
      const filled = KOLOM_LABELS.filter((l) => kolom[l]?.trim());
      return filled.map((l) => (jawaban.benarSalah[l] === 'S' ? 'S' : 'B')).join(',');
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const filledKolom = KOLOM_LABELS.filter((l) => kolom[l]?.trim()).length;
    if (kategoriSoal !== 'benar_salah' && filledKolom < 3) {
      setFormError('Minimal 3 kolom jawaban harus diisi.');
      return;
    }
    if (kategoriSoal === 'single_choice' && !jawaban.single) {
      setFormError('Pilih satu jawaban yang benar.');
      return;
    }
    if (kategoriSoal === 'multi_choice' && jawaban.multi.length === 0) {
      setFormError('Pilih minimal satu jawaban benar.');
      return;
    }
    if ((kategoriSoal === 'single_choice' || kategoriSoal === 'multi_choice') && !soal.trim()) {
      setFormError('Pertanyaan wajib diisi.');
      return;
    }
    if (!mataPelajaranId || !tingkat) {
      setFormError('Mata pelajaran dan tingkat wajib dipilih.');
      return;
    }

    const payload = {
      mataPelajaranId: Number(mataPelajaranId),
      tingkat: displayToTingkatApi(tingkat),
      jurusanId: jurusanId === '' ? null : Number(jurusanId),
      kategoriSoal,
      soal: soal.trim() || null,
      kolomA: kolom.A || null,
      kolomB: kolom.B || null,
      kolomC: kolom.C || null,
      kolomD: kolom.D || null,
      kolomE: kolom.E || null,
      kolomF: kolom.F || null,
      jawaban: buildJawabanValue(),
      gambar: gambar.trim() || null,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/guru/bank-soal/${id}`, payload);
      } else {
        await api.post('/guru/bank-soal', payload);
      }
      navigate('/guru/bank-soal');
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Gagal menyimpan soal');
    } finally {
      setSaving(false);
    }
  };

  const toggleMulti = (letter) => {
    setJawaban((j) => ({
      ...j,
      multi: j.multi.includes(letter) ? j.multi.filter((x) => x !== letter) : [...j.multi, letter],
    }));
  };

  const setBenarSalah = (letter, value) => {
    setJawaban((j) => ({
      ...j,
      benarSalah: { ...j.benarSalah, [letter]: value },
    }));
  };

  if (loading) {
    return (
      <div className="bank-soal-page">
        <div className="bank-soal-loading">Memuat data soal...</div>
      </div>
    );
  }

  return (
    <div className="bank-soal-page bank-soal-form-page">
      <div className="bank-soal-form-header">
        <button type="button" className="btn-back" onClick={() => navigate('/guru/bank-soal')}>
          <FiArrowLeft /> Kembali ke Daftar
        </button>
        <h1 className="page-title guru-title">
          <span className="title-text">{isEdit ? 'Edit Soal' : 'Tambah Soal'}</span>
          <span className="title-badge guru-badge">Guru</span>
        </h1>
        <p className="page-subtitle">
          {isEdit ? 'Ubah data soal' : 'Isi form di bawah. Data tidak hilang saat pindah halaman.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bank-soal-form bank-soal-form-full">
        {formError && <div className="form-error">{formError}</div>}

        <div className="form-section">
          <h3 className="form-section-title">Data Soal</h3>
          <p className="form-section-desc">
            {isEdit ? 'Ubah data soal. Mata pelajaran, tingkat, prodi, dan jawaban.' : 'Isi mapel, tingkat, prodi, kategori, pertanyaan, dan jawaban.'}
          </p>

          <div className="form-row two-cols">
            <div className="form-group">
              <label>Mata Pelajaran *</label>
              <select value={mataPelajaranId} onChange={(e) => setMataPelajaranId(e.target.value)} required>
                <option value="">Pilih Mapel</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.id}>{m.namaMapel}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tingkat (Kelas) *</label>
              <select value={tingkat} onChange={(e) => setTingkat(e.target.value)} required>
                {TINGKAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Prodi</label>
            <select value={jurusanId} onChange={(e) => setJurusanId(e.target.value)}>
              <option value="">Semua Prodi</option>
              {jurusanList.map((j) => (
                <option key={j.id} value={j.id}>{j.nama} ({j.idJurusan})</option>
              ))}
            </select>
            <p className="field-hint">Kosongkan = untuk semua prodi; pilih satu = hanya prodi tersebut.</p>
          </div>

          <div className="form-group">
            <label>Kategori Soal *</label>
            <select value={kategoriSoal} onChange={(e) => setKategoriSoal(e.target.value)}>
              {KATEGORI_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {(kategoriSoal === 'single_choice' || kategoriSoal === 'multi_choice') && (
            <>
              <div className="form-group">
                <label>Pertanyaan *</label>
                <textarea value={soal} onChange={(e) => setSoal(e.target.value)} rows={4} placeholder="Tulis pertanyaan..." required />
              </div>
              <div className="form-group">
                <label>URL Gambar (opsional)</label>
                <input type="text" value={gambar} onChange={(e) => setGambar(e.target.value)} placeholder="https://..." />
              </div>
            </>
          )}

          {kategoriSoal === 'benar_salah' && (
            <>
              <div className="form-group">
                <label>Pertanyaan (opsional)</label>
                <textarea value={soal} onChange={(e) => setSoal(e.target.value)} rows={4} placeholder="Tulis pertanyaan atau konteks untuk pernyataan di bawah (opsional)..." />
              </div>
              <div className="form-group">
                <label>URL Gambar (opsional)</label>
                <input type="text" value={gambar} onChange={(e) => setGambar(e.target.value)} placeholder="https://..." />
              </div>
            </>
          )}

          <div className="form-group">
            <label>{kategoriSoal === 'benar_salah' ? 'Pernyataan (isi di kolom A–F)' : 'Opsi Jawaban (minimal 3)'}</label>
            {KOLOM_LABELS.map((letter) => (
              <div key={letter} className="kolom-row">
                <span className="kolom-letter">{letter}.</span>
                <input
                  type="text"
                  value={kolom[letter]}
                  onChange={(e) => setKolom((k) => ({ ...k, [letter]: e.target.value }))}
                  placeholder={kategoriSoal === 'benar_salah' ? `Pernyataan ${letter}` : `Opsi ${letter}`}
                />
                {kategoriSoal === 'single_choice' && (
                  <button
                    type="button"
                    className={`btn-check ${jawaban.single === letter ? 'active' : ''}`}
                    onClick={() => setJawaban((j) => ({ ...j, single: letter }))}
                    title="Jawaban benar"
                  >
                    <FiCheck />
                  </button>
                )}
                {kategoriSoal === 'multi_choice' && (
                  <button
                    type="button"
                    className={`btn-check ${jawaban.multi.includes(letter) ? 'active' : ''}`}
                    onClick={() => toggleMulti(letter)}
                    title="Centang jika benar"
                  >
                    <FiCheck />
                  </button>
                )}
                {kategoriSoal === 'benar_salah' && (
                  <div className="benar-salah-btns">
                    <button
                      type="button"
                      className={jawaban.benarSalah[letter] === 'B' ? 'active' : ''}
                      onClick={() => setBenarSalah(letter, 'B')}
                    >
                      Benar
                    </button>
                    <button
                      type="button"
                      className={jawaban.benarSalah[letter] === 'S' ? 'active' : ''}
                      onClick={() => setBenarSalah(letter, 'S')}
                    >
                      Salah
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="form-actions-full">
            <button type="button" className="btn-secondary" onClick={() => navigate('/guru/bank-soal')}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan Soal')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
