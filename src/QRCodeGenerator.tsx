import React, { useState, useEffect, useRef } from 'react';
import { Download, Copy, Check, Clock, Trash2, Link, MessageSquare, User, Zap } from 'lucide-react';

interface HistoryItem {
  id: string;
  type: string;
  data: string;
  label: string;
  timestamp: Date;
}

const QRCodeGenerator = () => {
  const [activeTab, setActiveTab] = useState('url');
  const [qrData, setQrData] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [contactInfo, setContactInfo] = useState({
    firstName: '', lastName: '', phone: '', email: '', organization: '', url: ''
  });

  const generateQRCode = async (text: string) => {
    if (!text.trim()) {
      if (qrContainerRef.current) qrContainerRef.current.innerHTML = '';
      return;
    }
    setIsGenerating(true);
    try {
      if (!(window as any).QRious) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
        script.onload = () => { createQR(text); setIsGenerating(false); };
        document.head.appendChild(script);
      } else {
        createQR(text);
        setIsGenerating(false);
      }
    } catch {
      generateFallbackQR(text);
      setIsGenerating(false);
    }
  };

  const createQR = (text: string) => {
    if (!qrContainerRef.current) return;
    qrContainerRef.current.innerHTML = '';
    const canvas = document.createElement('canvas');
    qrContainerRef.current.appendChild(canvas);
    new (window as any).QRious({
      element: canvas, value: text, size: 280,
      background: '#0f0f14', foreground: '#00e5ff', level: 'M'
    });
    canvas.style.cssText = 'width:280px;height:280px;border-radius:12px;';
  };

  const generateFallbackQR = (text: string) => {
    if (!qrContainerRef.current) return;
    qrContainerRef.current.innerHTML = '';
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(text)}&format=png&margin=10&color=00e5ff&bgcolor=0f0f14`;
    img.style.cssText = 'width:280px;height:280px;border-radius:12px;';
    qrContainerRef.current.appendChild(img);
  };

  const formatUrl = (url: string) => {
    if (!url.trim()) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) return 'https://' + url;
    return url;
  };

  const generateVCard = (c: typeof contactInfo) =>
    `BEGIN:VCARD\nVERSION:3.0\nFN:${c.firstName} ${c.lastName}\nN:${c.lastName};${c.firstName};;;\nORG:${c.organization}\nTEL:${c.phone}\nEMAIL:${c.email}\nURL:${c.url}\nEND:VCARD`;

  const addToHistory = (data: string, type: string, label: string) => {
    if (!data.trim()) return;
    setHistory(prev => {
      const filtered = prev.filter(h => h.data !== data);
      return [{ id: Date.now().toString(), type, data, label, timestamp: new Date() }, ...filtered].slice(0, 10);
    });
  };

  useEffect(() => {
    let data = '';
    let label = '';
    switch (activeTab) {
      case 'url': data = formatUrl(urlInput); label = urlInput || ''; break;
      case 'text': data = textInput; label = textInput.slice(0, 30); break;
      case 'contact':
        if (contactInfo.firstName || contactInfo.lastName || contactInfo.phone || contactInfo.email) {
          data = generateVCard(contactInfo);
          label = `${contactInfo.firstName} ${contactInfo.lastName}`.trim() || contactInfo.email;
        }
        break;
    }
    setQrData(data);
    if (data) {
      generateQRCode(data);
      if (label) addToHistory(data, activeTab, label);
    } else if (qrContainerRef.current) {
      qrContainerRef.current.innerHTML = '';
    }
  }, [activeTab, urlInput, textInput, contactInfo]);

  const downloadQRCode = () => {
    if (!qrData) return;
    const canvas = qrContainerRef.current?.querySelector('canvas');
    const img = qrContainerRef.current?.querySelector('img');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `qr-${activeTab}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } else if (img) {
      const link = document.createElement('a');
      link.download = `qr-${activeTab}-${Date.now()}.png`;
      link.href = img.src;
      link.click();
    }
  };

  const copyToClipboard = async () => {
    if (qrData) {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setSelectedHistory(item.id);
    setActiveTab(item.type);
    if (item.type === 'url') setUrlInput(item.data.replace('https://', '').replace('http://', ''));
    else if (item.type === 'text') setTextInput(item.data);
    setTimeout(() => setSelectedHistory(null), 800);
  };

  const clearHistory = () => setHistory([]);

  const tabs = [
    { id: 'url', label: 'URL', icon: Link },
    { id: 'text', label: 'Текст', icon: MessageSquare },
    { id: 'contact', label: 'Контакт', icon: User },
  ];

  const inputClass = "w-full bg-[#16161f] border border-[#2a2a3a] text-[#e0e0f0] placeholder-[#444460] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff33] transition-all duration-200";

  const labelClass = "block text-xs font-semibold text-[#6666aa] uppercase tracking-widest mb-2";

  return (
    <div className="min-h-screen bg-[#0a0a10] text-white font-mono" style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #00e5ff 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">

        {/* Header / Logo */}
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00e5ff22, #7c3aed22)', border: '1px solid #00e5ff44' }}>
              <Zap className="w-5 h-5 text-[#00e5ff]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">QR<span className="text-[#00e5ff]">FORGE</span></h1>
              <p className="text-[10px] text-[#444460] uppercase tracking-widest">QR Code Generator</p>
            </div>
          </div>
          <div className="text-[10px] text-[#333355] uppercase tracking-widest">v1.0</div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">

          {/* Left panel */}
          <div className="space-y-5">

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0f0f14', border: '1px solid #1a1a2e' }}>
              {tabs.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-widest transition-all duration-200"
                    style={{
                      background: active ? 'linear-gradient(135deg, #00e5ff18, #7c3aed18)' : 'transparent',
                      color: active ? '#00e5ff' : '#444460',
                      border: active ? '1px solid #00e5ff33' : '1px solid transparent'
                    }}>
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Input Panel */}
            <div className="rounded-2xl p-6 space-y-4" style={{ background: '#0f0f14', border: '1px solid #1a1a2e' }}>

              {activeTab === 'url' && (
                <div>
                  <label className={labelClass}>Website URL</label>
                  <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                    placeholder="example.com" className={inputClass} />
                  <p className="text-[10px] text-[#333355] mt-2">https:// будет добавлен автоматически</p>
                </div>
              )}

              {activeTab === 'text' && (
                <div>
                  <label className={labelClass}>Текст</label>
                  <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
                    placeholder="Введите любой текст..." rows={5} className={inputClass + ' resize-none'} />
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Имя</label>
                      <input type="text" value={contactInfo.firstName}
                        onChange={e => setContactInfo({ ...contactInfo, firstName: e.target.value })}
                        placeholder="Иван" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Фамилия</label>
                      <input type="text" value={contactInfo.lastName}
                        onChange={e => setContactInfo({ ...contactInfo, lastName: e.target.value })}
                        placeholder="Иванов" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Телефон</label>
                    <input type="tel" value={contactInfo.phone}
                      onChange={e => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      placeholder="+7 (999) 123-45-67" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" value={contactInfo.email}
                      onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })}
                      placeholder="ivan@example.com" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Организация</label>
                    <input type="text" value={contactInfo.organization}
                      onChange={e => setContactInfo({ ...contactInfo, organization: e.target.value })}
                      placeholder="Название компании" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Сайт</label>
                    <input type="url" value={contactInfo.url}
                      onChange={e => setContactInfo({ ...contactInfo, url: e.target.value })}
                      placeholder="https://example.com" className={inputClass} />
                  </div>
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: '#0f0f14', border: '1px solid #1a1a2e' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#444460]" />
                    <span className="text-[10px] text-[#6666aa] uppercase tracking-widest font-semibold">История</span>
                  </div>
                  <button onClick={clearHistory}
                    className="flex items-center gap-1 text-[10px] text-[#333355] hover:text-red-400 transition-colors uppercase tracking-widest">
                    <Trash2 className="w-3 h-3" /> Очистить
                  </button>
                </div>
                <div className="space-y-2">
                  {history.map(item => (
                    <button key={item.id} onClick={() => loadFromHistory(item)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 group"
                      style={{
                        background: selectedHistory === item.id ? '#00e5ff11' : '#16161f',
                        border: selectedHistory === item.id ? '1px solid #00e5ff44' : '1px solid transparent'
                      }}>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: '#1a1a2e' }}>
                        {item.type === 'url' && <Link className="w-3 h-3 text-[#00e5ff]" />}
                        {item.type === 'text' && <MessageSquare className="w-3 h-3 text-[#7c3aed]" />}
                        {item.type === 'contact' && <User className="w-3 h-3 text-[#10b981]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#c0c0e0] truncate group-hover:text-white transition-colors">{item.label}</p>
                        <p className="text-[10px] text-[#333355] mt-0.5">
                          {item.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel — QR display */}
          <div className="space-y-4">
            <div className="rounded-2xl p-6 flex flex-col items-center"
              style={{ background: '#0f0f14', border: '1px solid #1a1a2e' }}>

              {/* QR area */}
              <div className="relative w-[280px] h-[280px] rounded-2xl flex items-center justify-center mb-5"
                style={{ background: '#0a0a10', border: '1px solid #1a1a2e' }}>
                {isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl"
                    style={{ background: '#0a0a10' }}>
                    <div className="w-8 h-8 border-2 border-[#00e5ff33] border-t-[#00e5ff] rounded-full animate-spin" />
                  </div>
                )}
                {!qrData && !isGenerating && (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center"
                      style={{ background: '#16161f', border: '1px solid #2a2a3a' }}>
                      <Zap className="w-7 h-7 text-[#2a2a3a]" />
                    </div>
                    <p className="text-[11px] text-[#333355] uppercase tracking-widest">Введите данные</p>
                  </div>
                )}
                <div ref={qrContainerRef} className="flex items-center justify-center" />

                {/* Corner accents */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#00e5ff44] rounded-tl-md" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#00e5ff44] rounded-tr-md" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#00e5ff44] rounded-bl-md" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#00e5ff44] rounded-br-md" />
              </div>

              {/* Action buttons */}
              {qrData && (
                <div className="w-full space-y-2">
                  <button onClick={downloadQRCode}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold uppercase tracking-widest transition-all duration-200 hover:opacity-90 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #00e5ff, #0099bb)', color: '#0a0a10' }}>
                    <Download className="w-4 h-4" />
                    Скачать PNG
                  </button>
                  <button onClick={copyToClipboard}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold uppercase tracking-widest transition-all duration-200"
                    style={{ background: '#16161f', border: '1px solid #2a2a3a', color: copied ? '#10b981' : '#6666aa' }}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Скопировано!' : 'Копировать данные'}
                  </button>
                </div>
              )}
            </div>

            {/* QR data preview */}
            {qrData && (
              <div className="rounded-xl p-4" style={{ background: '#0f0f14', border: '1px solid #1a1a2e' }}>
                <p className="text-[10px] text-[#444460] uppercase tracking-widest mb-2">Данные QR</p>
                <pre className="text-[10px] text-[#6666aa] whitespace-pre-wrap break-all max-h-24 overflow-y-auto leading-relaxed">
                  {qrData}
                </pre>
              </div>
            )}

            {/* Footer */}
            <p className="text-center text-[10px] text-[#222235] uppercase tracking-widest">
              Данные не сохраняются · Бесплатно
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
