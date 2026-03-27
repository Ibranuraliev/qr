import React, { useState, useEffect, useRef } from 'react';
import { Download, Copy, Check, Clock, Trash2, Link, MessageSquare, User, Zap } from 'lucide-react';

interface HistoryItem {
  id: string;
  type: string;
  data: string;
  label: string;
  timestamp: Date;
}

const S = {
  page: {
    minHeight: '100vh',
    background: '#0a0a10',
    color: '#e0e0f0',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    padding: '32px 16px',
    boxSizing: 'border-box' as const,
  },
  glow1: {
    position: 'fixed' as const, top: -200, left: -200,
    width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, #00e5ff18 0%, transparent 70%)',
    pointerEvents: 'none' as const, zIndex: 0,
  },
  glow2: {
    position: 'fixed' as const, bottom: -200, right: -200,
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, #7c3aed12 0%, transparent 70%)',
    pointerEvents: 'none' as const, zIndex: 0,
  },
  wrap: { position: 'relative' as const, zIndex: 1, maxWidth: 960, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 },
  logoBox: { display: 'flex', alignItems: 'center', gap: 12 },
  logoIcon: {
    width: 40, height: 40, borderRadius: 12,
    background: 'linear-gradient(135deg, #00e5ff22, #7c3aed22)',
    border: '1px solid #00e5ff44',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', color: '#fff', margin: 0 },
  logoSub: { fontSize: 10, color: '#444460', letterSpacing: 4, textTransform: 'uppercase' as const, margin: 0 },
  version: { fontSize: 10, color: '#222235', letterSpacing: 4, textTransform: 'uppercase' as const },
  card: {
    background: '#0f0f14',
    border: '1px solid #1a1a2e',
    borderRadius: 20,
    padding: 24,
  },
  tabRow: {
    display: 'flex', gap: 4, padding: 4,
    background: '#0f0f14', border: '1px solid #1a1a2e',
    borderRadius: 16, marginBottom: 20,
  },
  tabActive: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
    background: 'linear-gradient(135deg, #00e5ff18, #7c3aed18)',
    color: '#00e5ff', border: '1px solid #00e5ff33',
    fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const,
    fontFamily: 'inherit',
  },
  tabInactive: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
    background: 'transparent', color: '#444460', border: '1px solid transparent',
    fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const,
    fontFamily: 'inherit',
  },
  label: {
    display: 'block', fontSize: 10, fontWeight: 700,
    color: '#6666aa', letterSpacing: 3, textTransform: 'uppercase' as const, marginBottom: 8,
  },
  input: {
    width: '100%', background: '#16161f', border: '1px solid #2a2a3a',
    color: '#e0e0f0', borderRadius: 12, padding: '12px 16px',
    fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  textarea: {
    width: '100%', background: '#16161f', border: '1px solid #2a2a3a',
    color: '#e0e0f0', borderRadius: 12, padding: '12px 16px',
    fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'inherit', resize: 'none' as const, minHeight: 120,
  },
  hint: { fontSize: 10, color: '#333355', marginTop: 6 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  spaceY: { display: 'flex', flexDirection: 'column' as const, gap: 16 },
  qrArea: {
    width: 280, height: 280, borderRadius: 16,
    background: '#0a0a10', border: '1px solid #1a1a2e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative' as const, margin: '0 auto 20px',
  },
  cornerTL: { position: 'absolute' as const, top: 8, left: 8, width: 16, height: 16, borderTop: '2px solid #00e5ff44', borderLeft: '2px solid #00e5ff44', borderRadius: '4px 0 0 0' },
  cornerTR: { position: 'absolute' as const, top: 8, right: 8, width: 16, height: 16, borderTop: '2px solid #00e5ff44', borderRight: '2px solid #00e5ff44', borderRadius: '0 4px 0 0' },
  cornerBL: { position: 'absolute' as const, bottom: 8, left: 8, width: 16, height: 16, borderBottom: '2px solid #00e5ff44', borderLeft: '2px solid #00e5ff44', borderRadius: '0 0 0 4px' },
  cornerBR: { position: 'absolute' as const, bottom: 8, right: 8, width: 16, height: 16, borderBottom: '2px solid #00e5ff44', borderRight: '2px solid #00e5ff44', borderRadius: '0 0 4px 0' },
  emptyState: { textAlign: 'center' as const },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 14,
    background: '#16161f', border: '1px solid #2a2a3a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 12px',
  },
  emptyText: { fontSize: 10, color: '#333355', letterSpacing: 3, textTransform: 'uppercase' as const },
  btnPrimary: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '12px 0', borderRadius: 12, cursor: 'pointer',
    background: 'linear-gradient(135deg, #00e5ff, #0099bb)', color: '#0a0a10',
    border: 'none', fontSize: 12, fontWeight: 700, letterSpacing: 2,
    textTransform: 'uppercase' as const, fontFamily: 'inherit', marginBottom: 8,
  },
  btnSecondary: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '12px 0', borderRadius: 12, cursor: 'pointer',
    background: '#16161f', border: '1px solid #2a2a3a',
    fontSize: 12, fontWeight: 700, letterSpacing: 2,
    textTransform: 'uppercase' as const, fontFamily: 'inherit',
  },
  dataBox: {
    background: '#0f0f14', border: '1px solid #1a1a2e',
    borderRadius: 12, padding: 16, marginTop: 12,
  },
  dataLabel: { fontSize: 10, color: '#444460', letterSpacing: 3, textTransform: 'uppercase' as const, marginBottom: 8, margin: 0 },
  dataPre: { fontSize: 10, color: '#6666aa', whiteSpace: 'pre-wrap' as const, wordBreak: 'break-all' as const, maxHeight: 80, overflowY: 'auto' as const, margin: 0 },
  historyHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  historyTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: '#6666aa', letterSpacing: 3, textTransform: 'uppercase' as const, fontWeight: 700 },
  clearBtn: { background: 'none', border: 'none', fontSize: 10, color: '#444460', cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase' as const, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' },
  historyItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12, cursor: 'pointer', textAlign: 'left' as const,
    background: '#16161f', border: '1px solid transparent',
    marginBottom: 8, fontFamily: 'inherit',
  },
  historyIcon: {
    width: 28, height: 28, borderRadius: 8,
    background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  historyLabel: { fontSize: 12, color: '#c0c0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginBottom: 2 },
  historyTime: { fontSize: 10, color: '#333355' },
  footer: { textAlign: 'center' as const, fontSize: 10, color: '#222235', letterSpacing: 3, textTransform: 'uppercase' as const, marginTop: 16 },
};

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
    new (window as any).QRious({ element: canvas, value: text, size: 260, background: '#0a0a10', foreground: '#00e5ff', level: 'M' });
    canvas.style.cssText = 'width:260px;height:260px;border-radius:8px;display:block;';
  };

  const fallbackQR = (text: string) => {
    if (!qrContainerRef.current) return;
    qrContainerRef.current.innerHTML = '';
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(text)}&format=png&margin=10`;
    img.style.cssText = 'width:260px;height:260px;border-radius:8px;display:block;';
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

  const iconColor = (type: string) => type === 'url' ? '#00e5ff' : type === 'text' ? '#7c3aed' : '#10b981';

  const gridStyle: React.CSSProperties = isMobile
    ? { display: 'grid', gridTemplateColumns: '1fr', gap: 24 }
    : { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24 };

  return (
    <div style={S.page}>
      <style>{`
        input:focus, textarea:focus { border-color: #00e5ff !important; box-shadow: 0 0 0 3px #00e5ff18; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .qr-spinner { animation: spin 0.8s linear infinite; border: 2px solid #00e5ff22; border-top-color: #00e5ff; border-radius: 50%; width: 32px; height: 32px; }
      `}</style>

      <div style={S.glow1} />
      <div style={S.glow2} />

      <div style={S.wrap}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.logoBox}>
            <div style={S.logoIcon}><Zap size={18} color="#00e5ff" /></div>
            <div>
              <p style={S.logoText}>QR<span style={{ color: '#00e5ff' }}>FORGE</span></p>
              <p style={S.logoSub}>QR Code Generator</p>
            </div>
          </div>
          <span style={S.version}>v1.0</span>
        </div>

        <div style={gridStyle}>
          {/* LEFT */}
          <div>
            {/* Tabs */}
            <div style={S.tabRow}>
              {tabs.map(({ id, label, Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)} style={activeTab === id ? S.tabActive : S.tabInactive}>
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>

            {/* Input card */}
            <div style={S.card}>
              {activeTab === 'url' && (
                <div>
                  <label style={S.label}>Website URL</label>
                  <input style={S.input} value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="example.com" />
                  <p style={S.hint}>https:// будет добавлен автоматически</p>
                </div>
              )}
              {activeTab === 'text' && (
                <div>
                  <label style={S.label}>Текст</label>
                  <textarea style={S.textarea} value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Введите любой текст..." />
                </div>
              )}
              {activeTab === 'contact' && (
                <div style={S.spaceY}>
                  <div style={S.grid2}>
                    <div>
                      <label style={S.label}>Имя</label>
                      <input style={S.input} value={contactInfo.firstName} onChange={e => setContactInfo({ ...contactInfo, firstName: e.target.value })} placeholder="Иван" />
                    </div>
                    <div>
                      <label style={S.label}>Фамилия</label>
                      <input style={S.input} value={contactInfo.lastName} onChange={e => setContactInfo({ ...contactInfo, lastName: e.target.value })} placeholder="Иванов" />
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>Телефон</label>
                    <input style={S.input} value={contactInfo.phone} onChange={e => setContactInfo({ ...contactInfo, phone: e.target.value })} placeholder="+7 (999) 123-45-67" />
                  </div>
                  <div>
                    <label style={S.label}>Email</label>
                    <input style={S.input} value={contactInfo.email} onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })} placeholder="ivan@example.com" />
                  </div>
                  <div>
                    <label style={S.label}>Организация</label>
                    <input style={S.input} value={contactInfo.organization} onChange={e => setContactInfo({ ...contactInfo, organization: e.target.value })} placeholder="Название компании" />
                  </div>
                  <div>
                    <label style={S.label}>Сайт</label>
                    <input style={S.input} value={contactInfo.url} onChange={e => setContactInfo({ ...contactInfo, url: e.target.value })} placeholder="https://example.com" />
                  </div>
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div style={{ ...S.card, marginTop: 16 }}>
                <div style={S.historyHeader}>
                  <div style={S.historyTitle}><Clock size={13} />История</div>
                  <button style={S.clearBtn} onClick={() => setHistory([])}><Trash2 size={11} />Очистить</button>
                </div>
                {history.map(item => (
                  <button key={item.id} style={S.historyItem} onClick={() => loadHistory(item)}>
                    <div style={S.historyIcon}>
                      {item.type === 'url' && <Link size={12} color={iconColor(item.type)} />}
                      {item.type === 'text' && <MessageSquare size={12} color={iconColor(item.type)} />}
                      {item.type === 'contact' && <User size={12} color={iconColor(item.type)} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.historyLabel}>{item.label}</div>
                      <div style={S.historyTime}>{item.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — QR */}
          <div>
            <div style={S.card}>
              <div style={S.qrArea}>
                <div style={S.cornerTL} /><div style={S.cornerTR} />
                <div style={S.cornerBL} /><div style={S.cornerBR} />
                {isGenerating && <div className="qr-spinner" />}
                {!qrData && !isGenerating && (
                  <div style={S.emptyState}>
                    <div style={S.emptyIcon}><Zap size={24} color="#2a2a3a" /></div>
                    <p style={S.emptyText}>Введите данные</p>
                  </div>
                )}
                <div ref={qrContainerRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              </div>

              {qrData && (
                <div>
                  <button style={S.btnPrimary} onClick={download}><Download size={15} />Скачать PNG</button>
                  <button style={{ ...S.btnSecondary, color: copied ? '#10b981' : '#6666aa' }} onClick={copyText}>
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                    {copied ? 'Скопировано!' : 'Копировать данные'}
                  </button>
                </div>
              )}
            </div>

            {qrData && (
              <div style={S.dataBox}>
                <p style={{ ...S.dataLabel, marginBottom: 8 }}>Данные QR</p>
                <pre style={S.dataPre}>{qrData}</pre>
              </div>
            )}

            <p style={S.footer}>Данные не сохраняются · Бесплатно</p>
          </div>
        </div>
      </div>
    </div>
  );
}