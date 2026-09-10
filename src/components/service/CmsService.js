/**
 * CMS Service
 *
 * Thin wrapper around the backend's /api/content endpoints (packages,
 * portfolio items, FAQs, site copy). GET calls are public; create/update/
 * delete calls attach the admin's JWT (mirroring AdminService's auth
 * pattern) since those routes require the ADMIN role.
 */
import axios from "axios";
import { API_URL as BASE_API_URL } from "../../lib/config";

const API_URL = `${BASE_API_URL}/api/content`;

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

class CmsService {
  // --- Packages ---
  static async getPackages(activeOnly = true) {
    const res = await axios.get(`${API_URL}/packages`, { params: { activeOnly } });
    return res.data.data;
  }
  static async createPackage(pkg) {
    const res = await axios.post(`${API_URL}/packages`, pkg, { headers: authHeaders() });
    return res.data;
  }
  static async updatePackage(id, pkg) {
    const res = await axios.put(`${API_URL}/packages/${id}`, pkg, { headers: authHeaders() });
    return res.data;
  }
  static async deletePackage(id) {
    const res = await axios.delete(`${API_URL}/packages/${id}`, { headers: authHeaders() });
    return res.data;
  }

  // --- Portfolio ---
  static async getPortfolio(activeOnly = true) {
    const res = await axios.get(`${API_URL}/portfolio`, { params: { activeOnly } });
    return res.data.data;
  }
  static async createPortfolioItem(item) {
    const res = await axios.post(`${API_URL}/portfolio`, item, { headers: authHeaders() });
    return res.data;
  }
  static async updatePortfolioItem(id, item) {
    const res = await axios.put(`${API_URL}/portfolio/${id}`, item, { headers: authHeaders() });
    return res.data;
  }
  static async deletePortfolioItem(id) {
    const res = await axios.delete(`${API_URL}/portfolio/${id}`, { headers: authHeaders() });
    return res.data;
  }

  // --- FAQs ---
  static async getFaqs(activeOnly = true) {
    const res = await axios.get(`${API_URL}/faqs`, { params: { activeOnly } });
    return res.data.data;
  }
  static async createFaq(faq) {
    const res = await axios.post(`${API_URL}/faqs`, faq, { headers: authHeaders() });
    return res.data;
  }
  static async updateFaq(id, faq) {
    const res = await axios.put(`${API_URL}/faqs/${id}`, faq, { headers: authHeaders() });
    return res.data;
  }
  static async deleteFaq(id) {
    const res = await axios.delete(`${API_URL}/faqs/${id}`, { headers: authHeaders() });
    return res.data;
  }

  // --- Site content ---
  static async getSiteContent() {
    const res = await axios.get(`${API_URL}/site`);
    return res.data.data;
  }
  static async saveSiteContent(key, content) {
    const res = await axios.put(`${API_URL}/site/${key}`, content, { headers: authHeaders() });
    return res.data;
  }

  // --- File upload (reused for package/portfolio images) ---
  static async uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(`${BASE_API_URL}/api/files/upload`, formData, {
      headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
    });
    return res.data.data; // { fileName, originalName, url }
  }
}

export default CmsService;
