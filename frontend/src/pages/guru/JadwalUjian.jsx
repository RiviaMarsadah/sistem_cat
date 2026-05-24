import { useEffect, useState } from 'react';
import { FiCalendar, FiClock, FiBook, FiCheckCircle, FiXCircle, FiX, FiAlertCircle, FiPlus, FiLink, FiShield, FiTrash2, FiEdit2, FiCheck, FiEye, FiPrinter } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './GuruTheme.css';
import './JadwalUjian.css';

const getTingkatLabel = (tingkat) => {
  const map = { X: '10', XI: '11', XII: '12', ALUMNI: 'ALUMNI', KI: 'KI' };
  return map[tingkat] || tingkat;
};

const getNamaKelasDisplay = (kelas) => {
  if (!kelas) return '-';
  if (!kelas.tingkat || !kelas.jurusan || !kelas.inisial) return kelas.namaKelas || '-';
  const kode = kelas.jurusan.kodeProdi || '';
  return `${getTingkatLabel(kelas.tingkat)} ${kode} ${kelas.inisial}`;
};

export default function JadwalUjianGuru() {
  const [activeTab, setActiveTab] = useState('official'); // 'official' | 'custom'
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Data states
  const [officialJadwal, setOfficialJadwal] = useState([]);
  const [customJadwal, setCustomJadwal] = useState([]);
  const [myPakets, setMyPakets] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [mapelList, setMapelList] = useState([]);

  // Modals Data
  const [showPilihPaketModal, setShowPilihPaketModal] = useState(false);
  const [activeJadwalId, setActiveJadwalId] = useState(null);
  const [searchPaket, setSearchPaket] = useState('');
  
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  // Pagination per tab
  const ITEMS_PER_PAGE = 10;
  const [currentPageOfficial, setCurrentPageOfficial] = useState(1);
  const [currentPageCustom, setCurrentPageCustom] = useState(1);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState(null);
  const [currentPagePeriods, setCurrentPagePeriods] = useState(1);

  // Group officialJadwal by Periode
  const getPeriodsFromOfficial = () => {
    const periodMap = {};
    officialJadwal.forEach((j) => {
      if (j.periode) {
        const pid = j.periode.id;
        if (!periodMap[pid]) {
          periodMap[pid] = {
            id: pid,
            nama: j.periode.nama,
            semester: j.periode.semester,
            tahunAjaran: j.periode.tahunAjaran,
            mulai: j.periode.mulai,
            selesai: j.periode.selesai,
            schedules: [],
          };
        }
        periodMap[pid].schedules.push(j);
      } else {
        const pid = 'other';
        if (!periodMap[pid]) {
          periodMap[pid] = {
            id: 'other',
            nama: 'Jadwal Resmi Lainnya',
            semester: '-',
            tahunAjaran: '-',
            schedules: [],
          };
        }
        periodMap[pid].schedules.push(j);
      }
    });
    return Object.values(periodMap).sort((a, b) => {
      if (a.id === 'other') return 1;
      if (b.id === 'other') return -1;
      return new Date(b.mulai) - new Date(a.mulai);
    });
  };

  const periods = getPeriodsFromOfficial();

  const getFilteredOfficial = () => {
    if (!selectedPeriodeId) return [];
    if (selectedPeriodeId === 'other') {
      return officialJadwal.filter(j => !j.periode);
    }
    return officialJadwal.filter(j => j.periode?.id === selectedPeriodeId);
  };
  const filteredOfficialJadwal = getFilteredOfficial();

  const getPaginated = (data, page) => {
    const isShowAll = page === 9999;
    const tp = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
    const dp = isShowAll ? 1 : Math.min(Math.max(1, page), tp);
    const si = isShowAll ? 0 : (dp - 1) * ITEMS_PER_PAGE;
    return { 
      data: isShowAll ? data : data.slice(si, si + ITEMS_PER_PAGE), 
      tp, 
      dp, 
      si,
      isShowAll
    };
  };

  const { data: paginatedOfficial, tp: tpOfficial, dp: dpOfficial, si: siOfficial, isShowAll: isShowAllOfficial } = getPaginated(filteredOfficialJadwal, currentPageOfficial);
  const { data: paginatedCustom, tp: tpCustom, dp: dpCustom, si: siCustom, isShowAll: isShowAllCustom } = getPaginated(customJadwal, currentPageCustom);
  const { data: paginatedPeriods, tp: tpPeriods, dp: dpPeriods, si: siPeriods, isShowAll: isShowAllPeriods } = getPaginated(periods, currentPagePeriods);

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

  const renderPagination = (total, tp, dp, setPage, page, isShowAll) => (
    total > 0 && (
      <div className="table-pagination">
        <span className="table-pagination-info">
          {isShowAll 
            ? `Menampilkan 1–${total} dari ${total} jadwal` 
            : `Menampilkan ${(page === 1 ? 0 : (page - 1) * ITEMS_PER_PAGE) + 1}–${Math.min(page * ITEMS_PER_PAGE, total)} dari ${total} jadwal`
          }
        </span>
        <div className="table-pagination-controls">
          <button type="button" className="table-pagination-btn" disabled={isShowAll || dp <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Sebelumnya</button>
          <div className="table-pagination-pages">
            {isShowAll ? (
              <button type="button" className="table-pagination-page active" onClick={() => setPage(1)}>Tampilkan Per Halaman</button>
            ) : (
              getPaginationPages(tp, dp).map((item) =>
                item.type === 'ellipsis' ? <span key={`ellipsis-${item.key}`} className="table-pagination-ellipsis">…</span> :
                <button key={item.value} type="button" className={`table-pagination-page ${item.value === dp ? 'active' : ''}`} onClick={() => setPage(item.value)}>{item.value}</button>
              )
            )}
          </div>
          <button type="button" className="table-pagination-btn" disabled={isShowAll || dp >= tp} onClick={() => setPage(p => Math.min(tp, p + 1))}>Berikutnya</button>
          {!isShowAll && (
            <button type="button" className="table-pagination-btn show-all" onClick={() => setPage(9999)}>Tampilkan Semua</button>
          )}
        </div>
      </div>
    )
  );
  
  // Custom Form fields
  const [nama, setNama] = useState('');
  const [mataPelajaranId, setMataPelajaranId] = useState('');
  const [paketUjianId, setPaketUjianId] = useState('');
  const [mulai, setMulai] = useState('');
  const [selesai, setSelesai] = useState('');
  const [durasi, setDurasi] = useState(60);
  const [opsiKeamanan, setOpsiKeamanan] = useState(true);
  const [selectedKelas, setSelectedKelas] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resOff, resCust, resPak, resKel, resMap] = await Promise.all([
        api.get('/guru/jadwal-ujian/official'),
        api.get('/guru/jadwal-ujian/custom'),
        api.get('/guru/paket-ujian'),
        api.get('/guru/kelas'),
        api.get('/guru/mata-pelajaran')
      ]);
      setOfficialJadwal(resOff.data?.data || []);
      setCustomJadwal(resCust.data?.data || []);
      setMyPakets(resPak.data?.data || []);
      setKelasList(resKel.data?.data || []);
      setMapelList(resMap.data?.data || []);
    } catch(err) {
      showToast('Gagal memuat data. ' + (err?.response?.data?.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData() }, []);


  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleExportPDF = () => {
    const periodObj = periods.find(p => p.id === selectedPeriodeId);
    if (!periodObj) return;

    const schedules = periodObj.schedules || [];
    
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Gagal membuka jendela cetak. Pastikan pop-up tidak diblokir.', 'error');
      return;
    }

    // Build the HTML content
    let htmlContent = `
      <html>
        <head>
          <title>Jadwal Ujian Resmi - ${periodObj.nama}</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, sans-serif;
              color: #1e293b;
              padding: 40px;
              margin: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px double #cbd5e1;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .header h2 {
              margin: 5px 0 0 0;
              font-size: 16px;
              color: #475569;
              font-weight: 500;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              margin-bottom: 25px;
              font-size: 13px;
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .meta-item {
              display: flex;
            }
            .meta-label {
              font-weight: 700;
              width: 120px;
              color: #475569;
            }
            .meta-value {
              color: #1e293b;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 10px 12px;
              text-align: left;
            }
            th {
              background: #f1f5f9;
              color: #0f172a;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 11px;
            }
            tr:nth-child(even) {
              background: #f8fafc;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .badge-success {
              background: #d1fae5;
              color: #065f46;
              border: 1px solid #a7f3d0;
            }
            .badge-warning {
              background: #fef3c7;
              color: #92400e;
              border: 1px solid #fde68a;
            }
            .badge-info {
              background: #e0f2fe;
              color: #075985;
              border: 1px solid #bae6fd;
            }
            .footer {
              margin-top: 40px;
              text-align: right;
              font-size: 11px;
              color: #64748b;
            }
            @media print {
              body { padding: 0; }
              @page { size: A4 landscape; margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Jadwal Pelaksanaan Ujian Resmi</h1>
            <h2>${periodObj.nama}</h2>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Semester:</span>
              <span class="meta-value">${periodObj.semester}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Mulai Ujian:</span>
              <span class="meta-value">${new Date(periodObj.mulai).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Tahun Ajaran:</span>
              <span class="meta-value">${periodObj.tahunAjaran}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Selesai Ujian:</span>
              <span class="meta-value">${new Date(periodObj.selfinished || periodObj.selesai).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">No</th>
                <th style="width: 150px;">Mata Pelajaran</th>
                <th style="width: 80px; text-align: center;">Token IN</th>
                <th style="width: 80px; text-align: center;">Token OUT</th>
                <th>Kelas Peserta</th>
                <th style="width: 200px;">Waktu Ujian</th>
                <th style="width: 120px; text-align: center;">Status Paket</th>
              </tr>
            </thead>
            <tbody>
    `;

    schedules.forEach((j, index) => {
      const classStr = j.kelasJadwal && j.kelasJadwal.length > 0
        ? j.kelasJadwal.map(kj => getNamaKelasDisplay(kj.kelas)).join(', ')
        : 'Tidak ada kelas';

      const tokenIn = j.token || '-';
      const tokenOut = j.tokenCheckOut || '-';
      
      const tglObj = new Date(j.mulai);
      const hariTanggal = tglObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const waktuMulai = tglObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
      const waktuSelesai = new Date(j.selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
      
      const waktuStr = `${hariTanggal} (${waktuMulai} - ${waktuSelesai}) • ${j.durasi} Menit`;

      let statusBadge = '';
      if (j.paketUjianId) {
        if (j.paketUjian?.guruId === myPakets?.[0]?.guruId) {
          statusBadge = '<span class="badge badge-success">Milik Anda</span>';
        } else {
          statusBadge = `<span class="badge badge-info">${j.paketUjian?.guru?.user?.namaLengkap || 'Guru Lain'}</span>`;
        }
      } else {
        statusBadge = '<span class="badge badge-warning">Belum Terisi</span>';
      }

      htmlContent += `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td style="font-weight: 700;">${j.mataPelajaran?.namaMapel || '-'}</td>
          <td style="text-align: center; font-family: monospace; font-size: 13px; font-weight: bold; color: #1e3a8a;">${tokenIn}</td>
          <td style="text-align: center; font-family: monospace; font-size: 13px; font-weight: bold; color: #991b1b;">${tokenOut}</td>
          <td style="font-weight: 600;">${classStr}</td>
          <td>${waktuStr}</td>
          <td style="text-align: center;">${statusBadge}</td>
        </tr>
      `;
    });

    htmlContent += `
            </tbody>
          </table>

          <div class="footer">
            Dicetak otomatis oleh Sistem CAT pada ${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // HANDLER OFFICIAL EXAMS -----------------------------
  const handleOpenPilihPaket = (jdwlId) => {
    setActiveJadwalId(jdwlId);
    setSearchPaket('');
    setShowPilihPaketModal(true);
  };

  const handleLinkPaket = async (paketId) => {
    setSaving(true);
    try {
      const res = await api.put(`/guru/jadwal-ujian/official/${activeJadwalId}/paket`, { paketUjianId: paketId });
      showToast(res.data.message || 'Berhasil menautkan paket.', 'success');
      setShowPilihPaketModal(false);
      fetchData(); //mengambil data terbaru
    } catch(err) {
      showToast(err?.response?.data?.message || 'Gagal menautkan paket.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlinkPaket = (jdwlId) => {
    setConfirmData({
      id: jdwlId,
      title: 'Hapus Tautan Paket?',
      message: 'Yakin ingin menghapus tautan paket soal dari jadwal ini?',
      warning: 'Siswa tidak akan bisa mengerjakan ujian ini sampai ada paket soal baru yang ditautkan.',
      action: async () => {
        setSaving(true);
        try {
           const res = await api.delete(`/guru/jadwal-ujian/official/${jdwlId}/paket`);
           showToast(res.data.message || 'Tautan paket berhasil dilepas.', 'success');
           fetchData();
        } catch(err) {
           showToast(err?.response?.data?.message || 'Gagal melepas paket.', 'error');
        } finally {
           setSaving(false);
           setShowConfirmModal(false);
           setConfirmData(null);
        }
      }
    });
    setShowConfirmModal(true);
  };


  // HANDLERS CUSTOM EXAMS -----------------------------
  const toggleKelas = (idStr) => {
    if(selectedKelas.includes(idStr)) {
      setSelectedKelas(selectedKelas.filter(k => k !== idStr));
    } else {
      setSelectedKelas([...selectedKelas, idStr]);
    }
  };

  const openAddCustom = () => {
    setEditingId(null);
    setNama('');
    setMataPelajaranId('');
    setPaketUjianId('');
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    setMulai(`${dateStr}T00:00`);
    setSelesai(`${dateStr}T23:59`);
    
    setDurasi(60);
    setOpsiKeamanan(true);
    setSelectedKelas([]);
    setShowAddCustomModal(true);
  };

  const openEditCustom = (j) => {
    setEditingId(j.id);
    setNama(j.nama);
    setMataPelajaranId(j.mataPelajaranId);
    setPaketUjianId(j.paketUjianId);
    
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
    setShowAddCustomModal(true);
  };

  const handleSaveCustom = async (e) => {
    e.preventDefault(); //menghapus settingan default browser
    if(!nama || !mataPelajaranId || !paketUjianId || !mulai || !selesai || selectedKelas.length === 0) {
       showToast('Mohon isi semua data, termasuk kelas peserta.', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        nama, mataPelajaranId: Number(mataPelajaranId), paketUjianId: Number(paketUjianId),
        mulai, selesai, durasi: Number(durasi), opsiKeamanan, kelasIds: selectedKelas.map(Number)
      };

      if (editingId) {
        const res = await api.put(`/guru/jadwal-ujian/custom/${editingId}`, payload);
        showToast(res.data.message || 'Jadwal berhasil diperbarui.', 'success');
      } else {
        const res = await api.post('/guru/jadwal-ujian/custom', payload);
        showToast(res.data.message || 'Jadwal berhasil dibuat.', 'success');
      }
      
      setShowAddCustomModal(false);
      fetchData();
      setActiveTab('custom');
    } catch(err) {
       showToast(err?.response?.data?.message || 'Gagal menyimpan ulangan custom.', 'error');
    } finally {
       setSaving(false);
    }
  };

  const deleteCustomExam = (id) => {
    setConfirmData({
      id,
      title: 'Hapus Ulangan?',
      message: 'Yakin ingin menghapus ulangan ini?',
      warning: 'Tindakan ini tidak dapat dibatalkan. Seluruh data hasil ujian siswa terkait ulangan ini akan ikut terhapus.',
      action: async () => {
        setSaving(true);
        try {
           const res = await api.delete(`/guru/jadwal-ujian/custom/${id}`);
           showToast(res.data.message || 'Ulangan berhasil dihapus.', 'success');
           fetchData();
        } catch(err) {
           showToast(err?.response?.data?.message || 'Gagal menghapus ulangan.', 'error');
        } finally {
           setSaving(false);
           setShowConfirmModal(false);
           setConfirmData(null);
        }
      }
    });
    setShowConfirmModal(true);
  };


  return (
    <div className="guru-page jadwal-page">
      <div className="guru-header guru-header-card">
        <div>
          <h1 className="guru-title">
            <span className="guru-title-text">Jadwal Ujian</span>
            <span className="guru-title-badge">Guru</span>
          </h1>
          <p className="guru-subtitle">Pemantauan jadwal ujian resmi sekolah dan pembuatan agenda ujian mandiri.</p>
        </div>
        <div className="guru-meta">
          <div className="guru-meta-card">
            <div className="guru-meta-label">Total Jadwal</div>
            <div className="guru-meta-value">{activeTab === 'official' ? officialJadwal.length : customJadwal.length}</div>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <button 
           className={`tab-button official ${activeTab === 'official' ? 'active' : ''}`}
           onClick={() => { setActiveTab('official'); setSelectedPeriodeId(null); }}
        >
          <FiBook /> Jadwal Pusat (Resmi Admin)
        </button>
        <button 
           className={`tab-button custom ${activeTab === 'custom' ? 'active' : ''}`}
           onClick={() => { setActiveTab('custom'); setSelectedPeriodeId(null); }}
        >
          <FiPlus /> Ujian Mandiri (Custom Guru)
        </button>
      </div>



      <div className="guru-card">
         <div className="guru-card-header" style={{ flexDirection: selectedPeriodeId && activeTab === 'official' ? 'column' : 'row', alignItems: selectedPeriodeId && activeTab === 'official' ? 'flex-start' : 'center', gap: '0.75rem' }}>
           {selectedPeriodeId && activeTab === 'official' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px', marginBottom: '0.25rem' }}>
                  <button 
                    onClick={() => setSelectedPeriodeId(null)}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      background: 'white', 
                      border: '1px solid #cbd5e1', 
                      padding: '6px 12px', 
                      borderRadius: '8px', 
                      color: '#475569', 
                      cursor: 'pointer', 
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                  >
                    ← Kembali ke Daftar Ujian Resmi
                  </button>
                  <button
                    onClick={handleExportPDF}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 3px rgba(16, 185, 129, 0.3)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#059669'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#10b981'; }}
                  >
                    <FiPrinter /> Export PDF
                  </button>
                </div>
               <h2 className="guru-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                 {periods.find(p => p.id === selectedPeriodeId)?.nama}
                 {periods.find(p => p.id === selectedPeriodeId)?.schedules?.some(j => j.opsiKeamanan) && (
                   <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                     <FiShield size={10} /> Kiosk
                   </span>
                 )}
               </h2>
             </>
           ) : (
             <>
               <h2 className="guru-card-title">
                 {activeTab === 'official' ? 'Daftar Jadwal Resmi' : 'Daftar Ulangan Custom'}
               </h2>
               {activeTab === 'custom' && (
                 <button className="btn-add-user" onClick={openAddCustom} disabled={saving}>
                   <FiPlus className="btn-plus" />
                   <span>Buat Ulangan Mandiri</span>
                 </button>
               )}
             </>
           )}
         </div>

        {loading ? (
          <div className="loading-state">Memuat data jadwal...</div>
        ) : activeTab === 'official' ? (
          <div className="jadwal-table official-table">
            {officialJadwal.length === 0 ? (
               <div className="empty-state">Belum ada jadwal resmi dari Admin.</div>
            ) : !selectedPeriodeId ? (
               <>
                 <div className="jadwal-row jadwal-row-head" style={{ gridTemplateColumns: '80px 1fr 200px 150px 150px' }}>
                   <div>No</div>
                   <div>Nama Ujian</div>
                   <div>Semester & Tahun Ajaran</div>
                   <div style={{ textAlign: 'center' }}>Jumlah Sesi</div>
                   <div style={{ textAlign: 'center' }}>Aksi</div>
                 </div>

                 {paginatedPeriods.map((p, idx) => (
                   <div 
                     key={p.id} 
                     className="jadwal-row" 
                     style={{ gridTemplateColumns: '80px 1fr 200px 150px 150px', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                     onClick={() => {
                       setSelectedPeriodeId(p.id);
                       setCurrentPageOfficial(1);
                     }}
                   >
                     <div style={{ fontWeight: '500', color: '#64748b' }}>
                       {siPeriods + idx + 1}
                     </div>
                     <div className="col-main" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                       <div className="jadwal-nama" style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1e293b' }}>
                         {p.nama}
                       </div>
                       {p.mulai && p.selesai && (
                         <div className="jadwal-meta-info" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                           <FiCalendar size={12} style={{ marginRight: '4px' }} />
                           Periode: {new Date(p.mulai).toLocaleDateString('id-ID', { dateStyle: 'medium' })} s.d. {new Date(p.selesai).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                         </div>
                       )}
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                       <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>
                         Semester {p.semester}
                       </span>
                       <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                         TA: {p.tahunAjaran}
                       </span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                       <span className="mapel-badge" style={{ background: '#f1f5f9', color: '#334155', fontWeight: '700', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
                         {p.schedules.length} Sesi Ujian
                       </span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                       <button 
                         type="button" 
                         className="btn-action primary with-label"
                         onClick={(e) => {
                           e.stopPropagation();
                           setSelectedPeriodeId(p.id);
                           setCurrentPageOfficial(1);
                         }}
                         style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}
                       >
                         <FiEye /> <span>Lihat Sesi</span>
                       </button>
                     </div>
                   </div>
                 ))}
                 {renderPagination(periods.length, tpPeriods, dpPeriods, setCurrentPagePeriods, currentPagePeriods, isShowAllPeriods)}
               </>
            ) : (
               <>

                 <div className="jadwal-row jadwal-row-head">
                   <div>Mapel</div>
                   <div>Token Akses</div>
                   <div>Kelas</div>
                   <div>Waktu</div>
                   <div>Status Paket</div>
                   <div>Aksi</div>
                 </div>

                 {paginatedOfficial.length === 0 ? (
                   <div className="empty-state">Tidak ada sesi ujian untuk periode ini.</div>
                 ) : (
                   paginatedOfficial.map((j) => (
                     <div key={j.id} className="jadwal-row">
                       <div className="col-main">
                         <div className="jadwal-nama" style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>
                           {j.mataPelajaran?.namaMapel}
                         </div>
                         <div className="jadwal-meta-info" style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                           Kode: <strong>{j.mataPelajaran?.kodeMapel || '-'}</strong>
                         </div>
                       </div>

                       <div className="col-tokens">
                         <div className="token-box in">
                           <span>IN</span>
                           <span className="token-value">{j.token}</span>
                         </div>
                         <div className="token-box out">
                           <span>OUT</span>
                           <span className="token-value">{j.tokenCheckOut}</span>
                         </div>
                       </div>

                       <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {j.kelasJadwal && j.kelasJadwal.length > 0 ? (
                            <div className="class-tooltip-container">
                              <span 
                                className="mapel-badge" 
                                style={{ 
                                  background: '#eff6ff', 
                                  color: '#1e40af', 
                                  border: '1px solid #bfdbfe', 
                                  fontWeight: '700', 
                                  padding: '4px 12px', 
                                  borderRadius: '20px', 
                                  fontSize: '0.85rem',
                                  cursor: 'pointer'
                                }}
                              >
                                {j.kelasJadwal.length} Kelas
                              </span>
                              <div className="class-tooltip-bubble">
                                <div style={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: j.kelasJadwal.length === 1 ? '1fr' : 'repeat(2, 1fr)', 
                                  gap: '8px', 
                                  minWidth: j.kelasJadwal.length === 1 ? '100px' : '180px' 
                                }}>
                                  {j.kelasJadwal.map((kj, idx) => (
                                    <span key={idx} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                      {getNamaKelasDisplay(kj.kelas)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Tidak ada kelas</span>
                          )}
                        </div>

                       <div className="waktu-info" style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem', color: '#475569', justifyContent: 'center', textAlign: 'center' }}>
                         <div style={{ fontWeight: '700', color: '#0f172a' }}>{j.durasi} Menit</div>
                         <div style={{ fontSize: '0.75rem', color: '#64748b' }}>M: {formatDate(j.mulai)}</div>
                         <div style={{ fontSize: '0.75rem', color: '#64748b' }}>S: {formatDate(j.selesai)}</div>
                       </div>

                       <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                         {j.paketUjianId ? (
                           j.paketUjian?.guruId === myPakets?.[0]?.guruId ? ( 
                             <span className="status-badge aktif" style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>
                               Milik Anda
                             </span>
                           ) : (
                             <span className="status-badge info" style={{ background: '#e0f2fe', color: '#075985', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>
                               Guru Lain
                             </span>
                           )
                         ) : (
                           <span className="status-badge warning" style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>
                             Belum Terisi
                           </span>
                         )}
                       </div>

                       <div className="col-actions">
                          {j.paketUjianId && j.paketUjian?.guruId === myPakets?.[0]?.guruId ? (
                              <button className="btn-action danger with-label" onClick={() => handleUnlinkPaket(j.id)} disabled={saving} title="Lepas Paket">
                                <FiXCircle /> <span>Lepas</span>
                              </button>
                          ) : !j.paketUjianId ? (
                              <button className="btn-action primary with-label" onClick={() => handleOpenPilihPaket(j.id)} disabled={saving}>
                                <FiLink /> <span>Isi Paket</span>
                              </button>
                          ) : null}
                       </div>
                     </div>
                   ))
                 )}
                 {renderPagination(filteredOfficialJadwal.length, tpOfficial, dpOfficial, setCurrentPageOfficial, currentPageOfficial, isShowAllOfficial)}
               </>
            )}
          </div>
        ) : (
          /* CUSTOM TAB */
          <div className="jadwal-table custom-table">
             {customJadwal.length === 0 ? (
               <div className="empty-state">Anda belum membuat ulangan mandiri.</div>
             ) : (
               <>
                 <div className="jadwal-row jadwal-row-head">
                    <div>Nama Ulangan</div>
                    <div>Token Akses</div>
                    <div>Paket Soal</div>
                    <div>Kelas & Waktu</div>
                    <div>Keamanan</div>
                    <div>Aksi</div>
                 </div>

                 {paginatedCustom.map((j) => (
                   <div key={j.id} className="jadwal-row">
                      <div className="col-main">
                        <div className="jadwal-nama">{j.nama}</div>
                        <div className="jadwal-meta-info">
                          <FiClock size={12} /> Durasi: <strong>{j.durasi} Menit</strong>
                        </div>
                      </div>

                      <div className="col-tokens">
                        <div className="token-box in">
                          <span>IN</span>
                          <span className="token-value">{j.token}</span>
                        </div>
                        <div className="token-box out">
                          <span>OUT</span>
                          <span className="token-value">{j.tokenCheckOut}</span>
                        </div>
                      </div>

                      <div className="col-mapel-paket">
                         <div className="mapel-badge">
                           {j.mataPelajaran?.namaMapel} ({j.mataPelajaran?.kodeMapel || '-'})
                         </div>
                         <div className="paket-badge">
                           {j.paketUjian?.nama}
                         </div>
                      </div>

                      <div className="col-kelas-waktu">
                         <div className="kelas-count">{j.kelasJadwal?.length || 0} Kelas Peserta</div>
                         <div className="waktu-info">
                            <div className="waktu-stack">
                              <span>Mulai: {formatDate(j.mulai)}</span>
                              <span>Selesai: {formatDate(j.selesai)}</span>
                            </div>
                         </div>
                      </div>

                      <div>
                        {j.opsiKeamanan ? (
                           <span className="status-badge aktif"><FiShield /> Kiosk On</span>
                        ) : (
                           <span className="status-badge warning"><FiXCircle /> Kiosk Off</span>
                        )}
                      </div>

                      <div className="col-actions">
                        <button className="btn-action primary" onClick={() => openEditCustom(j)} disabled={saving} title="Edit Ulangan">
                          <FiEdit2 />
                        </button>
                        <button className="btn-action danger" onClick={() => deleteCustomExam(j.id)} disabled={saving} title="Hapus Ulangan">
                          <FiTrash2 />
                        </button>
                      </div>
                   </div>
                 ))}
               </>
             )}
             {renderPagination(customJadwal.length, tpCustom, dpCustom, setCurrentPageCustom, currentPageCustom, isShowAllCustom)}
          </div>
        )}
      </div>

      {/* MODAL PILIH PAKET UNTUK JADWAL RESMI */}
      {showPilihPaketModal && (
         <div className="modal-overlay">
           <div className="modal-container">
             <div className="modal-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0'}}>
                <h3 className="modal-title">Pilih Paket Soal Anda</h3>
                <button className="modal-close" onClick={() => setShowPilihPaketModal(false)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'}}><FiX size={20} /></button>
             </div>
             <div className="modal-body" style={{maxHeight:'50vh', overflowY:'auto', padding: '1.5rem 2rem'}}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{marginBottom: '0.75rem', fontSize: '0.9rem', color: '#64748b'}}>Hanya paket berstatus Siap Ujian yang akan ditampilkan di sini.</p>
                  <input
                    type="text"
                    className="input"
                    placeholder="Cari paket ujian..."
                    value={searchPaket}
                    onChange={(e) => setSearchPaket(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  />
                </div>
                {(() => {
                  const jadwalAktif = officialJadwal.find(j => j.id === activeJadwalId) || customJadwal.find(j => j.id === activeJadwalId);
                  const filteredPakets = myPakets.filter(p => 
                    (jadwalAktif ? String(p.mataPelajaran?.id) === String(jadwalAktif.mataPelajaranId) : true) &&
                    p.nama.toLowerCase().includes(searchPaket.toLowerCase())
                  );

                  if (filteredPakets.length === 0) {
                     return <div className="user-alert" style={{textAlign: 'center'}}>Tidak ada paket ujian yang ditemukan untuk mata pelajaran ini.</div>;
                  }

                  return (
                     <div style={{ display: 'grid', gap: '1rem' }}>
                       {filteredPakets.map(p => (
                          <div
                             key={p.id}
                             onClick={() => !saving && handleLinkPaket(p.id)}
                             style={{
                               padding: '1.25rem',
                               border: '1px solid #e2e8f0',
                               borderRadius: '12px',
                               background: '#f8fafc',
                               cursor: saving ? 'not-allowed' : 'pointer',
                               transition: 'all 0.18s ease',
                               opacity: saving ? 0.6 : 1,
                             }}
                             onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.12)'; } }}
                             onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                           >
                             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                               <strong style={{display: 'block', color: '#0f172a', whiteSpace: 'normal', overflowWrap: 'break-word'}}>{p.nama}</strong>
                               {p.guru?.user?.namaLengkap && (
                                 <span style={{fontSize: '0.7rem', padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', color: '#475569', whiteSpace: 'nowrap', marginLeft: '8px'}}>Oleh: {p.guru.user.namaLengkap}</span>
                               )}
                             </div>
                             <span style={{fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '4px'}}>
                               {p.mataPelajaran?.namaMapel} • {p._count?.soalPaket || 0} Soal
                             </span>
                          </div>
                       ))}
                     </div>
                  );
                })()}
             </div>
           </div>
         </div>
      )}

      {/* MODAL BUAT UJIAN CUSTOM */}
      {showAddCustomModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{maxWidth: '600px'}}>
             <div className="modal-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0'}}>
               <h3 className="modal-title">{editingId ? 'Edit Ulangan Mandiri' : 'Buat Ulangan Mandiri'}</h3>
               <button type="button" className="modal-close" onClick={() => setShowAddCustomModal(false)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'}}><FiX size={20} /></button>
             </div>
             <form className="user-form" onSubmit={handleSaveCustom}>
               <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1.5rem 2rem' }}>
                 <div className="form-group" style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                    <div className="field-wrapper" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      <label className="label" style={{fontWeight: '700', fontSize: '0.9rem'}}>Judul Ulangan <span className="label-required" style={{color: '#ef4444'}}>*</span></label>
                      <input className="input" style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0'}} placeholder="Misal: Ulangan Harian Bab 1" value={nama} onChange={(e) => setNama(e.target.value)} required />
                    </div>

                    <div className="field-wrapper" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      <label className="label" style={{fontWeight: '700', fontSize: '0.9rem'}}>Mata Pelajaran <span className="label-required" style={{color: '#ef4444'}}>*</span></label>
                      <select className="input" style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0'}} value={mataPelajaranId} onChange={(e) => setMataPelajaranId(e.target.value)} required>
                         <option value="">Pilih Mapel...</option>
                         {mapelList.map((m) => <option key={m.id} value={m.id}>{m.namaMapel} ({m.kodeMapel || '-'})</option>)}
                      </select>
                    </div>

                    <div className="field-wrapper" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      <label className="label" style={{fontWeight: '700', fontSize: '0.9rem'}}>Pilih Paket Ujian Anda <span className="label-required" style={{color: '#ef4444'}}>*</span></label>
                      <select className="input" style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0'}} value={paketUjianId} onChange={(e) => setPaketUjianId(e.target.value)} required>
                         <option value="">Pilih Paket...</option>
                          {myPakets.filter(p => String(p.mataPelajaranId) === String(mataPelajaranId)).map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                      </select>
                      <p className="field-hint" style={{fontSize: '0.75rem', color: '#64748b'}}>Hanya paket dengan mapel terkait yang muncul.</p>
                    </div>

                    <div className="form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                      <div className="field-wrapper" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                        <label className="label" style={{fontWeight: '700', fontSize: '0.9rem'}}>Waktu Mulai <span className="label-required" style={{color: '#ef4444'}}>*</span></label>
                        <input type="datetime-local" className="input" style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0'}} value={mulai} onChange={(e) => setMulai(e.target.value)} required />
                      </div>
                      <div className="field-wrapper" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                        <label className="label" style={{fontWeight: '700', fontSize: '0.9rem'}}>Waktu Selesai <span className="label-required" style={{color: '#ef4444'}}>*</span></label>
                        <input type="datetime-local" className="input" style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0'}} value={selesai} onChange={(e) => setSelesai(e.target.value)} required />
                      </div>
                    </div>

                     <div className="field-wrapper" style={{ marginTop: '0.5rem' }}>
                       <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: opsiKeamanan ? '#ecfdf5' : '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: `1px solid ${opsiKeamanan ? '#10b981' : '#e2e8f0'}`, cursor: 'pointer' }}>
                         <input type="checkbox" checked={opsiKeamanan} onChange={(e) => setOpsiKeamanan(e.target.checked)} style={{transform: 'scale(1.5)', marginInline: '5px'}}/>
                         <div>
                            <span style={{ fontWeight: '700', color: opsiKeamanan ? '#10b981' : '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FiShield /> Aktifkan Opsi Keamanan Kiosk Mode
                            </span>
                            <p style={{fontSize: '0.75rem', color: '#64748b', margin: 0, fontWeight: 'normal'}}>Mencegah aplikasi keluar/pindah aplikasi saat ujian berlangsung.</p>
                         </div>
                       </label>
                    </div>

                    <div className="field-wrapper" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      <label className="label" style={{fontWeight: '700', fontSize: '0.9rem'}}>Durasi Pengerjaan (Menit) <span className="label-required" style={{color: '#ef4444'}}>*</span></label>
                      <input type="number" min="1" className="input" style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0'}} value={durasi} onChange={(e) => setDurasi(e.target.value)} required />
                    </div>

                    <div className="field-wrapper" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      <label className="label" style={{fontWeight: '700', fontSize: '0.9rem'}}>Pilih Kelas <span className="label-required" style={{color: '#ef4444'}}>*</span></label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                         {kelasList.map(k => {
                           const tingkatLabel = { X: '10', XI: '11', XII: '12', ALUMNI: 'Alumni', KI: 'KI' }[k.tingkat] || k.tingkat;
                           const kName = `${tingkatLabel} ${k.jurusan?.kodeProdi || ''} ${k.inisial || ''}`.replace(/\s+$/, '');
                           return (
                             <label key={k.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'all 0.2s' }}>
                               <input type="checkbox" checked={selectedKelas.includes(String(k.id))} onChange={() => toggleKelas(String(k.id))} style={{transform: 'scale(1.2)'}}/>
                               <span style={{ fontSize: '0.9rem', color: '#334155' }}>{kName}</span>
                             </label>
                           );
                         })}
                      </div>
                    </div>
                 </div>
               </div>
               <div className="modal-footer" style={{padding: '1.5rem 2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
                  <button type="button" className="btn-modal-cancel" onClick={() => setShowAddCustomModal(false)}>Batal</button>
                  <button type="submit" className="btn-modal-submit" disabled={saving}>
                    {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Buat Ujian Mandiri'}
                  </button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmModal && confirmData && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-confirm" style={{ padding: '1.5rem' }}>
              <div className="modal-confirm-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="modal-confirm-icon-box danger" style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  fontSize: '1.5rem',
                  flexShrink: 0
                }}>
                  <FiAlertCircle />
                </div>
                <h3 className="modal-confirm-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                  {confirmData.title}
                </h3>
              </div>
              <div className="modal-confirm-body" style={{ marginBottom: '1.5rem' }}>
                <div className="modal-confirm-text" style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                  {confirmData.message}
                </div>
                {confirmData.warning && (
                  <div className="modal-confirm-warning" style={{
                    display: 'flex',
                    gap: '0.5rem',
                    background: '#fffbeb',
                    border: '1px solid #fef3c7',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: '#b45309',
                    fontSize: '0.85rem',
                    lineHeight: '1.4'
                  }}>
                    <FiAlertCircle style={{ flexShrink: 0, marginTop: '0.15rem', fontSize: '1rem' }} />
                    <span>{confirmData.warning}</span>
                  </div>
                )}
              </div>
              <div className="modal-confirm-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowConfirmModal(false)} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 600 }}>
                  Batal
                </button>
                <button type="button" className="btn-danger" onClick={confirmData.action} style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FiTrash2 /> Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
