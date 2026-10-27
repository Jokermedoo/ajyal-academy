import { BookA, Hash, Languages, Calculator, Brain, Heart, Palette, FlaskConical, BookOpen } from 'lucide-react';

const ICONS = { BookA, Hash, Languages, Calculator, Brain, Heart, Palette, FlaskConical };

export default function SubjectIcon({ name, size = 28, className = '' }) {
  const Icon = ICONS[name] || BookOpen;
  return <Icon size={size} strokeWidth={1.8} className={className} aria-hidden="true" />;
}
