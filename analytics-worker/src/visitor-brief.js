// HB-420: only the nightly brief. No collection, payments or dashboard changes.
export const BRIEF_SITE_LABELS = Object.freeze({ bjt: '旧站 BJT', 'nice-okinawa': 'Nice Okinawa 主站', kiso: 'KISO', progress: 'Progress', fishing: '海钓', snorkel: '浮潜', rental: '租车', golf: '高尔夫', activity: '活动预约', translation: '翻译', ev: 'EV SEA', japanusedcars: '二手车' });
const safeText = (value) => String(value || '').replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '***').replace(/[\r\n\x00-\x1f]/g, '').slice(0, 500);
const escapeHtml = (value) => safeText(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pathOnly = (value) => safeText(String(value || '/').split(/[?#]/)[0]);
const compare = (a, b) => String(a.created_at).localeCompare(String(b.created_at)) || Number(a.id) - Number(b.id);
function source(first) {
  const utm = safeText(first.utm_source).toLowerCase();
  const ref = safeText(first.referrer_host).toLowerCase().replace(/\.$/, '');
  if (!utm && (!ref || ref === 'direct')) return '直接／来源未传';
  if (!utm && (ref === 'nice.okinawa' || ref.endsWith('.nice.okinawa'))) return '站内续访／初始来源未知';
  const value = utm || ref;
  if (/google/.test(value)) return 'Google';
  if (/bing/.test(value)) return 'Bing';
  if (/chatgpt|openai/.test(value)) return 'ChatGPT';
  return value;
}
export function aggregateVisitorBrief(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!Object.hasOwn(BRIEF_SITE_LABELS, row.site_id) || !row.visitor_id) continue;
    const key = JSON.stringify([row.site_id, row.visitor_id]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const visitors = [];
  const sessions = new Set();
  for (const events of groups.values()) {
    events.sort(compare);
    const views = events.filter(r => r.event_type === 'pageview');
    if (!views.length) continue;
    const pages = [];
    const pending = new Map();
    const contacts = new Set();
    for (const event of events) {
      if (event.event_type === 'pageview') {
        const page = { path: pathOnly(event.landing_path), seconds: null };
        pages.push(page);
        // A later view closes the earlier view, even when the path is identical.
        pending.set(event.session_id, { page, rawPath: event.landing_path || '/', matched: false });
        sessions.add(JSON.stringify([event.site_id, event.visitor_id, event.session_id]));
      } else if (event.event_type === 'dwell') {
        const current = pending.get(event.session_id);
        if (current && !current.matched && current.rawPath === (event.landing_path || '/') && event.dwell_ms !== null && Number.isFinite(Number(event.dwell_ms)) && Number(event.dwell_ms) >= 0) {
          current.page.seconds = Math.min(1800, Math.round(Number(event.dwell_ms) / 1000));
          current.matched = true;
        }
      } else if (event.event_type === 'contact_click') {
        const names = { whatsapp: 'WhatsApp', email: '邮箱', wechat: '微信', line: 'LINE', phone: '电话', form: '表单' };
        if (names[event.contact_channel]) contacts.add(names[event.contact_channel]);
      }
    }
    visitors.push({ site: views[0].site_id, source: source(views[0]), first: views[0].created_at, pages, contacts: [...contacts] });
  }
  visitors.sort((a, b) => a.site.localeCompare(b.site) || a.first.localeCompare(b.first));
  const by_source = {};
  for (const [i, visitor] of visitors.entries()) {
    visitor.label = `访客 ${String(i + 1).padStart(2, '0')}`;
    by_source[visitor.source] ||= { visitors: 0, views: 0 };
    by_source[visitor.source].visitors++;
    by_source[visitor.source].views += visitor.pages.length;
    delete visitor.first;
  }
  return { totals: { visitors: visitors.length, pageviews: visitors.reduce((n, v) => n + v.pages.length, 0), sessions: sessions.size }, by_source, visitors };
}
export async function loadVisitorBrief(db, window) {
  const rows = [];
  let cursorTime = window.start, cursorId = -1;
  for (;;) {
    const result = await db.prepare(`SELECT id, site_id, visitor_id, session_id, event_type, landing_path, referrer_host, utm_source, dwell_ms, contact_channel, created_at
      FROM visitor_events WHERE created_at >= ? AND created_at < ?
      AND (created_at > ? OR (created_at = ? AND id > ?))
      AND event_type IN ('pageview', 'dwell', 'contact_click')
      ORDER BY created_at, id LIMIT 1000`).bind(window.start, window.end.toISOString(), cursorTime, cursorTime, cursorId).all();
    const page = result.results || [];
    rows.push(...page);
    if (page.length < 1000) break;
    cursorTime = page.at(-1).created_at; cursorId = page.at(-1).id;
  }
  return aggregateVisitorBrief(rows);
}
function displayTime(value) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
}
function pageLines(visitor) {
  const lines = [];
  for (const page of visitor.pages) {
    const duration = page.seconds === null ? '未采到时长' : page.seconds >= 1800 ? '30分（记录上限）' : `${page.seconds}秒`;
    const text = `${page.path} · ${duration}`;
    if (lines.at(-1)?.text === text) lines.at(-1).count++;
    else lines.push({ text, count: 1 });
  }
  return lines.map(({ text, count }) => text + (count > 1 ? ` ×${count}` : ''));
}
export function renderVisitorBrief(report) {
  const data = report.visitors;
  const window = `${displayTime(report.window.start)} → ${displayTime(report.window.end)} JST`;
  const note = '按站点匿名访客标识计数，跨站不去重，可能含自动访问。来源取当天首次页面记录；无来源不等于确定直接访问。';
  const contactCount = data?.visitors.filter(v => v.contacts.length).length || 0;
  const contact = data ? (contactCount ? `${contactCount} 位访客有联系按钮点击，已在下方标注。` : '本时段未记录到联系按钮点击。') : '联系点击数据暂不可用。';
  const caveat = `${contact}点击不等于咨询已发送。付款、表单咨询暂未与匿名访客可靠关联，因此不猜测“已付款／已咨询”。`;
  const title = data ? `${data.totals.visitors} 位访客 · ${data.totals.pageviews} 次浏览` : '访客数据暂不可用';
  const sources = Object.entries(data?.by_source || {}).sort((a,b) => b[1].visitors - a[1].visitors).map(([name, item]) => `${name} ${item.visitors}`).join('　');
  const text = ['客人从哪里来，又看了什么', window, title, sources, note, '联系与付款', caveat];
  const html = ['<!doctype html><html lang="zh-Hans" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>每日访客简报</title></head><body style="margin:0;background:#f3f5f4;color:#18372e;font:16px/1.65 -apple-system,BlinkMacSystemFont,PingFang SC,Arial,sans-serif"><main style="max-width:600px;margin:auto;padding:28px 18px;overflow-wrap:anywhere;word-break:break-word">', '<p style="margin:0;color:#61716b;font-size:12px;letter-spacing:2px">NICE OKINAWA · 每日访客简报</p><h1 style="font-size:29px;line-height:1.35;margin:10px 0">客人从哪里来，<br>又看了什么</h1>', `<p style="color:#61716b">${escapeHtml(window)}</p><div style="background:#fff;border-radius:14px;padding:20px;margin:20px 0"><strong style="font-size:28px">${escapeHtml(title)}</strong><p style="margin:8px 0 0">${escapeHtml(sources)}</p></div><p style="font-size:13px;color:#61716b">${note}</p><div style="border-left:3px solid #477c68;padding:8px 14px;margin:20px 0"><strong>联系与付款</strong><p style="margin:6px 0">${caveat}</p></div>`];
  for (const [site, name] of Object.entries(BRIEF_SITE_LABELS)) {
    const visitors = data?.visitors.filter(v => v.site === site) || [];
    if (!visitors.length) continue;
    html.push(`<h2 style="font-size:21px;margin:30px 0 12px">${name} <span style="color:#61716b;font-size:14px">${visitors.length} 位</span></h2>`);
    for (const visitor of visitors) {
      const contactLine = visitor.contacts.length ? `点击联系：${visitor.contacts.join('、')}（不等于已咨询）` : '';
      const lines = pageLines(visitor);
      text.push(`${name} ${visitor.label} · ${visitor.source}`, ...lines, contactLine);
      html.push(`<article style="background:#fff;border:1px solid #dce4df;border-radius:12px;padding:16px;margin-bottom:10px"><h3 style="font-size:15px;margin:0 0 8px">${visitor.label} <span style="color:#476d5d;font-weight:400">· ${escapeHtml(visitor.source)}</span></h3>${lines.map(line => `<div style="font-size:14px;margin:4px 0">${escapeHtml(line)}</div>`).join('')}${contactLine ? `<p style="font-size:14px">${escapeHtml(contactLine)}</p>` : ''}</article>`);
    }
  }
  const emptySites = Object.entries(BRIEF_SITE_LABELS).filter(([site]) => !data?.visitors.some(v => v.site === site)).map(([, label]) => label);
  const footer = (data && emptySites.length ? `已接信标但本时段无页面记录：${emptySites.join('、')}。` : '') + '时长为信标观察到的页面停留，非持续阅读时间；未收到离开记录会显示“未采到时长”。同页重进按访问顺序分别显示。';
  text.push(footer);
  html.push(`<p style="font-size:13px;color:#61716b;margin-top:28px">${footer}</p></main></body></html>`);
  return { text: text.filter(Boolean).join('\n\n'), html: html.join('') };
}
