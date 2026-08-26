const COLLECT_ORIGIN = 'https://translation.nice.okinawa';
const DASHBOARD_ORIGIN = 'https://db.nice.okinawa';
const MONTHLY_ALERT_SELF_CHECK_CRON = '0 0 1 * *';
const PATH_CHECK_CRON = '*/15 * * * *';
const PATH_CHECK_PREVIEW_INJECT_CRON = '11 29 7 29 *';
const PATH_CHECK_PREVIEW_TEST_EMAIL_CRON = '12 29 7 29 *';
const GSC_DAILY_SYNC_CRON = '0 0 * * *';
const GSC_DEFAULT_SYNC_DAYS = 28;
const GSC_REPORT_WINDOW_DAYS = 7;
const BING_SYNC_DAYS = 7;
const SEARCH_TERM_SOURCES = new Set(['google', 'bing', 'all']);
const DEFAULT_BING_SITE_URLS = 'https://bjt.nice.okinawa/,https://kiso.nice.okinawa/,https://snorkel.nice.okinawa/,https://progress.nice.okinawa/,https://nice.okinawa/,https://translation.nice.okinawa/';
const VISITOR_EVENT_PATH = '/events';
const VISITOR_DASHBOARD_PATH = '/visitors';
const VISITOR_EVENT_RATE_LIMIT_PER_MINUTE = 30;
const VISITOR_SAMPLE_MIN_EVENTS = 20;
const VISITOR_DASHBOARD_DAY_OPTIONS = new Set([1, 7, 30, 180]);
const VISITOR_EVENT_TYPES = new Set(['pageview', 'dwell', 'contact_click', 'section_view']);
const CONTACT_CHANNELS = new Set(['wechat', 'email', 'whatsapp', 'line', 'phone', 'form']);
const VISITOR_EVENT_SITES = Object.freeze({
  snorkel: 'snorkel.nice.okinawa',
  fishing: 'fishing.nice.okinawa',
  rental: 'rental.nice.okinawa',
  japanusedcars: 'japanusedcars.nice.okinawa',
  golf: 'golf.nice.okinawa',
  activity: 'activity.nice.okinawa',
  translation: 'translation.nice.okinawa',
  ev: 'ev.nice.okinawa',
  'nice-okinawa': 'nice.okinawa',
  bjt: 'bjt.nice.okinawa',
  progress: 'progress.nice.okinawa',
  kiso: 'kiso.nice.okinawa'
});
const SEARCH_CONSOLE_SITE_HOSTS = Object.freeze(
  Object.fromEntries(Object.entries(VISITOR_EVENT_SITES).map(([site, host]) => [host, site]))
);
const PATH_CHECK_ALERT_WINDOW_MS = 6 * 60 * 60 * 1000;
const PATH_CHECK_ALERT_ESCALATION_MS = 24 * 60 * 60 * 1000;
const PATH_CHECK_INTERVAL_MS = 15 * 60 * 1000;
const PATH_CHECK_TIMEOUT_MS = 12000;
const PATH_CHECK_FAILURE_DEBOUNCE = 3;
const PATH_CHECK_FAST_FAILURE_DEBOUNCE = 2;
const DEPLOYMENT_IN_PROGRESS_ALERT_MS = 30 * 60 * 1000;
const PATH_CHECK_BASELINES = Object.freeze([
  pageCheck('site-snorkel-home', 'snorkel home', 'https://snorkel.nice.okinawa/', 'Okinawa Snorkeling Tours'),
  pageCheck('site-fishing-home', 'fishing home', 'https://fishing.nice.okinawa/', 'Okinawa Fishing Charter'),
  pageCheck('site-rental-home', 'rental home', 'https://rental.nice.okinawa/', 'Okinawa Rental'),
  pageCheck('site-japanusedcars-home', 'japanusedcars home', 'https://japanusedcars.nice.okinawa/', 'Okinawa Used Cars', { caseInsensitive: true }),
  pageCheck('site-golf-home', 'golf home', 'https://golf.nice.okinawa/', 'Okinawa Golf Guide'),
  pageCheck('site-activity-home', 'activity home', 'https://activity.nice.okinawa/', '冲绳体验预约'),
  pageCheck('site-translation-home', 'translation home', 'https://translation.nice.okinawa/', '中日英商务翻译'),
  pageCheck('site-ev-home', 'ev home', 'https://ev.nice.okinawa/', 'EV SEA'),
  pageCheck('site-nice-okinawa-home', 'nice.okinawa home', 'https://nice.okinawa/', 'Nice Okinawa'),
  pageCheck('site-bjt-home', 'bjt home', 'https://bjt.nice.okinawa/', 'BJT商务日语能力考试'),
  pageCheck('site-progress-home', 'progress home', 'https://progress.nice.okinawa/', 'progress · nice.okinawa'),
  pageCheck('site-kiso-home', 'kiso home', 'https://kiso.nice.okinawa/', '从零开始学日语'),
  {
    ...pageCheck('bjt-mogi-trial', 'BJT mogi free trial', 'https://bjt.nice.okinawa/mogi/trial/', '体验版固定开放 9 题'),
    resources: [
      resourceCheck('https://bjt.nice.okinawa/assets/js/bjt-ui-i18n.js', [200])
    ]
  },
  {
    ...pageCheck('bjt-patto-trial', 'BJT PATTO root free trial', 'https://bjt.nice.okinawa/patto/', 'btn-start'),
    resources: [
      resourceCheck('https://bjt.nice.okinawa/patto/trial_bank.js', [200])
    ]
  },
  {
    ...pageCheck('bjt-patto-bjt-trial', 'BJT PATTO free trial', 'https://bjt.nice.okinawa/patto/bjt/trial/', 'TRIAL_FIXED_WORD_IDS'),
    resources: [
      resourceCheck('https://bjt.nice.okinawa/patto/bjt/trial/trial_bank.js', [200]),
      resourceCheck('https://bjt.nice.okinawa/audio/voca/bank01.js', [404])
    ]
  },
  {
    ...pageCheck('bjt-patto-keigo-trial', 'BJT keigo free trial', 'https://bjt.nice.okinawa/patto/keigo/trial/', 'BJT Pro 免费体验 · 固定 8 题'),
    resources: [
      resourceCheck('https://bjt.nice.okinawa/patto/keigo/trial/trial_bank.js', [200]),
      resourceCheck('https://bjt.nice.okinawa/patto/keigo/keigo_a_bank.js', [404])
    ]
  },
  pageCheck('bjt-buy', 'BJT Pro buy page', 'https://bjt.nice.okinawa/pro/buy/', 'BJT Pro 购买页'),
  pageCheck('bjt-login', 'BJT login page', 'https://bjt.nice.okinawa/pro', '邮箱登录 / メールでログイン'),
  pageCheck('bjt-score-check', 'BJT score check page', 'https://bjt.nice.okinawa/score-check/', '80'),
  jsonCheck('bjt-member-missing-token', 'BJT member missing token', 'https://bjt-worker.gerheidicn.workers.dev/api/member', [401], ['error'], { error: 'Missing token' }, { serviceBinding: 'BJT_API' }),
  jsonCheck('bjt-questions-free', 'BJT free question API', 'https://bjt-worker.gerheidicn.workers.dev/api/questions?scope=mogi&set=04', [200], ['ok', 'access', 'questions', 'lockedCount'], { ok: true, access: 'free' }, { serviceBinding: 'BJT_API' }),
  jsonCheck('bjt-check-locked', 'BJT check locked question', 'https://bjt-worker.gerheidicn.workers.dev/api/check', [403], ['error'], { error: 'Question locked' }, {
    method: 'POST',
    body: { id: 'mogi:01:A:1番', answer: 1, scope: 'mogi', set: '01' },
    serviceBinding: 'BJT_API'
  }),
  jsonCheck('bjt-ebook-catalog', 'BJT ebook catalog', 'https://bjt-worker.gerheidicn.workers.dev/api/ebooks/bjt-taihon', [200], ['id', 'book', 'chapters'], { id: 'bjt-taihon' }, { serviceBinding: 'BJT_API' }),
  jsonCheck('bjt-ebook-locked-chapter', 'BJT ebook locked chapter', 'https://bjt-worker.gerheidicn.workers.dev/api/ebooks/bjt-taihon/chapters/ch1', [401], ['error'], {}, { serviceBinding: 'BJT_API' }),
  jsonCheck('bjt-video-logs-locked', 'BJT video logs locked', 'https://bjt-worker.gerheidicn.workers.dev/api/video/logs', [401], ['error'], { error: 'Missing token' }, { serviceBinding: 'BJT_API' })
]);
const BOT_LIKE_CITIES = new Set([
  'the dalles',
  'boardman',
  'council bluffs',
  'ashburn',
  'columbus',
  'dublin',
  'reston',
  'herndon',
  'quincy',
  'prineville',
  'loudoun',
  'sterling',
  'san jose',
  'santa clara',
  'mountain view'
]);
const BEACON_SCRIPT = `(function(){try{var d=document,w=window,s=d.currentScript||d.querySelector('script[data-site][src*="beacon.js"]'),site=((s&&s.dataset&&s.dataset.site)||'').toLowerCase();if(!site)return;var ep='https://analytics.nice.okinawa/events',vk='nice_analytics_visitor_id',sk='nice_analytics_session_id',st=Date.now(),last=st,done=0,timer=0,seen=new Set;function rid(){try{return crypto.randomUUID()}catch(e){return Date.now().toString(36)+Math.random().toString(36).slice(2)}}function id(store,key){try{var v=store.getItem(key);if(v)return v;v=rid();store.setItem(key,v);return v}catch(e){return rid()}}var vid=id(localStorage,vk),sid=id(sessionStorage,sk);function ui(){try{return w.NICE_UI_LANG||w.SITE_UI_LANG||d.documentElement.lang||''}catch(e){return''}}function dev(){var ua=(navigator.userAgent||'').toLowerCase();return /ipad|tablet/.test(ua)?'tablet':(/mobile|iphone|android/.test(ua)?'mobile':'desktop')}function land(){try{var q=new URLSearchParams(location.search),o=new URLSearchParams;['utm_source','utm_medium','utm_campaign'].forEach(function(k){var v=q.get(k);if(v)o.set(k,v)});var x=o.toString();return location.pathname+(x?'?'+x:'')}catch(e){return location.pathname||'/'}}function base(type){return{site_id:site,event_type:type,visitor_id:vid,session_id:sid,ts:new Date().toISOString(),landing_url:land(),referrer:d.referrer||'',ui_lang:ui(),browser_lang:navigator.language||''}}function send(type,extra,beacon){try{var p=base(type);if(extra)for(var k in extra)p[k]=extra[k];var body=JSON.stringify(p);if(beacon&&navigator.sendBeacon){try{if(navigator.sendBeacon(ep,new Blob([body],{type:'text/plain'})))return}catch(e){}}fetch(ep,{method:'POST',headers:{'content-type':beacon?'text/plain':'application/json'},body:body,keepalive:!!beacon,mode:'cors'}).catch(function(){})}catch(e){}}function touch(){last=Date.now();arm()}function arm(){try{clearTimeout(timer);timer=setTimeout(dwell,1800000)}catch(e){}}function dwell(){try{if(done)return;done=1;send('dwell',{dwell_ms:Math.min(Date.now()-st,1800000)},1)}catch(e){}}function chan(el){try{var c=(el.getAttribute('data-contact')||'').toLowerCase();if(c)return c.replace(/[^a-z_]/g,'').slice(0,40);var h=(el.getAttribute('href')||'').toLowerCase();if(h.indexOf('mailto:')===0)return'email';if(h.indexOf('tel:')===0)return'phone';if(h.indexOf('wa.me/')>-1||h.indexOf('whatsapp')>-1)return'whatsapp';if(h.indexOf('line.me')>-1)return'line';if(h.indexOf('weixin')>-1||h.indexOf('wechat')>-1)return'wechat'}catch(e){}return''}send('pageview',{device_type:dev(),viewport_width:w.innerWidth||0});arm();['pointerdown','keydown','scroll','touchstart'].forEach(function(e){try{addEventListener(e,touch,{passive:true})}catch(x){}});d.addEventListener('click',function(ev){try{var el=ev.target.closest&&ev.target.closest('[data-contact],a[href]');if(!el)return;var c=chan(el);if(c)send('contact_click',{contact_channel:c},0)}catch(e){}},true);try{if('IntersectionObserver'in w){var ob=new IntersectionObserver(function(es){es.forEach(function(en){try{var id=en.target.id;if(en.isIntersecting&&id&&!seen.has(id)){seen.add(id);send('section_view',{section_id:id},0)}}catch(e){}})},{threshold:.55});d.querySelectorAll('section[id],header[id],main[id]').forEach(function(el){ob.observe(el)})}}catch(e){}d.addEventListener('visibilitychange',function(){if(d.visibilityState==='hidden')dwell()});addEventListener('pagehide',dwell)}catch(e){}})();`;
const TRACKING_SCRIPT = `(function(){var endpoint='https://analytics.nice.okinawa/collect';var site=location.hostname;var sessionKey='nice_analytics_session';var start=Date.now();var maxScroll=0;var sectionTimers={};var lastSection='';function uuid(){if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();return String(Date.now())+'-'+Math.random().toString(16).slice(2)}function sid(){try{var e=sessionStorage.getItem(sessionKey);if(e)return e;var id=uuid();sessionStorage.setItem(sessionKey,id);return id}catch(e){return uuid()}}var sessionId=sid();var visitorId=function(){try{var k='nice_analytics_visitor';var e=localStorage.getItem(k);if(e)return e;var id=uuid();localStorage.setItem(k,id);return id}catch(e){return''}}();function lang(){return document.documentElement.dataset.staticLang||document.body.dataset.lang||document.documentElement.lang||navigator.language||''}function depth(){var d=document.documentElement,b=document.body,t=window.scrollY||d.scrollTop||b.scrollTop||0,h=Math.max(b.scrollHeight,d.scrollHeight)-window.innerHeight;if(h<=0)return 100;return Math.max(0,Math.min(100,Math.round(t/h*100)))}function data(type,extra){var out={type:type,site:site,session_id:sessionId,visitor_id:visitorId,path:location.pathname,title:document.title,url:location.href,referrer:document.referrer,lang:lang(),browser_lang:navigator.language||'',screen:(screen&&screen.width?screen.width+'x'+screen.height:''),viewport:window.innerWidth+'x'+window.innerHeight,ts:new Date().toISOString()};if(extra)Object.keys(extra).forEach(function(k){out[k]=extra[k]});return out}function send(type,extra,keepalive){var body=JSON.stringify(data(type,extra));if(navigator.sendBeacon&&keepalive){try{navigator.sendBeacon(endpoint,new Blob([body],{type:'application/json'}));return}catch(e){}}try{fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:body,keepalive:!!keepalive,mode:'cors'}).catch(function(){})}catch(e){}}function contactType(el){var href=el.getAttribute('href')||'',text=(el.textContent||'').toLowerCase();if(href.indexOf('wa.me')>=0||text.indexOf('whatsapp')>=0)return'whatsapp';if(href.indexOf('mailto:')===0||text.indexOf('email')>=0)return'email';if(text.indexOf('wechat')>=0||text.indexOf('okinawaonline')>=0)return'wechat';if(href.indexOf('line')>=0||text.indexOf('line')>=0)return'line';if(href.indexOf('tel:')===0)return'phone';if(href.indexOf('#contact')>=0)return'contact';return''}document.addEventListener('click',function(event){var link=event.target.closest&&event.target.closest('a,button,summary,select');if(!link)return;var label=(link.textContent||link.getAttribute('aria-label')||'').trim().replace(/\\s+/g,' ').slice(0,120);var href=link.getAttribute&&link.getAttribute('href');var contact=link.matches('a')?contactType(link):'';var kind=contact?'contact_'+contact:(link.closest('nav')?'nav':(link.tagName||'').toLowerCase());send('click',{event_name:kind,label:label,href:href||'',section:lastSection})},true);window.addEventListener('scroll',function(){maxScroll=Math.max(maxScroll,depth())},{passive:true});if('IntersectionObserver'in window){var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){var id=entry.target.id||entry.target.tagName.toLowerCase();if(entry.isIntersecting){lastSection=id;sectionTimers[id]=Date.now();send('section_view',{section:id})}else if(sectionTimers[id]){var ms=Date.now()-sectionTimers[id];sectionTimers[id]=0;if(ms>800)send('section_time',{section:id,duration_ms:ms})}})},{threshold:.55});document.querySelectorAll('header[id],main[id],section[id]').forEach(function(s){observer.observe(s)})}var qs=new URLSearchParams(location.search);send('page_view',{utm_source:qs.get('utm_source')||'',utm_medium:qs.get('utm_medium')||'',utm_campaign:qs.get('utm_campaign')||''});window.addEventListener('pagehide',function(){send('page_leave',{duration_ms:Date.now()-start,max_scroll:Math.max(maxScroll,depth()),section:lastSection},true)})})();`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      if (url.pathname === VISITOR_EVENT_PATH) {
        return new Response(null, {
          status: 204,
          headers: visitorEventCorsHeaders(request)
        });
      }
      return new Response(null, { headers: corsHeaders(request) });
    }

    if (url.pathname === VISITOR_EVENT_PATH && request.method === 'POST') {
      return collectVisitorEvent(request, env, ctx);
    }

    if (url.pathname === '/collect' && request.method === 'POST') {
      return collect(request, env, ctx);
    }

    if (url.pathname === '/beacon.js' && (request.method === 'GET' || request.method === 'HEAD')) {
      return new Response(request.method === 'HEAD' ? null : BEACON_SCRIPT, {
        headers: {
          'content-type': 'application/javascript; charset=utf-8',
          'cache-control': 'public, max-age=3600',
          ...corsHeaders(request)
        }
      });
    }

    if (url.pathname === '/script.js' && (request.method === 'GET' || request.method === 'HEAD')) {
      return new Response(request.method === 'HEAD' ? null : TRACKING_SCRIPT, {
        headers: {
          'content-type': 'application/javascript; charset=utf-8',
          'cache-control': 'public, max-age=3600',
          ...corsHeaders(request)
        }
      });
    }

    if (url.pathname === '/summary' && request.method === 'GET') {
      return summary(request, env);
    }

    if (url.pathname === '/control' && request.method === 'GET') {
      return controlDashboard(request, env);
    }

    if (url.pathname === VISITOR_DASHBOARD_PATH && request.method === 'GET') {
      return visitorDashboard(request, env);
    }

    if (url.pathname === '/probes/run' && request.method === 'POST') {
      if (!requireDashboard(request, env)) {
        return json({ ok: false, error: 'unauthorized' }, request, 403);
      }
      const result = await runProbes(env, 'manual');
      return json({ ok: true, ...result }, request);
    }

    if (url.pathname === '/path-checks/run' && request.method === 'POST') {
      if (!requireDashboard(request, env)) {
        return json({ ok: false, error: 'unauthorized' }, request, 403);
      }
      const injectFailure = url.searchParams.get('inject_failure') === '1';
      const notify = url.searchParams.get('notify') === '1';
      const result = await runPathChecks(env, injectFailure ? 'manual-injected-failure' : 'manual', {
        notify,
        extraTargets: injectFailure ? [pathCheckInjectedFailure()] : []
      });
      return json({ ok: true, ...result }, request);
    }

    if (url.pathname === '/path-checks/status' && request.method === 'GET') {
      if (!requireDashboard(request, env)) {
        return json({ ok: false, error: 'unauthorized' }, request, 403);
      }
      const result = await getPathCheckStatus(env);
      return json({ ok: true, ...result }, request);
    }

    if (url.pathname === '/alerts/check' && request.method === 'POST') {
      if (!requireDashboard(request, env)) {
        return json({ ok: false, error: 'unauthorized' }, request, 403);
      }
      const result = await evaluateDashboardAlerts(env, 'manual');
      return json({ ok: true, ...result }, request);
    }

    if (url.pathname === '/alerts/test' && request.method === 'GET') {
      if (!requireDashboard(request, env)) {
        return json({
          ok: false,
          error: 'missing_dashboard_key',
          message: '发测试告警需要 Dashboard key；请在 db.nice.okinawa 登录后点击“发测试告警”。'
        }, request);
      }
      return json({
        ok: true,
        message: '此端点用于发送测试告警；请用 POST /alerts/test。'
      }, request);
    }

    if (url.pathname === '/alerts/test' && request.method === 'POST') {
      if (!requireDashboard(request, env)) {
        return json({ ok: false, error: 'unauthorized' }, request, 403);
      }
      try {
        const result = await sendManualTestAlert(env, { dryRun: url.searchParams.get('dry_run') === '1' });
        return json({ ok: true, ...result }, request);
      } catch (error) {
        return json({ ok: false, error: clean(error.message || String(error), 300) }, request, 502);
      }
    }

    if (url.pathname === '/alerts/self-check' && request.method === 'POST') {
      if (!requireDashboard(request, env)) {
        return json({ ok: false, error: 'unauthorized' }, request, 403);
      }
      try {
        const result = await sendMonthlyAlertChannelSelfCheck(env, new Date(), 'manual', {
          force: url.searchParams.get('force') === '1'
        });
        return json({ ok: true, ...result }, request);
      } catch (error) {
        return json({ ok: false, error: clean(error.message || String(error), 300) }, request, 502);
      }
    }

    if (url.pathname === '/search-console/sync' && request.method === 'POST') {
      return syncSearchConsole(request, env);
    }

    if (url.pathname === '/search-console/weekly-report' && request.method === 'POST') {
      return searchConsoleWeeklyReport(request, env);
    }

    if (url.pathname === '/search-console/status' && request.method === 'GET') {
      return searchConsoleStatus(request, env);
    }

    if (url.pathname === '/health') {
      return json({ ok: true, service: 'nice-analytics' }, request);
    }

    return json({ ok: false, error: 'not_found' }, request, 404);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScheduledTasks(event, env));
  }
};

function corsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const allowed = isAllowedOrigin(origin) ? origin : DASHBOARD_ORIGIN;
  return {
    'access-control-allow-origin': allowed,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-dashboard-key',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
}

function isAllowedOrigin(origin) {
  if (origin === COLLECT_ORIGIN || origin === DASHBOARD_ORIGIN || origin === 'https://nice.okinawa') return true;
  try {
    const host = new URL(origin).hostname;
    return host === 'nice.okinawa' || host.endsWith('.nice.okinawa');
  } catch (e) {
    return false;
  }
}

function json(data, request, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(request)
    }
  });
}

function clean(value, max = 500) {
  if (value === undefined || value === null) return '';
  return String(value).slice(0, max);
}

function deviceFromUA(ua) {
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return 'tablet';
  if (/mobile|iphone|android/.test(s)) return 'mobile';
  return 'desktop';
}

function sourceFromReferrer(referrer, url) {
  const utmSource = clean(url.searchParams.get('utm_source'), 80);
  const utmMedium = clean(url.searchParams.get('utm_medium'), 80);
  const utmCampaign = clean(url.searchParams.get('utm_campaign'), 120);
  if (utmSource) return { source: utmSource, medium: utmMedium || 'utm', campaign: utmCampaign };
  if (!referrer) return { source: 'direct', medium: 'none', campaign: '' };
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (host.includes('google.')) return { source: 'google', medium: 'organic', campaign: '' };
    if (host.includes('bing.')) return { source: 'bing', medium: 'organic', campaign: '' };
    if (host.includes('yahoo.')) return { source: 'yahoo', medium: 'organic', campaign: '' };
    if (host.includes('instagram.')) return { source: 'instagram', medium: 'social', campaign: '' };
    if (host.includes('facebook.')) return { source: 'facebook', medium: 'social', campaign: '' };
    if (host.includes('whatsapp.')) return { source: 'whatsapp', medium: 'message', campaign: '' };
    if (host.includes('translation.nice.okinawa')) return { source: 'internal', medium: 'site', campaign: '' };
    return { source: host, medium: 'referral', campaign: '' };
  } catch (e) {
    return { source: 'unknown', medium: 'unknown', campaign: '' };
  }
}

function safeUrl(value) {
  try {
    return new URL(value || 'https://translation.nice.okinawa/');
  } catch (e) {
    return new URL('https://translation.nice.okinawa/');
  }
}

async function collect(request, env, ctx) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'bad_json' }, request, 400);
  }

  const eventUrl = safeUrl(clean(body.url, 1000));
  const source = sourceFromReferrer(clean(body.referrer, 1000), eventUrl);
  const ua = request.headers.get('user-agent') || '';
  const cf = request.cf || {};
  const event = {
    type: clean(body.type, 60) || 'event',
    site: clean(body.site, 120) || 'translation.nice.okinawa',
    session_id: clean(body.session_id, 120),
    visitor_id: clean(body.visitor_id, 120),
    path: clean(body.path || eventUrl.pathname, 300),
    title: clean(body.title, 300),
    url: clean(body.url, 1000),
    referrer: clean(body.referrer, 1000),
    source: source.source,
    medium: source.medium,
    campaign: source.campaign || clean(body.utm_campaign, 120),
    lang: clean(body.lang, 40),
    browser_lang: clean(body.browser_lang, 80),
    country: clean(cf.country, 10),
    colo: clean(cf.colo, 20),
    device: deviceFromUA(ua),
    screen: clean(body.screen, 40),
    viewport: clean(body.viewport, 40),
    event_name: clean(body.event_name, 120),
    label: clean(body.label, 300),
    href: clean(body.href, 1000),
    section: clean(body.section, 120),
    duration_ms: Number.isFinite(Number(body.duration_ms)) ? Math.round(Number(body.duration_ms)) : null,
    max_scroll: Number.isFinite(Number(body.max_scroll)) ? Math.round(Number(body.max_scroll)) : null,
    raw: JSON.stringify(body).slice(0, 4000)
  };

  ctx.waitUntil(env.DB.prepare(`
    INSERT INTO events (
      type, site, session_id, visitor_id, path, title, url, referrer, source, medium, campaign,
      lang, browser_lang, country, colo, device, screen, viewport, event_name, label, href, section,
      duration_ms, max_scroll, raw
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    event.type, event.site, event.session_id, event.visitor_id, event.path, event.title, event.url,
    event.referrer, event.source, event.medium, event.campaign, event.lang, event.browser_lang,
    event.country, event.colo, event.device, event.screen, event.viewport, event.event_name,
    event.label, event.href, event.section, event.duration_ms, event.max_scroll, event.raw
  ).run());

  return json({ ok: true }, request);
}

function visitorEventCorsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const decision = visitorEventOriginDecision(origin);
  const headers = {
    'access-control-allow-methods': 'POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
  if (decision.allow || decision.discard) {
    headers['access-control-allow-origin'] = origin;
  }
  return headers;
}

function visitorEventOriginDecision(origin) {
  if (!origin) return { allow: false, discard: false, host: '' };
  let host = '';
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch (e) {
    return { allow: false, discard: false, host: '' };
  }
  if (host.endsWith('.pages.dev')) return { allow: false, discard: true, host };
  const allowed = Object.values(VISITOR_EVENT_SITES).includes(host);
  return { allow: allowed, discard: false, host };
}

function siteIdForHost(host) {
  for (const [siteId, siteHost] of Object.entries(VISITOR_EVENT_SITES)) {
    if (siteHost === host) return siteId;
  }
  return '';
}

function emptyVisitorEventResponse(request, status = 204) {
  return new Response(null, {
    status,
    headers: visitorEventCorsHeaders(request)
  });
}

function positiveInteger(value, fallback = null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.round(n));
}

function cappedDwellMs(value) {
  const n = positiveInteger(value, null);
  if (n === null) return null;
  return Math.min(n, 30 * 60 * 1000);
}

function safeTimestamp(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function referrerHostOnly(value) {
  if (!value) return '';
  try {
    return new URL(String(value)).hostname.replace(/^www\./, '').slice(0, 120);
  } catch (e) {
    return clean(value, 120).split('/')[0].split('?')[0];
  }
}

function landingPathOnly(value) {
  const raw = clean(value, 300) || '/';
  try {
    return new URL(raw, 'https://example.invalid').pathname.slice(0, 300) || '/';
  } catch (e) {
    return raw.split('?')[0].slice(0, 300) || '/';
  }
}

function landingUrlParts(value) {
  const raw = clean(value, 1000) || '/';
  try {
    const url = new URL(raw, 'https://example.invalid');
    return {
      path: url.pathname.slice(0, 300) || '/',
      utm_source: clean(url.searchParams.get('utm_source'), 120),
      utm_medium: clean(url.searchParams.get('utm_medium'), 120),
      utm_campaign: clean(url.searchParams.get('utm_campaign'), 160)
    };
  } catch (e) {
    return {
      path: landingPathOnly(raw),
      utm_source: '',
      utm_medium: '',
      utm_campaign: ''
    };
  }
}

function contactChannel(value) {
  const channel = clean(value, 40).toLowerCase();
  return CONTACT_CHANNELS.has(channel) ? channel : '';
}

function deviceType(value) {
  const device = clean(value, 40).toLowerCase();
  if (['mobile', 'tablet', 'desktop'].includes(device)) return device;
  return '';
}

async function visitorEventBody(request) {
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  if (contentType.startsWith('application/json')) return request.json();
  if (contentType.startsWith('text/plain')) return JSON.parse(await request.text());
  throw new Error('unsupported_content_type');
}

async function collectVisitorEvent(request, env, ctx) {
  const originDecision = visitorEventOriginDecision(request.headers.get('origin') || '');
  if (originDecision.discard) {
    return emptyVisitorEventResponse(request);
  }
  if (!originDecision.allow) {
    return emptyVisitorEventResponse(request, 403);
  }

  let body;
  try {
    body = await visitorEventBody(request);
  } catch (e) {
    return emptyVisitorEventResponse(request, 400);
  }

  const siteId = clean(body.site_id, 60).toLowerCase();
  const expectedSiteId = siteIdForHost(originDecision.host);
  if (!siteId || !VISITOR_EVENT_SITES[siteId] || siteId !== expectedSiteId) {
    return emptyVisitorEventResponse(request, 403);
  }

  const eventType = clean(body.event_type, 40).toLowerCase();
  if (!VISITOR_EVENT_TYPES.has(eventType)) {
    return emptyVisitorEventResponse(request, 400);
  }

  const visitorId = clean(body.visitor_id, 120);
  const sessionId = clean(body.session_id, 120);
  if (!visitorId || !sessionId) {
    return emptyVisitorEventResponse(request, 400);
  }

  const recent = await env.DB.prepare(`
    SELECT COUNT(*) AS count
    FROM visitor_events
    WHERE site_id = ?
      AND visitor_id = ?
      AND created_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-60 seconds')
  `).bind(siteId, visitorId).first();

  if (Number(recent?.count || 0) >= VISITOR_EVENT_RATE_LIMIT_PER_MINUTE) {
    return emptyVisitorEventResponse(request);
  }

  const cf = request.cf || {};
  const landing = landingUrlParts(body.landing_url || body.landing_path || body.path);
  const row = {
    site_id: siteId,
    event_type: eventType,
    visitor_id: visitorId,
    session_id: sessionId,
    ts: safeTimestamp(body.ts),
    referrer_host: referrerHostOnly(body.referrer || body.referrer_host),
    country: clean(cf.country, 10),
    city: clean(cf.city, 120),
    timezone: clean(cf.timezone, 80),
    ui_lang: clean(body.ui_lang, 40),
    browser_lang: clean(body.browser_lang, 80),
    landing_path: landing.path,
    utm_source: landing.utm_source,
    utm_medium: landing.utm_medium,
    utm_campaign: landing.utm_campaign,
    dwell_ms: eventType === 'dwell' ? cappedDwellMs(body.dwell_ms) : null,
    section_id: eventType === 'section_view' ? clean(body.section_id, 120) : '',
    contact_channel: eventType === 'contact_click' ? contactChannel(body.contact_channel) : '',
    device_type: deviceType(body.device_type),
    viewport_width: positiveInteger(body.viewport_width, null)
  };

  ctx.waitUntil(env.DB.prepare(`
    INSERT INTO visitor_events (
      site_id, event_type, visitor_id, session_id, ts, referrer_host, country, city, timezone,
      ui_lang, browser_lang, landing_path, utm_source, utm_medium, utm_campaign,
      dwell_ms, section_id, contact_channel, device_type, viewport_width
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    row.site_id, row.event_type, row.visitor_id, row.session_id, row.ts, row.referrer_host,
    row.country, row.city, row.timezone, row.ui_lang, row.browser_lang, row.landing_path,
    row.utm_source, row.utm_medium, row.utm_campaign, row.dwell_ms, row.section_id,
    row.contact_channel, row.device_type, row.viewport_width
  ).run());

  return emptyVisitorEventResponse(request);
}

function requireDashboard(request, env) {
  const expected = env.DASHBOARD_KEY || '';
  if (!expected) return false;
  return request.headers.get('x-dashboard-key') === expected;
}

async function visitorDashboard(request, env) {
  if (!requireDashboard(request, env)) {
    return json({ ok: false, error: 'unauthorized' }, request, 403);
  }

  const url = new URL(request.url);
  const requestedRange = clean(url.searchParams.get('range'), 20);
  const requestedDays = Number(url.searchParams.get('days') || 28);
  const days = VISITOR_DASHBOARD_DAY_OPTIONS.has(requestedDays) ? requestedDays : 28;
  const monthRange = requestedRange === 'month';
  const since = monthRange ? jstMonthStartIso() : new Date(Date.now() - days * 86400000).toISOString();

  const [
    totals,
    contactTotal,
    contactBySite,
    medianDwell,
    referrers,
    locations,
    landingPages,
    uiLangs,
    utmSources,
    rawRecords,
    visitorRows,
    contactVisitors
  ] = await Promise.all([
    all(env.DB, `
      SELECT
        site_id,
        COUNT(*) AS event_count,
        COUNT(CASE WHEN event_type='pageview' THEN 1 END) AS pv,
        COUNT(DISTINCT visitor_id) AS uv,
        COUNT(CASE WHEN event_type='contact_click' THEN 1 END) AS contact_clicks
      FROM visitor_events
      WHERE created_at >= ?
      GROUP BY site_id
      ORDER BY contact_clicks DESC, pv DESC, event_count DESC
    `, [since]),
    first(env.DB, `
      SELECT COUNT(*) AS count
      FROM visitor_events
      WHERE created_at >= ? AND event_type='contact_click'
    `, [since]),
    all(env.DB, `
      SELECT site_id, COUNT(*) AS count
      FROM visitor_events
      WHERE created_at >= ? AND event_type='contact_click'
      GROUP BY site_id
      ORDER BY count DESC, site_id
    `, [since]),
    all(env.DB, `
      WITH ranked AS (
        SELECT
          site_id,
          dwell_ms,
          ROW_NUMBER() OVER (PARTITION BY site_id ORDER BY dwell_ms) AS rn,
          COUNT(*) OVER (PARTITION BY site_id) AS cnt
        FROM visitor_events
        WHERE created_at >= ? AND event_type='dwell' AND dwell_ms IS NOT NULL
      )
      SELECT site_id, ROUND(AVG(dwell_ms)) AS median_dwell_ms
      FROM ranked
      WHERE rn IN ((cnt + 1) / 2, (cnt + 2) / 2)
      GROUP BY site_id
    `, [since]),
    visitorSourceRank(env.DB, since),
    visitorRank(env.DB, since, 'location', "TRIM(COALESCE(NULLIF(country, ''), '-') || ' · ' || COALESCE(NULLIF(city, ''), '-'))"),
    visitorRank(env.DB, since, 'landing_path', "COALESCE(NULLIF(landing_path, ''), '/')"),
    visitorRank(env.DB, since, 'ui_lang', "COALESCE(NULLIF(ui_lang, ''), '-')"),
    visitorRank(env.DB, since, 'utm_source', "COALESCE(NULLIF(utm_source, ''), '(none)')"),
    all(env.DB, `
      WITH ranked AS (
        SELECT
          created_at, site_id, event_type, referrer_host, country, city, landing_path,
          ROW_NUMBER() OVER (PARTITION BY site_id ORDER BY created_at DESC, id DESC) AS rn
        FROM visitor_events
        WHERE created_at >= ?
      )
      SELECT created_at, site_id, event_type, referrer_host, country, city, landing_path
      FROM ranked
      WHERE rn <= 80
      ORDER BY site_id, created_at DESC
    `, [since]),
    all(env.DB, `
      WITH base AS (
        SELECT *
        FROM visitor_events
        WHERE created_at >= ?
      ),
      grouped AS (
        SELECT
          site_id,
          visitor_id,
          MIN(created_at) AS first_seen_at,
          MAX(created_at) AS last_seen_at,
          COUNT(*) AS event_count,
          COUNT(CASE WHEN event_type='pageview' THEN 1 END) AS pageviews,
          COUNT(CASE WHEN event_type='section_view' THEN 1 END) AS section_views,
          COUNT(CASE WHEN event_type='dwell' THEN 1 END) AS dwell_count,
          ROUND(AVG(CASE WHEN event_type='dwell' AND dwell_ms IS NOT NULL THEN dwell_ms END)) AS avg_dwell_ms,
          MAX(CASE WHEN event_type='dwell' THEN dwell_ms END) AS max_dwell_ms,
          COUNT(CASE WHEN event_type='contact_click' THEN 1 END) AS contact_clicks,
          GROUP_CONCAT(DISTINCT CASE WHEN event_type='contact_click' AND contact_channel <> '' THEN contact_channel END) AS contact_channels,
          GROUP_CONCAT(DISTINCT CASE WHEN event_type='section_view' AND section_id <> '' THEN section_id END) AS section_ids
        FROM base
        GROUP BY site_id, visitor_id
      ),
      latest AS (
        SELECT
          site_id,
          visitor_id,
          created_at,
          referrer_host,
          country,
          city,
          timezone,
          ui_lang,
          browser_lang,
          landing_path,
          utm_source,
          utm_medium,
          utm_campaign,
          ROW_NUMBER() OVER (PARTITION BY site_id, visitor_id ORDER BY created_at DESC, id DESC) AS rn
        FROM base
      ),
      first_touch AS (
        SELECT
          site_id,
          visitor_id,
          landing_path,
          utm_source,
          utm_medium,
          utm_campaign,
          ROW_NUMBER() OVER (PARTITION BY site_id, visitor_id ORDER BY created_at ASC, id ASC) AS rn
        FROM base
      ),
      external_touch AS (
        SELECT
          site_id,
          visitor_id,
          LOWER(REPLACE(referrer_host, 'www.', '')) AS referrer_host,
          ROW_NUMBER() OVER (PARTITION BY site_id, visitor_id ORDER BY created_at ASC, id ASC) AS rn
        FROM base
        WHERE referrer_host IS NOT NULL
          AND referrer_host <> ''
          AND LOWER(REPLACE(referrer_host, 'www.', '')) <> 'direct'
          AND LOWER(REPLACE(referrer_host, 'www.', '')) <> 'nice.okinawa'
          AND LOWER(REPLACE(referrer_host, 'www.', '')) NOT LIKE '%.nice.okinawa'
      ),
      utm_touch AS (
        SELECT
          site_id,
          visitor_id,
          utm_source,
          ROW_NUMBER() OVER (PARTITION BY site_id, visitor_id ORDER BY created_at ASC, id ASC) AS rn
        FROM base
        WHERE utm_source IS NOT NULL
          AND utm_source <> ''
      )
      SELECT
        g.site_id,
        g.site_id AS landing_site,
        g.visitor_id,
        g.first_seen_at,
        g.last_seen_at,
        g.event_count,
        g.pageviews,
        g.section_views,
        g.dwell_count,
        g.avg_dwell_ms,
        g.max_dwell_ms,
        g.contact_clicks,
        COALESCE(g.contact_channels, '') AS contact_channels,
        COALESCE(g.section_ids, '') AS section_ids,
        COALESCE(e.referrer_host, u.utm_source, 'direct') AS referrer_host,
        COALESCE(l.country, '') AS country,
        COALESCE(l.city, '') AS city,
        COALESCE(l.timezone, '') AS timezone,
        COALESCE(l.ui_lang, '') AS ui_lang,
        COALESCE(l.browser_lang, '') AS browser_lang,
        COALESCE(NULLIF(f.landing_path, ''), COALESCE(l.landing_path, '/')) AS landing_path,
        COALESCE(NULLIF(f.utm_source, ''), COALESCE(l.utm_source, '')) AS utm_source,
        COALESCE(NULLIF(f.utm_medium, ''), COALESCE(l.utm_medium, '')) AS utm_medium,
        COALESCE(NULLIF(f.utm_campaign, ''), COALESCE(l.utm_campaign, '')) AS utm_campaign
      FROM grouped g
      LEFT JOIN latest l ON l.site_id = g.site_id AND l.visitor_id = g.visitor_id AND l.rn = 1
      LEFT JOIN first_touch f ON f.site_id = g.site_id AND f.visitor_id = g.visitor_id AND f.rn = 1
      LEFT JOIN external_touch e ON e.site_id = g.site_id AND e.visitor_id = g.visitor_id AND e.rn = 1
      LEFT JOIN utm_touch u ON u.site_id = g.site_id AND u.visitor_id = g.visitor_id AND u.rn = 1
      ORDER BY g.last_seen_at DESC
      LIMIT 160
    `, [since]),
    all(env.DB, `
      WITH base AS (
        SELECT *
        FROM visitor_events
        WHERE created_at >= ?
      ),
      grouped AS (
        SELECT
          site_id,
          visitor_id,
          MAX(created_at) AS last_contact_at,
          COUNT(CASE WHEN event_type='contact_click' THEN 1 END) AS contact_clicks,
          GROUP_CONCAT(DISTINCT CASE WHEN event_type='contact_click' AND contact_channel <> '' THEN contact_channel END) AS contact_channels,
          GROUP_CONCAT(DISTINCT CASE WHEN event_type='section_view' AND section_id <> '' THEN section_id END) AS section_ids
        FROM base
        GROUP BY site_id, visitor_id
        HAVING contact_clicks > 0
      ),
      latest_contact AS (
        SELECT
          site_id,
          visitor_id,
          country,
          city,
          timezone,
          ui_lang,
          browser_lang,
          ROW_NUMBER() OVER (PARTITION BY site_id, visitor_id ORDER BY created_at DESC, id DESC) AS rn
        FROM base
        WHERE event_type='contact_click'
      ),
      first_touch AS (
        SELECT
          site_id,
          visitor_id,
          landing_path,
          utm_source,
          ROW_NUMBER() OVER (PARTITION BY site_id, visitor_id ORDER BY created_at ASC, id ASC) AS rn
        FROM base
      ),
      external_touch AS (
        SELECT
          site_id,
          visitor_id,
          LOWER(REPLACE(referrer_host, 'www.', '')) AS referrer_host,
          ROW_NUMBER() OVER (PARTITION BY site_id, visitor_id ORDER BY created_at ASC, id ASC) AS rn
        FROM base
        WHERE referrer_host IS NOT NULL
          AND referrer_host <> ''
          AND LOWER(REPLACE(referrer_host, 'www.', '')) <> 'direct'
          AND LOWER(REPLACE(referrer_host, 'www.', '')) <> 'nice.okinawa'
          AND LOWER(REPLACE(referrer_host, 'www.', '')) NOT LIKE '%.nice.okinawa'
      ),
      utm_touch AS (
        SELECT
          site_id,
          visitor_id,
          utm_source,
          ROW_NUMBER() OVER (PARTITION BY site_id, visitor_id ORDER BY created_at ASC, id ASC) AS rn
        FROM base
        WHERE utm_source IS NOT NULL
          AND utm_source <> ''
      ),
      page_paths AS (
        SELECT
          site_id,
          visitor_id,
          GROUP_CONCAT(path, '||') AS page_paths
        FROM (
          SELECT
            site_id,
            visitor_id,
            COALESCE(NULLIF(landing_path, ''), '/') AS path,
            MIN(created_at) AS first_seen_at
          FROM base
          WHERE event_type='pageview'
          GROUP BY site_id, visitor_id, path
          ORDER BY site_id, visitor_id, first_seen_at
        )
        GROUP BY site_id, visitor_id
      )
      SELECT
        g.site_id,
        g.visitor_id,
        g.last_contact_at,
        g.contact_clicks,
        COALESCE(g.contact_channels, '') AS contact_channels,
        COALESCE(g.section_ids, '') AS section_ids,
        COALESCE(c.country, '') AS country,
        COALESCE(c.city, '') AS city,
        COALESCE(c.timezone, '') AS timezone,
        COALESCE(c.ui_lang, '') AS ui_lang,
        COALESCE(c.browser_lang, '') AS browser_lang,
        COALESCE(e.referrer_host, u.utm_source, 'direct') AS source,
        COALESCE(NULLIF(f.landing_path, ''), '/') AS landing_path,
        COALESCE(p.page_paths, '') AS page_paths
      FROM grouped g
      LEFT JOIN latest_contact c ON c.site_id = g.site_id AND c.visitor_id = g.visitor_id AND c.rn = 1
      LEFT JOIN first_touch f ON f.site_id = g.site_id AND f.visitor_id = g.visitor_id AND f.rn = 1
      LEFT JOIN external_touch e ON e.site_id = g.site_id AND e.visitor_id = g.visitor_id AND e.rn = 1
      LEFT JOIN utm_touch u ON u.site_id = g.site_id AND u.visitor_id = g.visitor_id AND u.rn = 1
      LEFT JOIN page_paths p ON p.site_id = g.site_id AND p.visitor_id = g.visitor_id
      ORDER BY g.last_contact_at DESC
      LIMIT 80
    `, [since])
  ]);

  const medianBySite = mapBySite(medianDwell, 'median_dwell_ms');
  const rawBySite = groupBySite(rawRecords);
  const ranks = {
    referrers: groupBySite(referrers),
    locations: groupBySite(locations),
    landing_pages: groupBySite(landingPages),
    ui_langs: groupBySite(uiLangs),
    utm_sources: groupBySite(utmSources)
  };

  const totalsBySite = new Map((totals || []).map((row) => [row.site_id || '', row]));
  const sites = Object.keys(VISITOR_EVENT_SITES).map((siteId) => {
    const row = totalsBySite.get(siteId) || {};
    const resolvedSiteId = row.site_id || siteId;
    const eventCount = Number(row.event_count || 0);
    const protectedSample = eventCount < VISITOR_SAMPLE_MIN_EVENTS;
    return {
      site_id: resolvedSiteId,
      event_count: eventCount,
      uv: Number(row.uv || 0),
      pv: Number(row.pv || 0),
      contact_clicks: Number(row.contact_clicks || 0),
      median_dwell_ms: Number(medianBySite.get(resolvedSiteId) || 0),
      protected: protectedSample,
      sample_min_events: VISITOR_SAMPLE_MIN_EVENTS,
      raw_records: protectedSample ? (rawBySite.get(resolvedSiteId) || []) : [],
      referrers: protectedSample ? [] : (ranks.referrers.get(resolvedSiteId) || []),
      locations: protectedSample ? [] : (ranks.locations.get(resolvedSiteId) || []),
      landing_pages: protectedSample ? [] : (ranks.landing_pages.get(resolvedSiteId) || []),
      ui_langs: protectedSample ? [] : (ranks.ui_langs.get(resolvedSiteId) || []),
      utm_sources: protectedSample ? [] : (ranks.utm_sources.get(resolvedSiteId) || [])
    };
  }).sort((a, b) => {
    const az = a.event_count > 0 ? 0 : 1;
    const bz = b.event_count > 0 ? 0 : 1;
    if (az !== bz) return az - bz;
    return b.uv - a.uv || b.pv - a.pv || b.contact_clicks - a.contact_clicks || a.site_id.localeCompare(b.site_id);
  });

  return json({
    ok: true,
    days,
    range: monthRange ? 'month' : `${days}d`,
    generated_at: new Date().toISOString(),
    sample_min_events: VISITOR_SAMPLE_MIN_EVENTS,
    contact_clicks: {
      total: Number(contactTotal?.count || 0),
      by_site: contactBySite.map((row) => ({
        site_id: row.site_id || '',
        count: Number(row.count || 0)
      }))
    },
    sites,
    visitor_rows: visitorRows.map((row) => ({
      site_id: row.site_id || '',
      landing_site: row.landing_site || row.site_id || '',
      visitor_id: row.visitor_id || '',
      first_seen_at: row.first_seen_at || '',
      last_seen_at: row.last_seen_at || '',
      event_count: Number(row.event_count || 0),
      pageviews: Number(row.pageviews || 0),
      section_views: Number(row.section_views || 0),
      dwell_count: Number(row.dwell_count || 0),
      avg_dwell_ms: Number(row.avg_dwell_ms || 0),
      max_dwell_ms: Number(row.max_dwell_ms || 0),
      contact_clicks: Number(row.contact_clicks || 0),
      contact_channels: splitCsv(row.contact_channels),
      section_ids: splitCsv(row.section_ids),
      referrer_host: row.referrer_host || 'direct',
      country: row.country || '',
      city: row.city || '',
      timezone: row.timezone || '',
      ui_lang: row.ui_lang || '',
      browser_lang: row.browser_lang || '',
      landing_path: row.landing_path || '/',
      utm_source: row.utm_source || '',
      utm_medium: row.utm_medium || '',
      utm_campaign: row.utm_campaign || '',
      is_bot_like: isBotLikeVisitor(row),
      bot_reasons: botLikeReasons(row)
    })),
    contact_visitors: contactVisitors.map((row) => ({
      site_id: row.site_id || '',
      visitor_id: row.visitor_id || '',
      last_contact_at: row.last_contact_at || '',
      contact_clicks: Number(row.contact_clicks || 0),
      contact_channels: splitCsv(row.contact_channels),
      country: row.country || '',
      city: row.city || '',
      timezone: row.timezone || '',
      ui_lang: row.ui_lang || '',
      browser_lang: row.browser_lang || '',
      source: row.source || 'direct',
      landing_path: row.landing_path || '/',
      page_paths: splitPipe(row.page_paths),
      section_ids: splitCsv(row.section_ids)
    }))
  }, request);
}

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function splitPipe(value) {
  return String(value || '')
    .split('||')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

async function visitorSourceRank(db, since) {
  return all(db, `
    WITH base AS (
      SELECT
        site_id,
        visitor_id,
        utm_source,
        LOWER(REPLACE(COALESCE(referrer_host, ''), 'www.', '')) AS referrer_host,
        created_at,
        id
      FROM visitor_events
      WHERE created_at >= ?
    ),
    external_touch AS (
      SELECT
        site_id,
        visitor_id,
        referrer_host,
        ROW_NUMBER() OVER (PARTITION BY site_id, visitor_id ORDER BY created_at ASC, id ASC) AS rn
      FROM base
      WHERE referrer_host <> ''
        AND referrer_host <> 'direct'
        AND referrer_host <> 'nice.okinawa'
        AND referrer_host NOT LIKE '%.nice.okinawa'
    ),
    utm_touch AS (
      SELECT
        site_id,
        visitor_id,
        utm_source,
        ROW_NUMBER() OVER (PARTITION BY site_id, visitor_id ORDER BY created_at ASC, id ASC) AS rn
      FROM base
      WHERE utm_source IS NOT NULL
        AND utm_source <> ''
    ),
    visitor_sources AS (
      SELECT
        site_id,
        visitor_id,
        COALESCE(
          MAX(CASE WHEN source_type = 'referrer' AND rn = 1 THEN value END),
          MAX(CASE WHEN source_type = 'utm' AND rn = 1 THEN value END),
          'direct'
        ) AS value
      FROM (
        SELECT DISTINCT site_id, visitor_id, NULL AS source_type, NULL AS value, NULL AS rn FROM base
        UNION ALL
        SELECT site_id, visitor_id, 'referrer' AS source_type, referrer_host AS value, rn FROM external_touch
        UNION ALL
        SELECT site_id, visitor_id, 'utm' AS source_type, utm_source AS value, rn FROM utm_touch
      )
      GROUP BY site_id, visitor_id
    ),
    grouped AS (
      SELECT site_id, value, COUNT(*) AS count
      FROM visitor_sources
      GROUP BY site_id, value
    ),
    ranked AS (
      SELECT
        site_id,
        value,
        count,
        ROW_NUMBER() OVER (PARTITION BY site_id ORDER BY count DESC, value) AS rn
      FROM grouped
    )
    SELECT site_id, 'referrer_host' AS field, value, count
    FROM ranked
    WHERE rn <= 8
    ORDER BY site_id, count DESC, value
  `, [since]);
}

async function visitorRank(db, since, field, valueExpr) {
  return all(db, `
    WITH grouped AS (
      SELECT site_id, ${valueExpr} AS value, COUNT(*) AS count
      FROM visitor_events
      WHERE created_at >= ?
      GROUP BY site_id, value
    ),
    ranked AS (
      SELECT
        site_id,
        value,
        count,
        ROW_NUMBER() OVER (PARTITION BY site_id ORDER BY count DESC, value) AS rn
      FROM grouped
    )
    SELECT site_id, ? AS field, value, count
    FROM ranked
    WHERE rn <= 8
    ORDER BY site_id, count DESC, value
  `, [since, field]);
}

function botLikeReasons(row) {
  const reasons = [];
  const city = String(row?.city || '').trim().toLowerCase();
  if (city && BOT_LIKE_CITIES.has(city)) reasons.push('city:' + String(row.city).trim());
  return reasons;
}

function isBotLikeVisitor(row) {
  return botLikeReasons(row).length > 0;
}

function mapBySite(rows, valueKey) {
  const map = new Map();
  for (const row of rows || []) map.set(row.site_id || '', row[valueKey]);
  return map;
}

function groupBySite(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const siteId = row.site_id || '';
    if (!map.has(siteId)) map.set(siteId, []);
    map.get(siteId).push(row);
  }
  return map;
}

async function runScheduledTasks(event, env) {
  const errors = [];
  const cron = event?.cron || 'cron';
  const scheduledAt = new Date(Number(event?.scheduledTime || Date.now()));

  if (cron === MONTHLY_ALERT_SELF_CHECK_CRON) {
    try {
      await sendMonthlyAlertChannelSelfCheck(env, scheduledAt, cron);
    } catch (e) {
      errors.push(`alert-self-check:${e.message}`);
    }
  }

  if (isPreviewEnv(env) && cron === PATH_CHECK_PREVIEW_TEST_EMAIL_CRON) {
    try {
      await sendPathCheckTestAlert(env);
    } catch (e) {
      errors.push(`path-check-test-email:${e.message}`);
    }
    return { ok: errors.length === 0, errors };
  }

  if (cron === PATH_CHECK_CRON || (isPreviewEnv(env) && cron === PATH_CHECK_PREVIEW_INJECT_CRON)) {
    try {
      await runPathChecks(env, cron, {
        notify: pathCheckAlertsEnabled(env),
        extraTargets: cron === PATH_CHECK_PREVIEW_INJECT_CRON ? [pathCheckInjectedFailure()] : []
      });
    } catch (e) {
      errors.push(`path-checks:${e.message}`);
    }
    if (isPreviewEnv(env) && cron === PATH_CHECK_PREVIEW_INJECT_CRON) {
      return { ok: errors.length === 0, errors };
    }
  }

  try {
    await runProbes(env, cron);
  } catch (e) {
    errors.push(`probes:${e.message}`);
  }

  if (cron === GSC_DAILY_SYNC_CRON) {
    try {
      await syncSearchConsoleRange(env);
    } catch (e) {
      errors.push(`gsc:${e.message}`);
    }
    try {
      await syncBingSearchTermsRange(env);
    } catch (e) {
      errors.push(`bing:${e.message}`);
    }
    if (isJstMonday(scheduledAt)) {
      try {
        const report = await sendSearchConsoleWeeklyReport(env, scheduledAt, { reason: cron });
        if (report?.configured !== false && report?.error) errors.push(`gsc-weekly:${report.error}`);
      } catch (e) {
        errors.push(`gsc-weekly:${e.message}`);
      }
    }
  }
  try {
    await evaluateDashboardAlerts(env, cron, { notify: dashboardAlertsEnabled(env) });
  } catch (e) {
    errors.push(`alerts:${e.message}`);
  }
  return { ok: errors.length === 0, errors };
}

async function all(db, sql, params = []) {
  return db.prepare(sql).bind(...params).all().then((r) => r.results || []);
}

async function first(db, sql, params = []) {
  return db.prepare(sql).bind(...params).first();
}

function jstDayStartIso(ms = Date.now()) {
  const jst = new Date(ms + 9 * 3600000);
  return new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate(), -9, 0, 0, 0)).toISOString();
}

function jstMonthStartIso(ms = Date.now()) {
  const jst = new Date(ms + 9 * 3600000);
  return new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), 1, -9, 0, 0, 0)).toISOString();
}

async function summary(request, env) {
  if (!requireDashboard(request, env)) {
    return json({ ok: false, error: 'unauthorized' }, request, 403);
  }

  const url = new URL(request.url);
  const range = clean(url.searchParams.get('range'), 20);
  const days = range === 'today'
    ? 1
    : Math.min(Math.max(Number(url.searchParams.get('days') || 7), 1), 365);
  const selectedSite = clean(url.searchParams.get('site'), 120);
  const selectedSearchSite = clean(url.searchParams.get('gsc_site'), 120);
  const selectedSearchSource = normalizeSearchTermSource(url.searchParams.get('search_source') || 'google');
  const selectedPath = clean(url.searchParams.get('path'), 300);
  const pathExpr = "COALESCE(NULLIF(landing_path, ''), '/')";
  const filterClause = `${selectedSite ? ' AND site_id = ?' : ''}${selectedPath ? ` AND ${pathExpr} = ?` : ''}`;
  const filterParams = [...(selectedSite ? [selectedSite] : []), ...(selectedPath ? [selectedPath] : [])];
  const siteFilterClause = selectedSite ? ' AND site_id = ?' : '';
  const siteFilterParams = selectedSite ? [selectedSite] : [];
  const todayIso = jstDayStartIso();
  const since = range === 'today' ? todayIso : new Date(Date.now() - days * 86400000).toISOString();
  const onlineSince = new Date(Date.now() - 5 * 60000).toISOString();

  const totals = await first(env.DB, `
    SELECT
      COUNT(CASE WHEN event_type='pageview' THEN 1 END) AS page_views,
      COUNT(DISTINCT CASE WHEN event_type='pageview' THEN session_id END) AS sessions,
      COUNT(DISTINCT CASE WHEN event_type='pageview' THEN visitor_id END) AS visitors,
      COUNT(CASE WHEN event_type='contact_click' THEN 1 END) AS clicks,
      ROUND(AVG(CASE WHEN event_type='dwell' AND dwell_ms IS NOT NULL THEN dwell_ms END)) AS avg_duration_ms,
      NULL AS avg_scroll
    FROM visitor_events
    WHERE created_at >= ?${filterClause}
  `, [since, ...filterParams]);

  const todayTotals = await first(env.DB, `
    SELECT
      COUNT(CASE WHEN event_type='pageview' THEN 1 END) AS page_views,
      COUNT(DISTINCT CASE WHEN event_type='pageview' THEN session_id END) AS sessions,
      COUNT(DISTINCT CASE WHEN event_type='pageview' THEN visitor_id END) AS visitors
    FROM visitor_events
    WHERE created_at >= ?${filterClause}
  `, [todayIso, ...filterParams]);

  const online = await first(env.DB, `
    SELECT COUNT(DISTINCT session_id) AS sessions
    FROM visitor_events
    WHERE created_at >= ?${filterClause}
  `, [onlineSince, ...filterParams]);

  const pages = await all(env.DB, `
    SELECT site_id AS site, ${pathExpr} AS path, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
    FROM visitor_events
    WHERE created_at >= ?${siteFilterClause} AND event_type='pageview'
    GROUP BY site_id, ${pathExpr}
    ORDER BY views DESC
    LIMIT 60
  `, [since, ...siteFilterParams]);

  const pageRows = await all(env.DB, `
    WITH page_views AS (
      SELECT site_id AS site, ${pathExpr} AS path, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions, COUNT(DISTINCT visitor_id) AS visitors
      FROM visitor_events
      WHERE created_at >= ?${filterClause} AND event_type='pageview'
      GROUP BY site_id, ${pathExpr}
    ),
    page_source_events AS (
      SELECT
        site_id AS site,
        ${pathExpr} AS path,
        CASE
          WHEN referrer_host IS NOT NULL
            AND referrer_host <> ''
            AND LOWER(REPLACE(referrer_host, 'www.', '')) <> 'direct'
            AND LOWER(REPLACE(referrer_host, 'www.', '')) <> 'nice.okinawa'
            AND LOWER(REPLACE(referrer_host, 'www.', '')) NOT LIKE '%.nice.okinawa'
            THEN LOWER(REPLACE(referrer_host, 'www.', ''))
          WHEN utm_source IS NOT NULL AND utm_source <> ''
            THEN utm_source
          ELSE 'direct'
        END AS source
      FROM visitor_events
      WHERE created_at >= ?${filterClause} AND event_type='pageview'
    ),
    source_rank AS (
      SELECT site, path, source, COUNT(*) AS views,
        ROW_NUMBER() OVER (PARTITION BY site, path ORDER BY COUNT(*) DESC, source) AS rn
      FROM page_source_events
      GROUP BY site, path, source
    ),
    lang_rank AS (
      SELECT site_id AS site, ${pathExpr} AS path, COALESCE(NULLIF(ui_lang, ''), 'unknown') AS lang, COUNT(*) AS views,
        ROW_NUMBER() OVER (PARTITION BY site_id, ${pathExpr} ORDER BY COUNT(*) DESC) AS rn
      FROM visitor_events
      WHERE created_at >= ?${filterClause} AND event_type='pageview'
      GROUP BY site_id, ${pathExpr}, COALESCE(NULLIF(ui_lang, ''), 'unknown')
    ),
    contacts AS (
      SELECT site_id AS site, ${pathExpr} AS path, COUNT(*) AS clicks
      FROM visitor_events
      WHERE created_at >= ?${filterClause} AND event_type='contact_click'
      GROUP BY site_id, ${pathExpr}
    ),
    leave_stats AS (
      SELECT site_id AS site, ${pathExpr} AS path, ROUND(AVG(dwell_ms)) AS avg_duration_ms, NULL AS avg_scroll
      FROM visitor_events
      WHERE created_at >= ?${filterClause} AND event_type='dwell'
      GROUP BY site_id, ${pathExpr}
    )
    SELECT
      pv.site,
      pv.path,
      pv.views,
      pv.sessions,
      pv.visitors,
      COALESCE(sr.source, '') AS top_source,
      COALESCE(lr.lang, '') AS top_lang,
      COALESCE(c.clicks, 0) AS contact_clicks,
      ls.avg_duration_ms,
      ls.avg_scroll
    FROM page_views pv
    LEFT JOIN source_rank sr ON sr.site = pv.site AND sr.path = pv.path AND sr.rn = 1
    LEFT JOIN lang_rank lr ON lr.site = pv.site AND lr.path = pv.path AND lr.rn = 1
    LEFT JOIN contacts c ON c.site = pv.site AND c.path = pv.path
    LEFT JOIN leave_stats ls ON ls.site = pv.site AND ls.path = pv.path
    ORDER BY pv.views DESC
    LIMIT 100
  `, [since, ...filterParams, since, ...filterParams, since, ...filterParams, since, ...filterParams, since, ...filterParams]);

  const sites = await all(env.DB, `
    SELECT site_id AS site, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
    FROM visitor_events
    WHERE created_at >= ? AND event_type='pageview'
    GROUP BY site_id
    ORDER BY views DESC
    LIMIT 50
  `, [since]);

  const sources = await all(env.DB, `
    SELECT COALESCE(NULLIF(referrer_host, ''), 'direct') AS source, COALESCE(NULLIF(utm_medium, ''), '') AS medium, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
    FROM visitor_events
    WHERE created_at >= ?${filterClause} AND event_type='pageview'
    GROUP BY COALESCE(NULLIF(referrer_host, ''), 'direct'), COALESCE(NULLIF(utm_medium, ''), '')
    ORDER BY views DESC
    LIMIT 20
  `, [since, ...filterParams]);

  const sections = await all(env.DB, `
    SELECT section_id AS section, COUNT(*) AS views, NULL AS avg_duration_ms
    FROM visitor_events
    WHERE created_at >= ?${filterClause} AND event_type='section_view' AND section_id <> ''
    GROUP BY section_id
    ORDER BY views DESC
    LIMIT 20
  `, [since, ...filterParams]);

  const contacts = await all(env.DB, `
    SELECT contact_channel AS event_name, contact_channel AS label, COUNT(*) AS clicks
    FROM visitor_events
    WHERE created_at >= ?${filterClause} AND event_type='contact_click'
    GROUP BY contact_channel
    ORDER BY clicks DESC
    LIMIT 20
  `, [since, ...filterParams]);

  const languages = await all(env.DB, `
    SELECT COALESCE(NULLIF(ui_lang, ''), 'unknown') AS lang, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
    FROM visitor_events
    WHERE created_at >= ?${filterClause} AND event_type='pageview'
    GROUP BY COALESCE(NULLIF(ui_lang, ''), 'unknown')
    ORDER BY views DESC
    LIMIT 20
  `, [since, ...filterParams]);

  const countries = await all(env.DB, `
    SELECT country, COUNT(*) AS views
    FROM visitor_events
    WHERE created_at >= ?${filterClause} AND event_type='pageview' AND country <> ''
    GROUP BY country
    ORDER BY views DESC
    LIMIT 20
  `, [since, ...filterParams]);

  const devices = await all(env.DB, `
    SELECT COALESCE(NULLIF(device_type, ''), 'unknown') AS device, COUNT(*) AS views
    FROM visitor_events
    WHERE created_at >= ?${filterClause} AND event_type='pageview'
    GROUP BY COALESCE(NULLIF(device_type, ''), 'unknown')
    ORDER BY views DESC
  `, [since, ...filterParams]);

  const recent = await all(env.DB, `
    SELECT
      created_at,
      event_type AS type,
      site_id AS site,
      ${pathExpr} AS path,
      COALESCE(NULLIF(referrer_host, ''), 'direct') AS source,
      country,
      device_type AS device,
      ui_lang AS lang,
      contact_channel AS event_name,
      section_id AS section,
      dwell_ms AS duration_ms,
      NULL AS max_scroll
    FROM visitor_events
    WHERE created_at >= ?${filterClause}
    ORDER BY created_at DESC
    LIMIT 50
  `, [since, ...filterParams]);

  const searchConsole = hasSearchTermsConfig(env)
    ? await searchConsoleSummary(env.DB, {
      since: range === 'today' ? dateOnly(Date.now()) : dateOnly(Date.now() - days * 86400000),
      site: selectedSearchSite,
      path: selectedPath,
      source: selectedSearchSource
    })
    : await searchConsoleSummary(env.DB, {
      since: range === 'today' ? dateOnly(Date.now()) : dateOnly(Date.now() - days * 86400000),
      site: selectedSearchSite,
      path: selectedPath,
      source: selectedSearchSource,
      configured: false
    });

  return json({
    ok: true,
    days,
    range: range === 'today' ? 'today' : `${days}d`,
    selected_site: selectedSite,
    selected_path: selectedPath,
    generated_at: new Date().toISOString(),
    online: online?.sessions || 0,
    totals,
    today: todayTotals,
    sites,
    pages,
    page_rows: pageRows,
    sources,
    sections,
    contacts,
    languages,
    countries,
    devices,
    recent,
    search_console: searchConsole
  }, request);
}

async function searchConsoleSummary(db, filters) {
  try {
    await ensureSearchTermsTable({ DB: db });
    const source = normalizeSearchTermSource(filters.source || 'google');
    const sourceClause = source === 'all' ? '' : ' AND source = ?';
    const clause = `${sourceClause}${filters.site ? ' AND site = ?' : ''}${filters.path ? ' AND path = ?' : ''}`;
    const params = [filters.since, ...(source === 'all' ? [] : [source]), ...(filters.site ? [filters.site] : []), ...(filters.path ? [filters.path] : [])];
    const totals = await first(db, `
      SELECT
        COALESCE(SUM(clicks), 0) AS clicks,
        COALESCE(SUM(impressions), 0) AS impressions,
        CASE WHEN SUM(impressions) > 0 THEN SUM(clicks) * 1.0 / SUM(impressions) ELSE 0 END AS ctr,
        CASE WHEN SUM(impressions) > 0 THEN SUM(position * impressions) / SUM(impressions) ELSE 0 END AS position,
        MAX(imported_at) AS imported_at
      FROM search_terms
      WHERE date >= ?${clause}
    `, params);
    const queries = await all(db, `
      SELECT
        query,
        site,
        path,
        SUM(clicks) AS clicks,
        SUM(impressions) AS impressions,
        CASE WHEN SUM(impressions) > 0 THEN SUM(clicks) * 1.0 / SUM(impressions) ELSE 0 END AS ctr,
        CASE WHEN SUM(impressions) > 0 THEN SUM(position * impressions) / SUM(impressions) ELSE 0 END AS position
      FROM search_terms
      WHERE date >= ?${clause}
      GROUP BY query, site, path
      ORDER BY impressions DESC, clicks DESC
      LIMIT 20
    `, params);
    const noClick = await all(db, `
      SELECT
        query,
        site,
        path,
        SUM(clicks) AS clicks,
        SUM(impressions) AS impressions,
        CASE WHEN SUM(impressions) > 0 THEN SUM(clicks) * 1.0 / SUM(impressions) ELSE 0 END AS ctr,
        CASE WHEN SUM(impressions) > 0 THEN SUM(position * impressions) / SUM(impressions) ELSE 0 END AS position
      FROM search_terms
      WHERE date >= ?${clause}
      GROUP BY query, site, path
      HAVING SUM(impressions) > 0 AND SUM(clicks) = 0
      ORDER BY impressions DESC, position ASC
      LIMIT 20
    `, params);
    const strikingDistance = await all(db, `
      SELECT
        query,
        site,
        path,
        SUM(clicks) AS clicks,
        SUM(impressions) AS impressions,
        CASE WHEN SUM(impressions) > 0 THEN SUM(clicks) * 1.0 / SUM(impressions) ELSE 0 END AS ctr,
        CASE WHEN SUM(impressions) > 0 THEN SUM(position * impressions) / SUM(impressions) ELSE 0 END AS position
      FROM search_terms
      WHERE date >= ?${clause}
      GROUP BY query, site, path
      HAVING SUM(impressions) > 0
         AND (SUM(position * impressions) / SUM(impressions)) >= 4
         AND (SUM(position * impressions) / SUM(impressions)) <= 15
      ORDER BY impressions DESC, position ASC
      LIMIT 20
    `, params);
    const pages = await all(db, `
      SELECT
        site,
        path,
        SUM(clicks) AS clicks,
        SUM(impressions) AS impressions,
        CASE WHEN SUM(impressions) > 0 THEN SUM(clicks) * 1.0 / SUM(impressions) ELSE 0 END AS ctr,
        CASE WHEN SUM(impressions) > 0 THEN SUM(position * impressions) / SUM(impressions) ELSE 0 END AS position
      FROM search_terms
      WHERE date >= ?${clause}
      GROUP BY site, path
      ORDER BY clicks DESC, impressions DESC
      LIMIT 80
    `, params);
    const sites = await all(db, `
      SELECT
        site,
        SUM(clicks) AS clicks,
        SUM(impressions) AS impressions,
        CASE WHEN SUM(impressions) > 0 THEN SUM(clicks) * 1.0 / SUM(impressions) ELSE 0 END AS ctr,
        CASE WHEN SUM(impressions) > 0 THEN SUM(position * impressions) / SUM(impressions) ELSE 0 END AS position,
        MAX(imported_at) AS imported_at
      FROM search_terms
      WHERE date >= ?${sourceClause}
      GROUP BY site
      ORDER BY impressions DESC, clicks DESC
    `, [filters.since, ...(source === 'all' ? [] : [source])]);
    return {
      ok: true,
      configured: filters.configured !== false,
      source,
      range_start: filters.since,
      selected_site: filters.site || '',
      totals,
      sites,
      queries,
      no_click: noClick,
      striking_distance: strikingDistance,
      pages
    };
  } catch (e) {
    return { ok: false, error: 'search_console_not_ready' };
  }
}

async function searchConsoleStatus(request, env) {
  if (!requireDashboard(request, env)) {
    return json({ ok: false, error: 'unauthorized' }, request, 403);
  }
  const data = await searchConsoleSummary(env.DB, {
    since: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    site: '',
    path: '',
    source: normalizeSearchTermSource(new URL(request.url).searchParams.get('search_source') || 'google'),
    configured: hasSearchTermsConfig(env)
  });
  return json({
    ok: true,
    configured: hasSearchTermsConfig(env),
    google_configured: hasSearchConsoleConfig(env),
    bing_configured: hasBingSearchConfig(env),
    sites: configuredSearchConsoleSites(env),
    search_console: data
  }, request);
}

async function syncSearchConsole(request, env) {
  if (!requireDashboard(request, env)) {
    return json({ ok: false, error: 'unauthorized' }, request, 403);
  }
  const url = new URL(request.url);
  const days = Math.min(Math.max(Number(url.searchParams.get('days') || GSC_DEFAULT_SYNC_DAYS), 1), 365);
  const endDate = url.searchParams.get('end') || dateOnly(Date.now() - 2 * 86400000);
  const startDate = url.searchParams.get('start') || dateOnly(Date.parse(endDate + 'T00:00:00Z') - (days - 1) * 86400000);
  const google = await syncSearchConsoleRange(env, startDate, endDate);
  const bing = await syncBingSearchTermsRange(env);
  const result = {
    configured: Boolean(google.configured || bing.configured),
    start_date: startDate,
    end_date: endDate,
    imported_rows: Number(google.imported_rows || 0) + Number(bing.imported_rows || 0),
    google,
    bing
  };
  return json({ ok: true, ...result }, request);
}

async function searchConsoleWeeklyReport(request, env) {
  if (!requireDashboard(request, env)) {
    return json({ ok: false, error: 'unauthorized' }, request, 403);
  }
  try {
    const result = await sendSearchConsoleWeeklyReport(env, new Date(), { reason: 'manual', force: true });
    return json({ ok: true, ...result }, request);
  } catch (error) {
    return json({ ok: false, error: clean(error.message || String(error), 300) }, request, 502);
  }
}

async function syncSearchConsoleRange(env, startDate, endDate) {
  await ensureSearchTermsTable(env);
  if (!hasSearchConsoleConfig(env)) {
    return { configured: false, imported_rows: 0, error: 'missing_search_console_config' };
  }
  const end = endDate || dateOnly(Date.now() - 2 * 86400000);
  const start = startDate || dateOnly(Date.parse(end + 'T00:00:00Z') - (GSC_DEFAULT_SYNC_DAYS - 1) * 86400000);
  const token = await googleAccessToken(env);
  const sites = configuredSearchConsoleSites(env);
  let imported = 0;
  const details = [];
  for (const siteUrl of sites) {
    const rows = await fetchSearchConsoleRows(token, siteUrl, start, end);
    const count = await storeSearchConsoleRows(env.DB, siteUrl, rows);
    imported += count;
    details.push({ site_url: siteUrl, rows: count });
  }
  return { configured: true, start_date: start, end_date: end, imported_rows: imported, sites: details };
}

async function sendSearchConsoleWeeklyReport(env, now = new Date(), options = {}) {
  if (!hasSearchConsoleConfig(env)) {
    return { configured: false, sent: false, error: 'missing_search_console_config' };
  }
  const report = await searchConsoleWeeklyReportData(env.DB, now);
  const config = getAlertConfig(env);
  const prefix = env.ALERT_SUBJECT_PREFIX || '';
  const subject = `${prefix}[Nice Dashboard] Google search weekly summary ${report.current.start_date}..${report.current.end_date}`;
  const text = buildSearchConsoleWeeklyEmailText(report);
  const result = await sendAlertEmail(config, subject, text);
  return {
    configured: true,
    sent: true,
    recipient: config.to,
    subject,
    current: report.current,
    previous: report.previous,
    sites: report.sites.length,
    no_click: report.no_click.length,
    striking_distance: report.striking_distance.length,
    reason: options.reason || 'manual',
    result
  };
}

async function searchConsoleWeeklyReportData(db, now = new Date()) {
  await ensureSearchTermsTable({ DB: db });
  const currentEnd = dateOnly(now.getTime() - 2 * 86400000);
  const currentStart = dateOnly(Date.parse(currentEnd + 'T00:00:00Z') - (GSC_REPORT_WINDOW_DAYS - 1) * 86400000);
  const previousEnd = dateOnly(Date.parse(currentStart + 'T00:00:00Z') - 86400000);
  const previousStart = dateOnly(Date.parse(previousEnd + 'T00:00:00Z') - (GSC_REPORT_WINDOW_DAYS - 1) * 86400000);
  const currentSites = await searchConsoleSiteTotals(db, currentStart, currentEnd, 'google');
  const previousSites = await searchConsoleSiteTotals(db, previousStart, previousEnd, 'google');
  const previousBySite = new Map(previousSites.map((row) => [row.site, row]));
  const sites = currentSites.map((row) => {
    const previous = previousBySite.get(row.site) || { clicks: 0, impressions: 0 };
    return {
      ...row,
      previous_clicks: Number(previous.clicks || 0),
      previous_impressions: Number(previous.impressions || 0),
      clicks_delta: Number(row.clicks || 0) - Number(previous.clicks || 0),
      impressions_delta: Number(row.impressions || 0) - Number(previous.impressions || 0)
    };
  });
  return {
    generated_at: now.toISOString(),
    current: { start_date: currentStart, end_date: currentEnd },
    previous: { start_date: previousStart, end_date: previousEnd },
    sites,
    no_click: await searchConsoleTopRows(db, currentStart, currentEnd, 'no_click', 5, 'google'),
    striking_distance: await searchConsoleTopRows(db, currentStart, currentEnd, 'striking_distance', 5, 'google')
  };
}

async function searchConsoleSiteTotals(db, startDate, endDate, source = 'google') {
  return await all(db, `
    SELECT
      site,
      SUM(clicks) AS clicks,
      SUM(impressions) AS impressions,
      CASE WHEN SUM(impressions) > 0 THEN SUM(clicks) * 1.0 / SUM(impressions) ELSE 0 END AS ctr,
      CASE WHEN SUM(impressions) > 0 THEN SUM(position * impressions) / SUM(impressions) ELSE 0 END AS position
    FROM search_terms
    WHERE date >= ? AND date <= ? AND source = ?
    GROUP BY site
    ORDER BY impressions DESC, clicks DESC
  `, [startDate, endDate, source]);
}

async function searchConsoleTopRows(db, startDate, endDate, kind, limit = 20, source = 'google') {
  const having = kind === 'striking_distance'
    ? `HAVING SUM(impressions) > 0
         AND (SUM(position * impressions) / SUM(impressions)) >= 4
         AND (SUM(position * impressions) / SUM(impressions)) <= 15`
    : 'HAVING SUM(impressions) > 0 AND SUM(clicks) = 0';
  return await all(db, `
    SELECT
      query,
      site,
      path,
      SUM(clicks) AS clicks,
      SUM(impressions) AS impressions,
      CASE WHEN SUM(impressions) > 0 THEN SUM(clicks) * 1.0 / SUM(impressions) ELSE 0 END AS ctr,
      CASE WHEN SUM(impressions) > 0 THEN SUM(position * impressions) / SUM(impressions) ELSE 0 END AS position
    FROM search_terms
    WHERE date >= ? AND date <= ? AND source = ?
    GROUP BY query, site, path
    ${having}
    ORDER BY impressions DESC, position ASC
    LIMIT ?
  `, [startDate, endDate, source, limit]);
}

export function buildSearchConsoleWeeklyEmailText(report) {
  const siteLines = report.sites.length
    ? report.sites.map((row) => `- ${row.site}: clicks ${row.clicks} (${signed(row.clicks_delta)}), impressions ${row.impressions} (${signed(row.impressions_delta)}), CTR ${percentText(row.ctr)}, pos ${positionText(row.position)}`)
    : ['- no Search Console rows in this window'];
  const noClickLines = report.no_click.length
    ? report.no_click.map((row) => `- ${row.site} | ${row.query || '-'} | ${row.path || '-'} | imp ${row.impressions} | pos ${positionText(row.position)}`)
    : ['- none'];
  const strikingLines = report.striking_distance.length
    ? report.striking_distance.map((row) => `- ${row.site} | ${row.query || '-'} | ${row.path || '-'} | clicks ${row.clicks} | imp ${row.impressions} | pos ${positionText(row.position)}`)
    : ['- none'];
  return [
    'Google Search Console weekly summary',
    '',
    `Current: ${report.current.start_date}..${report.current.end_date}`,
    `Previous: ${report.previous.start_date}..${report.previous.end_date}`,
    '',
    'Site week-over-week',
    ...siteLines,
    '',
    'CTR opportunities: impressions without clicks Top 5',
    ...noClickLines,
    '',
    'Striking distance: ranking 4-15 Top 5',
    ...strikingLines,
    '',
    `Generated: ${report.generated_at}`
  ].join('\n');
}

function signed(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? '+' : ''}${number}`;
}

function percentText(value) {
  return `${Math.round(Number(value || 0) * 1000) / 10}%`;
}

function positionText(value) {
  const number = Number(value || 0);
  return number ? String(Math.round(number * 10) / 10) : '-';
}

function hasSearchConsoleConfig(env) {
  return Boolean(searchConsoleCredentials(env) && configuredSearchConsoleSites(env).length);
}

function hasSearchTermsConfig(env) {
  return hasSearchConsoleConfig(env) || hasBingSearchConfig(env);
}

function hasBingSearchConfig(env) {
  return Boolean(clean(env.BING_API_KEY || '', 500) && configuredBingSites(env).length);
}

function configuredSearchConsoleSites(env) {
  return clean(env.GSC_SITE_URLS || '', 5000)
    .split(',')
    .map((site) => site.trim())
    .filter(Boolean);
}

function configuredBingSites(env) {
  return clean(env.BING_SITE_URLS || DEFAULT_BING_SITE_URLS, 5000)
    .split(',')
    .map((site) => site.trim())
    .filter(Boolean);
}

function normalizeSearchTermSource(value) {
  const source = clean(value, 20).toLowerCase();
  return SEARCH_TERM_SOURCES.has(source) ? source : 'google';
}

function dateOnly(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function isJstMonday(date) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    weekday: 'short'
  }).format(date);
  return weekday === 'Mon';
}

async function googleAccessToken(env) {
  const credentials = searchConsoleCredentials(env);
  if (!credentials) throw new Error('missing_search_console_config');
  const now = Math.floor(Date.now() / 1000);
  const assertion = await signJwt(credentials.clientEmail, credentials.privateKey, {
    iss: credentials.clientEmail,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'google_token_failed');
  }
  return data.access_token;
}

export function searchConsoleCredentials(env) {
  const rawJson = clean(env.GSC_SERVICE_ACCOUNT_JSON || '', 20000);
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      const clientEmail = clean(parsed.client_email, 300);
      const privateKey = clean(parsed.private_key, 5000);
      if (clientEmail && privateKey) return { clientEmail, privateKey, source: 'GSC_SERVICE_ACCOUNT_JSON' };
    } catch (e) {
      return null;
    }
  }
  const clientEmail = clean(env.GSC_CLIENT_EMAIL || '', 300);
  const privateKey = clean(env.GSC_PRIVATE_KEY || '', 5000);
  if (clientEmail && privateKey) return { clientEmail, privateKey, source: 'split' };
  return null;
}

async function signJwt(clientEmail, privateKeyPem, claims) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64UrlJson(header);
  const encodedClaims = base64UrlJson(claims);
  const input = `${encodedHeader}.${encodedClaims}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input));
  return `${input}.${base64UrlBytes(signature)}`;
}

function base64UrlJson(value) {
  return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlBytes(bytes) {
  let binary = '';
  const array = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : new Uint8Array(bytes.buffer || bytes);
  for (const byte of array) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToArrayBuffer(pem) {
  const body = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function fetchSearchConsoleRows(token, siteUrl, startDate, endDate) {
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const rows = [];
  const rowLimit = 25000;
  for (let startRow = 0; startRow < 250000; startRow += rowLimit) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['date', 'page', 'query', 'country', 'device'],
        rowLimit,
        startRow,
        dataState: 'final'
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'search_console_query_failed');
    }
    const pageRows = data.rows || [];
    rows.push(...pageRows);
    if (pageRows.length < rowLimit) break;
  }
  return rows;
}

async function storeSearchConsoleRows(db, siteUrl, rows) {
  if (!rows.length) return 0;
  const statements = rows.map((row) => {
    const keys = row.keys || [];
    const date = clean(keys[0], 20);
    const page = clean(keys[1], 1000);
    const query = clean(keys[2], 500);
    const country = clean(keys[3], 20);
    const device = clean(keys[4], 30);
    const parsed = parsePage(siteUrl, page);
    return db.prepare(`
      INSERT INTO search_terms (
        source, date, site_url, site, page, path, query, country, device, clicks, impressions, ctr, position, imported_at
      ) VALUES ('google', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ON CONFLICT(source, date, site_url, page, query, country, device) DO UPDATE SET
        site = excluded.site,
        path = excluded.path,
        clicks = excluded.clicks,
        impressions = excluded.impressions,
        ctr = excluded.ctr,
        position = excluded.position,
        imported_at = excluded.imported_at
    `).bind(
      date,
      clean(siteUrl, 300),
      parsed.site,
      page,
      parsed.path,
      query,
      country,
      device,
      Math.round(Number(row.clicks || 0)),
      Math.round(Number(row.impressions || 0)),
      Number(row.ctr || 0),
      Number(row.position || 0)
    );
  });
  await db.batch(statements);
  return statements.length;
}

async function ensureSearchTermsTable(env) {
  const db = env.DB;
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS search_terms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        imported_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        source TEXT NOT NULL DEFAULT 'google',
        date TEXT NOT NULL,
        site_url TEXT NOT NULL,
        site TEXT NOT NULL,
        page TEXT NOT NULL DEFAULT '',
        path TEXT NOT NULL DEFAULT '',
        query TEXT NOT NULL,
        country TEXT,
        device TEXT,
        clicks INTEGER NOT NULL DEFAULT 0,
        impressions INTEGER NOT NULL DEFAULT 0,
        ctr REAL NOT NULL DEFAULT 0,
        position REAL NOT NULL DEFAULT 0,
        UNIQUE(source, date, site_url, page, query, country, device)
      )
    `),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_search_terms_source_date ON search_terms(source, date)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_search_terms_source_site_date ON search_terms(source, site, date)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_search_terms_source_path_date ON search_terms(source, path, date)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_search_terms_source_query_date ON search_terms(source, query, date)`)
  ]);
  const legacy = await first(db, `SELECT name FROM sqlite_master WHERE type='table' AND name='search_console_daily'`);
  if (!legacy) return;
  await db.prepare(`
    INSERT OR IGNORE INTO search_terms (
      source, imported_at, date, site_url, site, page, path, query, country, device,
      clicks, impressions, ctr, position
    )
    SELECT
      'google', imported_at, date, site_url, site, page, path, query, country, device,
      clicks, impressions, ctr, position
    FROM search_console_daily
  `).run();
}

async function syncBingSearchTermsRange(env) {
  await ensureSearchTermsTable(env);
  if (!hasBingSearchConfig(env)) {
    return { configured: false, imported_rows: 0, error: 'missing_BING_API_KEY' };
  }
  const end = dateOnly(Date.now());
  const start = dateOnly(Date.parse(end + 'T00:00:00Z') - (BING_SYNC_DAYS - 1) * 86400000);
  let imported = 0;
  const details = [];
  for (const siteUrl of configuredBingSites(env)) {
    const rows = await fetchBingQueryStats(env.BING_API_KEY, siteUrl, start);
    const count = await storeBingSearchRows(env.DB, siteUrl, rows);
    imported += count;
    details.push({ site_url: siteUrl, rows: count });
  }
  return { configured: true, start_date: start, end_date: end, imported_rows: imported, sites: details };
}

async function fetchBingQueryStats(apiKey, siteUrl, startDate) {
  const endpoint = new URL('https://ssl.bing.com/webmaster/api.svc/json/GetQueryStats');
  endpoint.searchParams.set('siteUrl', siteUrl);
  endpoint.searchParams.set('apikey', apiKey);
  const res = await fetch(endpoint.toString(), {
    headers: { accept: 'application/json' }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || data.Message || `bing_query_stats_http_${res.status}`);
  }
  const rows = Array.isArray(data.d) ? data.d : [];
  return rows
    .map(normalizeBingQueryRow)
    .filter((row) => row.date >= startDate);
}

function normalizeBingQueryRow(row) {
  const date = bingDateOnly(row?.Date);
  const impressions = Math.round(Number(row?.Impressions || 0));
  const clicks = Math.round(Number(row?.Clicks || 0));
  const position = Number(row?.AvgImpressionPosition || row?.AvgClickPosition || 0);
  return {
    date,
    query: clean(row?.Query, 500),
    impressions,
    clicks,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: Number.isFinite(position) ? position : 0
  };
}

function bingDateOnly(value) {
  const textValue = clean(value, 80);
  const match = /\/Date\((-?\d+)([+-]\d{4})?\)\//.exec(textValue);
  if (match) return dateOnly(Number(match[1]));
  const parsed = Date.parse(textValue);
  return Number.isNaN(parsed) ? '' : dateOnly(parsed);
}

async function storeBingSearchRows(db, siteUrl, rows) {
  const usable = rows.filter((row) => row.date && row.query);
  if (!usable.length) return 0;
  const parsed = parsePage(siteUrl, siteUrl);
  const statements = usable.map((row) => db.prepare(`
    INSERT INTO search_terms (
      source, date, site_url, site, page, path, query, country, device, clicks, impressions, ctr, position, imported_at
    ) VALUES ('bing', ?, ?, ?, '', '', ?, '', '', ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT(source, date, site_url, page, query, country, device) DO UPDATE SET
      site = excluded.site,
      clicks = excluded.clicks,
      impressions = excluded.impressions,
      ctr = excluded.ctr,
      position = excluded.position,
      imported_at = excluded.imported_at
  `).bind(
    row.date,
    clean(siteUrl, 300),
    parsed.site,
    row.query,
    row.clicks,
    row.impressions,
    row.ctr,
    row.position
  ));
  await db.batch(statements);
  return statements.length;
}

function parsePage(siteUrl, page) {
  try {
    const parsed = new URL(page);
    return { site: siteIdFromHostname(parsed.hostname), path: parsed.pathname || '/' };
  } catch (e) {
    if (siteUrl.startsWith('sc-domain:')) {
      return { site: siteIdFromHostname(siteUrl.slice('sc-domain:'.length)), path: '/' };
    }
    try {
      const fallback = new URL(siteUrl);
      return { site: siteIdFromHostname(fallback.hostname), path: '/' };
    } catch (err) {
      return { site: '', path: '/' };
    }
  }
}

function siteIdFromHostname(hostname) {
  const host = clean(hostname, 300).toLowerCase();
  return SEARCH_CONSOLE_SITE_HOSTS[host] || host;
}

function pageCheck(key, label, url, contains, options = {}) {
  return {
    key,
    label,
    url,
    method: options.method || 'GET',
    okStatuses: options.okStatuses || [200],
    contract: { type: 'text_contains', contains, case_insensitive: !!options.caseInsensitive },
    critical: options.critical !== false,
    serviceBinding: options.serviceBinding || ''
  };
}

function resourceCheck(url, okStatuses = [200]) {
  return { url, okStatuses };
}

function jsonCheck(key, label, url, okStatuses, fields, equals = {}, options = {}) {
  return {
    key,
    label,
    url,
    method: options.method || 'GET',
    body: options.body || null,
    okStatuses,
    contract: { type: 'json_fields', fields, equals },
    critical: options.critical !== false,
    serviceBinding: options.serviceBinding || ''
  };
}

function pathCheckInjectedFailure() {
  return pageCheck(
    'm0729-11-injected-failure',
    'M0729-11 injected failure',
    'https://bjt.nice.okinawa/mogi/trial/',
    'M0729-11_THIS_STRING_MUST_NOT_EXIST',
    { critical: true }
  );
}

async function ensurePathCheckTables(env) {
  const statements = [
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS path_check_runs (
        run_id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        trigger TEXT NOT NULL,
        ok INTEGER NOT NULL DEFAULT 0,
        total INTEGER NOT NULL DEFAULT 0,
        failed INTEGER NOT NULL DEFAULT 0,
        duration_ms INTEGER,
        worker_version TEXT,
        summary_json TEXT
      )
    `),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_path_check_runs_started_at ON path_check_runs(started_at)'),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS path_check_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        check_key TEXT NOT NULL,
        label TEXT NOT NULL,
        url TEXT NOT NULL,
        ok INTEGER NOT NULL DEFAULT 0,
        status INTEGER,
        expected_status TEXT,
        contract_ok INTEGER NOT NULL DEFAULT 0,
        contract_type TEXT,
        duration_ms INTEGER,
        error TEXT,
        fingerprint TEXT NOT NULL DEFAULT '',
        excerpt TEXT,
        checked_at TEXT NOT NULL,
        FOREIGN KEY (run_id) REFERENCES path_check_runs(run_id)
      )
    `),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_path_check_results_run_id ON path_check_results(run_id)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_path_check_results_key_checked ON path_check_results(check_key, checked_at)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_path_check_results_ok_checked ON path_check_results(ok, checked_at)'),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS path_check_state (
        check_key TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        url TEXT NOT NULL,
        status TEXT NOT NULL,
        fingerprint TEXT NOT NULL DEFAULT '',
        consecutive_failures INTEGER NOT NULL DEFAULT 0,
        last_ok_at TEXT,
        last_fail_at TEXT,
        last_alert_at TEXT,
        recovered_at TEXT,
        detail_json TEXT,
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )
    `),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_path_check_state_status_updated ON path_check_state(status, updated_at)'),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS path_check_heartbeat (
        name TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        started_at TEXT NOT NULL,
        finished_at TEXT NOT NULL,
        status TEXT NOT NULL,
        ok INTEGER NOT NULL DEFAULT 0,
        total INTEGER NOT NULL DEFAULT 0,
        failed INTEGER NOT NULL DEFAULT 0,
        summary_json TEXT,
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )
    `)
  ];
  await env.DB.batch(statements);
  await ensureAlertSendLogTable(env);
}

async function runPathChecks(env, reason = 'manual', options = {}) {
  await ensurePathCheckTables(env);
  const startedAt = new Date();
  const runId = `path-${startedAt.toISOString()}-${randomId().slice(0, 8)}`;
  const targets = [...PATH_CHECK_BASELINES, ...(options.extraTargets || [])];
  await env.DB.prepare(`
    INSERT INTO path_check_runs (run_id, started_at, trigger, worker_version)
    VALUES (?, ?, ?, ?)
  `).bind(runId, startedAt.toISOString(), reason, env.WORKER_VERSION || '').run();

  const results = [];
  for (const target of targets) {
    results.push(await checkPathTarget(target, env, runId));
  }
  const finishedAt = new Date();
  const failedResults = results.filter((result) => !result.ok);
  const groupFailure = isFastPathCheckFailure(failedResults, results);
  const alertCandidates = [];
  const stateUpdates = [];
  for (const result of results) {
    const state = await updatePathCheckState(env, result, finishedAt, groupFailure);
    stateUpdates.push(state);
    if (state.should_alert) alertCandidates.push({ result, state });
  }
  const alert = options.notify === false
    ? { sent: false, skipped: true, reason: 'notify_disabled', candidates: alertCandidates.length }
    : await sendPathCheckAlerts(env, alertCandidates, reason, finishedAt);

  const summary = {
    reason,
    ok: failedResults.length === 0,
    total: results.length,
    failed: failedResults.length,
    failed_keys: failedResults.map((item) => item.key),
    alert
  };
  await env.DB.prepare(`
    UPDATE path_check_runs
    SET finished_at = ?, ok = ?, total = ?, failed = ?, duration_ms = ?, summary_json = ?
    WHERE run_id = ?
  `).bind(
    finishedAt.toISOString(),
    failedResults.length === 0 ? 1 : 0,
    results.length,
    failedResults.length,
    finishedAt.getTime() - startedAt.getTime(),
    JSON.stringify(summary),
    runId
  ).run();
  await env.DB.prepare(`
    INSERT INTO path_check_heartbeat (
      name, run_id, started_at, finished_at, status, ok, total, failed, summary_json, updated_at
    )
    VALUES ('customer-path-checker', ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT(name) DO UPDATE SET
      run_id = excluded.run_id,
      started_at = excluded.started_at,
      finished_at = excluded.finished_at,
      status = excluded.status,
      ok = excluded.ok,
      total = excluded.total,
      failed = excluded.failed,
      summary_json = excluded.summary_json,
      updated_at = excluded.updated_at
  `).bind(
    runId,
    startedAt.toISOString(),
    finishedAt.toISOString(),
    failedResults.length === 0 ? 'green' : 'red',
    failedResults.length === 0 ? 1 : 0,
    results.length,
    failedResults.length,
    JSON.stringify(summary)
  ).run();

  return {
    run_id: runId,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    ok: failedResults.length === 0,
    total: results.length,
    failed: failedResults.length,
    results,
    states: stateUpdates,
    alert
  };
}

async function checkPathTarget(target, env, runId) {
  const started = Date.now();
  const checkedAt = new Date().toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), PATH_CHECK_TIMEOUT_MS);
  let status = 0;
  let text = '';
  let contract = { ok: false, error: 'not_checked' };
  let resourceResults = [];
  let error = '';
  try {
    const res = await pathFetch(target, env, controller.signal);
    status = res.status;
    text = await res.text();
    contract = checkPathContract(target.contract, text);
    if (contract.ok && Array.isArray(target.resources) && target.resources.length) {
      resourceResults = await Promise.all(target.resources.map((resource) => checkPathResource(resource, env)));
      const bad = resourceResults.find((item) => !item.ok);
      if (bad) contract = { ok: false, error: `resource_failed:${bad.url}:${bad.status || bad.error}` };
    }
  } catch (e) {
    error = clean(e.message || String(e), 300);
  } finally {
    clearTimeout(timer);
  }
  const statusOk = (target.okStatuses || [200]).includes(status);
  const ok = statusOk && contract.ok && !error;
  const failureText = ok ? '' : [
    `status:${status || 'error'} expected:${(target.okStatuses || [200]).join('/')}`,
    `contract:${contract.ok ? 'ok' : contract.error}`,
    error ? `error:${error}` : ''
  ].filter(Boolean).join('|');
  const result = {
    key: target.key,
    label: target.label,
    url: target.url,
    ok,
    status,
    expected_status: (target.okStatuses || [200]).join(','),
    contract_ok: !!contract.ok,
    contract_type: target.contract?.type || '',
    duration_ms: Date.now() - started,
    error: clean(error || contract.error || '', 300),
    fingerprint: ok ? '' : stableFingerprint(`${target.key}|${failureText}`),
    excerpt: clean(text.replace(/\s+/g, ' ').trim(), 240),
    checked_at: checkedAt,
    critical: target.critical !== false,
    resources: resourceResults
  };
  await env.DB.prepare(`
    INSERT INTO path_check_results (
      run_id, check_key, label, url, ok, status, expected_status, contract_ok,
      contract_type, duration_ms, error, fingerprint, excerpt, checked_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    runId,
    result.key,
    result.label,
    result.url,
    result.ok ? 1 : 0,
    result.status,
    result.expected_status,
    result.contract_ok ? 1 : 0,
    result.contract_type,
    result.duration_ms,
    result.error,
    result.fingerprint,
    result.excerpt,
    result.checked_at
  ).run();
  return result;
}

async function pathFetch(target, env, signal) {
  const fetcher = target.serviceBinding ? env[target.serviceBinding] : null;
  const init = {
    method: target.method || 'GET',
    headers: {
      accept: 'application/json,text/html,text/plain,*/*',
      'user-agent': 'nice-customer-path-checker/1.0'
    },
    signal,
    cf: { cacheTtl: 0, cacheEverything: false }
  };
  if (target.body) {
    init.headers['content-type'] = 'application/json';
    init.body = JSON.stringify(target.body);
  }
  const request = new Request(target.url, init);
  return fetcher ? fetcher.fetch(request) : fetch(request);
}

async function checkPathResource(resource, env) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), PATH_CHECK_TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await pathFetch({
      url: resource.url,
      method: 'GET',
      okStatuses: resource.okStatuses || [200]
    }, env, controller.signal);
    await res.body?.cancel?.();
    const ok = (resource.okStatuses || [200]).includes(res.status);
    return { url: resource.url, ok, status: res.status, duration_ms: Date.now() - started };
  } catch (e) {
    return {
      url: resource.url,
      ok: false,
      status: 0,
      duration_ms: Date.now() - started,
      error: clean(e.message || String(e), 200)
    };
  } finally {
    clearTimeout(timer);
  }
}

function checkPathContract(contract, text) {
  if (!contract) return { ok: true };
  if (contract.type === 'text_contains') {
    const needle = String(contract.contains || '');
    const haystack = contract.case_insensitive ? String(text || '').toLowerCase() : String(text || '');
    const match = contract.case_insensitive ? needle.toLowerCase() : needle;
    return haystack.includes(match)
      ? { ok: true }
      : { ok: false, error: `missing_text:${needle.slice(0, 80)}` };
  }
  if (contract.type === 'json_fields') {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { ok: false, error: 'bad_json' };
    }
    for (const field of contract.fields || []) {
      if (!hasJsonPath(data, field)) return { ok: false, error: `missing_field:${field}` };
    }
    for (const [field, expected] of Object.entries(contract.equals || {})) {
      const actual = getJsonPath(data, field);
      if (actual !== expected) return { ok: false, error: `field_mismatch:${field}` };
    }
    return { ok: true };
  }
  return { ok: false, error: `unknown_contract:${contract.type}` };
}

function hasJsonPath(data, path) {
  return getJsonPath(data, path) !== undefined;
}

function getJsonPath(data, path) {
  return String(path || '').split('.').reduce((current, part) => {
    if (current === undefined || current === null) return undefined;
    return current[part];
  }, data);
}

function isFastPathCheckFailure(failedResults, results) {
  if (!failedResults.length) return false;
  if (failedResults.length >= 2) return true;
  const only = failedResults[0];
  if (!only) return false;
  if (only.status >= 500 || only.status === 0) return true;
  const failedRatio = results.length ? failedResults.length / results.length : 0;
  return failedRatio >= 0.25;
}

async function updatePathCheckState(env, result, now, groupFailure) {
  const previous = await first(env.DB, `
    SELECT check_key, status, fingerprint, consecutive_failures, last_ok_at, last_fail_at, last_alert_at
    FROM path_check_state
    WHERE check_key = ?
  `, [result.key]);
  const nowIso = now.toISOString();
  let consecutiveFailures = 0;
  let status = 'green';
  let shouldAlert = false;
  const threshold = groupFailure ? PATH_CHECK_FAST_FAILURE_DEBOUNCE : PATH_CHECK_FAILURE_DEBOUNCE;
  if (!result.ok) {
    status = 'red';
    consecutiveFailures = previous?.fingerprint === result.fingerprint
      ? Number(previous.consecutive_failures || 0) + 1
      : 1;
    shouldAlert = shouldSendPathCheckAlert({
      result,
      previous,
      consecutiveFailures,
      threshold,
      now
    });
    await env.DB.prepare(`
      INSERT INTO path_check_state (
        check_key, label, url, status, fingerprint, consecutive_failures,
        last_ok_at, last_fail_at, last_alert_at, recovered_at, detail_json, updated_at
      )
      VALUES (?, ?, ?, 'red', ?, ?, NULL, ?, NULL, NULL, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ON CONFLICT(check_key) DO UPDATE SET
        label = excluded.label,
        url = excluded.url,
        status = excluded.status,
        fingerprint = excluded.fingerprint,
        consecutive_failures = excluded.consecutive_failures,
        last_fail_at = excluded.last_fail_at,
        detail_json = excluded.detail_json,
        updated_at = excluded.updated_at
    `).bind(
      result.key,
      result.label,
      result.url,
      result.fingerprint,
      consecutiveFailures,
      nowIso,
      JSON.stringify({ result, threshold, group_failure: groupFailure })
    ).run();
  } else {
    const recovered = previous?.status === 'red';
    await env.DB.prepare(`
      INSERT INTO path_check_state (
        check_key, label, url, status, fingerprint, consecutive_failures,
        last_ok_at, last_fail_at, last_alert_at, recovered_at, detail_json, updated_at
      )
      VALUES (?, ?, ?, 'green', '', 0, ?, NULL, NULL, NULL, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ON CONFLICT(check_key) DO UPDATE SET
        label = excluded.label,
        url = excluded.url,
        status = excluded.status,
        fingerprint = excluded.fingerprint,
        consecutive_failures = 0,
        last_ok_at = excluded.last_ok_at,
        recovered_at = CASE WHEN path_check_state.status = 'red' THEN excluded.last_ok_at ELSE path_check_state.recovered_at END,
        detail_json = excluded.detail_json,
        updated_at = excluded.updated_at
    `).bind(
      result.key,
      result.label,
      result.url,
      nowIso,
      JSON.stringify({ result, recovered })
    ).run();
  }
  return {
    check_key: result.key,
    status,
    fingerprint: result.fingerprint,
    consecutive_failures: consecutiveFailures,
    threshold,
    should_alert: shouldAlert
  };
}

function shouldSendPathCheckAlert({ result, previous, consecutiveFailures, threshold, now }) {
  if (result.critical === false || consecutiveFailures < threshold) return false;
  const sameFingerprint = previous?.fingerprint === result.fingerprint;
  const lastAlertMs = parseTimeMs(previous?.last_alert_at);
  if (!sameFingerprint || !lastAlertMs) return true;
  if (now.getTime() - lastAlertMs < PATH_CHECK_ALERT_ESCALATION_MS) return false;
  const lastOkMs = parseTimeMs(previous?.last_ok_at);
  const estimatedFailureMs = Math.max(0, Number(consecutiveFailures || 0) - 1) * PATH_CHECK_INTERVAL_MS;
  const sinceLastOkMs = lastOkMs ? Math.max(0, now.getTime() - lastOkMs) : 0;
  const continuousFailureMs = Math.max(estimatedFailureMs, sinceLastOkMs);
  return continuousFailureMs >= PATH_CHECK_ALERT_ESCALATION_MS;
}

function parseTimeMs(value) {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

async function sendPathCheckAlerts(env, candidates, reason, now) {
  if (!candidates.length) return { sent: false, candidates: 0 };
  const sent = [];
  const skipped = [];
  for (const candidate of candidates) {
    const { result, state } = candidate;
    const lock = await claimAlertSend(env, {
      key: `path-check:${result.key}`,
      status: 'red',
      fingerprint: result.fingerprint,
      reason,
      detail: JSON.stringify({ result, state })
    }, PATH_CHECK_ALERT_WINDOW_MS);
    if (!lock.acquired) {
      skipped.push({ key: result.key, reason: 'dedup_window', fingerprint: result.fingerprint });
      continue;
    }
    const alert = await trySendPathCheckAlert(env, candidate, reason, now);
    await finishAlertSend(env, lock.id, alert);
    if (alert.ok) {
      await env.DB.prepare(`
        UPDATE path_check_state
        SET last_alert_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE check_key = ?
      `).bind(result.key).run();
    }
    sent.push({ key: result.key, ok: alert.ok, error: alert.error || '' });
  }
  return { sent: sent.some((item) => item.ok), candidates: candidates.length, sent_items: sent, skipped };
}

async function trySendPathCheckAlert(env, candidate, reason, now) {
  try {
    const result = await sendPathCheckAlert(env, candidate, reason, now);
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error: clean(error.message || String(error), 300) };
  }
}

async function sendPathCheckAlert(env, candidate, reason, now) {
  const config = getAlertConfig(env);
  const prefix = env.ALERT_SUBJECT_PREFIX || '';
  const { result, state } = candidate;
  const subject = `${prefix}[Nice Path Check] ALERT: ${result.label}`;
  const text = [
    'Nice customer path check found a failing path.',
    '',
    `Path: ${result.label}`,
    `URL: ${result.url}`,
    `Status: ${result.status}`,
    `Expected status: ${result.expected_status}`,
    `Contract: ${result.contract_type}`,
    `Contract ok: ${result.contract_ok ? 'yes' : 'no'}`,
    `Error: ${result.error || '-'}`,
    `Consecutive failures: ${state.consecutive_failures}/${state.threshold}`,
    `Fingerprint: ${result.fingerprint}`,
    `Reason: ${reason}`,
    `Time: ${now.toISOString()}`,
    '',
    `Excerpt: ${result.excerpt || '-'}`
  ].join('\n');
  return sendAlertEmail(config, subject, text);
}

async function sendPathCheckTestAlert(env) {
  const config = getAlertConfig(env);
  const prefix = env.ALERT_SUBJECT_PREFIX || '';
  const subject = `${prefix}[Nice Path Check] TEST: alert channel`;
  const text = [
    'Nice customer path checker test email.',
    '',
    'This message verifies the Resend alert channel for customer path checks.',
    'It is not a dashboard self-check and it is not a recovery/green report.',
    '',
    `Time: ${new Date().toISOString()}`
  ].join('\n');
  const result = await sendAlertEmail(config, subject, text);
  return { sent: true, to: config.to, result };
}

async function getPathCheckStatus(env) {
  await ensurePathCheckTables(env);
  const heartbeat = await first(env.DB, `
    SELECT name, run_id, started_at, finished_at, status, ok, total, failed, summary_json, updated_at
    FROM path_check_heartbeat
    WHERE name = 'customer-path-checker'
  `);
  const states = await all(env.DB, `
    SELECT check_key, label, url, status, fingerprint, consecutive_failures,
           last_ok_at, last_fail_at, last_alert_at, recovered_at, updated_at
    FROM path_check_state
    ORDER BY status DESC, label
  `);
  const recentRuns = await all(env.DB, `
    SELECT run_id, started_at, finished_at, trigger, ok, total, failed, duration_ms
    FROM path_check_runs
    ORDER BY started_at DESC
    LIMIT 5
  `);
  return { heartbeat, states, recent_runs: recentRuns, baseline_count: PATH_CHECK_BASELINES.length };
}

function stableFingerprint(value) {
  let hash = 0x811c9dc5;
  const input = String(value || '');
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function randomId() {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }
}

function isPreviewEnv(env) {
  return String(env.ALERT_SUBJECT_PREFIX || '').includes('[TEST]')
    || String(env.DASHBOARD_ORIGIN || '').includes('db-t0705-12');
}

function pathCheckAlertsEnabled(env) {
  return String(env.PATH_CHECK_ALERTS_ENABLED || '') === '1';
}

function dashboardAlertsEnabled(env) {
  return String(env.DASHBOARD_ALERTS_ENABLED || '') === '1';
}

const PROBE_TARGETS = [
  {
    key: 'bjt-member',
    label: 'BJT /api/member',
    url: 'https://bjt-worker.gerheidicn.workers.dev/api/member',
    okStatuses: [200, 401, 403],
    authHeader: 'Bearer probe',
    serviceBinding: 'BJT_API'
  },
  {
    key: 'progress-session',
    label: 'Progress /api/session',
    url: 'https://api.progress.nice.okinawa/api/session',
    okStatuses: [200, 401, 403]
  },
  {
    key: 'analytics-health',
    label: 'Analytics /health',
    url: 'https://nice-analytics.gerheidicn.workers.dev/health',
    okStatuses: [200],
    serviceBinding: 'ANALYTICS_API'
  }
];

const DEPLOYMENT_REPOS = ['db', 'bjt', 'progress', 'kiso'];

async function controlDashboard(request, env) {
  if (!requireDashboard(request, env)) {
    return json({ ok: false, error: 'unauthorized' }, request, 403);
  }

  const [backups, deployments, probes, revenue] = await Promise.all([
    getBackupStatus(env),
    getDeploymentStatus(env),
    getProbeSummary(env),
    getRevenueSummary(env)
  ]);

  return json({
    ok: true,
    generated_at: new Date().toISOString(),
    backups,
    deployments,
    probes,
    revenue
  }, request);
}

async function ensureProbeTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS probe_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      target TEXT NOT NULL,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      ok INTEGER NOT NULL DEFAULT 0,
      status INTEGER,
      duration_ms INTEGER,
      error TEXT,
      reason TEXT
    )
  `).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_probe_results_checked_at ON probe_results(checked_at)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_probe_results_target_checked ON probe_results(target, checked_at)').run();
}

async function runProbes(env, reason = 'cron') {
  await ensureProbeTable(env);
  const checkedAt = new Date().toISOString();
  const results = await Promise.all(PROBE_TARGETS.map((target) => probeTarget(target, env)));
  if (results.length) {
    await env.DB.batch(results.map((result) => env.DB.prepare(`
      INSERT INTO probe_results (checked_at, target, label, url, ok, status, duration_ms, error, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      checkedAt,
      result.target,
      result.label,
      result.url,
      result.ok ? 1 : 0,
      result.status,
      result.duration_ms,
      result.error || '',
      reason
    )));
  }
  return { checked_at: checkedAt, results };
}

async function probeTarget(target, env) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), 12000);
  try {
    const fetcher = target.serviceBinding ? env[target.serviceBinding] : null;
    const probeRequest = new Request(target.url, {
      method: 'GET',
      headers: {
        accept: 'application/json,text/plain,*/*',
        'user-agent': 'nice-analytics-probe/1.0',
        ...(target.authHeader ? { authorization: target.authHeader } : {})
      },
      signal: controller.signal,
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    const res = fetcher ? await fetcher.fetch(probeRequest) : await fetch(probeRequest);
    const status = res.status;
    await res.body?.cancel?.();
    return {
      target: target.key,
      label: target.label,
      url: target.url,
      ok: target.okStatuses.includes(status),
      status,
      duration_ms: Date.now() - started,
      error: ''
    };
  } catch (e) {
    return {
      target: target.key,
      label: target.label,
      url: target.url,
      ok: false,
      status: 0,
      duration_ms: Date.now() - started,
      error: clean(e.message || String(e), 300)
    };
  } finally {
    clearTimeout(timer);
  }
}

async function getProbeSummary(env) {
  await ensureProbeTable(env);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const rows = await all(env.DB, `
    SELECT id, target, label, url, ok, status, duration_ms, error, checked_at
    FROM probe_results
    WHERE checked_at >= ?
    ORDER BY checked_at DESC, id DESC
  `, [since]);
  const byTarget = new Map(PROBE_TARGETS.map((target) => [target.key, {
    target: target.key,
    label: target.label,
    url: target.url,
    total: 0,
    ok_count: 0,
    latest: null,
    hourly: []
  }]));
  for (const row of rows) {
    if (!byTarget.has(row.target)) {
      byTarget.set(row.target, {
        target: row.target,
        label: row.label,
        url: row.url,
        total: 0,
        ok_count: 0,
        latest: null,
        hourly: []
      });
    }
    const item = byTarget.get(row.target);
    item.total += 1;
    if (Number(row.ok)) item.ok_count += 1;
    const point = {
      checked_at: row.checked_at,
      ok: Boolean(row.ok),
      status: row.status,
      duration_ms: row.duration_ms,
      error: row.error || ''
    };
    if (!item.latest) item.latest = point;
    item.hourly.push(point);
  }
  return {
    generated_at: new Date().toISOString(),
    window_hours: 24,
    targets: Array.from(byTarget.values()).map((item) => ({
      ...item,
      ok: item.latest ? item.latest.ok : false,
      ok_rate: item.total ? item.ok_count / item.total : 0,
      hourly: item.hourly.slice(0, 24).reverse()
    }))
  };
}

async function getBackupStatus(env) {
  const now = new Date();
  const [bjt, progressProduction, progressPreview, niceAnalyticsProduction, bjtHistory, progressHistory, niceAnalyticsIndex] = await Promise.all([
    readR2Json(env.BJT_BACKUPS, 'kv-snapshots/latest/manifest.json'),
    readR2JsonFallback(env.PROGRESS_BACKUP, ['d1/latest/manifest.json', 'd1/progress/production/latest.json']),
    readR2Json(env.PROGRESS_BACKUP, 'd1/progress/preview/latest.json'),
    readR2Json(env.PROGRESS_BACKUP, 'd1/nice_analytics/production/latest.json'),
    readDailyBackupHistory(env.BJT_BACKUPS, 'kv-snapshots', now),
    readDailyBackupHistory(env.PROGRESS_BACKUP, 'd1/daily', now),
    readR2Json(env.PROGRESS_BACKUP, 'd1/nice_analytics/production/index.json')
  ]);
  const niceAnalyticsHistory = backupHistoryFromIndex(niceAnalyticsIndex, now);
  const bjtItem = attachBackupHistory(backupItem('bjt', 'BJT R2 latest manifest', bjt, ['generatedAt', 'generated_at', 'created_at', 'date'], now, {
    maxAgeHours: BJT_BACKUP_MAX_AGE_HOURS
  }), bjtHistory);
  const progressItem = attachBackupHistory(progressBackupItem('progress-production', 'Progress production D1 export', progressProduction, 'production', 'progress', now), progressHistory);
  const previewItem = progressBackupItem('progress-preview', 'Progress preview D1 export', progressPreview, 'preview', 'progress-otp-preview', now);
  const niceItem = attachBackupHistory(d1BackupItem('nice-analytics-production', 'nice_analytics production D1 export', niceAnalyticsProduction, 'production', 'nice_analytics', 'd1/nice_analytics/production/', now), niceAnalyticsHistory);
  return {
    generated_at: now.toISOString(),
    items: [
      bjtItem,
      progressItem,
      previewItem,
      niceItem
    ]
  };
}

async function readR2JsonFallback(bucket, keys) {
  for (const key of keys) {
    const result = await readR2Json(bucket, key);
    if (result.ok) return result;
  }
  return readR2Json(bucket, keys[0] || '');
}

async function readDailyBackupHistory(bucket, prefix, now, days = 7) {
  const entries = [];
  for (let offset = 0; offset < days; offset += 1) {
    const date = shiftDateKey(jstDateKey(now), -offset);
    const result = await readR2Json(bucket, `${prefix}/${date}/manifest.json`);
    const data = result.data || {};
    const ok = result.ok && data.status === 'complete' && !(data.failures || []).length;
    entries.push({
      date,
      ok,
      status: result.ok ? (data.status || result.status) : result.status,
      latest_at: firstDateValue(data, ['generated_at', 'generatedAt', 'created_at', 'date']) || result.updated_at || '',
      error: result.error || (ok ? '' : (data.failures || []).map((item) => `${item.stage || 'backup'}: ${item.error || ''}`).join('; '))
    });
  }
  return entries;
}

export function backupHistoryFromIndex(result, now, days = 7) {
  const today = jstDateKey(now);
  if (!today) {
    const rows = [];
    rows.skipped = 0;
    rows.status = 'unknown';
    return rows;
  }
  if (!result?.ok) {
    const rows = unknownBackupHistory(today, days, result?.error || 'backup history index unavailable');
    rows.skipped = 0;
    return rows;
  }
  const backups = Array.isArray(result?.data?.backups) ? result.data.backups : [];
  const byDate = new Map();
  let skipped = 0;
  for (const item of backups) {
    const date = jstDateKey(item.generated_at || item.created_at || '');
    if (!date) {
      skipped += 1;
      continue;
    }
    if (!byDate.has(date)) byDate.set(date, item);
  }
  if (!byDate.size) {
    const rows = unknownBackupHistory(today, days, backups.length ? 'backup history has no valid timestamps' : 'backup history is empty');
    rows.skipped = skipped;
    return rows;
  }
  const rows = Array.from({ length: days }, (_, offset) => {
    const date = shiftDateKey(today, -offset);
    const item = byDate.get(date);
    return {
      date,
      ok: Boolean(item),
      status: item ? 'complete' : 'missing',
      latest_at: item?.generated_at || '',
      error: item ? '' : 'no successful manifest for date'
    };
  });
  rows.skipped = skipped;
  return rows;
}

function unknownBackupHistory(today, days, error) {
  return Array.from({ length: days }, (_, offset) => ({
    date: shiftDateKey(today, -offset),
    ok: false,
    status: 'unknown',
    latest_at: '',
    error
  }));
}

export function attachBackupHistory(item, history, now = new Date()) {
  const rows = Array.isArray(history) ? history : [];
  const successful = rows.filter((row) => row.ok).length;
  let consecutiveFailures = 0;
  if (!item.ok) {
    for (const row of rows) {
      if (row.ok) break;
      consecutiveFailures += 1;
    }
  }
  const latestFailure = item.ok ? null : rows.find((row) => !row.ok);
  const today = jstDateKey(now);
  const silentToday = !item.ok && rows[0]?.date === today && !rows[0]?.ok && jstHour(now) >= 12;
  return {
    ...item,
    ...(silentToday ? {
      ok: false,
      status: 'silent',
      error: rows[0]?.error || 'no successful backup artifact by JST 12:00'
    } : {}),
    history_7d: rows,
    success_days_7d: successful,
    success_rate_7d: rows.length ? successful / rows.length : null,
    history_skipped: Number(rows.skipped || 0),
    last_success_at: rows.find((row) => row.ok)?.latest_at || (item.ok ? item.latest_at : ''),
    consecutive_failures: consecutiveFailures,
    failure_date: latestFailure?.date || '',
    failure_stage: failureStage(latestFailure?.error || '')
  };
}

function failureStage(error) {
  const match = /^([^:;]+):/.exec(String(error || ''));
  return match?.[1] || '';
}

function shiftDateKey(value, delta) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(delta || 0));
  return date.toISOString().slice(0, 10);
}

const R2_JSON_READ_ATTEMPTS = 3;

export async function readR2Json(bucket, key) {
  if (!bucket) return { ok: false, status: 'manual', key, error: 'missing_r2_binding' };
  let lastError = '';
  for (let attempt = 1; attempt <= R2_JSON_READ_ATTEMPTS; attempt += 1) {
    try {
      const object = await bucket.get(key);
      if (!object) return { ok: false, status: 'missing', key, error: 'not_found' };
      const text = await object.text();
      return {
        ok: true,
        status: 'ok',
        key,
        updated_at: object.uploaded ? object.uploaded.toISOString() : '',
        data: JSON.parse(text),
        attempts: attempt
      };
    } catch (e) {
      lastError = clean(e.message || String(e), 300);
      if (attempt >= R2_JSON_READ_ATTEMPTS || !isTransientR2ReadError(lastError)) break;
      await sleep(100 * attempt);
    }
  }
  return { ok: false, status: 'error', key, error: lastError };
}

function isTransientR2ReadError(error) {
  return /\\b10001\\b|internal error|try again|temporar/i.test(String(error || ''));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DAILY_BACKUP_MAX_AGE_HOURS = 27;
const BJT_BACKUP_MAX_AGE_HOURS = 51;

function backupAge(dateValue, now, maxAgeHours) {
  const parsed = parseDateSafe(dateValue);
  if (!parsed) return { ageMs: Number.POSITIVE_INFINITY, fresh: false };
  const ageMs = now.getTime() - parsed.getTime();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  return { ageMs, fresh: ageMs >= 0 && ageMs <= maxAgeMs };
}

export function backupItem(key, label, result, dateFields, now = new Date(), options = {}) {
  const maxAgeHours = options.maxAgeHours || DAILY_BACKUP_MAX_AGE_HOURS;
  const data = result.data || {};
  const dateValue = firstDateValue(data, dateFields) || result.updated_at || '';
  const { ageMs, fresh: ageFresh } = backupAge(dateValue, now, maxAgeHours);
  const fresh = result.ok && ageFresh;
  return {
    key,
    label,
    object_key: result.key,
    status: fresh ? result.status : (result.ok ? 'stale' : result.status),
    ok: fresh,
    latest_at: dateValue,
    max_age_hours: maxAgeHours,
    age_hours: Number.isFinite(ageMs) ? Math.round(ageMs / 36000) / 100 : null,
    error: result.error || (!fresh && result.ok ? `latest manifest is outside ${maxAgeHours}h freshness window: ${dateValue || '<missing>'}` : ''),
    source: 'R2'
  };
}

export function progressBackupItem(key, label, result, expectedEnvironment, expectedDatabase, now = new Date()) {
  if (result?.ok && result.data?.kind === 'progress-d1-r2-daily-backup') {
    return dailyD1BackupItem(key, label, result, now);
  }
  return d1BackupItem(key, label, result, expectedEnvironment, expectedDatabase, `d1/progress/${expectedEnvironment}/`, now);
}

export function dailyD1BackupItem(key, label, result, now = new Date()) {
  const data = result.data || {};
  const dateValue = firstDateValue(data, ['generated_at', 'generatedAt', 'created_at', 'date']) || result.updated_at || '';
  const { ageMs, fresh: ageFresh } = backupAge(dateValue, now, DAILY_BACKUP_MAX_AGE_HOURS);
  const complete = data.status === 'complete' && !(data.failures || []).length;
  const fresh = result.ok && complete && ageFresh;
  const failureDetail = (data.failures || []).map((item) => `${item.stage || 'backup'}: ${item.error || ''}`).join('; ');
  return {
    key,
    label,
    environment: 'production',
    database: data.database?.name || data.database || 'progress',
    object_key: result.key,
    backup_object_key: data.objects?.sql || '',
    status: fresh ? 'ok' : (result.ok ? (complete ? 'stale' : (data.status || 'failed')) : result.status),
    ok: fresh,
    latest_at: dateValue,
    max_age_hours: DAILY_BACKUP_MAX_AGE_HOURS,
    age_hours: Number.isFinite(ageMs) ? Math.round(ageMs / 36000) / 100 : null,
    error: result.error || failureDetail || (!fresh && result.ok ? `latest manifest is older than ${DAILY_BACKUP_MAX_AGE_HOURS}h: ${dateValue || '<missing>'}` : ''),
    source: 'R2'
  };
}

export function d1BackupItem(key, label, result, expectedEnvironment, expectedDatabase, expectedPrefix, now = new Date()) {
  const data = result.data || {};
  const dateValue = firstDateValue(data, ['generated_at', 'generatedAt', 'created_at', 'date']) || result.updated_at || '';
  const { ageMs, fresh: ageFresh } = backupAge(dateValue, now, DAILY_BACKUP_MAX_AGE_HOURS);
  let validationError = '';
  if (result.ok && data.environment !== expectedEnvironment) {
    validationError = `manifest environment mismatch: expected ${expectedEnvironment}, got ${data.environment || '<missing>'}`;
  } else if (result.ok && data.database !== expectedDatabase) {
    validationError = `manifest database mismatch: expected ${expectedDatabase}, got ${data.database || '<missing>'}`;
  } else if (result.ok && !String(data.object_key || '').startsWith(expectedPrefix)) {
    validationError = `manifest object key crosses environment boundary: ${data.object_key || '<missing>'}`;
  }
  const fresh = result.ok && ageFresh;
  const ok = fresh && !validationError;
  return {
    key,
    label,
    environment: expectedEnvironment,
    database: expectedDatabase,
    object_key: result.key,
    backup_object_key: data.object_key || '',
    status: ok ? 'ok' : (validationError ? 'environment_mismatch' : (result.ok ? 'stale' : result.status)),
    ok,
    latest_at: dateValue,
    max_age_hours: DAILY_BACKUP_MAX_AGE_HOURS,
    age_hours: Number.isFinite(ageMs) ? Math.round(ageMs / 36000) / 100 : null,
    error: result.error || validationError || (!fresh && result.ok ? `latest manifest is older than 27h: ${dateValue || '<missing>'}` : ''),
    source: 'R2'
  };
}

function firstDateValue(data, fields) {
  for (const field of fields) {
    if (data[field]) return String(data[field]);
  }
  if (data.manifest && typeof data.manifest === 'object') {
    return firstDateValue(data.manifest, fields);
  }
  return '';
}

async function getDeploymentStatus(env) {
  const items = await Promise.all(DEPLOYMENT_REPOS.map((repo) => getRepoDeploymentStatus(env, repo)));
  return {
    generated_at: new Date().toISOString(),
    source: 'GitHub Actions latest main non-scheduled non-backup workflow run',
    items
  };
}

async function getRepoDeploymentStatus(env, repo) {
  const token = env.GITHUB_TOKEN || '';
  if (!token) {
    return {
      repo,
      ok: false,
      status: 'manual',
      conclusion: '',
      updated_at: '',
      url: '',
      error: 'missing_GITHUB_TOKEN',
      manual: true,
      note: '未配 token'
    };
  }
  const url = `https://api.github.com/repos/wanjiaoben/${repo}/actions/runs?branch=main&per_page=10`;
  const headers = {
    accept: 'application/vnd.github+json',
    'user-agent': 'nice-analytics-dashboard',
    'x-github-api-version': '2022-11-28'
  };
  headers.authorization = `Bearer ${token}`;
  try {
    const res = await fetch(url, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        repo,
        ok: false,
        status: 'unknown',
        conclusion: '',
        updated_at: '',
        url: '',
        error: data.message || `github_http_${res.status}`,
        manual: !token
      };
    }
    const run = selectDeploymentWorkflowRun(data.workflow_runs || []);
    return deploymentWorkflowStatus(repo, run, new Date());
  } catch (e) {
    return {
      repo,
      ok: false,
      status: 'error',
      conclusion: '',
      updated_at: '',
      url: '',
      error: clean(e.message || String(e), 300),
      manual: false
    };
  }
}

export function selectDeploymentWorkflowRun(runs) {
  return (runs || []).find((item) => item.head_branch === 'main' && isDeploymentStatusRun(item)) || null;
}

export function deploymentWorkflowStatus(repo, run, now = new Date()) {
  if (!run) {
    return {
      repo,
      ok: false,
      status: 'no_data',
      conclusion: '',
      updated_at: '',
      url: '',
      error: '',
      manual: true,
      note: '无数据'
    };
  }

  const status = run.status || '';
  const conclusion = run.conclusion || status || '';
  const startedAt = run.run_started_at || run.created_at || run.updated_at || '';
  const updatedAt = run.updated_at || startedAt;
  const startedMs = Date.parse(startedAt);
  const ageMs = Number.isFinite(startedMs) ? Math.max(0, now.getTime() - startedMs) : 0;
  const inProgress = status && status !== 'completed';
  const inProgressTimedOut = inProgress && ageMs > DEPLOYMENT_IN_PROGRESS_ALERT_MS;
  const completedFailure = status === 'completed' && conclusion === 'failure';

  return {
    repo,
    ok: completedFailure || inProgressTimedOut ? false : true,
    status,
    conclusion,
    workflow: run.name || '',
    updated_at: updatedAt,
    url: run.html_url || '',
    error: inProgressTimedOut ? 'deployment_in_progress_timeout' : (completedFailure ? 'deployment_failed' : ''),
    manual: false,
    note: inProgress && !inProgressTimedOut ? '部署进行中' : '',
    alert: completedFailure || inProgressTimedOut,
    age_minutes: inProgress && Number.isFinite(ageMs) ? Math.round(ageMs / 60000) : null
  };
}

function isDeploymentStatusRun(run) {
  const name = String(run?.name || run?.display_title || '').toLowerCase();
  const event = String(run?.event || '').toLowerCase();
  if (event === 'schedule') return false;
  if (name.includes('backup')) return false;
  return true;
}

async function getRevenueSummary(env) {
  const [progress, bjt] = await Promise.all([
    getProgressRevenue(env),
    getBjtRevenue(env)
  ]);
  return {
    generated_at: new Date().toISOString(),
    currency: 'JPY',
    items: [progress, bjt]
  };
}

async function getProgressRevenue(env) {
  const token = env.PROGRESS_ADMIN_TOKEN || '';
  if (!token) return manualRevenueItem('progress', 'missing_PROGRESS_ADMIN_TOKEN', 'https://api.progress.nice.okinawa/api/admin/stats');
  const data = await fetchJsonWithBearer('https://api.progress.nice.okinawa/api/admin/stats', token);
  if (!data.ok) return { ...manualRevenueItem('progress', data.error, data.url), ok: false };
  const stats = data.data || {};
  const orders = Array.isArray(stats.orders) ? stats.orders : Array.isArray(stats.recentOrders) ? stats.recentOrders : [];
  const totals = aggregateOrders(orders);
  return {
    site: 'progress',
    ok: true,
    source: '/api/admin/stats',
    today_amount: numberFrom(stats.today_amount ?? stats.todayRevenue ?? stats.ordersTodayAmount ?? totals.today_amount),
    month_amount: numberFrom(stats.month_amount ?? stats.monthRevenue ?? stats.ordersMonthAmount ?? totals.month_amount),
    users_total: numberFrom(stats.users_total ?? stats.totalUsers ?? stats.users?.total ?? stats.accounts?.length),
    manual: orders.length === 0 && stats.today_amount == null && stats.month_amount == null,
    note: orders.length === 0 && stats.today_amount == null && stats.month_amount == null
      ? 'admin stats returned no order revenue fields'
      : ''
  };
}

async function getBjtRevenue(env) {
  const token = env.BJT_ADMIN_TOKEN || '';
  if (!token) return manualRevenueItem('bjt', 'missing_BJT_ADMIN_TOKEN', 'https://bjt-worker.gerheidicn.workers.dev/api/admin/service-orders');
  const data = await fetchJsonWithBearer('https://bjt-worker.gerheidicn.workers.dev/api/admin/service-orders', token);
  if (!data.ok) return { ...manualRevenueItem('bjt', data.error, data.url), ok: false };
  const orders = Array.isArray(data.data?.orders) ? data.data.orders : [];
  const totals = aggregateOrders(orders);
  return {
    site: 'bjt',
    ok: true,
    source: '/api/admin/service-orders',
    today_amount: totals.today_amount,
    month_amount: totals.month_amount,
    users_total: null,
    orders_total: orders.length,
    manual: false,
    note: ''
  };
}

function manualRevenueItem(site, note, source) {
  return {
    site,
    ok: false,
    source,
    today_amount: null,
    month_amount: null,
    users_total: null,
    orders_total: null,
    manual: true,
    note
  };
}

async function fetchJsonWithBearer(url, token) {
  try {
    const res = await fetch(url, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
        'user-agent': 'nice-analytics-dashboard'
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, url, error: data.error || `http_${res.status}` };
    return { ok: true, url, data };
  } catch (e) {
    return { ok: false, url, error: clean(e.message || String(e), 300) };
  }
}

function aggregateOrders(orders) {
  const now = new Date();
  const todayKey = jstDateKey(now);
  const monthKey = todayKey.slice(0, 7);
  let todayAmount = 0;
  let monthAmount = 0;
  for (const order of orders || []) {
    if (!order || order.source === 'cctest' || order.email === 'cctest@nice.okinawa') continue;
    const paidAt = order.paid_at || order.paidAt || order.created_at || order.createdAt || order.sort_at || '';
    const day = jstDateKey(parseDateSafe(paidAt));
    if (!day) continue;
    const amount = numberFrom(order.amount);
    if (day === todayKey) todayAmount += amount;
    if (day.slice(0, 7) === monthKey) monthAmount += amount;
  }
  return { today_amount: todayAmount, month_amount: monthAmount };
}

function numberFrom(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function parseDateSafe(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function jstDateKey(date) {
  if (!date) return '';
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(parsed);
}

async function ensureAlertTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS alert_state (
      key TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      fingerprint TEXT NOT NULL DEFAULT '',
      detail TEXT,
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      notified_at TEXT
    )
  `).run();
}

async function ensureAlertSendLogTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS alert_send_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL,
      status TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      window_start TEXT NOT NULL,
      reason TEXT,
      detail TEXT,
      claimed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      sent_at TEXT,
      ok INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      result TEXT
    )
  `).run();
  await env.DB.prepare(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_alert_send_log_unique_window
    ON alert_send_log(key, status, fingerprint, window_start)
  `).run();
  await env.DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_alert_send_log_key_claimed
    ON alert_send_log(key, claimed_at)
  `).run();
}

async function ensureAlertSelfCheckTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS alert_channel_self_checks (
      month_key TEXT PRIMARY KEY,
      scheduled_at TEXT NOT NULL,
      sent_at TEXT,
      ok INTEGER NOT NULL DEFAULT 0,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      error TEXT,
      result TEXT,
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `).run();
}

async function evaluateDashboardAlerts(env, reason = 'cron', options = {}) {
  await ensureAlertTable(env);
  await ensureAlertSendLogTable(env);
  const [backups, deployments, probes] = await Promise.all([
    getBackupStatus(env),
    getDeploymentStatus(env),
    getProbeSummary(env)
  ]);
  const redItems = collectAlertItems(backups, deployments, probes);
  const status = redItems.length ? 'red' : 'green';
  const fingerprint = redItems.map((item) => item.fingerprint || `${item.type}:${item.key}`).sort().join('|');
  const key = 'dashboard-control';
  const previous = await first(env.DB, 'SELECT key, status, fingerprint FROM alert_state WHERE key = ?', [key]);
  const shouldNotify = status === 'red'
    && (!previous || previous.status !== status || previous.fingerprint !== fingerprint);
  const generatedAt = new Date().toISOString();
  let sendLock = null;
  let alert = null;

  if (shouldNotify && options.notify !== false) {
    sendLock = await claimAlertSend(env, {
      key,
      status,
      fingerprint,
      reason,
      detail: JSON.stringify({ reason, generated_at: generatedAt, red_items: redItems })
    });
    if (sendLock.acquired) {
      alert = await trySendDashboardAlert(env, status, redItems);
      await finishAlertSend(env, sendLock.id, alert);
    }
  }

  const sendHistory = await alertSendHistory(env, key);
  const detail = buildAlertDetail({
    reason,
    generatedAt,
    redItems,
    sendLock,
    sendHistory
  });
  await upsertAlertState(env, key, status, fingerprint, detail, !!sendLock?.acquired);
  return {
    status,
    previous_status: previous?.status || null,
    sent: !!alert?.ok,
    notify_enabled: options.notify !== false,
    alert,
    red_items: redItems,
    send_lock: sendLock
  };
}

async function trySendDashboardAlert(env, status, redItems) {
  try {
    const result = await sendDashboardAlert(env, status, redItems);
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error: clean(error.message || String(error), 300) };
  }
}

async function sendManualTestAlert(env, options = {}) {
  const item = {
    type: 'manual',
    key: 'health_alert_channel_test',
    label: 'Health alert channel test',
    status: 'test',
    detail: 'Manual test alert from db dashboard admin endpoint.',
    latest_at: new Date().toISOString()
  };
  if (options.dryRun) {
    const preview = buildAlertEmailPreview(env, 'red', [item]);
    return { sent: false, dry_run: true, ...withTestAlertSubject(preview) };
  }
  const preview = withTestAlertSubject(buildAlertEmailPreview(env, 'red', [item]));
  const config = getAlertConfig(env);
  const result = await sendAlertEmail(config, preview.subject, preview.text);
  return { sent: true, to: config.to, subject: preview.subject, result };
}

function withTestAlertSubject(preview) {
  const subject = String(preview.subject || '');
  return {
    ...preview,
    subject: subject.startsWith('[TEST]') ? subject : `[TEST] ${subject}`
  };
}

async function sendMonthlyAlertChannelSelfCheck(env, scheduledAt, reason = MONTHLY_ALERT_SELF_CHECK_CRON, options = {}) {
  await ensureAlertSelfCheckTable(env);
  const monthKey = jstMonthKey(scheduledAt);
  const previous = await first(env.DB, 'SELECT ok, sent_at FROM alert_channel_self_checks WHERE month_key = ?', [monthKey]);
  if (Number(previous?.ok || 0) === 1 && !options.force) {
    return { skipped: true, month_key: monthKey, sent_at: previous.sent_at };
  }

  const recipient = getAlertRecipient(env);
  const prefix = env.ALERT_SUBJECT_PREFIX || '';
  const subject = `${prefix}[Nice Dashboard] 通道自检 ${monthKey}`;
  const scheduledIso = scheduledAt.toISOString();
  await env.DB.prepare(`
    INSERT INTO alert_channel_self_checks (
      month_key, scheduled_at, sent_at, ok, recipient, subject, error, result, updated_at
    )
    VALUES (?, ?, NULL, 1, ?, ?, '', ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT(month_key) DO UPDATE SET
      scheduled_at = excluded.scheduled_at,
      sent_at = excluded.sent_at,
      ok = excluded.ok,
      recipient = excluded.recipient,
      subject = excluded.subject,
      error = excluded.error,
      result = excluded.result,
      updated_at = excluded.updated_at
  `).bind(
    monthKey,
    scheduledIso,
    recipient,
    subject,
    JSON.stringify({ no_email: true, reason: 'green self-check disabled by Wan 2026-07-29' })
  ).run();
  return { sent: false, recorded: true, month_key: monthKey, to: recipient };
}

export function collectAlertItems(backups, deployments, probes) {
  const items = [];
  for (const item of backups?.items || []) {
    if (!item.ok && !item.manual) {
      const failureDate = item.failure_date || jstDateKey(new Date());
      const consecutiveFailures = Number(item.consecutive_failures || 0);
      const silent = item.status === 'silent' || (jstHour(new Date()) >= 12 && item.success_rate_7d < 1 && item.failure_date === jstDateKey(new Date()));
      items.push({
        type: 'backup',
        key: item.key || item.label || 'backup',
        label: item.label || item.key || 'Backup',
        status: silent ? 'silent' : (item.status || 'red'),
        alert_kind: silent ? 'silent' : (consecutiveFailures >= 2 ? 'escalation' : 'failure'),
        detail: item.error || item.latest_at || item.object_key || '',
        latest_at: item.latest_at || '',
        failure_date: failureDate,
        failure_stage: item.failure_stage || 'backup',
        consecutive_failures: consecutiveFailures,
        fingerprint: `backup:${item.key || item.label}:${failureDate}:${silent ? 'silent' : consecutiveFailures}`
      });
    }
  }
  for (const item of deployments?.items || []) {
    if (item.alert === true || (!item.ok && !item.manual && item.alert !== false)) {
      items.push({
        type: 'deployment',
        key: item.repo || 'repo',
        label: item.repo || 'Deployment',
        status: item.conclusion || item.status || 'red',
        detail: item.error || item.updated_at || item.url || '',
        latest_at: item.updated_at || ''
      });
    }
  }
  for (const item of probes?.targets || []) {
    if (!item.ok) {
      items.push({
        type: 'probe',
        key: item.target || item.label || 'probe',
        label: item.label || item.target || 'Probe',
        status: item.latest?.status || 'missing',
        detail: item.latest?.error || item.url || '',
        latest_at: item.latest?.checked_at || ''
      });
    }
  }
  return items;
}

function jstHour(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo', hour: '2-digit', hour12: false
  }).formatToParts(date);
  return Number(parts.find((part) => part.type === 'hour')?.value || 0);
}

async function upsertAlertState(env, key, status, fingerprint, detail, notified) {
  await env.DB.prepare(`
    INSERT INTO alert_state (key, status, fingerprint, detail, updated_at, notified_at)
    VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), ${notified ? "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')" : 'NULL'})
    ON CONFLICT(key) DO UPDATE SET
      status = excluded.status,
      fingerprint = excluded.fingerprint,
      detail = excluded.detail,
      updated_at = excluded.updated_at,
      notified_at = COALESCE(excluded.notified_at, alert_state.notified_at)
  `).bind(key, status, fingerprint, detail).run();
}

function d1ChangedRows(result) {
  return Number(result?.meta?.changes || result?.changes || 0);
}

async function claimAlertSend(env, { key, status, fingerprint, reason, detail }, windowMs) {
  const windowStart = alertSendWindowStart(new Date(), windowMs);
  const claimed = await env.DB.prepare(`
    INSERT INTO alert_send_log (key, status, fingerprint, window_start, reason, detail)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(key, status, fingerprint, window_start) DO NOTHING
  `).bind(key, status, fingerprint, windowStart, reason, detail).run();
  const acquired = d1ChangedRows(claimed) > 0;
  return {
    acquired,
    id: acquired ? Number(claimed?.meta?.last_row_id || claimed?.lastRowId || 0) : null,
    status,
    fingerprint,
    window_start: windowStart,
    reason
  };
}

async function finishAlertSend(env, id, alert) {
  if (!id) return;
  await env.DB.prepare(`
    UPDATE alert_send_log
    SET sent_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
        ok = ?,
        error = ?,
        result = ?
    WHERE id = ?
  `).bind(
    alert?.ok ? 1 : 0,
    alert?.error || '',
    JSON.stringify(alert?.result || null),
    id
  ).run();
}

function alertSendWindowStart(date, windowMs = 5 * 60 * 1000) {
  return new Date(Math.floor(date.getTime() / windowMs) * windowMs).toISOString();
}

async function alertSendHistory(env, key) {
  return await all(env.DB, `
    SELECT id, status, fingerprint, window_start, reason, claimed_at, sent_at, ok, error
    FROM alert_send_log
    WHERE key = ?
    ORDER BY claimed_at DESC, id DESC
    LIMIT 5
  `, [key]);
}

function buildAlertDetail({ reason, generatedAt, redItems, sendLock, sendHistory }) {
  return JSON.stringify({
    reason,
    generated_at: generatedAt,
    red_items: redItems,
    send_lock: sendLock ? {
      acquired: !!sendLock.acquired,
      id: sendLock.id || null,
      status: sendLock.status,
      fingerprint: sendLock.fingerprint,
      window_start: sendLock.window_start,
      reason: sendLock.reason
    } : null,
    send_history: (sendHistory || []).map((item) => ({
      id: item.id,
      status: item.status,
      fingerprint: item.fingerprint,
      window_start: item.window_start,
      reason: item.reason || '',
      claimed_at: item.claimed_at,
      sent_at: item.sent_at || '',
      ok: Boolean(item.ok),
      error: item.error || ''
    }))
  });
}

async function sendDashboardAlert(env, status, redItems) {
  const preview = buildAlertEmailPreview(env, status, redItems);
  const config = getAlertConfig(env);
  return sendAlertEmail(config, preview.subject, preview.text);
}

export function buildAlertEmailPreview(env, status, redItems) {
  const prefix = env.ALERT_SUBJECT_PREFIX || '';
  const backupItem = redItems.find((item) => item.type === 'backup');
  const subject = status === 'red' && backupItem?.alert_kind === 'silent'
    ? `${prefix}[P0] Backup silent: ${backupItem.key} ${backupItem.failure_date} (no artifact by JST 12:00)`
    : status === 'red' && backupItem?.alert_kind === 'escalation'
      ? `${prefix}[P0] Backup failure: ${backupItem.key} ${backupItem.failure_date} ${backupItem.failure_stage || 'backup'} (day ${backupItem.consecutive_failures})`
      : status === 'red' && backupItem
        ? `${prefix}Backup failure: ${backupItem.key} ${backupItem.failure_date} ${backupItem.failure_stage || 'backup'}`
        : status === 'red'
    ? `${prefix}[Nice Dashboard] ALERT: ${redItems.length} red item(s)`
    : `${prefix}[Nice Dashboard] RECOVERY: all monitored items green`;
  const text = status === 'red'
    ? [
      'Nice dashboard alert: one or more monitored items are red.',
      '',
      ...redItems.map((item) => [
        `- ${item.type}/${item.label}`,
        `  status: ${item.status || 'red'}`,
        ...(item.type === 'backup' ? [
          `  failure_date: ${item.failure_date || '-'}`,
          `  failure_stage: ${item.failure_stage || '-'}`,
          `  consecutive_failures: ${item.consecutive_failures || 0}`
        ] : []),
        `  latest_at: ${item.latest_at || '-'}`,
        `  detail: ${item.detail || '-'}`,
      ].join('\n')),
      '',
      `Time: ${new Date().toISOString()}`
    ].join('\n')
    : [
      'Nice dashboard recovery: backups, deployments, and probes are all green.',
      '',
      `Time: ${new Date().toISOString()}`
    ].join('\n');

  return { subject, text, recipient: getAlertRecipient(env) };
}

async function sendAlertEmail(config, subject, text) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: config.from,
      to: [config.to],
      subject,
      text
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `resend_http_${res.status}`);
  }
  return data;
}

function getAlertConfig(env) {
  const apiKey = env.RESEND_API_KEY || '';
  const to = getAlertRecipient(env);
  const from = env.ALERT_FROM_EMAIL || '';
  if (!apiKey) throw new Error('missing_RESEND_API_KEY');
  if (!from) throw new Error('missing_ALERT_FROM_EMAIL');
  return { apiKey, to, from };
}

function getAlertRecipient(env) {
  const recipients = parseAlertRecipients(env.ALERT_RECIPIENTS || '');
  if (!recipients.length) throw new Error('missing_ALERT_RECIPIENTS');
  if (recipients.length !== 1) throw new Error('invalid_ALERT_RECIPIENTS_count');
  return recipients[0];
}

function parseAlertRecipients(value) {
  return String(value || '')
    .split(',')
    .map((item) => normalizeEmailForAlert(item))
    .filter(Boolean);
}

function normalizeEmailForAlert(value) {
  return String(value || '').trim().toLowerCase();
}

function jstMonthKey(date) {
  if (!date) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit'
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || '0000';
  const month = parts.find((part) => part.type === 'month')?.value || '00';
  return `${year}-${month}`;
}

export {
  BEACON_SCRIPT,
  PATH_CHECK_BASELINES,
  bingDateOnly,
  configuredSearchConsoleSites,
  configuredBingSites,
  checkPathContract,
  isFastPathCheckFailure,
  normalizeBingQueryRow,
  normalizeSearchTermSource,
  parsePage,
  shouldSendPathCheckAlert,
  stableFingerprint
};
