function fail(res, e, status = 500) {
  console.error('[api-error]', e?.message || e);
  const message = process.env.NODE_ENV === 'production'
    ? 'حدث خطأ غير متوقع، حاول لاحقاً'
    : (e?.message || 'خطأ غير متوقع');
  res.status(status).json({ error: message });
}
module.exports = { fail };