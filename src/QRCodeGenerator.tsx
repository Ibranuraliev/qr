import React, { useState, useEffect, useRef } from 'react';
import { Download, Copy, Check, Clock, Trash2, Link, MessageSquare, User } from 'lucide-react';

interface HistoryItem {
  id: string;
  type: string;
  data: string;
  label: string;
  timestamp: Date;
}

export default function QRCodeGenerator() {
  const [activeTab, setActiveTab] = useState('url');
  const [qrData, setQrData] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [contactInfo, setContactInfo] = useState({
    firstName: '', lastName: '', phone: '', email: '', organization: '', url: ''
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const generateQRCode = (text: string) => {
    if (!text.trim()) { if (qrContainerRef.current) qrContainerRef.current.innerHTML = ''; return; }
    setIsGenerating(true);
    const run = () => { createQR(text); setIsGenerating(false); };
    if (!(window as any).QRious) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
      s.onload = run;
      s.onerror = () => { fallbackQR(text); setIsGenerating(false); };
      document.head.appendChild(s);
    } else run();
  };

  const createQR = (text: string) => {
    if (!qrContainerRef.current) return;
    qrContainerRef.current.innerHTML = '';
    const canvas = document.createElement('canvas');
    qrContainerRef.current.appendChild(canvas);
    new (window as any).QRious({ element: canvas, value: text, size: 260, background: '#ffffff', foreground: '#000000', level: 'M' });
    canvas.style.cssText = 'width:260px;height:260px;display:block;';
  };

  const fallbackQR = (text: string) => {
    if (!qrContainerRef.current) return;
    qrContainerRef.current.innerHTML = '';
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(text)}&format=png&margin=10`;
    img.style.cssText = 'width:260px;height:260px;display:block;';
    qrContainerRef.current.appendChild(img);
  };

  const formatUrl = (u: string) => !u.trim() ? '' : (u.startsWith('http') ? u : 'https://' + u);

  const generateVCard = (c: typeof contactInfo) =>
    `BEGIN:VCARD\nVERSION:3.0\nFN:${c.firstName} ${c.lastName}\nN:${c.lastName};${c.firstName};;;\nORG:${c.organization}\nTEL:${c.phone}\nEMAIL:${c.email}\nURL:${c.url}\nEND:VCARD`;

  const addToHistory = (data: string, type: string, label: string) => {
    if (!data.trim() || !label.trim()) return;
    setHistory(prev => [{ id: Date.now().toString(), type, data, label, timestamp: new Date() }, ...prev.filter(h => h.data !== data)].slice(0, 10));
  };

  useEffect(() => {
    let data = '', label = '';
    if (activeTab === 'url') { data = formatUrl(urlInput); label = urlInput; }
    else if (activeTab === 'text') { data = textInput; label = textInput.slice(0, 30); }
    else if (activeTab === 'contact') {
      if (contactInfo.firstName || contactInfo.lastName || contactInfo.phone || contactInfo.email) {
        data = generateVCard(contactInfo);
        label = `${contactInfo.firstName} ${contactInfo.lastName}`.trim() || contactInfo.email;
      }
    }
    setQrData(data);
    if (data) { generateQRCode(data); if (label) addToHistory(data, activeTab, label); }
    else if (qrContainerRef.current) qrContainerRef.current.innerHTML = '';
  }, [activeTab, urlInput, textInput, contactInfo]);

  const download = () => {
    const canvas = qrContainerRef.current?.querySelector('canvas');
    const img = qrContainerRef.current?.querySelector('img');
    if (!canvas && !img) return;
    const a = document.createElement('a');
    a.download = `qr-${Date.now()}.png`;
    a.href = canvas ? canvas.toDataURL() : (img as HTMLImageElement).src;
    a.click();
  };

  const copyText = async () => {
    if (!qrData) return;
    await navigator.clipboard.writeText(qrData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadHistory = (item: HistoryItem) => {
    setActiveTab(item.type);
    if (item.type === 'url') setUrlInput(item.data.replace(/^https?:\/\//, ''));
    else if (item.type === 'text') setTextInput(item.data);
  };

  const tabs = [
    { id: 'url', label: 'URL', Icon: Link },
    { id: 'text', label: 'Текст', Icon: MessageSquare },
    { id: 'contact', label: 'Контакт', Icon: User },
  ];

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '10px 14px',
    border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14,
    outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#111',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f9', fontFamily: 'system-ui, sans-serif', color: '#111', padding: '40px 16px', boxSizing: 'border-box' }}>
      <style>{`
        input:focus, textarea:focus { border-color: #000 !important; box-shadow: 0 0 0 2px #00000015; }
        button { transition: opacity 0.15s; }
        button:hover { opacity: 0.75; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 28px; height: 28px; border: 2px solid #ddd; border-top-color: #000; border-radius: 50%; animation: spin 0.7s linear infinite; }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 36, borderBottom: '2px solid #000', paddingBottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-1px' }}>QR Generator</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>Создай QR-код за секунду</p>
          </div>
          <span style={{ fontSize: 11, color: '#999', letterSpacing: 2 }}>v1.0</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) 300px', gap: 32 }}>

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #000' }}>
              {tabs.map(({ id, label, Icon }) => {
                const active = activeTab === id;
                return (
                  <button key={id} onClick={() => setActiveTab(id)} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px', border: 'none', background: active ? '#000' : 'transparent',
                    color: active ? '#fff' : '#666', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                    borderRadius: '6px 6px 0 0',
                  }}>
                    <Icon size={14} />{label}
                  </button>
                );
              })}
            </div>

            {/* Input area */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
              {activeTab === 'url' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>URL</label>
                  <input style={inp} value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="example.com" />
                  <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>https:// добавится автоматически</p>
                </div>
              )}

              {activeTab === 'text' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Текст</label>
                  <textarea style={{ ...inp, resize: 'none', minHeight: 120 }} value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Введите любой текст..." />
                </div>
              )}

              {activeTab === 'contact' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Имя</label>
                      <input style={inp} value={contactInfo.firstName} onChange={e => setContactInfo({ ...contactInfo, firstName: e.target.value })} placeholder="Иван" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Фамилия</label>
                      <input style={inp} value={contactInfo.lastName} onChange={e => setContactInfo({ ...contactInfo, lastName: e.target.value })} placeholder="Иванов" />
                    </div>
                  </div>
                  {[['Телефон', 'phone', 'tel', '+7 (999) 123-45-67'], ['Email', 'email', 'email', 'ivan@example.com'], ['Организация', 'organization', 'text', 'Компания'], ['Сайт', 'url', 'url', 'https://example.com']].map(([lbl, key, type, ph]) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{lbl}</label>
                      <input style={inp} type={type} value={(contactInfo as any)[key]} onChange={e => setContactInfo({ ...contactInfo, [key]: e.target.value })} placeholder={ph} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#333' }}>
                    <Clock size={13} /> История
                  </div>
                  <button onClick={() => setHistory([])} style={{ background: 'none', border: 'none', fontSize: 11, color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                    <Trash2 size={11} /> Очистить
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {history.map(item => (
                    <button key={item.id} onClick={() => loadHistory(item)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderRadius: 8, border: '1px solid #f0f0f0', background: '#fafafa',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {item.type === 'url' && <Link size={12} color="#333" />}
                        {item.type === 'text' && <MessageSquare size={12} color="#333" />}
                        {item.type === 'contact' && <User size={12} color="#333" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
                        <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>{item.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — QR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

              {/* QR box */}
              <div style={{ width: 260, height: 260, border: '1px solid #e5e7eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, background: '#fff' }}>
                {isGenerating && <div className="spinner" />}
                {!qrData && !isGenerating && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, border: '2px dashed #ddd', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                      <div style={{ width: 20, height: 20, border: '2px solid #ccc', borderRadius: 3 }} />
                    </div>
                    <p style={{ fontSize: 11, color: '#ccc', margin: 0 }}>Введите данные</p>
                  </div>
                )}
                <div ref={qrContainerRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              </div>

              {qrData && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={download} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px 0', background: '#000', color: '#fff', border: 'none',
                    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <Download size={14} /> Скачать PNG
                  </button>
                  <button onClick={copyText} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px 0', background: '#fff', color: copied ? '#000' : '#555',
                    border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Скопировано!' : 'Копировать данные'}
                  </button>
                </div>
              )}
            </div>

            {qrData && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>Данные QR</p>
                <pre style={{ fontSize: 10, color: '#666', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 80, overflowY: 'auto', margin: 0 }}>{qrData}</pre>
              </div>
            )}

            <p style={{ textAlign: 'center', fontSize: 11, color: '#ccc', margin: 0 }}>Данные не сохраняются · Бесплатно</p>
          </div>
        </div>
      </div>
    </div>
  );
}