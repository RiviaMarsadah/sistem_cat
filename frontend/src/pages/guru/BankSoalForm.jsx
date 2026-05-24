import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiFolder, FiCheck, FiX } from 'react-icons/fi';
import api from '../../services/api';
import { compressImageToWebP } from '../../utils/imageCompressor';
import { useToast } from '../../context/ToastContext';
import './GuruTheme.css';
import './JadwalUjian.css';
import './BankSoal.css';

const KOLOM_LABELS = ['A', 'B', 'C', 'D', 'E'];

const KATEGORI_OPTIONS = [
  { value: 'pilgan', label: 'Pilihan Ganda Sederhana' },
  { value: 'pilgan_kompleks', label: 'Pilihan Ganda Kompleks' },
  { value: 'pilgan_kategori', label: 'Pilihan Ganda Kategori' },
];

const TINGKAT_OPTIONS = [
  { value: '10', label: '10' },
  { value: '11', label: '11' },
  { value: '12', label: '12' },
  { value: '0', label: 'Semua Tingkat' },
];

const emptyKolom = () => ({ A: '', B: '', C: '', D: '', E: '' });

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
  const location = useLocation();
  const { showToast } = useToast();

  const queryParams = new URLSearchParams(location.search);
  const isEdit = location.pathname.includes('/edit/');
  const id = isEdit ? location.pathname.split('/').pop() : null;
  const queryKoleksiId = queryParams.get('bankSoalKoleksiId');

  const [hasPrefilledKoleksi, setHasPrefilledKoleksi] = useState(false);

  const [mapelList, setMapelList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
  const [koleksiList, setKoleksiList] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

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

  // Queue states for image uploads
  const [gambarFile, setGambarFile] = useState(null);
  const [gambarPreview, setGambarPreview] = useState('');
  const [kolomGambarFile, setKolomGambarFile] = useState({ A: null, B: null, C: null, D: null, E: null });
  const [kolomGambarPreview, setKolomGambarPreview] = useState({ A: '', B: '', C: '', D: '', E: '' });

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
      
      const fetchKoleksiDetails = async () => {
        try {
          // Fetch parent collection details first to get preset metadata
          const colRes = await api.get(`/guru/bank-soal-koleksi/${queryKoleksiId}`);
          const colData = colRes.data?.data;
          
          if (colData && colData.mataPelajaranId && colData.tingkat) {
            setMataPelajaranId(colData.mataPelajaranId ?? '');
            setTingkat(apiToTingkatDisplay(colData.tingkat) ?? '10');
            setJurusanId(colData.jurusanId != null ? String(colData.jurusanId) : '');
            setHasPrefilledKoleksi(true);
            return; // Successfully prefilled from collection metadata!
          }
          
          // Fallback: If collection metadata is empty (old collection), check first question
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
          console.error('Fetch koleksi details/questions error:', e);
        }
      };
      fetchKoleksiDetails();
    }
  }, [queryKoleksiId, isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/guru/bank-soal/${id}`);
        const row = res.data?.data;
        if (!row) throw new Error('Data tidak ditemukan');

        setBankSoalKoleksiId(row.bankSoalKoleksiId ?? '');
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
        });

        // Setup image edit preview
        setGambar(row.gambar || '');
        if (row.gambar && row.gambar.endsWith('.webp')) {
          setGambarPreview(row.gambar);
        }

        const initialKolomGambarPreview = { A: '', B: '', C: '', D: '', E: '' };
        KOLOM_LABELS.forEach((letter) => {
          const val = row[`kolom${letter}`];
          if (val && val.endsWith('.webp')) {
            initialKolomGambarPreview[letter] = val;
          }
        });
        setKolomGambarPreview(initialKolomGambarPreview);

        if (row.kategoriSoal === 'pilgan') {
          setJawaban((j) => ({ ...j, single: row.jawaban || '' }));
        } else if (row.kategoriSoal === 'pilgan_kompleks') {
          setJawaban((j) => ({ ...j, multi: (row.jawaban || '').split(',').map((s) => s.trim()).filter(Boolean) }));
        } else {
          const parts = (row.jawaban || '').split(',').map((s) => s.trim().toUpperCase());
          const k = { A: row.kolomA || '', B: row.kolomB || '', C: row.kolomC || '', D: row.kolomD || '', E: row.kolomE || '' };
          const filledLetters = KOLOM_LABELS.filter((l) => k[l]?.trim());
          const bs = emptyKolom();
          filledLetters.forEach((l, i) => { bs[l] = parts[i] === 'S' ? 'S' : 'B'; });
          setJawaban((j) => ({ ...j, benarSalah: bs }));
        }
      } catch (e) {
        showToast(e?.response?.data?.message || 'Gagal memuat data soal', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, navigate]);

  const handleImageUpload = async (file, type) => {
    if (!file) return;
    try {
      const { compressedFile, previewUrl } = await compressImageToWebP(file);
      if (type === 'soal') {
        setGambarFile(compressedFile);
        setGambarPreview(previewUrl);
      } else {
        setKolomGambarFile(prev => ({ ...prev, [type]: compressedFile }));
        setKolomGambarPreview(prev => ({ ...prev, [type]: previewUrl }));
        setKolom(prev => ({ ...prev, [type]: `${type}_image.webp` }));
      }
    } catch (err) {
      showToast(err.message || 'Gagal memproses gambar', 'error');
    }
  };

  const handleRemoveImage = (type) => {
    if (type === 'soal') {
      setGambarFile(null);
      setGambarPreview('');
      setGambar('');
    } else {
      setKolomGambarFile(prev => ({ ...prev, [type]: null }));
      setKolomGambarPreview(prev => ({ ...prev, [type]: '' }));
      setKolom(prev => ({ ...prev, [type]: '' }));
    }
  };

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

    let selectedKoleksiId = bankSoalKoleksiId ? Number(bankSoalKoleksiId) : null;
    const trimmedNamaKoleksi = namaKoleksiBaru.trim();

    if (modeKoleksi === 'pilih' && !selectedKoleksiId) {
      showToast('Pilih Bank Soal terlebih dahulu.', 'error');
      return;
    }
    if (modeKoleksi === 'buat' && !trimmedNamaKoleksi) {
      showToast('Nama Bank Soal baru wajib diisi.', 'error');
      return;
    }

    const filledKolom = KOLOM_LABELS.filter((l) => kolom[l]?.trim()).length;
    if (kategoriSoal !== 'pilgan_kategori' && filledKolom < 3) {
      showToast('Minimal 3 kolom jawaban harus diisi.', 'error');
      return;
    }
    if (kategoriSoal === 'pilgan' && !jawaban.single) {
      showToast('Pilih satu jawaban yang benar.', 'error');
      return;
    }
    if (kategoriSoal === 'pilgan_kompleks' && jawaban.multi.length === 0) {
      showToast('Pilih minimal satu jawaban benar.', 'error');
      return;
    }
    if ((kategoriSoal === 'pilgan' || kategoriSoal === 'pilgan_kompleks') && !soal.trim()) {
      showToast('Pertanyaan wajib diisi.', 'error');
      return;
    }
    if (!mataPelajaranId || !tingkat) {
      showToast('Mata pelajaran dan tingkat wajib dipilih.', 'error');
      return;
    }

    setSaving(true);

    try {
      // 1. Process local image queue
      let finalGambar = gambar;
      if (gambarFile) {
        const formData = new FormData();
        formData.append('image', gambarFile);
        const uploadRes = await api.post('/guru/bank-soal/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalGambar = uploadRes.data?.filename;
      }

      const finalKolom = { ...kolom };
      for (const letter of KOLOM_LABELS) {
        if (kolomGambarFile[letter]) {
          const formData = new FormData();
          formData.append('image', kolomGambarFile[letter]);
          const uploadRes = await api.post('/guru/bank-soal/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          finalKolom[letter] = uploadRes.data?.filename;
        } else if (kolomGambarPreview[letter]) {
          finalKolom[letter] = kolomGambarPreview[letter];
        }
      }

      if (modeKoleksi === 'buat') {
        const createKoleksiRes = await api.post('/guru/bank-soal-koleksi', { 
          nama: trimmedNamaKoleksi,
          mataPelajaranId: Number(mataPelajaranId),
          tingkat: displayToTingkatApi(tingkat),
          jurusanId: jurusanId === '' ? null : Number(jurusanId)
        });
        const idKoleksiBaru = createKoleksiRes.data?.data?.id;
        if (!idKoleksiBaru) {
          showToast('Gagal membuat Bank Soal baru.', 'error');
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
        kolomA: finalKolom.A || null,
        kolomB: finalKolom.B || null,
        kolomC: finalKolom.C || null,
        kolomD: finalKolom.D || null,
        kolomE: finalKolom.E || null,
        jawaban: buildJawabanValue(),
        gambar: finalGambar || null,
      };

      if (isEdit) {
        await api.put(`/guru/bank-soal/${id}`, payload);
      } else {
        await api.post('/guru/bank-soal', payload);
      }
      navigate('/guru/bank-soal');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal menyimpan soal', 'error');
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
          {isEdit ? 'Formulir pengeditan detail butir soal dan pembaruan opsi jawaban.' : 'Pembuatan butir soal baru, konfigurasi tipe soal, dan kunci jawaban.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bank-soal-form bank-soal-form-full">
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
                    placeholder="Contoh: Try Out Mandiri Ke-3"
                    required
                  />
                </>
              )}
            </div>
          </div>

          <div className="form-row three-cols">
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
                  <option key={m.id} value={m.id}>{m.namaMapel} ({m.kodeMapel || '-'})</option>
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
            <div className="form-group">
              <label>Program Studi (Jurusan) {hasPrefilledKoleksi && '(Terkunci)'}</label>
              <select 
                value={jurusanId} 
                onChange={(e) => setJurusanId(e.target.value)}
                disabled={hasPrefilledKoleksi}
                style={hasPrefilledKoleksi ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
              >
                <option value="">Semua Prodi</option>
                {jurusanList.map((j) => (
                  <option key={j.id} value={j.id}>{j.namaProdi}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Isi Soal & Opsi Jawaban</h3>
          <p className="form-section-desc">
            Pilih kategori soal, tulis pertanyaan, opsi jawaban, dan kunci jawaban.
          </p>

          <div className="form-group">
            <label>Kategori Soal *</label>
            <select value={kategoriSoal} onChange={(e) => setKategoriSoal(e.target.value)}>
              {KATEGORI_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{kategoriSoal === 'pilgan_kategori' ? 'Pertanyaan (opsional)' : 'Pertanyaan *'}</label>
            <textarea
              value={soal}
              onChange={(e) => setSoal(e.target.value)}
              rows={4}
              placeholder="Tulis butir pertanyaan di sini..."
              required={kategoriSoal !== 'pilgan_kategori'}
            />
          </div>

          {/* Premium Compression Image Upload for Question */}
          <div className="form-group" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Gambar Soal (Opsional, Maks 3MB)</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  handleImageUpload(e.target.files[0], 'soal');
                  e.target.value = '';
                }} 
                style={{ display: 'none' }}
                id="soal-image-file"
              />
              <label htmlFor="soal-image-file" className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', padding: '0.6rem 1.25rem', border: '2px dashed #cbd5e1', borderRadius: '8px' }}>
                Pilih / Unggah Gambar
              </label>
              {gambarPreview && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img 
                    src={gambarPreview.endsWith('.webp') ? `http://localhost:3000/uploads/${gambarPreview}` : gambarPreview} 
                    alt="Preview Soal" 
                    style={{ maxHeight: '120px', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveImage('soal')}
                    style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}
                    title="Hapus"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>
              {kategoriSoal === 'pilgan_kategori' ? 'Pernyataan (Isi kolom A–E)' : 'Opsi Jawaban (Minimal 3 Terisi)'}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.50rem' }}>
              {KOLOM_LABELS.map((letter) => {
                const val = kolom[letter] || '';
                const hasText = val.trim() !== '' && !val.endsWith('.webp');
                const hasImage = Boolean(kolomGambarPreview[letter]);
                
                return (
                  <div key={letter} className="kolom-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.50rem', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                      <span className="kolom-letter" style={{ fontSize: '1.2rem', fontWeight: 700 }}>{letter}.</span>
                      <input
                        type="text"
                        value={hasImage ? `[Berisi Gambar]` : val}
                        onChange={(e) => setKolom((k) => ({ ...k, [letter]: e.target.value }))}
                        placeholder={hasImage ? "Opsi berupa gambar (Terkunci)" : (kategoriSoal === 'pilgan_kategori' ? `Pernyataan ${letter}` : `Opsi ${letter}`)}
                        disabled={hasImage}
                        style={{ margin: 0, flex: 1, backgroundColor: hasImage ? '#e2e8f0' : 'white', cursor: hasImage ? 'not-allowed' : 'text' }}
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
                        <div className="benar-salah-btns" style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            type="button"
                            className={jawaban.benarSalah[letter] === 'B' ? 'active' : ''}
                            onClick={() => setBenarSalah(letter, 'B')}
                            style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: jawaban.benarSalah[letter] === 'B' ? '#22c55e' : '#fff', color: jawaban.benarSalah[letter] === 'B' ? '#fff' : '#475569', fontWeight: 600 }}
                          >
                            Benar
                          </button>
                          <button
                            type="button"
                            className={jawaban.benarSalah[letter] === 'S' ? 'active' : ''}
                            onClick={() => setBenarSalah(letter, 'S')}
                            style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: jawaban.benarSalah[letter] === 'S' ? '#ef4444' : '#fff', color: jawaban.benarSalah[letter] === 'S' ? '#fff' : '#475569', fontWeight: 600 }}
                          >
                            Salah
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Image Upload for Option (Mutually Exclusive) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '2rem', flexWrap: 'wrap' }}>
                      {!hasText && !hasImage && (
                        <>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              handleImageUpload(e.target.files[0], letter);
                              e.target.value = '';
                            }} 
                            id={`file-opsi-${letter}`}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor={`file-opsi-${letter}`} className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', padding: '0.35rem 0.85rem', border: '1.5px dashed #cbd5e1', borderRadius: '8px', fontSize: '0.8rem' }}>
                            Unggah Gambar {letter}
                          </label>
                        </>
                      )}
                      {hasImage && (
                        <div style={{ position: 'relative', display: 'inline-block', marginTop: '0.25rem' }}>
                          <img 
                            src={kolomGambarPreview[letter].endsWith('.webp') ? `http://localhost:3000/uploads/${kolomGambarPreview[letter]}` : kolomGambarPreview[letter]} 
                            alt={`Preview Opsi ${letter}`} 
                            style={{ maxHeight: '90px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                          />
                          <button 
                            type="button" 
                            onClick={() => handleRemoveImage(letter)}
                            style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                            title="Hapus Gambar"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      {hasText && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                          Unggah gambar dinonaktifkan karena kolom berisi teks.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/guru/bank-soal')}
            disabled={saving}
          >
            Batal
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Soal'}
          </button>
        </div>
      </form>


    </div>
  );
}
