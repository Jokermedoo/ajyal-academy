require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const supabase = require('./supabase');
const repo = require('./repo');

const defaultSettings = {
  academy_name: 'أكاديمية أجيال النموذجية للتعليم والتطوير الشامل',
  short_name: 'أكاديمية أجيال',
  english_name: 'Ajyal Academy',
  slogan: 'تعليم اليوم، نجاح الغد.',
  intro: 'أكاديمية أجيال النموذجية 🦋 جيل ذو أثر 🦋 — نحن نؤمن بأن كل طفل هو جيل المستقبل. نركز على التطوير الأكاديمي، السلوكي، الأخلاقي، والديني، في بيئة آمنة ومحفزة.',
  about: 'أكاديمية أجيال النموذجية للتعليم والتطوير الشامل — حضانة تعليمية في القصاصين الجديدة، محافظة الإسماعيلية، مصر. نؤمن بأن كل طفل هو جيل المستقبل، ونركز على التطوير الأكاديمي والسلوكي والأخلاقي والديني في بيئة آمنة ومحفزة.',
  mission: 'توفير بيئة تعليمية آمنة ومحفزة تسهم في تطوير أطفالنا أكاديمياً وسلوكياً وأخلاقياً ودينياً.',
  location: 'القصاصين الجديدة، محافظة الإسماعيلية، مصر',
  phone: '+20 11 55271647',
  phone_raw: '201155271647',
  facebook_1: 'https://www.facebook.com/AjialNursery12',
  facebook_2: 'https://www.facebook.com/p/Aya-Sorour-English-Pioneer-100063700435981/',
  show_subjects: '1',
  show_activities: '1',
  show_gallery: '1',
  show_courses: '1',
  show_features: '1',
  hero_image: '',
  hero_badge: '🦋 جيل ذو أثر',
  primary_color: '#1e6fe6',
  secondary_color: '#f97316',
  font_family: 'Tajawal',
  favicon_url: '',
  site_url: 'https://ajyal-academy.vercel.app',
  seo_title: 'أكاديمية أجيال النموذجية للتعليم والتطوير الشامل',
  seo_description: 'أكاديمية أجيال النموذجية — تعليم اليوم، نجاح الغد. حضانة تعليمية في القصاصين الجديدة، الإسماعيلية.',
  og_image: '',
  announcement_enabled: '0',
  announcement_text: '',
  maintenance_mode: '0',
  maintenance_message: 'الموقع تحت الصيانة حالياً، نعود قريباً بإذن الله.',
  whatsapp_float: '1',
  payment_online: '0',
  payment_mode: 'sandbox',
  payment_paymob: '0',
  payment_fawry: '0',
  payment_kashier: '0',
};

async function count(table) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
}

(async () => {
  // settings: insert only missing keys (never overwrite admin edits)
  const existingSettings = await repo.getSettings();
  const missingSettings = {};
  for (const [k, v] of Object.entries(defaultSettings)) {
    if (!(k in existingSettings)) missingSettings[k] = v;
  }
  if (Object.keys(missingSettings).length) await repo.updateSettings(missingSettings);
  console.log('settings ok');

  // Upload original logo to Supabase Storage if available
  const logoPath = path.join(__dirname, '..', 'logo.jpg');
  if (fs.existsSync(logoPath)) {
    const buf = fs.readFileSync(logoPath);
    const { error: upErr } = await supabase.storage.from('uploads').upload('logo.jpg', buf, { contentType: 'image/jpeg', upsert: true });
    if (!upErr) {
      const { data } = supabase.storage.from('uploads').getPublicUrl('logo.jpg');
      const current = await repo.getSettings();
      if (!current.hero_image) await repo.updateSettings({ hero_image: data.publicUrl });
      if (await count('gallery') === 0) {
        await repo.createGallery({ image: data.publicUrl, caption: 'شعار أكاديمية أجيال النموذجية', visible: 1, sort_order: 0 });
      }
      console.log('logo uploaded');
    } else {
      console.warn('logo upload failed:', upErr.message);
    }
  }

  if (await count('subjects') === 0) {
    const subjects = [
      ['اللغة العربية', 'تنمية مهارات القراءة والكتابة والتعبير لدى الطفل.', 'BookA', 1],
      ['الحساب', 'أساسيات الأرقام والعد والعمليات الحسابية البسيطة.', 'Hash', 2],
      ['اللغة الإنجليزية', 'مفردات وحروف وكلمات باللغة الإنجليزية بطريقة ممتعة.', 'Languages', 3],
      ['Math', 'أنشطة رياضية لتنمية التفكير المنطقي.', 'Calculator', 4],
      ['كتاب IQ', 'تمارين لتنمية التفكير والذكاء والقدرات الذهنية.', 'Brain', 5],
      ['التربية الإسلامية', 'غرس القيم والأخلاق والمبادئ الإسلامية.', 'Heart', 6],
      ['الرسم والتلوين', 'تنمية الإبداع والمهارات الفنية لدى الطفل.', 'Palette', 7],
      ['العلوم', 'التعرف على العالم والظواهر الطبيعية بأسلوب مبسط.', 'FlaskConical', 8],
    ];
    for (const s of subjects) await repo.createSubject({ title: s[0], description: s[1], icon: s[2], sort_order: s[3], visible: 1 });
    console.log('subjects ok');
  }

  if (await count('activities') === 0) {
    const acts = [
      ['English time — ABC', 'أغاني وحروف باللغة الإنجليزية مع المعلمة وطلابنا الصغار.'],
      ['Math — Play with the clown', 'العد والتفكير وحل الألغاز بأسلوب ممتع ومحفّز.'],
      ['Watermelon Day', 'نشاط خاص: يوم البطيخ، صور أطفالنا الحلوين.'],
      ['Coloring — Letter Cc', 'تلوين وتعلم حرف C باللغة الإنجليزية (Pioneers Class).'],
    ];
    for (const a of acts) await repo.createActivity({ title: a[0], description: a[1], visible: 1 });
    console.log('activities ok');
  }

  if (await count('gallery') === 0) {
    // hero image placeholder left empty; admin can upload logo to Supabase Storage
    console.log('gallery empty (upload logo via admin)');
  }

  if (await count('users') === 0) {
    const username = (process.env.ADMIN_USERNAME || 'admin').trim() || 'admin';
    const password = process.env.ADMIN_PASSWORD;

    if (!password || password.length < 8) {
      throw new Error(
        'ADMIN_PASSWORD is required (min 8 characters) to create the first admin user. ' +
        'Set it in .env, then run "npm run seed" again.'
      );
    }

    const hash = bcrypt.hashSync(password, 10);
    const { error } = await supabase.from('users').insert({ username, password_hash: hash, role: 'admin' });
    if (error) throw error;
    console.log(`admin user "${username}" created from ADMIN_PASSWORD`);
  }

  console.log('SEED DONE');
})().catch(e => { console.error(e); process.exit(1); });