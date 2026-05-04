import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiInfo, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';
import './ReviewHasil.css';

export default function ReviewHasilGuru() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/guru/rekap/detail/${id}`);
      setData(res.data?.data);
    } catch (error) {
      console.error('Fetch detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="review-page-loading">
        <div className="loader"></div>
        <p>Memuat rincian jawaban siswa...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="review-page-error">
        <FiAlertCircle size={48} />
        <h2>Data Tidak Ditemukan</h2>
        <button className="btn-back" onClick={() => navigate(-1)}>Kembali</button>
      </div>
    );
  }

  return (
    <div className="review-hasil-page">
      <div className="review-container">
        <div className="review-header-compact">
          <div className="header-left">
            <button className="btn-back-minimal" onClick={() => navigate(-1)}>
              <FiArrowLeft /> Kembali
            </button>
            <div className="student-info-main">
              <div className="avatar-small">
                {data.siswa?.user?.namaLengkap?.charAt(0)}
              </div>
              <div>
                <h1 className="student-name-small">{data.siswa?.user?.namaLengkap}</h1>
                <p className="student-meta-small">{data.siswa?.nis} • Kelas {data.siswa?.kelas?.tingkat} {data.siswa?.kelas?.jurusan?.namaProdi || 'N/A'}</p>
              </div>


            </div>
          </div>

          <div className="header-right-stats">
            <div className="score-badge-compact">
              <span className="label">SKOR</span>
              <span className="value">{Number(data.nilaiAkhir).toFixed(1)}</span>
            </div>
            <div className="stats-row-compact">
              <div className="stat-item-mini green" title="Benar">
                <FiCheckCircle /> <span>{data.benar}</span>
              </div>
              <div className="stat-item-mini red" title="Salah">
                <FiXCircle /> <span>{data.salah}</span>
              </div>
              <div className="stat-item-mini gray" title="Kosong">
                <FiAlertCircle /> <span>{data.kosong}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="exam-info-strip">
          <FiInfo /> 
          <span><strong>{data.jadwalUjian?.nama}</strong> • {data.jadwalUjian?.mataPelajaran?.namaMapel} • {data.totalSoal} Soal</span>
        </div>

        <div className="answers-container-compact">
          <div className="answers-grid-compact">
            {data.jawabanSiswa?.map((j) => (
              <div key={j.id} className={`q-card-compact ${j.isBenar ? 'is-correct' : 'is-wrong'}`}>
                <div className="q-card-header">
                  <span className="q-number-badge">#{j.nomorSoal}</span>
                  <span className={`q-result-text ${j.isBenar ? 'correct' : 'wrong'}`}>
                    {j.isBenar ? 'Benar' : 'Salah'}
                  </span>
                </div>
                
                <div className="q-body-compact">
                  <div className="q-text-small" dangerouslySetInnerHTML={{ __html: j.bankSoal?.soal }}></div>
                  
                  {j.bankSoal?.gambar && (
                    <div className="q-image-small">
                      <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '')}/uploads/${j.bankSoal.gambar}`} alt="Soal" />
                    </div>
                  )}

                  <div className="q-comparison-compact">
                    <div className="comp-item">
                      <span className="l">Jawaban Siswa:</span>
                      <span className={`v ${!j.jawabanSiswa ? 'empty' : ''}`}>{j.jawabanSiswa || 'Kosong'}</span>
                    </div>
                    <div className="comp-item">
                      <span className="l">Kunci Jawaban:</span>
                      <span className="v highlight">{j.bankSoal?.jawaban}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

