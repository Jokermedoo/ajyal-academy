import { useEffect } from 'react';

const SUFFIX = ' | أكاديمية أجيال النموذجية';
const DEFAULT_TITLE = 'أكاديمية أجيال النموذجية للتعليم والتطوير الشامل';
const DEFAULT_DESC = 'أكاديمية أجيال النموذجية — تعليم اليوم، نجاح الغد. حضانة تعليمية في القصاصين الجديدة، الإسماعيلية.';

function setMeta(attr, key, content) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default function usePageMeta(title, description) {
  useEffect(() => {
    const fullTitle = title ? title + SUFFIX : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESC;
    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
  }, [title, description]);
}
