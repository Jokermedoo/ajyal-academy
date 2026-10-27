const crypto = require('crypto');
const supabase = require('./supabase');

// ---- settings ----
async function getSettings() {
  const { data, error } = await supabase.from('settings').select('key,value');
  if (error) throw error;
  const obj = {};
  (data || []).forEach(r => { obj[r.key] = r.value; });
  return obj;
}
async function updateSettings(obj) {
  const rows = Object.entries(obj).map(([key, value]) => ({ key, value: String(value ?? '') }));
  if (!rows.length) return;
  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) throw error;
}

// ---- subjects ----
async function listSubjects(visibleOnly = false) {
  let q = supabase.from('subjects').select('*').order('sort_order').order('id');
  if (visibleOnly) q = q.eq('visible', 1);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
async function createSubject(d) {
  const { data, error } = await supabase.from('subjects').insert({
    title: d.title, description: d.description || '', icon: d.icon || 'BookOpen',
    image: d.image || null, sort_order: Number(d.sort_order || 0), visible: d.visible ? 1 : 0
  }).select().single();
  if (error) throw error;
  return data;
}
async function updateSubject(id, d) {
  const cur = await getSubject(id);
  const payload = {
    title: d.title !== undefined ? d.title : cur.title,
    description: d.description !== undefined ? d.description : cur.description,
    icon: d.icon !== undefined ? d.icon : cur.icon,
    image: d.image !== undefined ? d.image : cur.image,
    sort_order: d.sort_order !== undefined ? Number(d.sort_order) : cur.sort_order,
    visible: d.visible !== undefined ? (d.visible ? 1 : 0) : cur.visible,
  };
  const { data, error } = await supabase.from('subjects').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
async function getSubject(id) {
  const { data, error } = await supabase.from('subjects').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
async function deleteSubject(id) {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw error;
}

// ---- activities ----
async function listActivities(visibleOnly = false) {
  let q = supabase.from('activities').select('*').order('id', { ascending: false });
  if (visibleOnly) q = q.eq('visible', 1);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
async function createActivity(d) {
  const { data, error } = await supabase.from('activities').insert({
    title: d.title, description: d.description || '', image: d.image || null,
    event_date: d.event_date || '', visible: d.visible ? 1 : 0
  }).select().single();
  if (error) throw error;
  return data;
}
async function getActivity(id) {
  const { data, error } = await supabase.from('activities').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
async function updateActivity(id, d) {
  const cur = await getActivity(id);
  const payload = {
    title: d.title !== undefined ? d.title : cur.title,
    description: d.description !== undefined ? d.description : cur.description,
    image: d.image !== undefined ? d.image : cur.image,
    event_date: d.event_date !== undefined ? d.event_date : cur.event_date,
    visible: d.visible !== undefined ? (d.visible ? 1 : 0) : cur.visible,
  };
  const { data, error } = await supabase.from('activities').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
async function deleteActivity(id) {
  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) throw error;
}

// ---- gallery ----
async function listGallery(visibleOnly = false) {
  let q = supabase.from('gallery').select('*').order('sort_order').order('id');
  if (visibleOnly) q = q.eq('visible', 1);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
async function createGallery(d) {
  const { data, error } = await supabase.from('gallery').insert({
    image: d.image, caption: d.caption || '', visible: d.visible ? 1 : 0, sort_order: Number(d.sort_order || 0)
  }).select().single();
  if (error) throw error;
  return data;
}
async function getGalleryItem(id) {
  const { data, error } = await supabase.from('gallery').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
async function updateGallery(id, d) {
  const cur = await getGalleryItem(id);
  const payload = {
    image: d.image !== undefined ? d.image : cur.image,
    caption: d.caption !== undefined ? d.caption : cur.caption,
    visible: d.visible !== undefined ? (d.visible ? 1 : 0) : cur.visible,
    sort_order: d.sort_order !== undefined ? Number(d.sort_order) : cur.sort_order,
  };
  const { data, error } = await supabase.from('gallery').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
async function deleteGallery(id) {
  const { error } = await supabase.from('gallery').delete().eq('id', id);
  if (error) throw error;
}

// ---- courses ----
const COURSE_FIELDS = [
  'title', 'description', 'image', 'schedule', 'slug', 'price_cents', 'currency',
  'capacity', 'is_open', 'age_min', 'age_max', 'duration', 'sort_order',
  'seo_title', 'seo_description', 'visible',
];

async function listCourses(visibleOnly = false) {
  let q = supabase.from('courses').select('*').order('sort_order').order('id', { ascending: false });
  if (visibleOnly) q = q.eq('visible', 1);
  let { data, error } = await q;
  // Graceful fallback before migration 002 is applied (sort_order column missing).
  if (error && /sort_order/i.test(error.message || '')) {
    let q2 = supabase.from('courses').select('*').order('id', { ascending: false });
    if (visibleOnly) q2 = q2.eq('visible', 1);
    ({ data, error } = await q2);
  }
  if (error) throw error;
  return data || [];
}
async function createCourse(d) {
  const payload = {
    title: d.title,
    description: d.description || '',
    image: d.image || null,
    schedule: d.schedule || '',
    slug: d.slug || null,
    price_cents: Number(d.price_cents || 0),
    currency: d.currency || 'EGP',
    capacity: Number(d.capacity || 0),
    is_open: d.is_open ? 1 : 0,
    age_min: d.age_min != null ? Number(d.age_min) : null,
    age_max: d.age_max != null ? Number(d.age_max) : null,
    duration: d.duration || '',
    sort_order: Number(d.sort_order || 0),
    seo_title: d.seo_title || '',
    seo_description: d.seo_description || '',
    visible: d.visible ? 1 : 0,
  };
  const { data, error } = await supabase.from('courses').insert(payload).select().single();
  if (error) throw error;
  return data;
}
async function getCourse(id) {
  const { data, error } = await supabase.from('courses').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
async function getCourseBySlug(slug) {
  const { data, error } = await supabase.from('courses').select('*').eq('slug', slug).single();
  if (error) return null;
  return data;
}
async function updateCourse(id, d) {
  const cur = await getCourse(id);
  const payload = {};
  for (const f of COURSE_FIELDS) {
    if (d[f] === undefined) { payload[f] = cur[f]; continue; }
    if (['price_cents', 'capacity', 'sort_order'].includes(f)) payload[f] = Number(d[f]);
    else if (['is_open', 'visible'].includes(f)) payload[f] = d[f] ? 1 : 0;
    else if (['age_min', 'age_max'].includes(f)) payload[f] = d[f] === '' || d[f] === null ? null : Number(d[f]);
    else if (f === 'image') payload[f] = d[f] || null;
    else if (f === 'slug') payload[f] = d[f] || null;
    else payload[f] = d[f];
  }
  const { data, error } = await supabase.from('courses').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
async function deleteCourse(id) {
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw error;
}

// ---- navigation ----
async function listNavigation(location, visibleOnly = false) {
  let q = supabase.from('navigation').select('*').order('sort_order').order('id');
  if (location) q = q.eq('location', location);
  if (visibleOnly) q = q.eq('visible', 1);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
async function getNavigation(id) {
  const { data, error } = await supabase.from('navigation').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
async function createNavigation(d) {
  const { data, error } = await supabase.from('navigation').insert({
    label: d.label, href: d.href, location: d.location || 'header',
    sort_order: Number(d.sort_order || 0), visible: d.visible ? 1 : 0, target: d.target || '_self',
  }).select().single();
  if (error) throw error;
  return data;
}
async function updateNavigation(id, d) {
  const cur = await getNavigation(id);
  const payload = {
    label: d.label !== undefined ? d.label : cur.label,
    href: d.href !== undefined ? d.href : cur.href,
    location: d.location !== undefined ? d.location : cur.location,
    sort_order: d.sort_order !== undefined ? Number(d.sort_order) : cur.sort_order,
    visible: d.visible !== undefined ? (d.visible ? 1 : 0) : cur.visible,
    target: d.target !== undefined ? d.target : cur.target,
  };
  const { data, error } = await supabase.from('navigation').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
async function deleteNavigation(id) {
  const { error } = await supabase.from('navigation').delete().eq('id', id);
  if (error) throw error;
}

// ---- site sections ----
async function listSections(visibleOnly = false) {
  let q = supabase.from('site_sections').select('*').order('sort_order').order('id');
  if (visibleOnly) q = q.eq('visible', 1);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
async function getSection(id) {
  const { data, error } = await supabase.from('site_sections').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
async function updateSection(id, d) {
  const cur = await getSection(id);
  const payload = {
    title: d.title !== undefined ? d.title : cur.title,
    subtitle: d.subtitle !== undefined ? d.subtitle : cur.subtitle,
    visible: d.visible !== undefined ? (d.visible ? 1 : 0) : cur.visible,
    sort_order: d.sort_order !== undefined ? Number(d.sort_order) : cur.sort_order,
    settings: d.settings !== undefined ? d.settings : cur.settings,
  };
  const { data, error } = await supabase.from('site_sections').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ---- pages ----
async function listPages(visibleOnly = false) {
  let q = supabase.from('pages').select('*').order('id');
  if (visibleOnly) q = q.eq('visible', 1);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
async function getPage(id) {
  const { data, error } = await supabase.from('pages').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
async function getPageBySlug(slug) {
  const { data, error } = await supabase.from('pages').select('*').eq('slug', slug).single();
  if (error) return null;
  return data;
}
async function createPage(d) {
  const { data, error } = await supabase.from('pages').insert({
    slug: d.slug, title: d.title, content: d.content || '',
    seo_title: d.seo_title || '', seo_description: d.seo_description || '',
    visible: d.visible ? 1 : 0,
  }).select().single();
  if (error) throw error;
  return data;
}
async function updatePage(id, d) {
  const cur = await getPage(id);
  const payload = {
    slug: d.slug !== undefined ? d.slug : cur.slug,
    title: d.title !== undefined ? d.title : cur.title,
    content: d.content !== undefined ? d.content : cur.content,
    seo_title: d.seo_title !== undefined ? d.seo_title : cur.seo_title,
    seo_description: d.seo_description !== undefined ? d.seo_description : cur.seo_description,
    visible: d.visible !== undefined ? (d.visible ? 1 : 0) : cur.visible,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('pages').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
async function deletePage(id) {
  const { error } = await supabase.from('pages').delete().eq('id', id);
  if (error) throw error;
}

// ---- media ----
async function listMedia() {
  const { data, error } = await supabase.from('media').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
async function createMedia(d) {
  const { data, error } = await supabase.from('media').insert({
    url: d.url, path: d.path || '', alt: d.alt || '', mime: d.mime || '', size: Number(d.size || 0),
  }).select().single();
  if (error) throw error;
  return data;
}
async function getMedia(id) {
  const { data, error } = await supabase.from('media').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
async function updateMedia(id, d) {
  const payload = {};
  if (d.alt !== undefined) payload.alt = d.alt;
  const { data, error } = await supabase.from('media').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
async function deleteMedia(id) {
  const { error } = await supabase.from('media').delete().eq('id', id);
  if (error) throw error;
}

// ---- enrollments ----
async function listEnrollments(status) {
  let q = supabase.from('enrollments').select('*, courses(title, slug, price_cents)').order('id', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
async function getEnrollment(id) {
  const { data, error } = await supabase.from('enrollments').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
async function countEnrollmentsForCourse(courseId) {
  const { count, error } = await supabase.from('enrollments').select('*', { count: 'exact', head: true })
    .eq('course_id', courseId).neq('status', 'cancelled');
  if (error) throw error;
  return count || 0;
}
async function createEnrollment(d) {
  const { data, error } = await supabase.from('enrollments').insert({
    course_id: d.course_id, student_name: d.student_name,
    student_age: d.student_age != null ? Number(d.student_age) : null,
    guardian_name: d.guardian_name || '', phone: d.phone, email: d.email || '',
    notes: d.notes || '', status: d.status || 'new',
  }).select().single();
  if (error) throw error;
  return data;
}
async function updateEnrollment(id, d) {
  const cur = await getEnrollment(id);
  const payload = {
    status: d.status !== undefined ? d.status : cur.status,
    notes: d.notes !== undefined ? d.notes : cur.notes,
    student_name: d.student_name !== undefined ? d.student_name : cur.student_name,
    student_age: d.student_age !== undefined ? (d.student_age === '' || d.student_age === null ? null : Number(d.student_age)) : cur.student_age,
    guardian_name: d.guardian_name !== undefined ? d.guardian_name : cur.guardian_name,
    phone: d.phone !== undefined ? d.phone : cur.phone,
    email: d.email !== undefined ? d.email : cur.email,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('enrollments').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
async function deleteEnrollment(id) {
  const { error } = await supabase.from('enrollments').delete().eq('id', id);
  if (error) throw error;
}

// ---- orders ----
function newOrderNumber() {
  const d = new Date();
  const ymd = d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  return 'AJ-' + ymd + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}
async function listOrders(status) {
  let q = supabase.from('orders').select('*, enrollments(student_name, phone), courses(title, slug)').order('id', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
async function getOrder(id) {
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
async function getOrderByNumber(orderNumber) {
  const { data, error } = await supabase.from('orders').select('*').eq('order_number', orderNumber).single();
  if (error) return null;
  return data;
}
async function getOrderByProviderRef(providerRef, provider) {
  let q = supabase.from('orders').select('*').eq('provider_ref', String(providerRef));
  if (provider) q = q.eq('provider', provider);
  const { data, error } = await q.order('id', { ascending: false }).limit(1);
  if (error) return null;
  return data?.[0] || null;
}
async function createOrder(d) {
  const payload = {
    order_number: d.order_number || newOrderNumber(),
    order_type: d.order_type || 'course',
    enrollment_id: d.enrollment_id || null,
    course_id: d.course_id || null,
    description: d.description || '',
    customer_name: d.customer_name || '',
    phone: d.phone || '',
    email: d.email || '',
    amount_cents: Number(d.amount_cents || 0),
    currency: d.currency || 'EGP',
    status: d.status || 'pending',
    provider: d.provider || null,
    provider_ref: d.provider_ref || null,
    access_token: d.access_token || '',
  };
  let lastError = null;
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase.from('orders').insert(payload).select().single();
    if (!error) return data;
    lastError = error;
    if (error.code !== '23505') break;
    payload.order_number = newOrderNumber();
  }
  throw lastError;
}
async function updateOrder(id, d) {
  const cur = await getOrder(id);
  const payload = {
    status: d.status !== undefined ? d.status : cur.status,
    description: d.description !== undefined ? d.description : cur.description,
    amount_cents: d.amount_cents !== undefined ? Number(d.amount_cents) : cur.amount_cents,
    provider: d.provider !== undefined ? d.provider : cur.provider,
    provider_ref: d.provider_ref !== undefined ? d.provider_ref : cur.provider_ref,
    paid_at: d.paid_at !== undefined ? d.paid_at : cur.paid_at,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('orders').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
async function markOrderPaid(orderNumber, provider, providerRef) {
  const order = await getOrderByNumber(orderNumber);
  if (!order) return null;
  if (order.status === 'paid') return order;
  const { data, error } = await supabase.from('orders').update({
    status: 'paid', provider, provider_ref: providerRef || order.provider_ref,
    paid_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq('id', order.id).select().single();
  if (error) throw error;
  if (order.enrollment_id) {
    await supabase.from('enrollments').update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', order.enrollment_id);
  }
  return data;
}
async function markOrderStatus(orderNumber, status, provider, providerRef) {
  const order = await getOrderByNumber(orderNumber);
  if (!order) return null;
  if (order.status === 'paid' && status !== 'refunded') return order;
  const { data, error } = await supabase.from('orders').update({
    status, provider: provider || order.provider,
    provider_ref: providerRef || order.provider_ref, updated_at: new Date().toISOString(),
  }).eq('id', order.id).select().single();
  if (error) throw error;
  return data;
}
async function deleteOrder(id) {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}

// ---- payment events ----
async function logPaymentEvent(orderId, provider, eventType, payload, signatureValid) {
  const { error } = await supabase.from('payment_events').insert({
    order_id: orderId, provider, event_type: eventType || '',
    payload: payload || {}, signature_valid: !!signatureValid,
  });
  if (error) console.warn('payment event log failed:', error.message);
}
async function listPaymentEvents(orderId) {
  const { data, error } = await supabase.from('payment_events').select('*').eq('order_id', orderId).order('id', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ---- audit ----
async function logAudit(user, action, entity, entityId, details) {
  try {
    await supabase.from('audit_log').insert({
      user_id: user?.id || null, username: user?.username || '',
      action, entity: entity || '', entity_id: String(entityId || ''),
      details: details || {},
    });
  } catch (e) { console.warn('audit log failed:', e.message); }
}
async function listAudit(limit = 100) {
  const { data, error } = await supabase.from('audit_log').select('*').order('id', { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

// ---- users ----
async function getUserByUsername(username) {
  const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
  if (error) return null;
  return data;
}
async function getUserById(id) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}
async function listUsers() {
  const { data, error } = await supabase.from('users').select('id, username, role, active, last_login, created_at').order('id');
  if (error) throw error;
  return data || [];
}
async function createUser(d) {
  const { data, error } = await supabase.from('users').insert({
    username: d.username, password_hash: d.password_hash, role: d.role || 'editor', active: 1,
  }).select('id, username, role, active, created_at').single();
  if (error) throw error;
  return data;
}
async function updateUser(id, d) {
  const payload = {};
  if (d.password_hash !== undefined) payload.password_hash = d.password_hash;
  if (d.role !== undefined) payload.role = d.role;
  if (d.active !== undefined) payload.active = d.active ? 1 : 0;
  const { data, error } = await supabase.from('users').update(payload).eq('id', id).select('id, username, role, active, created_at').single();
  if (error) throw error;
  return data;
}
async function deleteUser(id) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
}
async function touchLogin(id) {
  try { await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', id); } catch {}
}

// ---- stats ----
async function checkSchema() {
  const tables = ['navigation', 'site_sections', 'pages', 'media', 'enrollments', 'orders', 'payment_events', 'audit_log'];
  const checks = await Promise.all([
    ...tables.map(async (t) => {
      const { error } = await supabase.from(t).select('*').limit(1);
      return error ? t : null;
    }),
    (async () => {
      const { error } = await supabase.from('courses').select('slug,price_cents,sort_order').limit(1);
      return error ? 'courses.columns' : null;
    })(),
    (async () => {
      const { error } = await supabase.from('users').select('role,active').limit(1);
      return error ? 'users.columns' : null;
    })(),
    (async () => {
      const { error } = await supabase.from('orders').select('access_token').limit(1);
      return error ? 'orders.access_token' : null;
    })(),
  ]);
  const missing = checks.filter(Boolean);
  return { ready: missing.length === 0, missing };
}

async function getAdminStats() {
  const schema = await checkSchema();
  const count = async (table, filter) => {
    try {
      let q = supabase.from(table).select('*', { count: 'exact', head: true });
      if (filter) q = filter(q);
      const { count: c, error } = await q;
      if (error) throw error;
      return c || 0;
    } catch { return 0; }
  };
  const [courses, enrollments, orders] = await Promise.all([
    count('courses'),
    count('enrollments'),
    count('orders'),
  ]);
  let paid = [];
  try {
    const { data } = await supabase.from('orders').select('amount_cents,status').eq('status', 'paid');
    paid = data || [];
  } catch {}
  const revenue = paid.reduce((s, o) => s + Number(o.amount_cents || 0), 0);
  let recentEnrollments = [];
  try {
    const { data } = await supabase.from('enrollments')
      .select('*, courses(title)').order('id', { ascending: false }).limit(5);
    recentEnrollments = data || [];
  } catch {}
  let recentOrders = [];
  try {
    const { data } = await supabase.from('orders')
      .select('*').order('id', { ascending: false }).limit(5);
    recentOrders = data || [];
  } catch {}
  return {
    schema,
    courses, enrollments, orders,
    paidOrders: paid.length,
    revenue_cents: revenue,
    recentEnrollments,
    recentOrders,
  };
}

// ---- storage ----
async function isImageInUse(url) {
  if (!url) return false;
  const settings = await getSettings();
  if (settings.hero_image === url) return true;
  const tables = ['subjects', 'activities', 'gallery', 'courses', 'media'];
  for (const table of tables) {
    const col = table === 'media' ? 'url' : 'image';
    const { data, error } = await supabase.from(table).select('id').eq(col, url).limit(1);
    if (!error && data && data.length) return true;
  }
  const { data: pages } = await supabase.from('pages').select('id').ilike('content', `%${url}%`).limit(1);
  if (pages && pages.length) return true;
  return false;
}

async function deleteStorageFile(url) {
  try {
    const marker = '/storage/v1/object/public/uploads/';
    const i = String(url).indexOf(marker);
    if (i === -1) return;
    const path = decodeURIComponent(String(url).slice(i + marker.length).split('?')[0]);
    if (!path) return;
    await supabase.storage.from('uploads').remove([path]);
  } catch (e) {
    console.warn('storage delete failed:', e.message);
  }
}

module.exports = {
  getSettings, updateSettings,
  listSubjects, createSubject, updateSubject, deleteSubject, getSubject,
  listActivities, createActivity, updateActivity, deleteActivity, getActivity,
  listGallery, createGallery, updateGallery, deleteGallery, getGalleryItem,
  listCourses, createCourse, updateCourse, deleteCourse, getCourse, getCourseBySlug,
  listNavigation, getNavigation, createNavigation, updateNavigation, deleteNavigation,
  listSections, getSection, updateSection,
  listPages, getPage, getPageBySlug, createPage, updatePage, deletePage,
  listMedia, createMedia, getMedia, updateMedia, deleteMedia,
  listEnrollments, getEnrollment, countEnrollmentsForCourse, createEnrollment, updateEnrollment, deleteEnrollment,
  listOrders, getOrder, getOrderByNumber, getOrderByProviderRef, createOrder, updateOrder, markOrderPaid, markOrderStatus, deleteOrder,
  logPaymentEvent, listPaymentEvents,
  logAudit, listAudit,
  getUserByUsername, getUserById, listUsers, createUser, updateUser, deleteUser, touchLogin,
  getAdminStats, checkSchema,
  deleteStorageFile, isImageInUse,
};
