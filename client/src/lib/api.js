import { fallbackSettings, fallbackSubjects, fallbackActivities, fallbackGallery, fallbackCourses } from './fallback';
const BASE = '';
async function req(path, opts = {}) {
  const res = await fetch(BASE + path, { credentials: 'include', ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers||{}) } });
  if (!res.ok) {
    let msg = 'خطأ في الطلب';
    try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
    throw new Error(msg);
  }
  return res.json();
}
const qs = (params) => {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') s.set(k, v); });
  const str = s.toString();
  return str ? '?' + str : '';
};
const body = (d) => JSON.stringify(d);

const emptySite = {
  settings: fallbackSettings,
  navigation: [],
  sections: [],
  pages: [],
  payments: { online_enabled: false, mode: 'sandbox', providers: [] },
};

export const api = {
  // ---- public ----
  getBootstrap: async () => {
    try { return await req('/api/public/bootstrap'); }
    catch {
      const [subjects, activities, gallery, courses] = await Promise.all([
        api.getSubjects(), api.getActivities(), api.getGallery(), api.getCourses(),
      ]);
      return { ...emptySite, subjects, activities, gallery, courses };
    }
  },
  getSettings: async () => { try { return await req('/api/public/settings'); } catch { return fallbackSettings; } },
  getSubjects: async () => { try { return await req('/api/public/subjects'); } catch { return fallbackSubjects; } },
  getActivities: async () => { try { return await req('/api/public/activities'); } catch { return fallbackActivities; } },
  getGallery: async () => { try { return await req('/api/public/gallery'); } catch { return fallbackGallery; } },
  getCourses: async () => { try { return await req('/api/public/courses'); } catch { return fallbackCourses; } },
  getCourse: (slug) => req('/api/public/courses/' + encodeURIComponent(slug)),
  getNavigation: (location) => req('/api/public/navigation' + qs({ location })),
  getSections: () => req('/api/public/sections'),
  getPages: () => req('/api/public/pages'),
  getPage: (slug) => req('/api/public/pages/' + encodeURIComponent(slug)),
  getPaymentConfig: () => req('/api/public/payment-config'),
  enroll: (d) => req('/api/public/enrollments', { method: 'POST', body: body(d) }),
  getOrder: (orderNumber, token) => req('/api/public/orders/' + encodeURIComponent(orderNumber) + qs({ token })),
  startCheckout: (orderNumber, provider, token) => req('/api/public/orders/' + encodeURIComponent(orderNumber) + '/checkout', { method: 'POST', body: body({ provider, token }) }),

  // ---- auth ----
  login: (u,p) => req('/api/auth/login', { method:'POST', body: body({username:u,password:p}) }),
  logout: () => req('/api/auth/logout', { method:'POST' }),
  session: () => req('/api/auth/session'),

  // ---- admin ----
  me: () => req('/api/admin/me'),
  stats: () => req('/api/admin/stats'),
  adminSettings: () => req('/api/admin/settings'),
  updateSettings: (d) => req('/api/admin/settings', { method:'PUT', body: body(d) }),
  adminSubjects: () => req('/api/admin/subjects'),
  createSubject: (d) => req('/api/admin/subjects', { method:'POST', body: body(d) }),
  updateSubject: (id,d) => req('/api/admin/subjects/'+id, { method:'PUT', body: body(d) }),
  deleteSubject: (id) => req('/api/admin/subjects/'+id, { method:'DELETE' }),
  adminActivities: () => req('/api/admin/activities'),
  createActivity: (d) => req('/api/admin/activities', { method:'POST', body: body(d) }),
  updateActivity: (id,d) => req('/api/admin/activities/'+id, { method:'PUT', body: body(d) }),
  deleteActivity: (id) => req('/api/admin/activities/'+id, { method:'DELETE' }),
  adminGallery: () => req('/api/admin/gallery'),
  createGallery: (d) => req('/api/admin/gallery', { method:'POST', body: body(d) }),
  updateGallery: (id,d) => req('/api/admin/gallery/'+id, { method:'PUT', body: body(d) }),
  deleteGallery: (id) => req('/api/admin/gallery/'+id, { method:'DELETE' }),
  adminCourses: () => req('/api/admin/courses'),
  createCourse: (d) => req('/api/admin/courses', { method:'POST', body: body(d) }),
  updateCourse: (id,d) => req('/api/admin/courses/'+id, { method:'PUT', body: body(d) }),
  deleteCourse: (id) => req('/api/admin/courses/'+id, { method:'DELETE' }),
  adminNavigation: (location) => req('/api/admin/navigation' + qs({ location })),
  createNavigation: (d) => req('/api/admin/navigation', { method:'POST', body: body(d) }),
  updateNavigation: (id,d) => req('/api/admin/navigation/'+id, { method:'PUT', body: body(d) }),
  deleteNavigation: (id) => req('/api/admin/navigation/'+id, { method:'DELETE' }),
  adminSections: () => req('/api/admin/sections'),
  updateSection: (id,d) => req('/api/admin/sections/'+id, { method:'PUT', body: body(d) }),
  adminPages: () => req('/api/admin/pages'),
  createPage: (d) => req('/api/admin/pages', { method:'POST', body: body(d) }),
  updatePage: (id,d) => req('/api/admin/pages/'+id, { method:'PUT', body: body(d) }),
  deletePage: (id) => req('/api/admin/pages/'+id, { method:'DELETE' }),
  adminMedia: () => req('/api/admin/media'),
  createMedia: (d) => req('/api/admin/media', { method:'POST', body: body(d) }),
  updateMedia: (id,d) => req('/api/admin/media/'+id, { method:'PUT', body: body(d) }),
  deleteMedia: (id) => req('/api/admin/media/'+id, { method:'DELETE' }),
  adminEnrollments: (status) => req('/api/admin/enrollments' + qs({ status })),
  updateEnrollment: (id,d) => req('/api/admin/enrollments/'+id, { method:'PUT', body: body(d) }),
  deleteEnrollment: (id) => req('/api/admin/enrollments/'+id, { method:'DELETE' }),
  adminOrders: (status) => req('/api/admin/orders' + qs({ status })),
  createOrder: (d) => req('/api/admin/orders', { method:'POST', body: body(d) }),
  updateOrder: (id,d) => req('/api/admin/orders/'+id, { method:'PUT', body: body(d) }),
  markOrderPaid: (id) => req('/api/admin/orders/'+id+'/mark-paid', { method:'POST' }),
  deleteOrder: (id) => req('/api/admin/orders/'+id, { method:'DELETE' }),
  orderEvents: (id) => req('/api/admin/orders/'+id+'/events'),
  adminUsers: () => req('/api/admin/users'),
  createUser: (d) => req('/api/admin/users', { method:'POST', body: body(d) }),
  updateUser: (id,d) => req('/api/admin/users/'+id, { method:'PUT', body: body(d) }),
  deleteUser: (id) => req('/api/admin/users/'+id, { method:'DELETE' }),
  adminAudit: (limit=100) => req('/api/admin/audit' + qs({ limit })),
  reorder: (entity, ids) => req('/api/admin/reorder', { method:'POST', body: body({ entity, ids }) }),
  paymentsStatus: () => req('/api/admin/payments/status'),
  changePassword: (cur,nxt) => req('/api/admin/password', { method:'PUT', body: body({current:cur,next:nxt}) }),
  upload: async (file) => {
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/upload', { method:'POST', credentials:'include', body: fd });
    if (!res.ok) { let m='فشل الرفع'; try{const j=await res.json(); if(j.error)m=j.error;}catch{} throw new Error(m); }
    return res.json();
  }
};

export const enrollmentsCsvUrl = '/api/admin/enrollments/export.csv';
