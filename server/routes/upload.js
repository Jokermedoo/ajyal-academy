const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../auth');
const supabase = require('../supabase');
const { fail } = require('../errors');

const MIME_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (MIME_EXT[file.mimetype]) cb(null, true);
    else cb(new Error('نوع ملف غير مدعوم (PNG/JPG/GIF/WEBP فقط)'));
  }
});

const router = express.Router();
router.use(requireAuth);
router.post('/', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || 'فشل الرفع' });
    if (!req.file) return res.status(400).json({ error: 'لم يتم رفع ملف' });
    try {
      const ext = MIME_EXT[req.file.mimetype];
      const name = Date.now() + '-' + Math.round(Math.random()*1e6) + '.' + ext;
      const { error } = await supabase.storage.from('uploads').upload(name, req.file.buffer, {
        contentType: req.file.mimetype, upsert: false
      });
      if (error) throw error;
      const { data } = supabase.storage.from('uploads').getPublicUrl(name);
      res.json({ url: data.publicUrl });
    } catch (e) { fail(res, e); }
  });
});

module.exports = router;