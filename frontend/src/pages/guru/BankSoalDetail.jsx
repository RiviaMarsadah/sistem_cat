import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FiEdit2, FiPlus, FiTrash2, FiUpload, FiX, FiFolder, FiEye, FiCheck, FiSearch, FiArrowLeft, FiDownload, FiHelpCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';
import { compressImageToWebP } from '../../utils/imageCompressor';
import { useToast } from '../../context/ToastContext';
import './GuruTheme.css';
import './JadwalUjian.css';
import './BankSoal.css';

const BASE_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

const KATEGORI_OPTIONS = [
  { value: 'pilgan', label: 'Pilihan Ganda Sederhana' },
  { value: 'pilgan_kompleks', label: 'Pilihan Ganda Kompleks' },
  { value: 'pilgan_kategori', label: 'Pilihan Ganda Kategori' },
];

const TINGKAT_OPTIONS = [
  { value: '10', api: 'X', label: '10' },
  { value: '11', api: 'XI', label: '11' },
  { value: '12', api: 'XII', label: '12' },
  { value: '0', api: 'SEMUA', label: 'Semua Tingkat' },
];

const ITEMS_PER_PAGE = 10;

function getPaginationPages(totalPages, currentPage) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => ({ type: 'page', value: i + 1 }));
  }
  const delta = 2;
  const rangeStart = Math.max(2, currentPage - delta);
  const rangeEnd = Math.min(totalPages - 1, currentPage + delta);
  const result = [];
  result.push({ type: 'page', value: 1 });
  if (rangeStart > 2) result.push({ type: 'ellipsis', key: 'left' });
  for (let i = rangeStart; i <= rangeEnd; i++) result.push({ type: 'page', value: i });
  if (rangeEnd < totalPages - 1) result.push({ type: 'ellipsis', key: 'right' });
  if (totalPages > 1) result.push({ type: 'page', value: totalPages });
  return result;
}

function tingkatToDisplay(t) {
  if (t === 'X') return '10';
  if (t === 'XI') return '11';
  if (t === 'XII') return '12';
  if (t === 'SEMUA') return 'Semua';
  return t;
}

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

const isImageFile = (str) => typeof str === 'string' && str.trim().endsWith('.webp');

export default function BankSoalDetail() {
  const { koleksiId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapelList, setMapelList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
  const [koleksiList, setKoleksiList] = useState([]);
  const [koleksiDetail, setKoleksiDetail] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  const [importMapel, setImportMapel] = useState('');
  const [importTingkat, setImportTingkat] = useState('');
  const [importJurusan, setImportJurusan] = useState('');
  const [importNamaBankSoal, setImportNamaBankSoal] = useState('');
  const [importKoleksiId, setImportKoleksiId] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  const [selectedSoalForPreview, setSelectedSoalForPreview] = useState(null);
  const [selectedSoalForEdit, setSelectedSoalForEdit] = useState(null);

  // States for CREATE Soal Modal (Persistent)
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMataPelajaranId, setAddMataPelajaranId] = useState('');
  const [addTingkat, setAddTingkat] = useState('10');
  const [addJurusanId, setAddJurusanId] = useState('');
  const [addKategoriSoal, setAddKategoriSoal] = useState('pilgan');
  const [addSoalText, setAddSoalText] = useState('');
  const [addKolom, setAddKolom] = useState({ A: '', B: '', C: '', D: '', E: '' });
  const [addJawaban, setAddJawaban] = useState({ single: '', multi: [], benarSalah: { A: '', B: '', C: '', D: '', E: '' } });
  const [addGambarFile, setAddGambarFile] = useState(null);
  const [addGambarPreview, setAddGambarPreview] = useState('');
  const [addKolomGambarFile, setAddKolomGambarFile] = useState({ A: null, B: null, C: null, D: null, E: null });
  const [addKolomGambarPreview, setAddKolomGambarPreview] = useState({ A: '', B: '', C: '', D: '', E: '' });
  const [addSaving, setAddSaving] = useState(false);

  // States for EDIT Soal Modal (Non-persistent on switch, but modal edit itself is standard)
  const [editMataPelajaranId, setEditMataPelajaranId] = useState('');
  const [editTingkat, setEditTingkat] = useState('10');
  const [editJurusanId, setEditJurusanId] = useState('');
  const [editKategoriSoal, setEditKategoriSoal] = useState('pilgan');
  const [editSoalText, setEditSoalText] = useState('');
  const [editKolom, setEditKolom] = useState({ A: '', B: '', C: '', D: '', E: '' });
  const [editJawaban, setEditJawaban] = useState({ single: '', multi: [], benarSalah: { A: '', B: '', C: '', D: '', E: '' } });
  const [editGambar, setEditGambar] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Image Upload Queue inside Edit form
  const [editGambarFile, setEditGambarFile] = useState(null);
  const [editGambarPreview, setEditGambarPreview] = useState('');
  const [editKolomGambarFile, setEditKolomGambarFile] = useState({ A: null, B: null, C: null, D: null, E: null });
  const [editKolomGambarPreview, setEditKolomGambarPreview] = useState({ A: '', B: '', C: '', D: '', E: '' });

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

  const loadSoal = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (koleksiId) params.set('bankSoalKoleksiId', koleksiId);
      const res = await api.get(`/guru/bank-soal?${params.toString()}`);
      setItems(res.data?.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal memuat bank soal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadKoleksiDetail = async () => {
    if (!koleksiId) return;
    try {
      const res = await api.get(`/guru/bank-soal-koleksi/${koleksiId}`);
      if (res.data?.success) {
        setKoleksiDetail(res.data.data);
      }
    } catch (e) {
      console.error('Gagal memuat detail koleksi:', e);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    loadSoal();
    loadKoleksiDetail();
  }, [koleksiId]);

  const triggerDelete = (item) => {
    setConfirmData({
      id: item.id,
      title: 'Hapus Soal?',
      message: `Yakin ingin menghapus butir soal ini?`,
      warning: 'Berkas gambar terkait soal ini di server backend akan ikut dibersihkan dan dihapus secara permanen.',
      action: async () => {
        try {
          await api.delete(`/guru/bank-soal/${item.id}`);
          showToast('Soal berhasil dihapus.', 'success');
          loadSoal();
        } catch (e) {
          showToast(e?.response?.data?.message || 'Gagal menghapus soal', 'error');
        } finally {
          setShowConfirmModal(false);
          setConfirmData(null);
        }
      }
    });
    setShowConfirmModal(true);
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/guru/bank-soal/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Template_Bank_Soal.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal mengunduh template', 'error');
    }
  };

  // Add Question Handlers
  const handleAddImageUpload = async (file, type) => {
    if (!file) return;
    try {
      const { compressedFile, previewUrl } = await compressImageToWebP(file);
      if (type === 'soal') {
        setAddGambarFile(compressedFile);
        setAddGambarPreview(previewUrl);
      } else {
        setAddKolomGambarFile(prev => ({ ...prev, [type]: compressedFile }));
        setAddKolomGambarPreview(prev => ({ ...prev, [type]: previewUrl }));
        setAddKolom(prev => ({ ...prev, [type]: `${type}_image.webp` }));
      }
    } catch (err) {
      showToast(err.message || 'Gagal memproses gambar', 'error');
    }
  };

  const handleRemoveAddImage = (type) => {
    if (type === 'soal') {
      setAddGambarFile(null);
      setAddGambarPreview('');
    } else {
      setAddKolomGambarFile(prev => ({ ...prev, [type]: null }));
      setAddKolomGambarPreview(prev => ({ ...prev, [type]: '' }));
      setAddKolom(prev => ({ ...prev, [type]: '' }));
    }
  };

  const toggleMultiAdd = (letter) => {
    setAddJawaban((j) => ({
      ...j,
      multi: j.multi.includes(letter) ? j.multi.filter((x) => x !== letter) : [...j.multi, letter],
    }));
  };

  const setBenarSalahAdd = (letter, value) => {
    setAddJawaban((j) => ({
      ...j,
      benarSalah: { ...j.benarSalah, [letter]: value },
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    const filledKolom = ['A', 'B', 'C', 'D', 'E'].filter((l) => addKolom[l]?.trim()).length;
    if (addKategoriSoal !== 'pilgan_kategori' && filledKolom < 3) {
      showToast('Minimal 3 kolom jawaban harus diisi.', 'error');
      return;
    }
    if (addKategoriSoal === 'pilgan' && !addJawaban.single) {
      showToast('Pilih satu jawaban yang benar.', 'error');
      return;
    }
    if (addKategoriSoal === 'pilgan_kompleks' && addJawaban.multi.length === 0) {
      showToast('Pilih minimal satu jawaban benar.', 'error');
      return;
    }
    if ((addKategoriSoal === 'pilgan' || addKategoriSoal === 'pilgan_kompleks') && !addSoalText.trim()) {
      showToast('Pertanyaan wajib diisi.', 'error');
      return;
    }
    if (!addMataPelajaranId || !addTingkat) {
      showToast('Mata pelajaran dan tingkat wajib dipilih.', 'error');
      return;
    }

    setAddSaving(true);

    try {
      // 1. Process local image queue
      let finalGambar = '';
      if (addGambarFile) {
        const formData = new FormData();
        formData.append('image', addGambarFile);
        const uploadRes = await api.post('/guru/bank-soal/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalGambar = uploadRes.data?.filename;
      }

      const finalKolom = { ...addKolom };
      for (const letter of ['A', 'B', 'C', 'D', 'E']) {
        if (addKolomGambarFile[letter]) {
          const formData = new FormData();
          formData.append('image', addKolomGambarFile[letter]);
          const uploadRes = await api.post('/guru/bank-soal/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          finalKolom[letter] = uploadRes.data?.filename;
        }
      }

      const buildAddJawabanValue = () => {
        if (addKategoriSoal === 'pilgan') return addJawaban.single;
        if (addKategoriSoal === 'pilgan_kompleks') return addJawaban.multi.sort().join(',');
        if (addKategoriSoal === 'pilgan_kategori') {
          const filled = ['A', 'B', 'C', 'D', 'E'].filter((l) => finalKolom[l]?.trim());
          return filled.map((l) => (addJawaban.benarSalah[l] === 'S' ? 'S' : 'B')).join(',');
        }
        return '';
      };

      const payload = {
        bankSoalKoleksiId: Number(koleksiId),
        mataPelajaranId: Number(addMataPelajaranId),
        tingkat: displayToTingkatApi(addTingkat),
        jurusanId: addJurusanId === '' ? null : Number(addJurusanId),
        kategoriSoal: addKategoriSoal,
        soal: addSoalText.trim() || null,
        kolomA: finalKolom.A || null,
        kolomB: finalKolom.B || null,
        kolomC: finalKolom.C || null,
        kolomD: finalKolom.D || null,
        kolomE: finalKolom.E || null,
        jawaban: buildAddJawabanValue(),
        gambar: finalGambar || null,
      };

      await api.post('/guru/bank-soal', payload);
      showToast('Soal baru berhasil ditambahkan!', 'success');
      
      // RESET all creation states ONLY after a successful submit!
      setAddSoalText('');
      setAddKolom({ A: '', B: '', C: '', D: '', E: '' });
      setAddJawaban({ single: '', multi: [], benarSalah: { A: '', B: '', C: '', D: '', E: '' } });
      setAddGambarFile(null);
      setAddGambarPreview('');
      setAddKolomGambarFile({ A: null, B: null, C: null, D: null, E: null });
      setAddKolomGambarPreview({ A: '', B: '', C: '', D: '', E: '' });
      
      setShowAddModal(false);
      loadSoal();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal menyimpan soal', 'error');
    } finally {
      setAddSaving(false);
    }
  };

  // Edit Question Handlers
  const handleOpenEdit = (row) => {
    setSelectedSoalForEdit(row);
    setEditMataPelajaranId(row.mataPelajaranId ?? '');
    setEditTingkat(apiToTingkatDisplay(row.tingkat) ?? '10');
    setEditJurusanId(row.jurusanId != null ? String(row.jurusanId) : '');
    setEditKategoriSoal(row.kategoriSoal || 'pilgan');
    setEditSoalText(row.soal || '');
    setEditKolom({
      A: row.kolomA || '',
      B: row.kolomB || '',
      C: row.kolomC || '',
      D: row.kolomD || '',
      E: row.kolomE || '',
    });

    // Setup Edit Image states
    setEditGambarFile(null);
    if (row.gambar && row.gambar.endsWith('.webp')) {
      setEditGambarPreview(row.gambar);
      setEditGambar(row.gambar);
    } else {
      setEditGambarPreview('');
      setEditGambar(row.gambar || '');
    }

    setEditKolomGambarFile({ A: null, B: null, C: null, D: null, E: null });
    const initialKolomGambarPreview = { A: '', B: '', C: '', D: '', E: '' };
    ['A', 'B', 'C', 'D', 'E'].forEach((letter) => {
      const val = row[`kolom${letter}`];
      if (val && val.endsWith('.webp')) {
        initialKolomGambarPreview[letter] = val;
      }
    });
    setEditKolomGambarPreview(initialKolomGambarPreview);
    
    // Parse jawaban
    if (row.kategoriSoal === 'pilgan') {
      setEditJawaban({
        single: row.jawaban || '',
        multi: [],
        benarSalah: { A: '', B: '', C: '', D: '', E: '' }
      });
    } else if (row.kategoriSoal === 'pilgan_kompleks') {
      setEditJawaban({
        single: '',
        multi: (row.jawaban || '').split(',').map((s) => s.trim()).filter(Boolean),
        benarSalah: { A: '', B: '', C: '', D: '', E: '' }
      });
    } else {
      const parts = (row.jawaban || '').split(',').map((s) => s.trim().toUpperCase());
      const k = { A: row.kolomA || '', B: row.kolomB || '', C: row.kolomC || '', D: row.kolomD || '', E: row.kolomE || '' };
      const filledLetters = ['A', 'B', 'C', 'D', 'E'].filter((l) => k[l]?.trim());
      const bs = { A: '', B: '', C: '', D: '', E: '' };
      filledLetters.forEach((l, i) => { bs[l] = parts[i] === 'S' ? 'S' : 'B'; });
      setEditJawaban({
        single: '',
        multi: [],
        benarSalah: bs
      });
    }
  };

  const handleEditImageUpload = async (file, type) => {
    if (!file) return;
    try {
      const { compressedFile, previewUrl } = await compressImageToWebP(file);
      if (type === 'soal') {
        setEditGambarFile(compressedFile);
        setEditGambarPreview(previewUrl);
      } else {
        setEditKolomGambarFile(prev => ({ ...prev, [type]: compressedFile }));
        setEditKolomGambarPreview(prev => ({ ...prev, [type]: previewUrl }));
        setEditKolom(prev => ({ ...prev, [type]: `${type}_image.webp` }));
      }
    } catch (err) {
      showToast(err.message || 'Gagal memproses gambar', 'error');
    }
  };

  const handleRemoveEditImage = (type) => {
    if (type === 'soal') {
      setEditGambarFile(null);
      setEditGambarPreview('');
      setEditGambar('');
    } else {
      setEditKolomGambarFile(prev => ({ ...prev, [type]: null }));
      setEditKolomGambarPreview(prev => ({ ...prev, [type]: '' }));
      setEditKolom(prev => ({ ...prev, [type]: '' }));
    }
  };

  const toggleMultiEdit = (letter) => {
    setEditJawaban((j) => ({
      ...j,
      multi: j.multi.includes(letter) ? j.multi.filter((x) => x !== letter) : [...j.multi, letter],
    }));
  };

  const setBenarSalahEdit = (letter, value) => {
    setEditJawaban((j) => ({
      ...j,
      benarSalah: { ...j.benarSalah, [letter]: value },
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const filledKolom = ['A', 'B', 'C', 'D', 'E'].filter((l) => editKolom[l]?.trim()).length;
    if (editKategoriSoal !== 'pilgan_kategori' && filledKolom < 3) {
      showToast('Minimal 3 kolom jawaban harus diisi.', 'error');
      return;
    }
    if (editKategoriSoal === 'pilgan' && !editJawaban.single) {
      showToast('Pilih satu jawaban yang benar.', 'error');
      return;
    }
    if (editKategoriSoal === 'pilgan_kompleks' && editJawaban.multi.length === 0) {
      showToast('Pilih minimal satu jawaban benar.', 'error');
      return;
    }
    if ((editKategoriSoal === 'pilgan' || editKategoriSoal === 'pilgan_kompleks') && !editSoalText.trim()) {
      showToast('Pertanyaan wajib diisi.', 'error');
      return;
    }
    if (!editMataPelajaranId || !editTingkat) {
      showToast('Mata pelajaran dan tingkat wajib dipilih.', 'error');
      return;
    }

    setEditSaving(true);

    try {
      // Process edit image queue
      let finalGambar = editGambar;
      if (editGambarFile) {
        const formData = new FormData();
        formData.append('image', editGambarFile);
        const uploadRes = await api.post('/guru/bank-soal/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalGambar = uploadRes.data?.filename;
      }

      const finalKolom = { ...editKolom };
      for (const letter of ['A', 'B', 'C', 'D', 'E']) {
        if (editKolomGambarFile[letter]) {
          const formData = new FormData();
          formData.append('image', editKolomGambarFile[letter]);
          const uploadRes = await api.post('/guru/bank-soal/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          finalKolom[letter] = uploadRes.data?.filename;
        } else if (editKolomGambarPreview[letter]) {
          finalKolom[letter] = editKolomGambarPreview[letter];
        }
      }

      const buildEditJawabanValue = () => {
        if (editKategoriSoal === 'pilgan') return editJawaban.single;
        if (editKategoriSoal === 'pilgan_kompleks') return editJawaban.multi.sort().join(',');
        if (editKategoriSoal === 'pilgan_kategori') {
          const filled = ['A', 'B', 'C', 'D', 'E'].filter((l) => finalKolom[l]?.trim());
          return filled.map((l) => (editJawaban.benarSalah[l] === 'S' ? 'S' : 'B')).join(',');
        }
        return '';
      };

      const payload = {
        bankSoalKoleksiId: Number(koleksiId),
        mataPelajaranId: Number(editMataPelajaranId),
        tingkat: displayToTingkatApi(editTingkat),
        jurusanId: editJurusanId === '' ? null : Number(editJurusanId),
        kategoriSoal: editKategoriSoal,
        soal: editSoalText.trim() || null,
        kolomA: finalKolom.A || null,
        kolomB: finalKolom.B || null,
        kolomC: finalKolom.C || null,
        kolomD: finalKolom.D || null,
        kolomE: finalKolom.E || null,
        jawaban: buildEditJawabanValue(),
        gambar: finalGambar || null,
      };

      await api.put(`/guru/bank-soal/${selectedSoalForEdit.id}`, payload);
      showToast('Soal berhasil diubah!', 'success');
      setSelectedSoalForEdit(null);
      loadSoal();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal menyimpan soal', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setImportResult(null);

    const mapel = importMapel ? Number(importMapel) : null;
    const kelas = importTingkat ? displayToTingkatApi(importTingkat) : null;
    const prodi = importJurusan ? Number(importJurusan) : null;
    const isNew = !koleksiId && importNamaBankSoal.trim();
    const isExist = !koleksiId && importKoleksiId;

    if (!koleksiId && !isNew && !isExist) {
      showToast('Wajib tentukan nama Bank Soal.', 'error');
      return;
    }
    if (!mapel || !kelas) {
      showToast('Mata pelajaran dan tingkat wajib diisi.', 'error');
      return;
    }
    if (!importFile) {
      showToast('Pilih file Excel terlebih dahulu.', 'error');
      return;
    }

    setImportLoading(true);

    try {
      let finalKoleksiId = koleksiId ? Number(koleksiId) : null;

      if (!koleksiId && isNew) {
        const createRes = await api.post('/guru/bank-soal-koleksi', { nama: importNamaBankSoal.trim() });
        finalKoleksiId = createRes.data?.data?.id;
        if (!finalKoleksiId) throw new Error('Gagal membuat bank soal koleksi baru');
      } else if (!koleksiId && isExist) {
        finalKoleksiId = Number(importKoleksiId);
      }

      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('bankSoalKoleksiId', String(finalKoleksiId));
      formData.append('mataPelajaranId', String(mapel));
      formData.append('tingkat', kelas);
      if (prodi) formData.append('jurusanId', String(prodi));

      const res = await api.post('/guru/bank-soal/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const resultData = res.data?.data || res.data;
      setImportResult(resultData);

      if (resultData.failed === 0) {
        showToast('Seluruh soal berhasil diimpor!', 'success');
        loadSoal();
        setTimeout(() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportResult(null);
        }, 1800);
      } else {
        showToast(`Impor selesai sebagian. ${resultData.created || 0} sukses, ${resultData.failed || 0} gagal.`, 'error');
        loadSoal();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mengimpor file excel.', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const filteredItems = items.filter((row) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const soalMatch = (row.soal || '').toLowerCase().includes(query);
    const jawabanMatch = (row.jawaban || '').toLowerCase().includes(query);
    const opsiAMatch = (row.kolomA || '').toLowerCase().includes(query);
    const opsiBMatch = (row.kolomB || '').toLowerCase().includes(query);
    const opsiCMatch = (row.kolomC || '').toLowerCase().includes(query);
    const opsiDMatch = (row.kolomD || '').toLowerCase().includes(query);
    const opsiEMatch = (row.kolomE || '').toLowerCase().includes(query);
    
    return soalMatch || jawabanMatch || opsiAMatch || opsiBMatch || opsiCMatch || opsiDMatch || opsiEMatch;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const isShowAll = currentPage === 9999;
  const displayPage = isShowAll ? 1 : Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = isShowAll ? 0 : (displayPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = isShowAll ? filteredItems : filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage !== 9999 && currentPage > totalPages && totalPages >= 1) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const hasPrefilledCollection = items.length > 0 || (koleksiDetail && koleksiDetail.mataPelajaranId && koleksiDetail.tingkat);

  useEffect(() => {
    if (koleksiDetail && koleksiDetail.mataPelajaranId && koleksiDetail.tingkat) {
      setImportMapel(koleksiDetail.mataPelajaranId ? String(koleksiDetail.mataPelajaranId) : '');
      setImportTingkat(koleksiDetail.tingkat ? apiToTingkatDisplay(koleksiDetail.tingkat) : '');
      setImportJurusan(koleksiDetail.jurusanId != null ? String(koleksiDetail.jurusanId) : '');
      
      // Prefill persistent ADD states
      setAddMataPelajaranId(koleksiDetail.mataPelajaranId ? String(koleksiDetail.mataPelajaranId) : '');
      setAddTingkat(koleksiDetail.tingkat ? apiToTingkatDisplay(koleksiDetail.tingkat) : '10');
      setAddJurusanId(koleksiDetail.jurusanId != null ? String(koleksiDetail.jurusanId) : '');
    } else if (items.length > 0) {
      const first = items[0];
      setImportMapel(first.mataPelajaranId ? String(first.mataPelajaranId) : '');
      setImportTingkat(first.tingkat ? apiToTingkatDisplay(first.tingkat) : '');
      setImportJurusan(first.jurusanId != null ? String(first.jurusanId) : '');
      
      // Prefill persistent ADD states
      setAddMataPelajaranId(first.mataPelajaranId ? String(first.mataPelajaranId) : '');
      setAddTingkat(first.tingkat ? apiToTingkatDisplay(first.tingkat) : '10');
      setAddJurusanId(first.jurusanId != null ? String(first.jurusanId) : '');
    }
    if (koleksiId) {
      setImportKoleksiId(koleksiId);
    }
  }, [items, koleksiId, koleksiDetail]);

  return (
    <div className="bank-soal-page">
      <div className="bank-soal-header-banner flex justify-between items-center">
        <div>
          <button type="button" className="btn-back" onClick={() => navigate('/guru/bank-soal')} style={{ marginBottom: '0.75rem' }}>
            <FiArrowLeft /> Kembali ke Daftar Bank Soal
          </button>
          <h1 className="page-title guru-title">
            Detail Bank Soal
            <span className="title-badge guru-badge">Guru</span>
          </h1>
          <p className="page-subtitle">Manajemen butir soal, pembuatan soal baru, kunci jawaban, dan impor berkas Excel.</p>
        </div>
      </div>

      {showImportModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="bank-soal-modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Import Soal via Excel</h2>
              <button type="button" className="modal-close" onClick={() => { setShowImportModal(false); setImportResult(null); setImportFile(null); }} aria-label="Tutup">×</button>
            </div>
            
            <div className="import-modal-body">
              <div className="import-modal-actions mb-4" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <button type="button" className="btn-download-template" onClick={handleDownloadTemplate}>
                  <FiDownload /> Download Template Excel
                </button>
                <button type="button" className="btn-guide" onClick={() => setShowGuideModal(true)}>
                  <FiHelpCircle /> Baca Panduan Format
                </button>
              </div>

              <form onSubmit={handleImportSubmit} className="import-form">
                <div className="form-row two-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Mata Pelajaran *</label>
                    <select value={importMapel} onChange={(e) => setImportMapel(e.target.value)} required disabled={Boolean(koleksiId)} style={koleksiId ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}>
                      <option value="">Pilih Mapel</option>
                      {mapelList.map((m) => (
                        <option key={m.id} value={m.id}>{m.namaMapel} ({m.kodeMapel || '-'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Tingkat (Kelas) *</label>
                    <select value={importTingkat} onChange={(e) => setImportTingkat(e.target.value)} required disabled={Boolean(koleksiId)} style={koleksiId ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}>
                      <option value="">Pilih Kelas</option>
                      {TINGKAT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: '1.25rem' }}>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Program Studi (Jurusan)</label>
                    <select value={importJurusan} onChange={(e) => setImportJurusan(e.target.value)} disabled={Boolean(koleksiId)} style={koleksiId ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}>
                      <option value="">Semua Prodi</option>
                      {jurusanList.map((j) => (
                        <option key={j.id} value={j.id}>{j.namaProdi}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="upload-zone-wrapper">
                   <FiUpload className="upload-icon" />
                   <p className="upload-text">Klik atau seret file Excel ke sini</p>
                   <p className="upload-sub">Format yang didukung: .xlsx, .xls</p>
                   <input
                     ref={fileInputRef}
                     type="file"
                     accept=".xlsx,.xls"
                     onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                   />
                </div>
                
                {importFile && (
                   <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                      <span className="file-name-chip"><FiFolder style={{ marginRight: '4px' }} /> {importFile.name}</span>
                   </div>
                )}

                <button type="submit" className="btn-submit-import" disabled={importLoading || !importFile}>
                  <FiUpload style={{ fontSize: '1.2rem' }} /> {importLoading ? 'Sedang Memproses...' : 'Mulai Import Data'}
                </button>
              </form>
              {importResult && (
                <div className={`import-result ${importResult.failed > 0 ? 'has-errors' : ''}`}>
                  <p><strong>{importResult.created}</strong> soal berhasil diimpor, <strong>{importResult.failed}</strong> gagal.</p>
                  {importResult.errors?.length > 0 && (
                    <ul className="import-errors-list">
                      {importResult.errors.slice(0, 15).map((err, i) => (
                        <li key={i}>Baris {err.row}: {err.message}</li>
                      ))}
                      {importResult.errors.length > 15 && (
                        <li>… dan {importResult.errors.length - 15} error lainnya.</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showGuideModal && (
        <div className="modal-overlay" onClick={() => setShowGuideModal(false)} role="dialog" aria-modal="true">
          <div className="bank-soal-modal guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Panduan Format Excel Import Bank Soal</h2>
              <button type="button" className="modal-close" onClick={() => setShowGuideModal(false)} aria-label="Tutup">×</button>
            </div>
            <div className="guide-content">
              <p className="guide-note mb-3" style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6', marginBottom: '1rem' }}>
                <strong>Catatan Penting:</strong> 
                Semua soal di dalam file Excel akan dimasukkan ke dalam <strong>Nama Bank Soal</strong> yang Anda pilih sebelum mengimpor.
              </p>
              <p><strong>Kolom di sheet &quot;Soal&quot; (baris pertama = header):</strong></p>
              <table className="guide-table">
                <thead>
                  <tr><th>Kolom</th><th>Keterangan</th></tr>
                </thead>
                <tbody>
                  <tr><td><code>Kategori</code></td><td><code>pilgan</code> | <code>pilgan_kompleks</code> | <code>pilgan_kategori</code></td></tr>
                  <tr><td><code>Soal</code></td><td>Teks pertanyaan (opsional untuk <code>pilgan_kategori</code>)</td></tr>
                  <tr><td><code>Opsi A</code> s/d <code>Opsi E</code></td><td>Isi opsi atau pernyataan. Minimal 3 untuk <code>pilgan</code>/<code>pilgan_kompleks</code>, minimal 1 untuk <code>pilgan_kategori</code></td></tr>
                  <tr><td><code>Jawaban</code></td><td>Single: satu huruf A–E. Multi: dipisah koma, contoh <code>A,B,D</code>. Benar/Salah: B atau S per pernyataan, contoh <code>B,B,S</code></td></tr>
                  <tr><td><code>Gambar</code></td><td>URL gambar (opsional)</td></tr>
                </tbody>
              </table>
              <p><strong>Contoh nilai Kategori:</strong> <code>pilgan</code>, <code>pilgan_kompleks</code>, <code>pilgan_kategori</code></p>
              <p>Untuk <strong>pilgan_kategori</strong>, isi Jawaban dengan <strong>B</strong> (Benar) dan <strong>S</strong> (Salah) sesuai urutan Opsi A, B, C, …</p>
              <p>Gunakan file template yang didownload agar format kolom sesuai.</p>
            </div>
          </div>
        </div>
      )}

      <div className="guru-card">
        <div className="guru-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: '1', minWidth: '300px', flexWrap: 'wrap' }}>
            <h2 className="guru-card-title" style={{ margin: 0, whiteSpace: 'nowrap' }}>Daftar Butir Soal</h2>
            
            <div className="search-box-wrap" style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1.1rem', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Cari soal, opsi, atau kunci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 2rem 0.55rem 2.25rem',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  backgroundColor: '#f8fafc',
                  transition: 'all 0.2s'
                }}
                className="search-input-premium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Bersihkan
                </button>
              )}
            </div>
          </div>

          <div className="header-actions" style={{ display: 'flex', gap: '0.75rem', margin: 0 }}>
            <button
              type="button"
              className="btn-import-excel"
              onClick={() => setShowImportModal(true)}
            >
              <FiUpload /> Import Soal
            </button>
            <button 
              type="button"
              className="btn-tambah"
              onClick={() => setShowAddModal(true)}
            >
              <FiPlus /> 
              <span>Tambah Soal</span>
            </button>
          </div>
        </div>

      {loading ? (
        <div className="bank-soal-loading">Memuat...</div>
      ) : (
        <div className="bank-soal-table-wrap">
          <table className="bank-soal-table">
            <thead>
              <tr>
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
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty-row">
                    {searchQuery ? 'Tidak ada soal yang cocok dengan pencarian Anda.' : 'Belum ada soal. Klik "Tambah Soal".'}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{startIndex + idx + 1}</td>
                    <td>
                      <span className={`badge badge-${row.kategoriSoal}`}>
                        {KATEGORI_OPTIONS.find((o) => o.value === row.kategoriSoal)?.label || row.kategoriSoal}
                      </span>
                    </td>
                    <td className="soal-preview" style={{ maxWidth: '200px' }}>
                      {row.soal ? (row.soal.length > 50 ? row.soal.slice(0, 50) + '…' : row.soal) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Pernyataan)</span>}
                    </td>
                    <td>
                      {row.gambar ? (
                        <img 
                          src={row.gambar.endsWith('.webp') ? `${BASE_URL}/uploads/${row.gambar}` : row.gambar} 
                          alt="Soal" 
                          style={{ maxHeight: '40px', borderRadius: '4px', maxWidth: '80px', objectFit: 'contain' }} 
                        />
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>-</span>
                      )}
                    </td>
                    <td>
                      {isImageFile(row.kolomA) ? (
                        <img src={`${BASE_URL}/uploads/${row.kolomA}`} alt="Opsi A" style={{ maxHeight: '40px', borderRadius: '4px' }} />
                      ) : (
                        row.kolomA || '-'
                      )}
                    </td>
                    <td>
                      {isImageFile(row.kolomB) ? (
                        <img src={`${BASE_URL}/uploads/${row.kolomB}`} alt="Opsi B" style={{ maxHeight: '40px', borderRadius: '4px' }} />
                      ) : (
                        row.kolomB || '-'
                      )}
                    </td>
                    <td>
                      {isImageFile(row.kolomC) ? (
                        <img src={`${BASE_URL}/uploads/${row.kolomC}`} alt="Opsi C" style={{ maxHeight: '40px', borderRadius: '4px' }} />
                      ) : (
                        row.kolomC || '-'
                      )}
                    </td>
                    <td>
                      {isImageFile(row.kolomD) ? (
                        <img src={`${BASE_URL}/uploads/${row.kolomD}`} alt="Opsi D" style={{ maxHeight: '40px', borderRadius: '4px' }} />
                      ) : (
                        row.kolomD || '-'
                      )}
                    </td>
                    <td>
                      {isImageFile(row.kolomE) ? (
                        <img src={`${BASE_URL}/uploads/${row.kolomE}`} alt="Opsi E" style={{ maxHeight: '40px', borderRadius: '4px' }} />
                      ) : (
                        row.kolomE || '-'
                      )}
                    </td>
                    <td>
                      <span className="badge badge-pilgan">
                        {row.jawaban}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        <button type="button" className="btn-icon view" onClick={() => setSelectedSoalForPreview(row)} title="Preview">
                          <FiEye />
                        </button>
                        <button type="button" className="btn-icon edit" onClick={() => handleOpenEdit(row)} title="Edit">
                          <FiEdit2 />
                        </button>
                        <button type="button" className="btn-icon delete" onClick={() => triggerDelete(row)} title="Hapus">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalItems > 0 && (
        <div className="bank-soal-pagination">
          <span className="pagination-info">
            {isShowAll 
              ? `Menampilkan 1-${totalItems} dari ${totalItems} soal`
              : `Menampilkan ${startIndex + 1}-${startIndex + paginatedItems.length} dari ${totalItems} soal`
            }
          </span>
          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              disabled={isShowAll || displayPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Halaman sebelumnya"
            >
              Sebelumnya
            </button>
            <div className="pagination-pages">
              {isShowAll ? (
                <button
                  type="button"
                  className="pagination-page active"
                  onClick={() => setCurrentPage(1)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Tampilkan Per Halaman
                </button>
              ) : (
                getPaginationPages(totalPages, displayPage).map((item, idx) =>
                  item.type === 'ellipsis' ? (
                    <span key={`ellipsis-${item.key}`} className="pagination-ellipsis" aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <button
                      key={item.value}
                      type="button"
                      className={`pagination-page ${item.value === displayPage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(item.value)}
                      aria-label={`Halaman ${item.value}`}
                      aria-current={item.value === displayPage ? 'page' : undefined}
                    >
                      {item.value}
                    </button>
                  )
                )
              )}
            </div>
            <button
              type="button"
              className="pagination-btn"
              disabled={isShowAll || displayPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Halaman berikutnya"
            >
              Berikutnya
            </button>
            {!isShowAll && (
              <button
                type="button"
                className="pagination-btn show-all"
                onClick={() => setCurrentPage(9999)}
                style={{ marginLeft: '0.5rem', whiteSpace: 'nowrap' }}
              >
                Tampilkan Semua
              </button>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Preview Modal - Hanya bisa ditutup dengan menekan tombol X */}
      {selectedSoalForPreview && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="bank-soal-modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Preview Detail Soal</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedSoalForPreview(null)}
                aria-label="Tutup"
              >
                <FiX />
              </button>
            </div>
            <div className="import-modal-body" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kategori</h4>
                <span className={`badge badge-${selectedSoalForPreview.kategoriSoal}`}>
                  {KATEGORI_OPTIONS.find((o) => o.value === selectedSoalForPreview.kategoriSoal)?.label || selectedSoalForPreview.kategoriSoal}
                </span>
              </div>

              {selectedSoalForPreview.soal && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pertanyaan</h4>
                  <p style={{ margin: 0, fontSize: '1rem', color: '#0f172a', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {selectedSoalForPreview.soal}
                  </p>
                </div>
              )}

              {selectedSoalForPreview.gambar && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gambar</h4>
                  <img 
                    src={selectedSoalForPreview.gambar.endsWith('.webp') ? `${BASE_URL}/uploads/${selectedSoalForPreview.gambar}` : selectedSoalForPreview.gambar} 
                    alt="Soal" 
                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #cbd5e1' }} 
                  />
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#475569', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opsi Jawaban / Pernyataan</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {['A', 'B', 'C', 'D', 'E'].map((letter) => {
                    const optionText = selectedSoalForPreview[`kolom${letter}`];
                    if (!optionText) return null;

                    const isOptionImg = isImageFile(optionText);
                    
                    let isCorrect = false;
                    if (selectedSoalForPreview.kategoriSoal === 'pilgan') {
                      isCorrect = selectedSoalForPreview.jawaban === letter;
                    } else if (selectedSoalForPreview.kategoriSoal === 'pilgan_kompleks') {
                      const correctAnswers = (selectedSoalForPreview.jawaban || '').split(',').map(s => s.trim());
                      isCorrect = correctAnswers.includes(letter);
                    } else if (selectedSoalForPreview.kategoriSoal === 'pilgan_kategori') {
                      const bsParts = (selectedSoalForPreview.jawaban || '').split(',').map(s => s.trim().toUpperCase());
                      const letters = ['A', 'B', 'C', 'D', 'E'].filter(l => selectedSoalForPreview[`kolom${l}`]?.trim());
                      const idx = letters.indexOf(letter);
                      const status = bsParts[idx] === 'S' ? 'Salah' : 'Benar';
                      
                      return (
                        <div key={letter} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            {letter}. {isOptionImg ? (
                              <img src={`${BASE_URL}/uploads/${optionText}`} alt={`Opsi ${letter}`} style={{ maxHeight: '60px', borderRadius: '4px' }} />
                            ) : (
                              optionText
                            )}
                          </span>
                          <span className={`badge ${status === 'Benar' ? 'badge-pilgan_kompleks' : 'badge-pilgan_kategori'}`}>{status}</span>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={letter} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '0.75rem 1rem', 
                          background: isCorrect ? 'rgba(34, 197, 94, 0.1)' : '#f8fafc', 
                          border: isCorrect ? '1px solid #22c55e' : '1px solid #e2e8f0', 
                          borderRadius: '8px',
                          color: isCorrect ? '#15803d' : '#0f172a',
                          fontWeight: isCorrect ? 600 : 400
                        }}
                      >
                        <span style={{ marginRight: '0.5rem', fontWeight: 700 }}>{letter}.</span>
                        {isOptionImg ? (
                          <img src={`${BASE_URL}/uploads/${optionText}`} alt={`Opsi ${letter}`} style={{ maxHeight: '60px', borderRadius: '4px' }} />
                        ) : (
                          <span>{optionText}</span>
                        )}
                        {isCorrect && <FiCheck style={{ marginLeft: 'auto', color: '#22c55e' }} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kunci Jawaban</h4>
                <span className="badge badge-pilgan" style={{ fontSize: '0.95rem', padding: '0.4rem 0.8rem' }}>
                  {selectedSoalForPreview.jawaban}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tambah Soal Modal - PERSISTENT Input, Hanya bisa ditutup dengan tombol X atau Batal */}
      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="bank-soal-modal" style={{ maxWidth: '780px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Soal Baru</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowAddModal(false)}
                aria-label="Tutup"
              >
                <FiX />
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
              <form onSubmit={handleAddSubmit} className="import-form" style={{ marginTop: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Mata Pelajaran *</label>
                    <select 
                      value={addMataPelajaranId} 
                      onChange={(e) => setAddMataPelajaranId(e.target.value)} 
                      disabled={hasPrefilledCollection} 
                      style={hasPrefilledCollection ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                      required
                    >
                      <option value="">— Pilih Mapel —</option>
                      {mapelList.map((m) => (
                        <option key={m.id} value={m.id}>{m.namaMapel} ({m.kodeMapel || '-'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Tingkat (Kelas) *</label>
                    <select 
                      value={addTingkat} 
                      onChange={(e) => setAddTingkat(e.target.value)} 
                      disabled={hasPrefilledCollection} 
                      style={hasPrefilledCollection ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                      required
                    >
                      {TINGKAT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Program Studi (Jurusan)</label>
                    <select 
                      value={addJurusanId} 
                      onChange={(e) => setAddJurusanId(e.target.value)} 
                      disabled={hasPrefilledCollection} 
                      style={hasPrefilledCollection ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                    >
                      <option value="">Semua Prodi</option>
                      {jurusanList.map((j) => (
                        <option key={j.id} value={j.id}>{j.namaProdi}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="filter-group" style={{ margin: '0 0 1.25rem 0' }}>
                  <label>Kategori Soal *</label>
                  <select value={addKategoriSoal} onChange={(e) => setAddKategoriSoal(e.target.value)}>
                    {KATEGORI_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group" style={{ margin: '0 0 1.25rem 0' }}>
                  <label style={{ fontWeight: 700 }}>{addKategoriSoal === 'pilgan_kategori' ? 'Pertanyaan (opsional)' : 'Pertanyaan *'}</label>
                  <textarea 
                    value={addSoalText} 
                    onChange={(e) => setAddSoalText(e.target.value)} 
                    rows={3} 
                    placeholder="Tulis pertanyaan..." 
                    required={addKategoriSoal !== 'pilgan_kategori'}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: '2px solid #cbd5e1', borderRadius: '8px', background: '#fff', fontSize: '0.9375rem', resize: 'vertical' }}
                  />
                </div>

                {/* Tambah Gambar Soal */}
                <div className="filter-group" style={{ margin: '0 0 1.5rem 0', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Gambar Soal (Opsional, Maks 3MB)</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        handleAddImageUpload(e.target.files[0], 'soal');
                        e.target.value = '';
                      }} 
                      style={{ display: 'none' }}
                      id="add-soal-image-file"
                    />
                    <label htmlFor="add-soal-image-file" className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', padding: '0.5rem 1rem', border: '1.5px dashed #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}>
                      Pilih / Unggah Gambar
                    </label>
                    {addGambarPreview && (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img 
                          src={addGambarPreview} 
                          alt="Preview Soal" 
                          style={{ maxHeight: '100px', borderRadius: '6px', border: '1px solid #e2e8f0' }} 
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveAddImage('soal')}
                          style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                          title="Hapus"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tambah Opsi A-E Mutually Exclusive */}
                <div className="filter-group" style={{ margin: '0 0 1.5rem 0' }}>
                  <label style={{ fontWeight: 700 }}>{addKategoriSoal === 'pilgan_kategori' ? 'Pernyataan (isi di kolom A–E)' : 'Opsi Jawaban (minimal 3)'}</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {['A', 'B', 'C', 'D', 'E'].map((letter) => {
                      const val = addKolom[letter] || '';
                      const hasText = val.trim() !== '' && !val.endsWith('.webp');
                      const hasImage = Boolean(addKolomGambarPreview[letter]);
                      
                      return (
                        <div key={letter} className="kolom-row" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                            <span className="kolom-letter" style={{ fontSize: '1.1rem', fontWeight: 'bold', minWidth: '20px' }}>{letter}.</span>
                            <input
                              type="text"
                              value={hasImage ? `[Berisi Gambar]` : val}
                              onChange={(e) => setAddKolom((k) => ({ ...k, [letter]: e.target.value }))}
                              placeholder={hasImage ? "Opsi berupa gambar (Terkunci)" : (addKategoriSoal === 'pilgan_kategori' ? `Pernyataan ${letter}` : `Opsi ${letter}`)}
                              disabled={hasImage}
                              style={{ margin: 0, flex: 1, backgroundColor: hasImage ? '#e2e8f0' : 'white', cursor: hasImage ? 'not-allowed' : 'text' }}
                            />
                            {addKategoriSoal === 'pilgan' && (
                              <button
                                type="button"
                                className={`btn-check ${addJawaban.single === letter ? 'active' : ''}`}
                                onClick={() => setAddJawaban((j) => ({ ...j, single: letter }))}
                                title="Jawaban benar"
                                style={{ margin: 0 }}
                              >
                                <FiCheck />
                              </button>
                            )}
                            {addKategoriSoal === 'pilgan_kompleks' && (
                              <button
                                type="button"
                                className={`btn-check ${addJawaban.multi.includes(letter) ? 'active' : ''}`}
                                onClick={() => toggleMultiAdd(letter)}
                                title="Centang jika benar"
                                style={{ margin: 0 }}
                              >
                                <FiCheck />
                              </button>
                            )}
                            {addKategoriSoal === 'pilgan_kategori' && (
                              <div className="benar-salah-btns" style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                  type="button"
                                  className={addJawaban.benarSalah[letter] === 'B' ? 'active' : ''}
                                  onClick={() => setBenarSalahAdd(letter, 'B')}
                                  style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: addJawaban.benarSalah[letter] === 'B' ? '#22c55e' : '#fff', color: addJawaban.benarSalah[letter] === 'B' ? '#fff' : '#475569', fontWeight: 600 }}
                                >
                                  Benar
                                </button>
                                <button
                                  type="button"
                                  className={addJawaban.benarSalah[letter] === 'S' ? 'active' : ''}
                                  onClick={() => setBenarSalahAdd(letter, 'S')}
                                  style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: addJawaban.benarSalah[letter] === 'S' ? '#ef4444' : '#fff', color: addJawaban.benarSalah[letter] === 'S' ? '#fff' : '#475569', fontWeight: 600 }}
                                >
                                  Salah
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Image Upload for this option */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '2rem', flexWrap: 'wrap' }}>
                            {!hasText && !hasImage && (
                              <>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    handleAddImageUpload(e.target.files[0], letter);
                                    e.target.value = '';
                                  }}
                                  id={`add-file-opsi-${letter}`}
                                  style={{ display: 'none' }}
                                />
                                <label htmlFor={`add-file-opsi-${letter}`} className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', padding: '0.25rem 0.75rem', border: '1px dashed #cbd5e1', borderRadius: '6px', fontSize: '0.75rem' }}>
                                  Unggah Gambar {letter}
                                </label>
                              </>
                            )}
                            {hasImage && (
                              <div style={{ position: 'relative', display: 'inline-block', marginTop: '0.25rem' }}>
                                <img
                                  src={addKolomGambarPreview[letter]}
                                  alt={`Preview Opsi ${letter}`}
                                  style={{ maxHeight: '80px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAddImage(letter)}
                                  style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '8px', fontWeight: 'bold' }}
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.6rem 1.2rem', cursor: 'pointer', background: '#fff' }}>
                    Batal
                  </button>
                  <button type="submit" className="btn-primary" disabled={addSaving} style={{ borderRadius: '8px', padding: '0.6rem 1.2rem', cursor: 'pointer', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 600 }}>
                    {addSaving ? 'Menyimpan...' : 'Simpan Soal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Hanya bisa ditutup dengan menekan tombol X */}
      {selectedSoalForEdit && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="bank-soal-modal" style={{ maxWidth: '780px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Soal</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedSoalForEdit(null)}
                aria-label="Tutup"
              >
                <FiX />
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
              <form onSubmit={handleEditSubmit} className="import-form" style={{ marginTop: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Mata Pelajaran (Terkunci)</label>
                    <select value={editMataPelajaranId} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}>
                      <option value="">— Pilih Mapel —</option>
                      {mapelList.map((m) => (
                        <option key={m.id} value={m.id}>{m.namaMapel} ({m.kodeMapel || '-'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Tingkat (Kelas) (Terkunci)</label>
                    <select value={editTingkat} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}>
                      {TINGKAT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group" style={{ margin: 0 }}>
                    <label>Program Studi (Terkunci)</label>
                    <select value={editJurusanId} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}>
                      <option value="">Semua Prodi</option>
                      {jurusanList.map((j) => (
                        <option key={j.id} value={j.id}>{j.namaProdi}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="filter-group" style={{ margin: '0 0 1.25rem 0' }}>
                  <label>Kategori Soal *</label>
                  <select value={editKategoriSoal} onChange={(e) => setEditKategoriSoal(e.target.value)}>
                    {KATEGORI_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group" style={{ margin: '0 0 1.25rem 0' }}>
                  <label style={{ fontWeight: 700 }}>{editKategoriSoal === 'pilgan_kategori' ? 'Pertanyaan (opsional)' : 'Pertanyaan *'}</label>
                  <textarea 
                    value={editSoalText} 
                    onChange={(e) => setEditSoalText(e.target.value)} 
                    rows={3} 
                    placeholder="Tulis pertanyaan..." 
                    required={editKategoriSoal !== 'pilgan_kategori'}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: '2px solid #cbd5e1', borderRadius: '8px', background: '#fff', fontSize: '0.9375rem', resize: 'vertical' }}
                  />
                </div>

                {/* Edit Gambar Soal */}
                <div className="filter-group" style={{ margin: '0 0 1.5rem 0', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Gambar Soal (Opsional, Maks 3MB)</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        handleEditImageUpload(e.target.files[0], 'soal');
                        e.target.value = '';
                      }} 
                      style={{ display: 'none' }}
                      id="edit-soal-image-file"
                    />
                    <label htmlFor="edit-soal-image-file" className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', padding: '0.5rem 1rem', border: '1.5px dashed #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}>
                      Pilih / Unggah Gambar
                    </label>
                    {editGambarPreview && (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img 
                          src={editGambarPreview.endsWith('.webp') ? `${BASE_URL}/uploads/${editGambarPreview}` : editGambarPreview} 
                          alt="Preview Soal" 
                          style={{ maxHeight: '100px', borderRadius: '6px', border: '1px solid #e2e8f0' }} 
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveEditImage('soal')}
                          style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                          title="Hapus"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Opsi A-E Mutually Exclusive */}
                <div className="filter-group" style={{ margin: '0 0 1.5rem 0' }}>
                  <label style={{ fontWeight: 700 }}>{editKategoriSoal === 'pilgan_kategori' ? 'Pernyataan (isi di kolom A–E)' : 'Opsi Jawaban (minimal 3)'}</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {['A', 'B', 'C', 'D', 'E'].map((letter) => {
                      const val = editKolom[letter] || '';
                      const hasText = val.trim() !== '' && !val.endsWith('.webp');
                      const hasImage = Boolean(editKolomGambarPreview[letter]);
                      
                      return (
                        <div key={letter} className="kolom-row" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                            <span className="kolom-letter" style={{ fontSize: '1.1rem', fontWeight: 'bold', minWidth: '20px' }}>{letter}.</span>
                            <input
                              type="text"
                              value={hasImage ? `[Berisi Gambar]` : val}
                              onChange={(e) => setEditKolom((k) => ({ ...k, [letter]: e.target.value }))}
                              placeholder={hasImage ? "Opsi berupa gambar (Terkunci)" : (editKategoriSoal === 'pilgan_kategori' ? `Pernyataan ${letter}` : `Opsi ${letter}`)}
                              disabled={hasImage}
                              style={{ margin: 0, flex: 1, backgroundColor: hasImage ? '#e2e8f0' : 'white', cursor: hasImage ? 'not-allowed' : 'text' }}
                            />
                            {editKategoriSoal === 'pilgan' && (
                              <button
                                type="button"
                                className={`btn-check ${editJawaban.single === letter ? 'active' : ''}`}
                                onClick={() => setEditJawaban((j) => ({ ...j, single: letter }))}
                                title="Jawaban benar"
                                style={{ margin: 0 }}
                              >
                                <FiCheck />
                              </button>
                            )}
                            {editKategoriSoal === 'pilgan_kompleks' && (
                              <button
                                type="button"
                                className={`btn-check ${editJawaban.multi.includes(letter) ? 'active' : ''}`}
                                onClick={() => toggleMultiEdit(letter)}
                                title="Centang jika benar"
                                style={{ margin: 0 }}
                              >
                                <FiCheck />
                              </button>
                            )}
                            {editKategoriSoal === 'pilgan_kategori' && (
                              <div className="benar-salah-btns" style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                  type="button"
                                  className={editJawaban.benarSalah[letter] === 'B' ? 'active' : ''}
                                  onClick={() => setBenarSalahEdit(letter, 'B')}
                                  style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: editJawaban.benarSalah[letter] === 'B' ? '#22c55e' : '#fff', color: editJawaban.benarSalah[letter] === 'B' ? '#fff' : '#475569', fontWeight: 600 }}
                                >
                                  Benar
                                </button>
                                <button
                                  type="button"
                                  className={editJawaban.benarSalah[letter] === 'S' ? 'active' : ''}
                                  onClick={() => setBenarSalahEdit(letter, 'S')}
                                  style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: editJawaban.benarSalah[letter] === 'S' ? '#ef4444' : '#fff', color: editJawaban.benarSalah[letter] === 'S' ? '#fff' : '#475569', fontWeight: 600 }}
                                >
                                  Salah
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Image Upload for this option */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '2rem', flexWrap: 'wrap' }}>
                            {!hasText && !hasImage && (
                              <>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    handleEditImageUpload(e.target.files[0], letter);
                                    e.target.value = '';
                                  }}
                                  id={`edit-file-opsi-${letter}`}
                                  style={{ display: 'none' }}
                                />
                                <label htmlFor={`edit-file-opsi-${letter}`} className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', padding: '0.25rem 0.75rem', border: '1px dashed #cbd5e1', borderRadius: '6px', fontSize: '0.75rem' }}>
                                  Unggah Gambar {letter}
                                </label>
                              </>
                            )}
                            {hasImage && (
                              <div style={{ position: 'relative', display: 'inline-block', marginTop: '0.25rem' }}>
                                <img
                                  src={editKolomGambarPreview[letter].endsWith('.webp') ? `${BASE_URL}/uploads/${editKolomGambarPreview[letter]}` : editKolomGambarPreview[letter]}
                                  alt={`Preview Opsi ${letter}`}
                                  style={{ maxHeight: '80px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditImage(letter)}
                                  style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifycontent: 'center', cursor: 'pointer', fontSize: '8px', fontWeight: 'bold' }}
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setSelectedSoalForEdit(null)} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.6rem 1.2rem', cursor: 'pointer', background: '#fff' }}>
                    Batal
                  </button>
                  <button type="submit" className="btn-primary" disabled={editSaving} style={{ borderRadius: '8px', padding: '0.6rem 1.2rem', cursor: 'pointer', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 600 }}>
                    {editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
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
