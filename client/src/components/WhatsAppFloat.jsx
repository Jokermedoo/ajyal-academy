import { MessageCircle } from 'lucide-react';

export default function WhatsAppFloat({ phone }) {
  if (!phone) return null;
  return (
    <a
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noreferrer"
      aria-label="تواصل عبر واتساب"
      className="fixed bottom-5 left-5 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white shadow-xl shadow-green-900/20 hover:bg-green-600 transition"
    >
      <MessageCircle size={26} />
    </a>
  );
}
