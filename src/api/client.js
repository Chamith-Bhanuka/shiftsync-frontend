import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({ baseURL: BASE_URL });

// ---- Session helpers (no JWT in this build — simple "act as" picker) ----

const SESSION_KEY = 'shiftsync_user';

export function getSessionUser() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSessionUser(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSessionUser() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ================= Scheduling Service =================

export const getEmployees = (locationId = 1) =>
  apiClient.get(`/scheduling/employees?locationId=${locationId}`).then((res) => res.data);

export const getShifts = (locationId = 1) =>
  apiClient.get(`/scheduling/shifts?locationId=${locationId}`).then((res) => res.data);

export const createShift = (payload) =>
  apiClient.post('/scheduling/shifts', payload).then((res) => res.data);

export const getAvailableEmployeesForShift = (shiftId) =>
  apiClient.get(`/scheduling/shifts/${shiftId}/available-employees`).then((res) => res.data);

export const claimShift = (shiftId, employeeId) =>
  apiClient.put(`/scheduling/shifts/${shiftId}/claim`, { employeeId }).then((res) => res.data);

export const createSwapRequest = (payload) =>
  apiClient.post('/scheduling/swap-requests', payload).then((res) => res.data);

export const respondToSwapRequest = (id, payload) =>
  apiClient.put(`/scheduling/swap-requests/${id}/respond`, payload).then((res) => res.data);

export const approveSwapRequest = (id) =>
  apiClient.put(`/scheduling/swap-requests/${id}/approve`).then((res) => res.data);

export const rejectSwapRequest = (id) =>
  apiClient.put(`/scheduling/swap-requests/${id}/reject`).then((res) => res.data);

export const getSwapRequestsForEmployee = (employeeId) =>
  apiClient.get(`/scheduling/swap-requests?employeeId=${employeeId}`).then((res) => res.data);

export const getAwaitingDecisionSwapRequests = () =>
  apiClient.get('/scheduling/swap-requests/awaiting-decision').then((res) => res.data);

// ================= Notification Service =================

export const getNotifications = (userId) =>
  apiClient.get(`/notifications/notifications?userId=${userId}`).then((res) => res.data);

export const getUnreadNotifications = (userId) =>
  apiClient.get(`/notifications/notifications/unread?userId=${userId}`).then((res) => res.data);

export const markNotificationRead = (id) =>
  apiClient.put(`/notifications/notifications/${id}/read`).then((res) => res.data);

// ================= Credential Service =================

export const uploadCredential = (employeeId, employeeName, documentType, note, file) => {
  const formData = new FormData();
  formData.append('employeeId', employeeId);
  if (employeeName) formData.append('employeeName', employeeName);
  formData.append('documentType', documentType);
  if (note) formData.append('note', note);
  formData.append('file', file);
  return apiClient
    .post('/credentials/credentials/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
};

export const getCredentialsForEmployee = (employeeId) =>
  apiClient.get(`/credentials/credentials/${employeeId}`).then((res) => res.data);

export const getPendingReviewDocuments = () =>
  apiClient.get('/credentials/credentials/pending-review').then((res) => res.data);

export const reviewDocument = (objectPath, decision, reviewerId, comment) =>
  apiClient
    .put('/credentials/credentials/review', { objectPath, decision, reviewerId, comment })
    .then((res) => res.data);
