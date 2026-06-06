import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动附加 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message || error.message || '网络请求失败';

    // Token 过期或未认证，跳转登录
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 避免在登录页重复跳转
      if (!window.location.pathname.includes('/login')) {
        message.error('登录已过期，请重新登录');
        window.location.href = '/login';
      }
    } else {
      message.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }

    return Promise.reject(error);
  },
);

// ========== 认证 API ==========
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// ========== 动物管理 API ==========
export const animalApi = {
  getList: (params?: any) => api.get('/animals', { params }),
  getDetail: (id: number) => api.get(`/animals/${id}`),
  create: (data: any) => api.post('/animals', data),
  update: (id: number, data: any) => api.patch(`/animals/${id}`, data),
  delete: (id: number) => api.delete(`/animals/${id}`),
  getSpecies: () => api.get('/animals/species'),
};

// ========== 健康记录 API ==========
export const healthApi = {
  getList: (params?: any) => api.get('/health-records', { params }),
  getDetail: (id: number) => api.get(`/health-records/${id}`),
  create: (data: any) => api.post('/health-records', data),
  update: (id: number, data: any) => api.patch(`/health-records/${id}`, data),
  delete: (id: number) => api.delete(`/health-records/${id}`),
};

// ========== 实验项目 API ==========
export const experimentApi = {
  getList: (params?: any) => api.get('/experiments', { params }),
  getDetail: (id: number) => api.get(`/experiments/${id}`),
  create: (data: any) => api.post('/experiments', data),
  update: (id: number, data: any) => api.patch(`/experiments/${id}`, data),
  delete: (id: number) => api.delete(`/experiments/${id}`),
  addAnimal: (data: any) => api.post('/experiments/animals', data),
  removeAnimal: (id: number) => api.delete(`/experiments/animals/${id}`),
};

// ========== 实验里程碑 API ==========
export const milestoneApi = {
  getList: (params?: any) => api.get('/experiment-milestones', { params }),
  getByExperimentId: (experimentId: number) =>
    api.get(`/experiment-milestones/experiment/${experimentId}`),
  getDetail: (id: number) => api.get(`/experiment-milestones/${id}`),
  create: (data: any) => api.post('/experiment-milestones', data),
  update: (id: number, data: any) => api.patch(`/experiment-milestones/${id}`, data),
  delete: (id: number) => api.delete(`/experiment-milestones/${id}`),
  getGanttData: (params?: any) => api.get('/experiment-milestones/gantt/data', { params }),
};

// ========== 饲养记录 API ==========
export const feedingApi = {
  getList: (params?: any) => api.get('/feeding-records', { params }),
  getDetail: (id: number) => api.get(`/feeding-records/${id}`),
  create: (data: any) => api.post('/feeding-records', data),
  update: (id: number, data: any) => api.patch(`/feeding-records/${id}`, data),
  delete: (id: number) => api.delete(`/feeding-records/${id}`),
};

// ========== 统计 API ==========
export const statisticsApi = {
  getOverview: () => api.get('/statistics/overview'),
  getAnimalStats: () => api.get('/statistics/animals'),
  getExperimentStats: () => api.get('/statistics/experiments'),
  getFeedingStats: () => api.get('/statistics/feeding'),
};

// ========== 动物转移/借调 API ==========
export const animalTransferApi = {
  getList: (params?: any) => api.get('/animal-transfers', { params }),
  getDetail: (id: number) => api.get(`/animal-transfers/${id}`),
  create: (data: any) => api.post('/animal-transfers', data),
  update: (id: number, data: any) => api.patch(`/animal-transfers/${id}`, data),
  delete: (id: number) => api.delete(`/animal-transfers/${id}`),
  startTransit: (id: number) => api.post(`/animal-transfers/${id}/start-transit`),
  confirmDelivery: (id: number) => api.post(`/animal-transfers/${id}/confirm-delivery`),
  confirmReturn: (id: number) => api.post(`/animal-transfers/${id}/confirm-return`),
  getTimeline: (id: number) => api.get(`/animal-transfers/${id}/timeline`),
};

// ========== 死亡记录 API ==========
export const deathRecordApi = {
  getList: (params?: any) => api.get('/death-records', { params }),
  getDetail: (id: number) => api.get(`/death-records/${id}`),
  getByAnimalId: (animalId: number) => api.get(`/death-records/animal/${animalId}`),
  create: (data: any) => api.post('/death-records', data),
  update: (id: number, data: any) => api.patch(`/death-records/${id}`, data),
  delete: (id: number) => api.delete(`/death-records/${id}`),
  getStatsByCause: () => api.get('/death-records/stats/by-cause'),
  getStatsByNecropsyStatus: () => api.get('/death-records/stats/by-necropsy-status'),
};

// ========== 库存管理 API ==========
export const inventoryApi = {
  getItems: (params?: any) => api.get('/inventory/items', { params }),
  getItemDetail: (id: number) => api.get(`/inventory/items/${id}`),
  getItemDetailWithTransactions: (id: number, params?: any) =>
    api.get(`/inventory/items/${id}/detail`, { params }),
  createItem: (data: any) => api.post('/inventory/items', data),
  updateItem: (id: number, data: any) => api.patch(`/inventory/items/${id}`, data),
  deleteItem: (id: number) => api.delete(`/inventory/items/${id}`),
  getWarnings: () => api.get('/inventory/items/warnings'),
  getCategorySummary: () => api.get('/inventory/items/category-summary'),
  getStockTrend: (id: number, days?: number) =>
    api.get(`/inventory/items/${id}/trend`, { params: { days } }),
  createTransaction: (data: any) => api.post('/inventory/transactions', data),
  getTransactions: (params?: any) => api.get('/inventory/transactions', { params }),
};

// ========== 尸检报告 API ==========
export const necropsyReportApi = {
  getList: () => api.get('/necropsy-reports'),
  getDetail: (id: number) => api.get(`/necropsy-reports/${id}`),
  getByDeathRecordId: (deathRecordId: number) => api.get(`/necropsy-reports/death-record/${deathRecordId}`),
  create: (deathRecordId: number, data: any) => api.post(`/necropsy-reports/death-record/${deathRecordId}`, data),
  update: (id: number, data: any) => api.patch(`/necropsy-reports/${id}`, data),
  delete: (id: number) => api.delete(`/necropsy-reports/${id}`),
  uploadImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/necropsy-reports/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  removeImage: (id: number, imageUrl: string) =>
    api.delete(`/necropsy-reports/${id}/images`, { data: { imageUrl } }),
};

export default api;
