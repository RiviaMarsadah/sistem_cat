import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiCheck, FiArrowLeft } from 'react-icons/fi';
import api from '../../services/api';
import './BankSoal.css';

const KATEGORI_OPTIONS = [
  { value: 'pilgan', label: 'Pilihan Ganda Sederhana' },
  { value: 'pilgan_kompleks', label: 'Pilihan Ganda Kompleks' },
  { value: 'pilgan_kategori', label: 'Pilihan Ganda Kategori' },
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
  const [searchParams] = useSearchParams();
  const queryKoleksiId = searchParams.get('bankSoalKoleksiId');
  const [hasPrefilledKoleksi, setHasPrefilledKoleksi] = useState(false);

  const [mapelList, setMapelList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
  const [koleksiList, setKoleksiList] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [modeKoleksi, setModeKoleksi] = useState('pilih');
  const [bankSoalKoleksiId, setBankSoalKoleksiId] = useState('');
  const [namaKoleksiBaru, setNamaKoleksiBaru] = useState('');
  const [mataPelajaranId, setMataPelajaranId] = useState('');
  const [tingkat, setTingkat] = useState('10');
  const [jurusanId, setJurusanId] = useState('');
  const [kategoriSoal, setKategoriSoal] = useState('pilgan');
  const [soal, setSoal] = useState('');
  const [kolom, setKolom] = useState(emptyKolom());
  const [jawaban, setJawaban] = useState({ single: '', multi: [], benarSalah: emptyKolom() });
  const [gambar, setGambar] = useState('');

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
    if (!isEdit && queryKoleksiId) {
      setBankSoalKoleksiId(queryKoleksiId);
      setModeKoleksi('pilih');
      
      const fetchKoleksiQuestions = async () => {
        try {
          const res = await api.get(`/guru/bank-soal?bankSoalKoleksiId=${queryKoleksiId}`);
          const questions = res.data?.data || [];
          if (questions.length > 0) {
            const first = questions[0];
            setMataPelajaranId(first.mataPelajaranId ?? '');
            setTingkat(apiToTingkatDisplay(first.tingkat) ?? '10');
            setJurusanId(first.jurusanId != null ? String(first.jurusanId) : '');
            setHasPrefilledKoleksi(true);
          }
        } catch (e) {
          console.error('Fetch koleksi questions error:', e);
        }
      };
      fetchKoleksiQuestions();
    }
  }, [queryKoleksiId, isEdit]);

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
        setBankSoalKoleksiId(row.bankSoalKoleksiId != null ? String(row.bankSoalKoleksiId) : '');
        setModeKoleksi(row.bankSoalKoleksiId != null ? 'pilih' : 'buat');
        setMataPelajaranId(row.mataPelajaranId ?? '');
        setTingkat(apiToTingkatDisplay(row.tingkat) ?? '10');
        setJurusanId(row.jurusanId != null ? String(row.jurusanId) : '');
        setKategoriSoal(row.kategoriSoal || 'pilgan');
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
        if (row.kategoriSoal === 'pilgan') {
          setJawaban((j) => ({ ...j, single: row.jawaban || '' }));
        } else if (row.kategoriSoal === 'pilgan_kompleks') {
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
    if (kategoriSoal === 'pilgan') return jawaban.single;
    if (kategoriSoal === 'pilgan_kompleks') return jawaban.multi.sort().join(',');
    if (kategoriSoal === 'pilgan_kategori') {
      const filled = KOLOM_LABELS.filter((l) => kolom[l]?.trim());
      return filled.map((l) => (jawaban.benarSalah[l] === 'S' ? 'S' : 'B')).join(',');
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    let selectedKoleksiId = bankSoalKoleksiId ? Number(bankSoalKoleksiId) : null;
    const trimmedNamaKoleksi = namaKoleksiBaru.trim();

    if (modeKoleksi === 'pilih' && !selectedKoleksiId) {
      setFormError('Pilih Bank Soal terlebih dahulu.');
      return;
    }
    if (modeKoleksi === 'buat' && !trimmedNamaKoleksi) {
      setFormError('Nama Bank Soal baru wajib diisi.');
      return;
    }

    const filledKolom = KOLOM_LABELS.filter((l) => kolom[l]?.trim()).length;
    if (kategoriSoal !== 'pilgan_kategori' && filledKolom < 3) {
      setFormError('Minimal 3 kolom jawaban harus diisi.');
      return;
    }
    if (kategoriSoal === 'pilgan' && !jawaban.single) {
      setFormError('Pilih satu jawaban yang benar.');
      return;
    }
    if (kategoriSoal === 'pilgan_kompleks' && jawaban.multi.length === 0) {
      setFormError('Pilih minimal satu jawaban benar.');
      return;
    }
    if ((kategoriSoal === 'pilgan' || kategoriSoal === 'pilgan_kompleks') && !soal.trim()) {
      setFormError('Pertanyaan wajib diisi.');
      return;
    }
    if (!mataPelajaranId || !tingkat) {
      setFormError('Mata pelajaran dan tingkat wajib dipilih.');
      return;
    }

    setSaving(true);

    try {
      if (modeKoleksi === 'buat') {
        const createKoleksiRes = await api.post('/guru/bank-soal-koleksi', { nama: trimmedNamaKoleksi });
        const idKoleksiBaru = createKoleksiRes.data?.data?.id;
        if (!idKoleksiBaru) {
          setFormError('Gagal membuat Bank Soal baru.');
          setSaving(false);
          return;
        }
        selectedKoleksiId = Number(idKoleksiBaru);
      }

    const payload = {
      bankSoalKoleksiId: selectedKoleksiId,
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
              <label>Pilih Bank Soal * {queryKoleksiId && '(Terkunci)'}</label>
              <select 
                value={modeKoleksi} 
                onChange={(e) => setModeKoleksi(e.target.value)}
                disabled={Boolean(queryKoleksiId)}
                style={queryKoleksiId ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
              >
                <option value="pilih">Pilih dari yang sudah ada</option>
                <option value="buat">Buat Bank Soal baru</option>
              </select>
            </div>
            <div className="form-group">
              {modeKoleksi === 'pilih' ? (
                <>
                  <label>Bank Soal * {queryKoleksiId && '(Terkunci)'}</label>
                  <select
                    value={bankSoalKoleksiId}
                    onChange={(e) => setBankSoalKoleksiId(e.target.value)}
                    required
                    disabled={Boolean(queryKoleksiId)}
                    style={queryKoleksiId ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                  >
                    <option value="">Pilih Bank Soal</option>
                    {koleksiList.map((k) => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label>Nama Bank Soal Baru *</label>
                  <input
                    type="text"
                    value={namaKoleksiBaru}
                    onChange={(e) => setNamaKoleksiBaru(e.target.value)}
                    placeholder="Contoh: Bank Soal Matematika Kelas 10"
                    required
                  />
                </>
              )}
            </div>
          </div>

          <div className="form-row two-cols">
            <div className="form-group">
              <label>Mata Pelajaran * {hasPrefilledKoleksi && '(Terkunci)'}</label>
              <select 
                value={mataPelajaranId} 
                onChange={(e) => setMataPelajaranId(e.target.value)} 
                required
                disabled={hasPrefilledKoleksi}
                style={hasPrefilledKoleksi ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
              >
                <option value="">Pilih Mapel</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.id}>{m.namaMapel}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tingkat (Kelas) * {hasPrefilledKoleksi && '(Terkunci)'}</label>
              <select 
                value={tingkat} 
                onChange={(e) => setTingkat(e.target.value)} 
                required
                disabled={hasPrefilledKoleksi}
                style={hasPrefilledKoleksi ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
              >
                {TINGKAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Prodi {hasPrefilledKoleksi && '(Terkunci)'}</label>
            <select 
              value={jurusanId} 
              onChange={(e) => setJurusanId(e.target.value)}
              disabled={hasPrefilledKoleksi}
              style={hasPrefilledKoleksi ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
            >
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

        {(kategoriSoal === 'pilgan' || kategoriSoal === 'pilgan_kompleks') && (
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

        {kategoriSoal === 'pilgan_kategori' && (
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
          <label>{kategoriSoal === 'pilgan_kategori' ? 'Pernyataan (isi di kolom A–F)' : 'Opsi Jawaban (minimal 3)'}</label>
            {KOLOM_LABELS.map((letter) => (
              <div key={letter} className="kolom-row">
                <span className="kolom-letter">{letter}.</span>
                <input
                  type="text"
                  value={kolom[letter]}
                  onChange={(e) => setKolom((k) => ({ ...k, [letter]: e.target.value }))}
                placeholder={kategoriSoal === 'pilgan_kategori' ? `Pernyataan ${letter}` : `Opsi ${letter}`}
                />
              {kategoriSoal === 'pilgan' && (
                  <button
                    type="button"
                    className={`btn-check ${jawaban.single === letter ? 'active' : ''}`}
                    onClick={() => setJawaban((j) => ({ ...j, single: letter }))}
                    title="Jawaban benar"
                  >
                    <FiCheck />
                  </button>
                )}
              {kategoriSoal === 'pilgan_kompleks' && (
                  <button
                    type="button"
                    className={`btn-check ${jawaban.multi.includes(letter) ? 'active' : ''}`}
                    onClick={() => toggleMulti(letter)}
                    title="Centang jika benar"
                  >
                    <FiCheck />
                  </button>
                )}
              {kategoriSoal === 'pilgan_kategori' && (
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
