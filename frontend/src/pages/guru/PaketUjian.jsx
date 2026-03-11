import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEdit2, FiEye, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import api from '../../services/api';
import './PaketUjian.css';

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

export default function PaketUjian() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [soalModalOpen, setSoalModalOpen] = useState(false);
  const [soalModalLoading, setSoalModalLoading] = useState(false);
  const [soalModalData, setSoalModalData] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/guru/paket-ujian');
      setItems(res.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal memuat paket ujian');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus paket ujian ini?')) return;
    try {
      await api.delete(`/guru/paket-ujian/${id}`);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal menghapus');
    }
  };

  const openSoalModal = async (id) => {
    setSoalModalOpen(true);
    setSoalModalData(null);
    setSoalModalLoading(true);
    try {
      const res = await api.get(`/guru/paket-ujian/${id}`);
      setSoalModalData(res.data?.data || null);
    } catch (e) {
      setSoalModalData(null);
      setError(e?.response?.data?.message || 'Gagal memuat soal');
    } finally {
      setSoalModalLoading(false);
    }
  };

  const closeSoalModal = () => {
    setSoalModalOpen(false);
    setSoalModalData(null);
  };

  return (
    <div className="paket-ujian-page">
      <div className="paket-ujian-header">
        <div>
          <h1 className="page-title guru-title">
            <span className="title-text">Paket Ujian</span>
            <span className="title-badge guru-badge">Guru</span>
          </h1>
          <p className="page-subtitle">Buat dan kelola paket soal ujian (UH, UTS, UAS) beserta token check-in/checkout</p>
        </div>
        <Link to="/guru/paket-ujian/tambah" className="btn-tambah">
          <FiPlus /> Buat Paket Ujian
        </Link>
      </div>

      {error && <div className="paket-ujian-error">{error}</div>}

      {loading ? (
        <div className="paket-ujian-loading">Memuat...</div>
      ) : (
        <div className="paket-ujian-table-wrap">
          <table className="paket-ujian-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Paket</th>
                <th>Mapel</th>
                <th>Tingkat</th>
                <th>Tipe</th>
                <th>Jumlah Soal</th>
                <th>Token Check-in</th>
                <th>Token Checkout</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-row">
                    Belum ada paket ujian. Klik &quot;Buat Paket Ujian&quot;.
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{idx + 1}</td>
                    <td>{row.nama}</td>
                    <td>{row.mataPelajaran?.namaMapel}</td>
                    <td>{tingkatToDisplay(row.tingkat)}</td>
                    <td>{TIPE_OPTIONS.find((o) => o.value === row.tipeUjian)?.label || row.tipeUjian}</td>
                    <td>{row._count?.soalPaket ?? 0}</td>
                    <td><code className="token-code">{row.tokenCheckIn}</code></td>
                    <td><code className="token-code">{row.tokenCheckOut}</code></td>
                    <td>
                      <button
                        type="button"
                        className="btn-icon view"
                        onClick={() => openSoalModal(row.id)}
                        title="Tampilkan Soal"
                      >
                        <FiEye />
                      </button>
                      <Link to={`/guru/paket-ujian/edit/${row.id}`} className="btn-icon edit" title="Edit">
                        <FiEdit2 />
                      </Link>
                      <button
                        type="button"
                        className="btn-icon delete"
                        onClick={() => handleDelete(row.id)}
                        title="Hapus"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {soalModalOpen && (
        <div className="modal-overlay" onClick={closeSoalModal} role="dialog" aria-modal="true" aria-labelledby="modal-soal-title">
          <div className="modal-content modal-soal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="modal-soal-title" className="modal-title">
                {soalModalData ? `Soal dalam paket: ${soalModalData.nama}` : 'Soal dalam paket'}
              </h2>
              <button type="button" className="modal-close" onClick={closeSoalModal} aria-label="Tutup">
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              {soalModalLoading ? (
                <div className="soal-picker-loading">Memuat soal...</div>
              ) : !soalModalData ? (
                <div className="soal-picker-empty">Gagal memuat data.</div>
              ) : !soalModalData.soalPaket?.length ? (
                <div className="soal-picker-empty">Belum ada soal di paket ini.</div>
              ) : (
                <div className="modal-soal-table-wrap">
                  <table className="paket-ujian-table modal-soal-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Mapel</th>
                        <th>Tingkat</th>
                        <th>Kategori</th>
                        <th>Soal / Pernyataan</th>
                        <th>Jawaban</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soalModalData.soalPaket.map((sp, idx) => {
                        const s = sp.bankSoal;
                        if (!s) return null;
                        return (
                          <tr key={sp.id ?? s.id}>
                            <td>{idx + 1}</td>
                            <td>{s.mataPelajaran?.namaMapel}</td>
                            <td>{tingkatToDisplay(s.tingkat)}</td>
                            <td>
                              <span className={`badge badge-${s.kategoriSoal}`}>
                                {KATEGORI_OPTIONS.find((k) => k.value === s.kategoriSoal)?.label || s.kategoriSoal}
                              </span>
                            </td>
                            <td className="cell-soal-preview">
                              {s.soal ? (s.soal.slice(0, 80) + (s.soal.length > 80 ? '…' : '')) : '(Pernyataan di kolom A-F)'}
                            </td>
                            <td>{s.jawaban}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
