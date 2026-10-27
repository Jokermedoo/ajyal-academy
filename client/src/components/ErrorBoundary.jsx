import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('UI error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">🦋</div>
          <h1 className="text-2xl font-extrabold text-brand-900 mb-2">حدث خطأ غير متوقع</h1>
          <p className="text-slate-600 mb-6">يمكنك إعادة تحميل الصفحة للمحاولة مرة أخرى.</p>
          <button onClick={() => window.location.reload()} className="bg-brand-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-brand-700">إعادة التحميل</button>
        </div>
      );
    }
    return this.props.children;
  }
}