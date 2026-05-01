const BASE_URL = process.env.SIJUWAN_API_BASE_URL;
const API_KEY = process.env.SIJUWAN_API_KEY;

const fetchSijuwan = async (endpoint, params = {}, retries = 3) => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-API-Key': API_KEY,
          'Accept': 'application/json',
          'User-Agent': 'CAT-Website-Sync/1.0',
          'Connection': 'close',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`⚠️ API Fetch attempt ${i+1} failed: ${err.message}. Retrying...`);
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};

module.exports = {
  getGuru: (params) => fetchSijuwan('/guru', params),
  getSiswa: (params) => fetchSijuwan('/siswa', params),
  getProdi: (params) => fetchSijuwan('/prodi', params),
  getKelas: (params) => fetchSijuwan('/kelas', params),
  getMapel: (params) => fetchSijuwan('/mapel', params),
  getAngkatan: (params) => fetchSijuwan('/angkatan', params), // If available
};
