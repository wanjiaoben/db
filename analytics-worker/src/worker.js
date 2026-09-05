import expiriesConfig from '../expiries.json' with { type: 'json' };
import auditHumanDataPlan from '../audit-human-data-plan.json' with { type: 'json' };

const COLLECT_ORIGIN = 'https://translation.nice.okinawa';
const DASHBOARD_ORIGIN = 'https://db.nice.okinawa';
const MONTHLY_ALERT_SELF_CHECK_CRON = '0 0 1 * *';
const PATH_CHECK_CRON = '*/15 * * * *';
const PATH_CHECK_PREVIEW_INJECT_CRON = '11 29 7 29 *';
const PATH_CHECK_PREVIEW_TEST_EMAIL_CRON = '12 29 7 29 *';
const GSC_DAILY_SYNC_CRON = '0 0 * * *';
const CONFIG_SNAPSHOT_CRON = '7 0 * * *';
const AUDIT_HUMAN_METRICS_CRON = '0 0 1 * *';
const GSC_DEFAULT_SYNC_DAYS = 28;
const GSC_REPORT_WINDOW_DAYS = 7;
const BING_SYNC_DAYS = 7;
const SEARCH_TERM_SOURCES = new Set(['google', 'bing', 'all']);
const DEFAULT_BING_SITE_URLS = 'https://bjt.nice.okinawa/,https://kiso.nice.okinawa/,https://snorkel.nice.okinawa/,https://progress.nice.okinawa/,https://nice.okinawa/,https://translation.nice.okinawa/';
const VISITOR_EVENT_PATH = '/events';
const VISITOR_DASHBOARD_PATH = '/visitors';
const DAILY_BRIEF_SAMPLE_PATH = '/daily-brief/sample';
const DAILY_BRIEF_RECIPIENT = 'aboutokinawa@gmail.com';
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
const CONFIG_SNAPSHOT_SOURCE = 'cloudflare-github-config';
const CONFIG_SNAPSHOT_ALERT_KEY = 'config-snapshot';
const CONFIG_SNAPSHOT_ALERT_WINDOW_MS = 24 * 60 * 60 * 1000;
const AUDIT_HUMAN_METRICS_SOURCE = 'audit-human-data-plan';
const AUDIT_HUMAN_METRICS_ARTIFACT_KEY_PREFIX = 'audit/human-metrics/';
const BJT_ORDER_META_PREFIX = 'paypal_order_meta:';
const AUDIT_PAID_ORDER_STATUSES = new Set(['captured', 'completed']);
const EXPIRY_KIND_ALLOWLIST = new Set(['domain', 'token', 'cert', 'subscription']);
const EXPIRY_WARNING_DAYS = 30;
const EXPIRY_RED_DAYS = 7;
const CLOUDFLARE_CONFIG_ENDPOINTS = Object.freeze([
  { key: 'cf.account', path: (accountId) => `/accounts/${accountId}` },
  { key: 'cf.access_apps', path: (accountId) => `/accounts/${accountId}/access/apps` },
  { key: 'cf.access_service_tokens', path: (accountId) => `/accounts/${accountId}/access/service_tokens` },
  { key: 'cf.pages_projects', path: (accountId) => `/accounts/${accountId}/pages/projects` },
  { key: 'cf.workers_scripts', path: (accountId) => `/accounts/${accountId}/workers/scripts` },
  { key: 'cf.workers.nice-analytics.secrets', path: (accountId) => `/accounts/${accountId}/workers/scripts/nice-analytics/secrets` },
  { key: 'cf.workers.nice-analytics.schedules', path: (accountId) => `/accounts/${accountId}/workers/scripts/nice-analytics/schedules` },
  { key: 'cf.workers.db-private.secrets', path: (accountId) => `/accounts/${accountId}/workers/scripts/db-private/secrets` },
  { key: 'cf.workers.db-private.schedules', path: (accountId) => `/accounts/${accountId}/workers/scripts/db-private/schedules` }
]);
const CLOUDFLARE_ZONE_CONFIG_ENDPOINTS = Object.freeze([
  { key: 'cf.workers_routes', path: (zoneId) => `/zones/${zoneId}/workers/routes` }
]);
const GITHUB_CONFIG_REPOS = Object.freeze(['db', 'bjt', 'progress', 'kiso']);
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
const BEACON_SCRIPT = `(function(){try{var d=document,w=window,s=d.currentScript||d.querySelector('script[data-site][src*="beacon.js"]'),site=((s&&s.dataset&&s.dataset.site)||'').toLowerCase();if(!site)return;var ep='https://analytics.nice.okinawa/events',vk='nice_analytics_visitor_id',sk='nice_analytics_session_id',ftk='nice_ft',st=Date.now(),last=st,done=0,timer=0,seen=new Set;function rid(){try{return crypto.randomUUID()}catch(e){return Date.now().toString(36)+Math.random().toString(36).slice(2)}}function id(store,key){try{var v=store.getItem(key);if(v)return v;v=rid();store.setItem(key,v);return v}catch(e){return rid()}}var vid=id(localStorage,vk),sid=id(sessionStorage,sk);function ui(){try{return w.NICE_UI_LANG||w.SITE_UI_LANG||d.documentElement.lang||''}catch(e){return''}}function dev(){var ua=(navigator.userAgent||'').toLowerCase();return /ipad|tablet/.test(ua)?'tablet':(/mobile|iphone|android/.test(ua)?'mobile':'desktop')}function land(){try{var q=new URLSearchParams(location.search),o=new URLSearchParams;['utm_source','utm_medium','utm_campaign'].forEach(function(k){var v=q.get(k);if(v)o.set(k,v)});var x=o.toString();return location.pathname+(x?'?'+x:'')}catch(e){return location.pathname||'/'}}function ft(){try{var n=Date.now(),raw=localStorage.getItem(ftk),o=raw&&JSON.parse(raw);if(o&&n-Date.parse(o.first_seen)<2592e6)return o;var q=new URLSearchParams(location.search),u={utm_source:q.get('utm_source')||'',utm_medium:q.get('utm_medium')||'',utm_campaign:q.get('utm_campaign')||''};o={visitor_id:vid,ref_host:(d.referrer?new URL(d.referrer).hostname:''),landing:location.pathname,utm:u,first_seen:new Date().toISOString(),ui_lang:ui()};var j=JSON.stringify(o);localStorage.setItem(ftk,j);d.cookie=ftk+'='+encodeURIComponent(j)+';path=/;max-age=2592000;SameSite=Lax';return o}catch(e){return{}}}ft();function base(type){return{site_id:site,event_type:type,visitor_id:vid,session_id:sid,ts:new Date().toISOString(),landing_url:land(),referrer:d.referrer||'',ui_lang:ui(),browser_lang:navigator.language||''}}function send(type,extra,beacon){try{var p=base(type);if(extra)for(var k in extra)p[k]=extra[k];var body=JSON.stringify(p);if(beacon&&navigator.sendBeacon){try{if(navigator.sendBeacon(ep,new Blob([body],{type:'text/plain'})))return}catch(e){}}fetch(ep,{method:'POST',headers:{'content-type':beacon?'text/plain':'application/json'},body:body,keepalive:!!beacon,mode:'cors'}).catch(function(){})}catch(e){}}function touch(){last=Date.now();arm()}function arm(){try{clearTimeout(timer);timer=setTimeout(dwell,1800000)}catch(e){}}function dwell(){try{if(done)return;done=1;send('dwell',{dwell_ms:Math.min(Date.now()-st,1800000)},1)}catch(e){}}function chan(el){try{var c=(el.getAttribute('data-contact')||'').toLowerCase();if(c)return c.replace(/[^a-z_]/g,'').slice(0,40);var h=(el.getAttribute('href')||'').toLowerCase();if(h.indexOf('mailto:')===0)return'email';if(h.indexOf('tel:')===0)return'phone';if(h.indexOf('wa.me/')>-1||h.indexOf('whatsapp')>-1)return'whatsapp';if(h.indexOf('line.me')>-1)return'line';if(h.indexOf('weixin')>-1||h.indexOf('wechat')>-1)return'wechat'}catch(e){}return''}send('pageview',{device_type:dev(),viewport_width:w.innerWidth||0});arm();['pointerdown','keydown','scroll','touchstart'].forEach(function(e){try{addEventListener(e,touch,{passive:true})}catch(x){}});d.addEventListener('click',function(ev){try{var el=ev.target.closest&&ev.target.closest('[data-contact],a[href]');if(!el)return;var c=chan(el);if(c)send('contact_click',{contact_channel:c},0)}catch(e){}},true);try{if('IntersectionObserver'in w){var ob=new IntersectionObserver(function(es){es.forEach(function(en){try{var id=en.target.id;if(en.isIntersecting&&id&&!seen.has(id)){seen.add(id);send('section_view',{section_id:id},0)}}catch(e){}})},{threshold:.55});d.querySelectorAll('section[id],header[id],main[id]').forEach(function(el){ob.observe(el)})}}catch(e){}d.addEventListener('visibilitychange',function(){if(d.visibilityState==='hidden')dwell()});addEventListener('pagehide',dwell)}catch(e){}})();`;
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

    if (url.pathname === DAILY_BRIEF_SAMPLE_PATH && (request.method === 'GET' || request.method === 'POST')) {
      if (!requireDashboard(request, env)) return json({ ok: false, error: 'unauthorized' }, request, 403);
      try {
        const report = await buildDailyBossBrief(env, new Date());
        if (request.method === 'GET' || url.searchParams.get('dry_run') === '1') {
          return json({ ok: true, sent: false, ...report }, request);
        }
        const config = getAlertConfig({ ...env, ALERT_RECIPIENTS: DAILY_BRIEF_RECIPIENT });
        const subject = buildDailyBriefSubject(report, true);
        const result = await sendAlertEmail(config, subject, renderDailyBossBrief(report));
        return json({ ok: true, sent: true, to: config.to, subject, result, report }, request);
      } catch (error) {
        return json({ ok: false, error: clean(error.message || String(error), 300) }, request, 502);
      }
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

    if (url.pathname === '/config-snapshot/run' && request.method === 'POST') {
      if (!requireDashboard(request, env)) {
        return json({ ok: false, error: 'unauthorized' }, request, 403);
      }
      const result = await runConfigSnapshot(env, 'manual', { notify: url.searchParams.get('notify') === '1' });
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

    if (url.pathname === '/audit/human-metrics' && request.method === 'GET') {
      return auditHumanMetrics(request, env);
    }

    if (url.pathname === '/audit/human-metrics/run' && request.method === 'POST') {
      return runAuditHumanMetricsEndpoint(request, env);
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
  const requestedDays = Number(url.searchParams.get('days') || 28);
  const days = VISITOR_DASHBOARD_DAY_OPTIONS.has(requestedDays) ? requestedDays : 28;
  const since = new Date(Date.now() - days * 86400000).toISOString();

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
    visitorRows
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
        COALESCE(e.referrer_host, 'direct') AS referrer_host,
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
      ORDER BY g.last_seen_at DESC
      LIMIT 160
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

async function visitorSourceRank(db, since) {
  return all(db, `
    WITH base AS (
      SELECT
        site_id,
        visitor_id,
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
    visitor_sources AS (
      SELECT
        site_id,
        visitor_id,
        COALESCE(MAX(CASE WHEN rn = 1 THEN referrer_host END), 'direct') AS value
      FROM (
        SELECT DISTINCT site_id, visitor_id, NULL AS referrer_host, NULL AS rn FROM base
        UNION ALL
        SELECT site_id, visitor_id, referrer_host, rn FROM external_touch
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
  if (cron === CONFIG_SNAPSHOT_CRON) {
    try {
      await runConfigSnapshot(env, cron, { notify: dashboardAlertsEnabled(env) });
    } catch (e) {
      errors.push(`config-snapshot:${e.message}`);
    }
  }
  if (cron === AUDIT_HUMAN_METRICS_CRON) {
    try {
      await runAuditHumanMetrics(env, { month: previousJstMonthKey(scheduledAt), reason: cron });
    } catch (e) {
      errors.push(`audit-human-metrics:${e.message}`);
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
    source_rank AS (
      SELECT site_id AS site, ${pathExpr} AS path, COALESCE(NULLIF(referrer_host, ''), 'direct') AS source, COUNT(*) AS views,
        ROW_NUMBER() OVER (PARTITION BY site_id, ${pathExpr} ORDER BY COUNT(*) DESC) AS rn
      FROM visitor_events
      WHERE created_at >= ?${filterClause} AND event_type='pageview'
      GROUP BY site_id, ${pathExpr}, COALESCE(NULLIF(referrer_host, ''), 'direct')
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

export function jstWindow(ms = Date.now()) {
  const end = new Date(ms);
  return { start: jstDayStartIso(ms), end };
}

export function classifyDailyBriefSource(referrer, utmSource = '') {
  const value = `${String(referrer || '')} ${String(utmSource || '')}`.toLowerCase();
  if (!value.trim()) return 'Direct';
  if (/google\./.test(value)) return 'Google';
  if (/\b(bing|msn)\./.test(value) || /\bbing\b/.test(value)) return 'Bing';
  if (/chatgpt|openai|perplexity|claude|anthropic|gemini|copilot|you\.com/.test(value)) return 'AI';
  if (/instagram|facebook|tiktok|youtube|twitter|x\.com|linkedin|line\.me|threads|pinterest/.test(value)) return 'SNS';
  if (/^https?:\/\/(?:www\.)?nice\.okinawa(?:\/|$)/.test(String(referrer || '').toLowerCase())) return 'Direct';
  return 'Other';
}

export function dailyBriefLamp(signals) {
  const known = (signals || []).filter((signal) => signal !== null && signal !== undefined);
  if (!known.length) return { color: 'ei', icon: '—', label: '数据暂不可用' };
  if (known.some((signal) => signal === false || signal === 'red')) return { color: 'red', icon: '🔴', label: '红' };
  if (known.some((signal) => signal === 'yellow' || signal === 'stale')) return { color: 'yellow', icon: '🟡', label: '黄' };
  if (known.some((signal) => signal === 'ei')) return { color: 'ei', icon: '—', label: '数据暂不可用' };
  return { color: 'green', icon: '🟢', label: '绿' };
}

function dailyBriefUnavailable(source, error = 'data_unavailable') {
  return { available: false, value: null, status: 'EI', source, latest_available_date: '', error: clean(error, 180) };
}

async function dailyBriefSource(label, loader) {
  try {
    const value = await loader();
    if (value?.available === false) return value;
    return { available: true, value, status: 'OK', source: label, latest_available_date: '' };
  }
  catch (error) { return dailyBriefUnavailable(label, error.message || String(error)); }
}

async function loadDailyBriefVisitors(env, window) {
  const rows = await all(env.DB, `
    SELECT referrer_host, utm_source, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
    FROM visitor_events
    WHERE created_at >= ? AND created_at < ? AND event_type = 'pageview'
    GROUP BY referrer_host, utm_source
  `, [window.start, window.end.toISOString()]);
  const bySource = Object.fromEntries(['Google', 'AI', 'Bing', 'SNS', 'Direct', 'Other'].map((key) => [key, { views: 0, visitors: 0, raw_referrers: [] }]));
  for (const row of rows) {
    const category = classifyDailyBriefSource(row.referrer_host, row.utm_source);
    bySource[category].views += Number(row.views || 0);
    bySource[category].visitors += Number(row.visitors || 0);
    if (row.referrer_host) bySource[category].raw_referrers.push(row.referrer_host);
  }
  const totals = await first(env.DB, `
    SELECT COUNT(*) AS pageviews, COUNT(DISTINCT visitor_id) AS visitors, COUNT(DISTINCT session_id) AS sessions
    FROM visitor_events WHERE created_at >= ? AND created_at < ? AND event_type = 'pageview'
  `, [window.start, window.end.toISOString()]);
  return { totals: { pageviews: Number(totals?.pageviews || 0), visitors: Number(totals?.visitors || 0), sessions: Number(totals?.sessions || 0) }, by_source: bySource };
}

async function loadDailyBriefReview(env) {
  const url = env.REVIEW_TASK_API_URL || '';
  if (!url) return dailyBriefUnavailable('Review task API', 'missing_REVIEW_TASK_API_URL');
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`review_api_http_${response.status}`);
  const data = await response.json();
  const rows = Array.isArray(data) ? data : (data.tasks || data.items || []);
  const groups = {};
  for (const row of rows) {
    const group = clean(row.business_group || row.group || row.category || 'Other', 80) || 'Other';
    groups[group] = (groups[group] || 0) + 1;
  }
  return { pending: rows.length, groups, entry: env.REVIEW_TASK_URL || 'https://db.nice.okinawa/review' };
}

async function loadDailyBriefSeo(env, pathStatus) {
  let gsc = new Map();
  try {
    await ensureSearchTermsTable(env);
    const rows = await all(env.DB, `SELECT site, MAX(date) AS latest_available_date FROM search_terms WHERE source = 'google' GROUP BY site`);
    gsc = new Map(rows.map((row) => [row.site, row.latest_available_date]));
  } catch (_) { /* hard gate: each site remains EI */ }
  const pathRows = new Map((pathStatus?.states || []).map((row) => [row.check_key, row]));
  return Object.entries(VISITOR_EVENT_SITES).map(([site, host]) => {
    const path = pathRows.get(`site-${site}-home`);
    const pathSignal = path ? (path.status === 'ok') : null;
    return {
      site, host, seo: dailyBriefLamp([pathSignal, gsc.has(site) ? true : 'ei']),
      geo: dailyBriefLamp([pathSignal]),
      signals: { robots: '—', sitemap: '—', canonical: '—', not_found_404: '—', schema: '—', gsc_latest_available_date: gsc.get(site) || '—' },
      note: '仅报告可观察信号；未编排名'
    };
  });
}

async function buildDailyBossBrief(env, now = new Date()) {
  const window = jstWindow(now.getTime());
  const [visitors, review, paths, backups, alerts, seo] = await Promise.all([
    dailyBriefSource('visitor_events / attribution', () => loadDailyBriefVisitors(env, window)),
    dailyBriefSource('Review task API', () => loadDailyBriefReview(env)),
    dailyBriefSource('customer-paths', () => getPathCheckStatus(env)),
    dailyBriefSource('backup', () => getBackupStatus(env)),
    dailyBriefSource('alert_state', async () => all(env.DB, 'SELECT key, status, detail, updated_at FROM alert_state WHERE status = \'red\'')),
    dailyBriefSource('Search Console sync', async () => loadDailyBriefSeo(env, await getPathCheckStatus(env)))
  ]);
  const visitorValue = visitors.available ? visitors.value : null;
  const redAlerts = alerts.available ? alerts.value : [];
  const pathStates = paths.available ? paths.value.states : [];
  const backupItems = backups.available ? backups.value.items : [];
  const pathFor = (site) => pathStates.find((row) => row.check_key === `site-${site}-home`);
  const backupFor = (key) => backupItems.find((row) => row.key === key);
  const businessHealth = [
    { name: 'BJT', lamp: dailyBriefLamp([pathFor('bjt')?.status === 'ok' ? true : pathFor('bjt') ? false : null, backupFor('bjt')?.ok ?? null]) },
    { name: 'KISO', lamp: dailyBriefLamp([pathFor('kiso')?.status === 'ok' ? true : pathFor('kiso') ? false : null]) },
    { name: 'Progress', lamp: dailyBriefLamp([pathFor('progress')?.status === 'ok' ? true : pathFor('progress') ? false : null, backupFor('progress-production')?.ok ?? null]) }
  ];
  const systemRed = redAlerts.length + businessHealth.filter((item) => item.lamp.color === 'red').length;
  const headline = systemRed ? '🔴 有系统红项，先处理阻断项' : (review.value?.pending ? '🟡 有待审核事项，建议今日处理' : '🟢 今日暂无紧急阻断');
  const reviewCount = review.available ? review.value.pending : null;
  return { generated_at: now.toISOString(), window: { timezone: 'Asia/Tokyo', start: window.start, end: window.end.toISOString() }, headline, review_count: reviewCount, system_red: systemRed, visitors: visitorValue, review, system: { red_items: redAlerts, business_health: businessHealth }, seo: seo.available ? seo.value : Object.entries(VISITOR_EVENT_SITES).map(([site, host]) => ({ site, host, seo: dailyBriefLamp([]), geo: dailyBriefLamp([]), signals: { robots: '—', sitemap: '—', canonical: '—', not_found_404: '—', schema: '—', gsc_latest_available_date: '—' } })), sns: dailyBriefUnavailable('SNS queue', 'no_existing_sns_queue_source'), top_actions: redAlerts.slice(0, 3).map((item) => item.detail || item.key).concat(review.value?.pending ? ['打开审核台处理待审核项'] : []).slice(0, 3), sources: { visitors, review, customer_paths: paths, backup: backups, alert_state: alerts, search_console: seo } };
}

export function buildDailyBriefSubject(report, sample = false) {
  const date = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', month: '2-digit', day: '2-digit' }).format(new Date(report.generated_at));
  const review = report.review_count === null ? '—' : report.review_count;
  const red = report.system_red === null || report.system_red === undefined ? '—' : report.system_red;
  const visitors = report.visitors?.totals?.visitors ?? '—';
  return `${sample ? '【SAMPLE｜Nice Okinawa Daily】' : '【Nice Okinawa Daily】'}${date}｜待审核${review}｜系统${red}红｜今日访客${visitors}`;
}

export function renderDailyBossBrief(report) {
  const lines = [
    report.headline, '', `窗口：${report.window.start} → ${report.window.end}（JST）`,
    `待我处理：${report.review_count ?? '—'}${report.review_count === null ? '（EI / 数据暂不可用）' : ''}`,
    `系统处理中：${report.system?.business_health?.map((item) => `${item.name}${item.lamp.icon}`).join(' / ') || '—'}`,
    `系统红项：${report.system_red || 0}`, '', '今日访客', `访客：${report.visitors?.totals?.visitors ?? '—'}｜会话：${report.visitors?.totals?.sessions ?? '—'}｜PV：${report.visitors?.totals?.pageviews ?? '—'}`,
    '来源占比（底层保留真实 referrer；证据不足归 Direct/Unknown）', ...Object.entries(report.visitors?.by_source || {}).map(([key, value]) => `- ${key}：${value.views || 0}`), '',
    'Review 摘要（业务分组仅显示数量）', ...(report.review.available ? Object.entries(report.review.value.groups).map(([key, value]) => `- ${key}：${value}`) : ['- —（EI / 数据暂不可用）']), report.review.available ? `审核台：${report.review.value.entry}` : '', '',
    '营业健康', ...report.system.business_health.map((item) => `- ${item.lamp.icon} ${item.name}`), '', '全站 SEO/GEO', ...report.seo.map((site) => `- ${site.site}（${site.host}）：SEO ${site.seo.icon}｜GEO ${site.geo.icon}｜GSC latest_available_date ${site.signals.gsc_latest_available_date}`), '',
    'SNS 队列六指标', '- 排队：—｜可发布：—｜已排程：—｜已发布：—｜失败：—｜过期：—（EI / 数据暂不可用）', '', '今日值得做（最多 3 件）', ...(report.top_actions.length ? report.top_actions.map((item) => `- ${item}`) : ['- 暂无']), '', '数据不可用项按 — / EI 展示；单项缺失不阻断日报。', `生成：${report.generated_at}`
  ];
  return lines.filter((line, index) => !(line === '' && lines[index - 1] === '')).join('\n');
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

  const [backups, deployments, probes, revenue, configSnapshot, expiries, auditHumanMetrics] = await Promise.all([
    getBackupStatus(env),
    getDeploymentStatus(env),
    getProbeSummary(env),
    getRevenueSummary(env),
    getConfigSnapshotStatus(env),
    getExpiryStatus(),
    getAuditHumanMetricsStatus(env)
  ]);

  return json({
    ok: true,
    generated_at: new Date().toISOString(),
    backups,
    deployments,
    probes,
    revenue,
    config_snapshot: configSnapshot,
    expiries,
    audit_human_metrics: auditHumanMetrics
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

async function ensureConfigSnapshotTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS config_snapshot (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      source TEXT NOT NULL,
      json TEXT NOT NULL,
      sha256 TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_config_snapshot_source_ts ON config_snapshot(source, ts)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_config_snapshot_source_sha ON config_snapshot(source, sha256)').run();
}

async function getConfigSnapshotStatus(env) {
  try {
    await ensureConfigSnapshotTable(env);
    const latest = await first(env.DB, `
      SELECT ts, source, sha256, json
      FROM config_snapshot
      WHERE source = ?
      ORDER BY ts DESC, id DESC
      LIMIT 1
    `, [CONFIG_SNAPSHOT_SOURCE]);
    const previous = latest ? await first(env.DB, `
      SELECT ts, source, sha256
      FROM config_snapshot
      WHERE source = ? AND ts < ?
      ORDER BY ts DESC, id DESC
      LIMIT 1
    `, [CONFIG_SNAPSHOT_SOURCE, latest.ts]) : null;
    const parsed = latest?.json ? JSON.parse(latest.json) : null;
    return {
      ok: true,
      configured: Boolean(latest),
      source: CONFIG_SNAPSHOT_SOURCE,
      latest_at: latest?.ts || '',
      sha256: latest?.sha256 || '',
      changed: Boolean(previous && previous.sha256 !== latest.sha256),
      previous_sha256: previous?.sha256 || '',
      permissions: parsed?.permissions || [],
      pending_authorization: parsed?.pending_authorization || []
    };
  } catch (e) {
    return {
      ok: false,
      configured: false,
      source: CONFIG_SNAPSHOT_SOURCE,
      error: clean(e.message || String(e), 200)
    };
  }
}

function validateExpiryConfig(input) {
  if (input == null) {
    return { ok: false, error: 'missing expiries config file' };
  }
  let rows = input;
  if (typeof input === 'string') {
    try {
      rows = JSON.parse(input);
    } catch (error) {
      return { ok: false, error: 'invalid expiries JSON' };
    }
  }
  if (!Array.isArray(rows)) {
    return { ok: false, error: 'expiries config must be an array' };
  }
  const items = [];
  for (const [index, row] of rows.entries()) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      return { ok: false, error: `expiries[${index}] must be an object` };
    }
    const item = {
      name: clean(row.name, 120),
      kind: clean(row.kind, 40),
      expires_on: clean(row.expires_on, 20),
      owner: clean(row.owner, 120),
      renew_url_or_note: clean(row.renew_url_or_note, 300)
    };
    for (const field of ['name', 'kind', 'expires_on', 'owner', 'renew_url_or_note']) {
      if (!item[field]) return { ok: false, error: `expiries[${index}].${field} missing` };
    }
    if (!EXPIRY_KIND_ALLOWLIST.has(item.kind)) {
      return { ok: false, error: `expiries[${index}].kind invalid` };
    }
    if (!validDateOnly(item.expires_on)) {
      return { ok: false, error: `expiries[${index}].expires_on invalid` };
    }
    if (containsSensitiveExpiryNote(item.renew_url_or_note)) {
      return { ok: false, error: `expiries[${index}].renew_url_or_note sensitive` };
    }
    items.push(item);
  }
  return { ok: true, items };
}

function getExpiryStatus(options = {}) {
  const now = options.now || new Date();
  const config = Object.hasOwn(options, 'config') ? options.config : expiriesConfig;
  const validated = validateExpiryConfig(config);
  const generatedAt = now.toISOString();
  if (!validated.ok) {
    return {
      ok: false,
      configured: false,
      status: 'config_error',
      generated_at: generatedAt,
      error: validated.error,
      items: [],
      nearest: null
    };
  }
  const items = validated.items
    .map((item) => expiryItemStatus(item, now))
    .sort((a, b) => a.days_remaining - b.days_remaining || a.name.localeCompare(b.name));
  const status = items.some((item) => item.status === 'red' || item.status === 'expired')
    ? 'red'
    : items.some((item) => item.status === 'yellow')
      ? 'yellow'
      : 'green';
  return {
    ok: status !== 'red',
    configured: true,
    status,
    generated_at: generatedAt,
    warning_days: EXPIRY_WARNING_DAYS,
    red_days: EXPIRY_RED_DAYS,
    nearest: items[0] || null,
    items
  };
}

function expiryItemStatus(item, now) {
  const daysRemaining = daysUntilDate(item.expires_on, now);
  const status = daysRemaining < 0
    ? 'expired'
    : daysRemaining <= EXPIRY_RED_DAYS
      ? 'red'
      : daysRemaining <= EXPIRY_WARNING_DAYS
        ? 'yellow'
        : 'green';
  return {
    ...item,
    days_remaining: daysRemaining,
    status,
    ok: status === 'green' || status === 'yellow',
    latest_at: item.expires_on,
    detail: item.renew_url_or_note,
    fingerprint: `expiry:${item.kind}:${item.name}:${item.expires_on}:${status}`
  };
}

function validDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const [year, month, day] = String(value).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function daysUntilDate(dateKey, now) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const target = Date.UTC(year, month - 1, day);
  const today = jstDateKey(now);
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);
  return Math.round((target - todayUtc) / 86400000);
}

function containsSensitiveExpiryNote(value) {
  return /\b(token|password|passwd|secret|card|cvv|otp|jwt)\s*[:=]/i.test(String(value || ''))
    || /[?&](token|password|secret|key|otp|jwt)=/i.test(String(value || ''));
}

async function ensureAuditHumanMetricsTable(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS audit_human_metrics (month TEXT NOT NULL, question_id TEXT NOT NULL, value TEXT NOT NULL, source TEXT NOT NULL, computed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), evidence_status TEXT NOT NULL, PRIMARY KEY (month, question_id))").run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_audit_human_metrics_computed_at ON audit_human_metrics(computed_at)').run();
}

function validateAuditHumanDataPlan(input = auditHumanDataPlan) {
  if (!Array.isArray(input)) return { ok: false, error: 'audit human data plan must be an array' };
  const rows = [];
  const seen = new Set();
  for (const [index, row] of input.entries()) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return { ok: false, error: 'audit plan[' + index + '] must be an object' };
    const item = {
      question_id: clean(row.question_id, 20),
      module: clean(row.module, 80),
      question: clean(row.question, 500),
      monthly_metric: clean(row.monthly_metric, 800),
      data_source: clean(row.data_source, 800),
      privacy_boundary: clean(row.privacy_boundary, 800),
      evidence_status: clean(row.evidence_status, 40),
      required_read_access: clean(row.required_read_access || '', 800)
    };
    for (const field of ['question_id', 'module', 'question', 'monthly_metric', 'data_source', 'privacy_boundary', 'evidence_status']) {
      if (!item[field]) return { ok: false, error: 'audit plan[' + index + '].' + field + ' missing' };
    }
    if (!/^q(?:[1-9]|1[0-2])$/.test(item.question_id)) return { ok: false, error: 'audit plan[' + index + '].question_id invalid' };
    if (!['OK', 'EI', 'WAN_PENDING'].includes(item.evidence_status)) return { ok: false, error: 'audit plan[' + index + '].evidence_status invalid' };
    if (seen.has(item.question_id)) return { ok: false, error: 'audit plan[' + index + '].question_id duplicate' };
    seen.add(item.question_id);
    rows.push(item);
  }
  if (rows.length !== 12) return { ok: false, error: 'audit human data plan must contain 12 questions' };
  return { ok: true, rows: rows.sort((a, b) => Number(a.question_id.slice(1)) - Number(b.question_id.slice(1))) };
}

function auditMonthRangeJst(month) {
  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) throw new Error('invalid_month');
  const [year, monthNumber] = month.split('-').map(Number);
  if (monthNumber < 1 || monthNumber > 12) throw new Error('invalid_month');
  const start = new Date(Date.UTC(year, monthNumber - 1, 1, -9, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthNumber, 1, -9, 0, 0, 0));
  return { start: start.toISOString(), end: end.toISOString() };
}

function previousJstMonthKey(date = new Date()) {
  const jst = new Date(date.getTime() + 9 * 3600000);
  const previous = new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth() - 1, 1));
  return previous.toISOString().slice(0, 7);
}

async function collectAuditVisitorAggregates(env, month) {
  const range = auditMonthRangeJst(month);
  if (!env.DB) return { ok: false, range, error: 'missing_nice_analytics_D1', trial: null, content: null };
  try {
    const trial = await first(env.DB, "/* audit:trial */ SELECT COUNT(DISTINCT visitor_id) AS visitors, COUNT(*) AS pageviews FROM visitor_events WHERE created_at >= ? AND created_at < ? AND site_id IN ('bjt', 'progress', 'kiso') AND event_type = 'pageview' AND (landing_path LIKE '%trial%' OR landing_path LIKE '%free%' OR landing_path LIKE '%study%' OR landing_path LIKE '%mogi%' OR landing_path LIKE '%pro%')", [range.start, range.end]);
    const content = await first(env.DB, "/* audit:content */ SELECT COUNT(DISTINCT visitor_id) AS visitors, COUNT(*) AS pageviews FROM visitor_events WHERE created_at >= ? AND created_at < ? AND site_id IN ('bjt', 'progress', 'kiso') AND event_type = 'pageview' AND (landing_path LIKE '%guide%' OR landing_path LIKE '%article%' OR landing_path LIKE '%column%' OR landing_path LIKE '%blog%')", [range.start, range.end]);
    return { ok: true, range, trial: normalizeAuditCountRow(trial), content: normalizeAuditCountRow(content) };
  } catch (e) {
    return { ok: false, range, error: clean(e.message || String(e), 200), trial: null, content: null };
  }
}

function normalizeAuditCountRow(row) {
  return { visitors: Number(row?.visitors || 0), pageviews: Number(row?.pageviews || 0) };
}

function createReadOnlyKv(kv, label = 'KV') {
  if (!kv) return null;
  return Object.freeze({
    get: (...args) => kv.get(...args),
    list: (...args) => kv.list(...args),
    put() { throw new Error(label + '_write_forbidden'); },
    delete() { throw new Error(label + '_write_forbidden'); }
  });
}

function createReadOnlyD1(db, label = 'D1') {
  if (!db) return null;
  return Object.freeze({
    prepare(sql) {
      assertReadOnlySql(sql, label);
      const statement = db.prepare(sql);
      return {
        bind: (...params) => {
          const bound = statement.bind(...params);
          return {
            first: (...args) => bound.first(...args),
            all: (...args) => bound.all(...args),
            raw: (...args) => bound.raw(...args),
            run() { throw new Error(label + '_write_forbidden'); }
          };
        },
        first: (...args) => statement.first(...args),
        all: (...args) => statement.all(...args),
        raw: (...args) => statement.raw(...args),
        run() { throw new Error(label + '_write_forbidden'); }
      };
    },
    exec() { throw new Error(label + '_write_forbidden'); },
    batch() { throw new Error(label + '_write_forbidden'); }
  });
}

function assertReadOnlySql(sql, label = 'D1') {
  const normalized = String(sql || '')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--.*$/gm, ' ')
    .trim()
    .toLowerCase();
  if (!normalized) throw new Error(label + '_empty_sql_forbidden');
  if (!/^(select|with|pragma)\b/.test(normalized)) throw new Error(label + '_non_select_forbidden');
  if (/\b(insert|update|delete|drop|alter|create|replace|attach|detach|vacuum|reindex|analyze)\b/.test(normalized)) throw new Error(label + '_write_sql_forbidden');
}

function auditMonthDayRangeJst(month) {
  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) throw new Error('invalid_month');
  const [year, monthNumber] = month.split('-').map(Number);
  const start = String(year).padStart(4, '0') + '-' + String(monthNumber).padStart(2, '0') + '-01';
  const endDate = new Date(Date.UTC(year, monthNumber, 1));
  const end = endDate.toISOString().slice(0, 10);
  return { start, end };
}

function previousAuditMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 2, 1)).toISOString().slice(0, 7);
}

function isAuditPaidStatus(status) {
  return AUDIT_PAID_ORDER_STATUSES.has(String(status || '').trim().toLowerCase());
}

function normalizeAuditEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function auditOrderTimestamp(order) {
  return order.captured_at || order.created_at || order.updated_at || '';
}

function auditOrderTimeMs(order) {
  const ms = Date.parse(auditOrderTimestamp(order));
  return Number.isFinite(ms) ? ms : 0;
}

function isAuditTestOrder(order, key = '') {
  const text = [key, order.source, order.status, order.plan, order.product_type, order.service, order.email]
    .map((value) => String(value || '').toLowerCase())
    .join(' ');
  return /cctest|regtest|internal|demo|probe|synthetic/.test(text);
}

function auditDedupeKey(order, key = '') {
  const explicit = clean(order.order_id || '', 80);
  if (explicit) return 'explicit:' + explicit;
  const timestamp = auditOrderTimestamp(order);
  const minute = timestamp ? timestamp.slice(0, 16) : '';
  return ['fallback', normalizeAuditEmail(order.email), order.currency || '', order.amount || '', minute].join(':');
}

function auditDedupeRank(order) {
  const paid = isAuditPaidStatus(order.status) ? 1 : 0;
  return paid * 1000000000000000 + auditOrderTimeMs(order);
}

async function listAuditKvJson(kv, prefix) {
  const rows = [];
  let cursor;
  do {
    const page = await kv.list({ prefix, cursor, limit: 1000 });
    for (const item of page.keys || []) rows.push(item.name);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  const out = [];
  for (let i = 0; i < rows.length; i += 20) {
    const chunk = await Promise.all(rows.slice(i, i + 20).map(async (key) => {
      const value = await kv.get(key, { type: 'json' }).catch(() => null);
      return value && typeof value === 'object' && !Array.isArray(value) ? { key, value } : null;
    }));
    out.push(...chunk.filter(Boolean));
  }
  return out;
}

function normalizeAuditSource(order) {
  const ref = String(order.first_ref || order.ref_host || '').trim().toLowerCase();
  const utm = String(order.first_utm?.utm_source || order.utm_source || '').trim().toLowerCase();
  const combined = (ref + ' ' + utm).trim();
  if (!combined) return 'unknown';
  if (/chatgpt|openai/.test(combined)) return 'chatgpt';
  if (/google/.test(combined)) return 'google';
  if (/bing/.test(combined)) return 'bing';
  if (/xiaohongshu|小红书|xhs/.test(combined)) return 'xiaohongshu';
  if (/facebook|instagram|reddit|twitter|x\.com/.test(combined)) return 'sns';
  if (/direct|none|unknown/.test(combined)) return 'direct';
  return clean(ref || utm || 'other', 80);
}

function isContentLanding(order) {
  return /guide|article|column|blog|tips|lesson/.test(String(order.first_landing || '').toLowerCase());
}

function topEntries(map, limit = 3) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

function sumAmountByCurrency(orders) {
  const sums = new Map();
  for (const order of orders) {
    const currency = clean(order.currency || 'unknown', 10).toUpperCase();
    const amount = Number(order.amount || 0);
    if (!Number.isFinite(amount)) continue;
    sums.set(currency, (sums.get(currency) || 0) + amount);
  }
  return Object.fromEntries([...sums.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function rate(numerator, denominator) {
  if (!denominator) return null;
  return Number((numerator / denominator).toFixed(4));
}

async function collectAuditBjtOrderAggregates(env, month) {
  const kv = createReadOnlyKv(env.BJT_KV, 'BJT_KV');
  const range = auditMonthRangeJst(month);
  if (!kv) return { ok: false, error: 'missing_BJT_KV_binding' };
  try {
    const pairs = await listAuditKvJson(kv, BJT_ORDER_META_PREFIX);
    const byKey = new Map();
    for (const { key, value } of pairs) {
      if (isAuditTestOrder(value, key)) continue;
      const dedupeKey = auditDedupeKey(value, key);
      const existing = byKey.get(dedupeKey);
      if (!existing || auditDedupeRank(value) > auditDedupeRank(existing)) byKey.set(dedupeKey, { ...value });
    }
    const orders = [...byKey.values()];
    const paid = orders.filter((order) => isAuditPaidStatus(order.status));
    const currentPaid = paid.filter((order) => {
      const ts = auditOrderTimestamp(order);
      return ts >= range.start && ts < range.end;
    });
    const previousMonth = previousAuditMonth(month);
    const previousRange = auditMonthRangeJst(previousMonth);
    const previousPaid = paid.filter((order) => {
      const ts = auditOrderTimestamp(order);
      return ts >= previousRange.start && ts < previousRange.end;
    });
    const firstPaidByAccount = new Map();
    for (const order of paid) {
      const account = normalizeAuditEmail(order.email);
      if (!account) continue;
      const ts = auditOrderTimestamp(order);
      const existing = firstPaidByAccount.get(account);
      if (!existing || ts < existing) firstPaidByAccount.set(account, ts);
    }
    const currentAccounts = new Set(currentPaid.map((order) => normalizeAuditEmail(order.email)).filter(Boolean));
    const previousAccounts = new Set(previousPaid.map((order) => normalizeAuditEmail(order.email)).filter(Boolean));
    const newAccounts = new Set([...currentAccounts].filter((account) => {
      const firstTs = firstPaidByAccount.get(account) || '';
      return firstTs >= range.start && firstTs < range.end;
    }));
    const repeatAccounts = new Set([...currentAccounts].filter((account) => !newAccounts.has(account)));
    const previousNewAccounts = new Set([...previousAccounts].filter((account) => {
      const firstTs = firstPaidByAccount.get(account) || '';
      return firstTs >= previousRange.start && firstTs < previousRange.end;
    }));
    const previousRepeatAccounts = new Set([...previousAccounts].filter((account) => !previousNewAccounts.has(account)));
    const attributed = currentPaid.filter((order) => order.first_ref || order.first_landing || order.first_utm || order.utm_source);
    const sourceCounts = new Map();
    const landingCounts = new Map();
    for (const order of currentPaid) {
      sourceCounts.set(normalizeAuditSource(order), (sourceCounts.get(normalizeAuditSource(order)) || 0) + 1);
      const landing = clean(order.first_landing || 'unknown', 160) || 'unknown';
      landingCounts.set(landing, (landingCounts.get(landing) || 0) + 1);
    }
    const contentPaid = currentPaid.filter(isContentLanding);
    return {
      ok: true,
      range,
      scanned_keys: pairs.length,
      deduped_records: orders.length,
      current_paid_count: currentPaid.length,
      previous_paid_count: previousPaid.length,
      current_paid_accounts: currentAccounts.size,
      previous_paid_accounts: previousAccounts.size,
      current_new_accounts: newAccounts.size,
      previous_new_accounts: previousNewAccounts.size,
      current_repeat_accounts: repeatAccounts.size,
      previous_repeat_accounts: previousRepeatAccounts.size,
      renewal_rate: rate(repeatAccounts.size, currentAccounts.size),
      amount_by_currency: sumAmountByCurrency(currentPaid),
      attributed_count: attributed.length,
      attribution_rate: rate(attributed.length, currentPaid.length),
      top_sources: topEntries(sourceCounts, 3),
      top_landings: topEntries(landingCounts, 5),
      content_paid_count: contentPaid.length,
      content_amount_by_currency: sumAmountByCurrency(contentPaid)
    };
  } catch (e) {
    return { ok: false, error: clean(e.message || String(e), 200) };
  }
}

async function collectAuditProgressAggregates(env, month) {
  const db = createReadOnlyD1(env.PROGRESS_D1, 'PROGRESS_D1');
  if (!db) return { ok: false, error: 'missing_PROGRESS_D1_binding' };
  const dayRange = auditMonthDayRangeJst(month);
  try {
    const active = await first(db, "/* audit:progress_active */ SELECT COUNT(*) AS count FROM (SELECT email FROM daily_activity WHERE ymd >= ? AND ymd < ? AND review_count > 0 GROUP BY email HAVING COUNT(DISTINCT ymd) >= 15)", [dayRange.start, dayRange.end]);
    const cumulative = await first(db, "/* audit:progress_cumulative */ SELECT COUNT(*) AS count FROM (SELECT email FROM events WHERE event_type = 'answer' AND created_at < ? GROUP BY email HAVING COUNT(*) >= 300)", [auditMonthRangeJst(month).end]);
    return { ok: true, active_15_day_accounts: Number(active?.count || 0), cumulative_300_answer_accounts: Number(cumulative?.count || 0) };
  } catch (e) {
    return { ok: false, error: clean(e.message || String(e), 200) };
  }
}

function metricEvidenceStatus(questionId, sources) {
  if (questionId === 'q9') return 'WAN_PENDING';
  if (['q1', 'q2', 'q10', 'q11'].includes(questionId)) return sources.orders?.ok ? 'OK' : 'EI';
  if (['q3', 'q4', 'q12'].includes(questionId)) return sources.orders?.ok && sources.visitors?.ok ? 'OK' : 'EI';
  if (['q7', 'q8'].includes(questionId)) return sources.progress?.ok ? 'OK' : 'EI';
  return 'EI';
}

function metricSource(questionId, status) {
  if (status === 'WAN_PENDING') return 'WAN_PENDING';
  if (['q1', 'q2', 'q10', 'q11'].includes(questionId)) return 'BJT_KV';
  if (['q3', 'q4', 'q12'].includes(questionId)) return 'nice_analytics_D1+BJT_KV';
  if (['q7', 'q8'].includes(questionId)) return 'PROGRESS_D1';
  return AUDIT_HUMAN_METRICS_SOURCE;
}

function missingAuditAccess(questionId, status, item, sources) {
  if (status === 'OK') return [];
  if (status === 'WAN_PENDING') return ['Wan monthly manual aggregate'];
  if (['q1', 'q2', 'q10', 'q11'].includes(questionId) && sources.orders?.error) return [sources.orders.error];
  if (['q7', 'q8'].includes(questionId) && sources.progress?.error) return [sources.progress.error];
  if (['q3', 'q4', 'q12'].includes(questionId)) {
    const missing = [];
    if (sources.visitors?.error) missing.push(sources.visitors.error);
    if (sources.orders?.error) missing.push(sources.orders.error);
    return missing.length ? missing : (item.required_read_access ? [item.required_read_access] : []);
  }
  return item.required_read_access ? [item.required_read_access] : [];
}

function addAuditMetrics(value, questionId, sources) {
  const orders = sources.orders || {};
  const visitors = sources.visitors || {};
  const progress = sources.progress || {};
  if (questionId === 'q1') {
    value.metrics = { new_paid_count: orders.current_new_accounts || 0, paid_accounts: orders.current_paid_accounts || 0, paid_records: orders.current_paid_count || 0, amount_by_currency: orders.amount_by_currency || {} };
  } else if (questionId === 'q2') {
    value.metrics = { repeat_paid_count: orders.current_repeat_accounts || 0, paid_accounts: orders.current_paid_accounts || 0, renewal_rate: orders.renewal_rate };
  } else if (questionId === 'q3') {
    const trialVisitors = visitors.trial?.visitors || 0;
    value.metrics = { anonymous_trial_or_study_visitors: trialVisitors, anonymous_trial_or_study_pageviews: visitors.trial?.pageviews || 0, new_paid_count: orders.current_new_accounts || 0, aggregate_conversion_rate: rate(orders.current_new_accounts || 0, trialVisitors) };
    value.notes.push('aggregate conversion only; no personal identity join.');
  } else if (questionId === 'q4') {
    value.metrics = { current_new_paid_count: orders.current_new_accounts || 0, previous_new_paid_count: orders.previous_new_accounts || 0, current_repeat_paid_count: orders.current_repeat_accounts || 0, previous_repeat_paid_count: orders.previous_repeat_accounts || 0, current_paid_records: orders.current_paid_count || 0, previous_paid_records: orders.previous_paid_count || 0, current_trial_visitors: visitors.trial?.visitors || 0, current_conversion_rate: rate(orders.current_new_accounts || 0, visitors.trial?.visitors || 0) };
  } else if (questionId === 'q7') {
    value.metrics = { active_15_day_count: progress.active_15_day_accounts || 0 };
  } else if (questionId === 'q8') {
    value.metrics = { cumulative_300_answer_count: progress.cumulative_300_answer_accounts || 0 };
  } else if (questionId === 'q9') {
    value.metrics = { denominator_policy: 'excluded_until_wan_fills' };
  } else if (questionId === 'q10') {
    value.metrics = { paid_records: orders.current_paid_count || 0, attributed_records: orders.attributed_count || 0, attribution_rate: orders.attribution_rate };
  } else if (questionId === 'q11') {
    value.metrics = { top_sources: orders.top_sources || [] };
  } else if (questionId === 'q12') {
    value.metrics = { learning_content_visitors: visitors.content?.visitors || 0, learning_content_pageviews: visitors.content?.pageviews || 0, content_paid_records: orders.content_paid_count || 0, content_amount_by_currency: orders.content_amount_by_currency || {}, top_content_landings: (orders.top_landings || []).filter((item) => /guide|article|column|blog|tips|lesson/.test(item.key)).slice(0, 5) };
    value.notes.push('landing aggregate only; no personal identity join.');
  }
}

function buildAuditHumanMetricRows(planRows, month, computedAt, sources = {}) {
  const rows = [];
  for (const item of planRows) {
    const status = metricEvidenceStatus(item.question_id, sources);
    const value = {
      schema_version: 2,
      month,
      question_id: item.question_id,
      module: item.module,
      question: item.question,
      monthly_metric: item.monthly_metric,
      privacy_boundary: item.privacy_boundary,
      evidence_status: status,
      metrics: {},
      missing_read_access: missingAuditAccess(item.question_id, status, item, sources),
      notes: []
    };
    addAuditMetrics(value, item.question_id, sources);
    if (sources.visitors?.error && ['q3', 'q4', 'q12'].includes(item.question_id)) value.notes.push('analytics aggregate unavailable: ' + sources.visitors.error);
    rows.push({ month, question_id: item.question_id, value, source: metricSource(item.question_id, status), computed_at: computedAt, evidence_status: status });
  }
  return rows;
}

function assertAuditPayloadPrivacy(payload) {
  const text = JSON.stringify(payload);
  const forbidden = [/email/i, /order[_-]?id/i, /\bip\b/i, /visitor_id/i, /customer/i, /paypal_order_meta:/i, /\bname\b/i];
  for (const pattern of forbidden) if (pattern.test(text)) throw new Error('audit payload contains forbidden personal field: ' + pattern.source);
}

async function collectAuditHumanMetricSources(env, month) {
  const [visitors, orders, progress] = await Promise.all([
    collectAuditVisitorAggregates(env, month),
    collectAuditBjtOrderAggregates(env, month),
    collectAuditProgressAggregates(env, month)
  ]);
  return { visitors, orders, progress };
}

async function runAuditHumanMetrics(env, options = {}) {
  const month = options.month || previousJstMonthKey(options.now || new Date());
  const computedAt = (options.now || new Date()).toISOString();
  const validated = validateAuditHumanDataPlan(options.plan || auditHumanDataPlan);
  if (!validated.ok) throw new Error(validated.error);
  const sources = Object.hasOwn(options, 'sources') ? options.sources : await collectAuditHumanMetricSources(env, month);
  const rows = buildAuditHumanMetricRows(validated.rows, month, computedAt, sources);
  const payload = { schema_version: 2, month, source: AUDIT_HUMAN_METRICS_SOURCE, computed_at: computedAt, evidence_summary: summarizeAuditEvidence(rows), metrics: rows.map((row) => row.value) };
  assertAuditPayloadPrivacy(payload);
  await ensureAuditHumanMetricsTable(env);
  for (const row of rows) {
    await env.DB.prepare('INSERT INTO audit_human_metrics (month, question_id, value, source, computed_at, evidence_status) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(month, question_id) DO UPDATE SET value = excluded.value, source = excluded.source, computed_at = excluded.computed_at, evidence_status = excluded.evidence_status').bind(row.month, row.question_id, JSON.stringify(row.value), row.source, row.computed_at, row.evidence_status).run();
  }
  const artifact = await writeAuditHumanMetricsArtifact(env, month, payload);
  return { ok: true, month, computed_at: computedAt, rows: rows.length, evidence_summary: payload.evidence_summary, artifact, payload };
}

function summarizeAuditEvidence(rows) {
  return rows.reduce((summary, row) => {
    summary[row.evidence_status] = (summary[row.evidence_status] || 0) + 1;
    return summary;
  }, {});
}

function auditArtifactPrefix(env) {
  const configured = clean(env.AUDIT_ARTIFACTS_PREFIX || AUDIT_HUMAN_METRICS_ARTIFACT_KEY_PREFIX, 120) || AUDIT_HUMAN_METRICS_ARTIFACT_KEY_PREFIX;
  return configured.endsWith('/') ? configured : configured + '/';
}

async function writeAuditHumanMetricsArtifact(env, month, payload) {
  const key = auditArtifactPrefix(env) + month + '.json';
  if (!env.AUDIT_ARTIFACTS) return { ok: false, status: 'ARTIFACT_R2_PENDING', key, reason: 'missing_AUDIT_ARTIFACTS_binding' };
  await env.AUDIT_ARTIFACTS.put(key, JSON.stringify(payload, null, 2), { httpMetadata: { contentType: 'application/json; charset=utf-8' } });
  return { ok: true, status: 'written', key };
}

async function getAuditHumanMetricsStatus(env) {
  try {
    await ensureAuditHumanMetricsTable(env);
    const latest = await first(env.DB, 'SELECT month, computed_at, source, evidence_status FROM audit_human_metrics ORDER BY computed_at DESC, month DESC LIMIT 1');
    if (!latest) return { ok: true, configured: false, source: AUDIT_HUMAN_METRICS_SOURCE, latest_month: '', latest_at: '', evidence_summary: {} };
    const rows = await all(env.DB, 'SELECT evidence_status, COUNT(*) AS count FROM audit_human_metrics WHERE month = ? GROUP BY evidence_status ORDER BY evidence_status', [latest.month]);
    return { ok: true, configured: true, source: latest.source || AUDIT_HUMAN_METRICS_SOURCE, latest_month: latest.month, latest_at: latest.computed_at, evidence_summary: Object.fromEntries(rows.map((row) => [row.evidence_status, Number(row.count || 0)])) };
  } catch (e) {
    return { ok: false, configured: false, source: AUDIT_HUMAN_METRICS_SOURCE, error: clean(e.message || String(e), 200) };
  }
}

async function getAuditHumanMetrics(env, month) {
  await ensureAuditHumanMetricsTable(env);
  const rows = await all(env.DB, 'SELECT month, question_id, value, source, computed_at, evidence_status FROM audit_human_metrics WHERE month = ? ORDER BY CAST(substr(question_id, 2) AS INTEGER)', [month]);
  return rows.map((row) => ({ month: row.month, question_id: row.question_id, value: JSON.parse(row.value), source: row.source, computed_at: row.computed_at, evidence_status: row.evidence_status }));
}

async function auditHumanMetrics(request, env) {
  if (!requireDashboard(request, env)) return json({ ok: false, error: 'unauthorized' }, request, 403);
  const url = new URL(request.url);
  const month = clean(url.searchParams.get('month') || previousJstMonthKey(new Date()), 20);
  if (!/^\d{4}-\d{2}$/.test(month)) return json({ ok: false, error: 'invalid_month' }, request, 400);
  try {
    const metrics = await getAuditHumanMetrics(env, month);
    return json({ ok: true, month, count: metrics.length, metrics }, request);
  } catch (e) {
    return json({ ok: false, error: clean(e.message || String(e), 300) }, request, 500);
  }
}

async function runAuditHumanMetricsEndpoint(request, env) {
  if (!requireDashboard(request, env)) return json({ ok: false, error: 'unauthorized' }, request, 403);
  const url = new URL(request.url);
  const month = clean(url.searchParams.get('month') || previousJstMonthKey(new Date()), 20);
  if (!/^\d{4}-\d{2}$/.test(month)) return json({ ok: false, error: 'invalid_month' }, request, 400);
  try {
    const result = await runAuditHumanMetrics(env, { month, reason: 'manual' });
    return json(result, request);
  } catch (e) {
    return json({ ok: false, error: clean(e.message || String(e), 300) }, request, 500);
  }
}

async function runConfigSnapshot(env, reason = 'manual', options = {}) {
  await ensureConfigSnapshotTable(env);
  await ensureAlertTable(env);
  await ensureAlertSendLogTable(env);
  const raw = options.snapshot || await collectConfigSnapshot(env);
  const safeSnapshot = normalizeSnapshot(raw);
  assertNoSecretValues(safeSnapshot);
  const jsonText = JSON.stringify(safeSnapshot);
  const sha256 = await sha256Hex(jsonText);
  const previous = await first(env.DB, `
    SELECT ts, sha256, json
    FROM config_snapshot
    WHERE source = ?
    ORDER BY ts DESC, id DESC
    LIMIT 1
  `, [CONFIG_SNAPSHOT_SOURCE]);
  const changed = Boolean(previous && previous.sha256 !== sha256);
  const ts = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO config_snapshot (ts, source, json, sha256)
    VALUES (?, ?, ?, ?)
  `).bind(ts, CONFIG_SNAPSHOT_SOURCE, jsonText, sha256).run();

  let alert = null;
  let sendLock = null;
  const diff = changed ? diffSnapshotJson(previous.json, jsonText) : [];
  const fingerprint = changed ? `config:${sha256}` : '';
  if (changed && options.notify !== false) {
    sendLock = await claimAlertSend(env, {
      key: CONFIG_SNAPSHOT_ALERT_KEY,
      status: 'red',
      fingerprint,
      reason,
      detail: JSON.stringify({ reason, ts, sha256, previous_sha256: previous.sha256, diff })
    }, CONFIG_SNAPSHOT_ALERT_WINDOW_MS);
    if (sendLock.acquired) {
      alert = await trySendDashboardAlert(env, 'red', [{
        type: 'config_snapshot',
        key: CONFIG_SNAPSHOT_SOURCE,
        label: 'Cloudflare/GitHub 配置快照',
        status: 'changed',
        detail: diff.slice(0, 12).join('; ') || 'snapshot changed',
        latest_at: ts,
        fingerprint
      }]);
      await finishAlertSend(env, sendLock.id, alert);
    }
  }
  return {
    ok: true,
    source: CONFIG_SNAPSHOT_SOURCE,
    ts,
    sha256,
    previous_sha256: previous?.sha256 || '',
    changed,
    diff,
    permissions: safeSnapshot.permissions || [],
    pending_authorization: safeSnapshot.pending_authorization || [],
    alert,
    send_lock: sendLock
  };
}

async function collectConfigSnapshot(env) {
  const permissions = [];
  const pendingAuthorization = [];
  const [cloudflare, github] = await Promise.all([
    collectCloudflareConfigSnapshot(env, permissions, pendingAuthorization),
    collectGithubConfigSnapshot(env, permissions, pendingAuthorization)
  ]);
  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    cloudflare,
    github,
    permissions,
    pending_authorization: pendingAuthorization
  };
}

async function collectCloudflareConfigSnapshot(env, permissions, pendingAuthorization) {
  const token = env.CLOUDFLARE_CONFIG_READ_TOKEN || env.CLOUDFLARE_API_TOKEN || '';
  const accountId = env.CLOUDFLARE_ACCOUNT_ID || '';
  const zoneId = env.CLOUDFLARE_ZONE_ID || '';
  if (!token || !accountId) {
    const result = !token ? 'token missing' : 'account missing';
    for (const target of [...CLOUDFLARE_CONFIG_ENDPOINTS, ...CLOUDFLARE_ZONE_CONFIG_ENDPOINTS]) {
      recordConfigPermission(permissions, pendingAuthorization, target.key, result, 'Cloudflare Worker secret CLOUDFLARE_CONFIG_READ_TOKEN plus CLOUDFLARE_ACCOUNT_ID', 'Cloudflare Access/Pages/Workers snapshot');
    }
    return { configured: false, items: [] };
  }
  const items = [];
  for (const target of CLOUDFLARE_CONFIG_ENDPOINTS) {
    const path = target.path(accountId);
    const result = await fetchCloudflareConfig(path, token);
    recordConfigPermission(permissions, pendingAuthorization, target.key, result.status, 'Cloudflare Account read / Access read / Pages read / Workers read', target.key);
    if (result.ok) items.push(normalizeCloudflareEndpoint(target.key, result.data));
  }
  if (!zoneId) {
    for (const target of CLOUDFLARE_ZONE_CONFIG_ENDPOINTS) {
      recordConfigPermission(permissions, pendingAuthorization, target.key, 'zone missing', 'Cloudflare Worker secret CLOUDFLARE_ZONE_ID', 'Worker route snapshot');
    }
  } else {
    for (const target of CLOUDFLARE_ZONE_CONFIG_ENDPOINTS) {
      const result = await fetchCloudflareConfig(target.path(zoneId), token);
      recordConfigPermission(permissions, pendingAuthorization, target.key, result.status, 'Cloudflare Zone read', target.key);
      if (result.ok) items.push(normalizeCloudflareEndpoint(target.key, result.data));
    }
  }
  return { configured: true, items };
}

async function collectGithubConfigSnapshot(env, permissions, pendingAuthorization) {
  const token = env.GITHUB_TOKEN || '';
  if (!token) {
    for (const repo of githubConfigRepos(env)) {
      recordConfigPermission(permissions, pendingAuthorization, `github.${repo}`, 'token missing', 'analytics-worker secret GITHUB_TOKEN with read-only repo metadata scope', 'GitHub branch protection / Actions names / Pages source');
    }
    return { configured: false, repos: [] };
  }
  const repos = [];
  for (const repo of githubConfigRepos(env)) {
    const full = repo.includes('/') ? repo : `wanjiaoben/${repo}`;
    const [branch, secrets, variables, pages] = await Promise.all([
      fetchGithubConfig(`/repos/${full}/branches/main`, token),
      fetchGithubConfig(`/repos/${full}/actions/secrets`, token),
      fetchGithubConfig(`/repos/${full}/actions/variables`, token),
      fetchGithubConfig(`/repos/${full}/pages`, token)
    ]);
    recordConfigPermission(permissions, pendingAuthorization, `github.${full}.branch`, branch.status, 'GitHub repo metadata read', 'branch protection / required checks');
    recordConfigPermission(permissions, pendingAuthorization, `github.${full}.actions_secrets`, secrets.status, 'GitHub Actions secrets metadata read', 'secret name list');
    recordConfigPermission(permissions, pendingAuthorization, `github.${full}.actions_variables`, variables.status, 'GitHub Actions variables metadata read', 'variable name list');
    recordConfigPermission(permissions, pendingAuthorization, `github.${full}.pages`, pages.status, 'GitHub Pages read', 'Pages source/config');
    repos.push(normalizeGithubRepoSnapshot(full, { branch, secrets, variables, pages }));
  }
  return { configured: true, repos };
}

function githubConfigRepos(env) {
  return clean(env.CONFIG_SNAPSHOT_GITHUB_REPOS || '', 2000)
    .split(',')
    .map((repo) => repo.trim())
    .filter(Boolean)
    .concat(clean(env.CONFIG_SNAPSHOT_GITHUB_REPOS || '', 2000) ? [] : [...GITHUB_CONFIG_REPOS])
    .sort();
}

async function fetchCloudflareConfig(path, token) {
  return fetchConfigJson(`https://api.cloudflare.com/client/v4${path}`, {
    authorization: `Bearer ${token}`,
    accept: 'application/json'
  });
}

async function fetchGithubConfig(path, token) {
  return fetchConfigJson(`https://api.github.com${path}`, {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'user-agent': 'nice-dashboard-config-snapshot'
  });
}

async function fetchConfigJson(url, headers) {
  try {
    const res = await fetch(url, { headers });
    if (res.status === 403) return { ok: false, status: '403' };
    if (res.status === 404) return { ok: false, status: '404' };
    if (!res.ok) return { ok: false, status: `http_${res.status}` };
    return { ok: true, status: 'OK', data: await res.json().catch(() => ({})) };
  } catch (e) {
    return { ok: false, status: 'unsupported', error: clean(e.message || String(e), 200) };
  }
}

function normalizeCloudflareEndpoint(key, data) {
  const result = Array.isArray(data?.result) ? data.result : (data?.result ? [data.result] : []);
  return {
    key,
    items: result.map((item) => normalizeCloudflareItem(key, item)).sort(compareJsonStable)
  };
}

function normalizeCloudflareItem(key, item) {
  if (key === 'cf.access_apps') {
    return pickDefined({
      name: item.name,
      domain: item.domain,
      type: item.type,
      aud_present: Boolean(item.aud),
      session_duration: item.session_duration,
      policies: Array.isArray(item.policies) ? item.policies.map((policy) => normalizeAccessPolicy(policy)).sort(compareJsonStable) : []
    });
  }
  if (key === 'cf.access_service_tokens') {
    return pickDefined({
      name: item.name,
      duration: item.duration,
      expires_at: item.expires_at
    });
  }
  if (key === 'cf.pages_projects') {
    return pickDefined({
      name: item.name,
      domains: sortedStrings(item.domains || []),
      production_branch: item.production_branch,
      build_config: normalizePagesBuildConfig(item.build_config || {}),
      deployment_configs: normalizePagesDeploymentConfigs(item.deployment_configs || {})
    });
  }
  if (key === 'cf.workers_scripts') {
    return pickDefined({
      id: item.id,
      script_name: item.script_name || item.id,
      modified_on: item.modified_on,
      created_on: item.created_on,
      usage_model: item.usage_model,
      compatibility_date: item.compatibility_date,
      cron_triggers: sortedStrings(item.schedules || item.cron_triggers || [])
    });
  }
  if (key.endsWith('.secrets')) {
    return pickDefined({
      secret_names: secretNameList(Array.isArray(item) ? item.map((entry) => entry.name) : [item.name].filter(Boolean))
    });
  }
  if (key.endsWith('.schedules')) {
    return pickDefined({
      cron: item.cron || item.schedule || item.pattern,
      created_on: item.created_on,
      modified_on: item.modified_on
    });
  }
  if (key === 'cf.workers_routes') {
    return pickDefined({
      pattern: item.pattern,
      script: item.script,
      zone_name: item.zone_name
    });
  }
  return pickDefined({
    id_present: Boolean(item.id),
    name: item.name,
    type: item.type
  });
}

function normalizeAccessPolicy(policy) {
  return pickDefined({
    name: policy.name,
    decision: policy.decision,
    include_types: accessRuleTypes(policy.include),
    exclude_types: accessRuleTypes(policy.exclude),
    require_types: accessRuleTypes(policy.require)
  });
}

function accessRuleTypes(rules) {
  return sortedStrings((Array.isArray(rules) ? rules : []).map((rule) => Object.keys(rule || {}).sort().join('+')).filter(Boolean));
}

function normalizePagesBuildConfig(config) {
  return pickDefined({
    build_command: config.build_command,
    destination_dir: config.destination_dir,
    root_dir: config.root_dir,
    web_analytics_tag: config.web_analytics_tag ? 'present' : ''
  });
}

function normalizePagesDeploymentConfigs(configs) {
  const out = {};
  for (const name of ['production', 'preview']) {
    const cfg = configs[name] || {};
    out[name] = pickDefined({
      env_var_names: envVarNames(cfg.env_vars),
      secrets_names: secretNameList(cfg.secrets || cfg.secret_text || {}),
      compatibility_date: cfg.compatibility_date,
      compatibility_flags: sortedStrings(cfg.compatibility_flags || [])
    });
  }
  return out;
}

function normalizeGithubRepoSnapshot(full, results) {
  const branch = results.branch.ok ? results.branch.data : null;
  const secrets = results.secrets.ok ? results.secrets.data : null;
  const variables = results.variables.ok ? results.variables.data : null;
  const pages = results.pages.ok ? results.pages.data : null;
  return pickDefined({
    repo: full,
    branch_protected: Boolean(branch?.protected),
    required_checks: sortedStrings(branch?.protection?.required_status_checks?.contexts || []),
    actions_secret_names: secretNameList((secrets?.secrets || []).map((secret) => secret.name)),
    actions_variable_names: variableNameList((variables?.variables || []).map((variable) => variable.name)),
    pages: pages ? pickDefined({
      status: pages.status,
      source_branch: pages.source?.branch,
      source_path: pages.source?.path,
      cname: pages.cname || ''
    }) : null
  });
}

function envVarNames(vars) {
  if (!vars) return [];
  if (Array.isArray(vars)) return variableNameList(vars.map((item) => item.name || item.key || item));
  return variableNameList(Object.keys(vars));
}

function secretNameList(input) {
  const names = Array.isArray(input) ? input : Object.keys(input || {});
  return names.map((name) => sanitizeSecretName(name)).sort(compareJsonStable);
}

function variableNameList(input) {
  const names = Array.isArray(input) ? input : Object.keys(input || {});
  return names.map((name) => sanitizeSecretName(name)).sort(compareJsonStable);
}

function sanitizeSecretName(name) {
  const value = clean(name, 300);
  if (secretNameLooksSensitive(value)) {
    return { category: secretNameCategory(value), name_hash: stableSyncHash(value) };
  }
  return { name: value };
}

function secretNameLooksSensitive(name) {
  return /@|CUSTOMER|BUYER|PAYER|CLIENT_EMAIL|ORDER_ID|PERSONAL|PRIVATE_PERSON/i.test(name);
}

function secretNameCategory(name) {
  if (/@|EMAIL/i.test(name)) return 'email-related';
  if (/CUSTOMER|BUYER|PAYER/i.test(name)) return 'customer-related';
  if (/ORDER/i.test(name)) return 'order-related';
  return 'sensitive-name';
}

function stableSyncHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function recordConfigPermission(permissions, pendingAuthorization, target, result, needs, impact) {
  const row = { target, result };
  permissions.push(row);
  if (result !== 'OK') {
    pendingAuthorization.push({
      target,
      result,
      needs,
      impact
    });
  }
}

function normalizeSnapshot(value) {
  if (Array.isArray(value)) return value.map((item) => normalizeSnapshot(item)).sort(compareJsonStable);
  if (!value || typeof value !== 'object') return redactConfigScalar(value);
  const out = {};
  for (const key of Object.keys(value).sort()) {
    if (secretValueKey(key)) {
      out[key] = value[key] === undefined || value[key] === null || value[key] === '' ? '' : 'present';
    } else {
      out[key] = normalizeSnapshot(value[key]);
    }
  }
  return out;
}

function redactConfigScalar(value) {
  if (typeof value !== 'string') return value;
  if (/^[A-Za-z0-9_\-=]{24,}$/.test(value) && !/^https?:\/\//.test(value)) return 'present';
  return clean(value, 1000);
}

function secretValueKey(key) {
  const lower = String(key || '').toLowerCase();
  if (lower === 'key') return false;
  return lower === 'value'
    || /(^|_)(secret|token|password|private_key|client_secret|api_key)$/.test(lower)
    || /_key$/.test(lower);
}

function assertNoSecretValues(snapshot) {
  const text = JSON.stringify(snapshot);
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text)) throw new Error('config snapshot would store a private key');
  if (/Bearer\s+[A-Za-z0-9._-]+/i.test(text)) throw new Error('config snapshot would store a bearer token');
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function diffSnapshotJson(previousJson, nextJson) {
  const previous = JSON.parse(previousJson || '{}');
  const next = JSON.parse(nextJson || '{}');
  const diffs = [];
  collectDiffs('', previous, next, diffs);
  return diffs.slice(0, 50);
}

function collectDiffs(path, a, b, out) {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) || Array.isArray(b)) {
    out.push(`${path || '$'} changed`);
    return;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of [...keys].sort()) collectDiffs(path ? `${path}.${key}` : key, a[key], b[key], out);
}

function compareJsonStable(a, b) {
  return JSON.stringify(a).localeCompare(JSON.stringify(b));
}

function sortedStrings(values) {
  return [...(values || [])].map((value) => clean(value, 500)).filter(Boolean).sort();
}

function pickDefined(input) {
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    out[key] = value;
  }
  return out;
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

export async function getBackupStatus(env, now = new Date()) {
  const previewProgressBucket = env.PROGRESS_BACKUP_PREVIEW;
  const previewProgressSqlBucket = env.PROGRESS_DB_BACKUP_PREVIEW;
  const [bjt, progressProduction, progressPreview, progressProductionSql, progressPreviewSql, niceAnalyticsProduction, bjtHistory, progressHistory, previewHistory, niceAnalyticsIndex] = await Promise.all([
    readR2Json(env.BJT_BACKUPS, 'kv-snapshots/latest/manifest.json'),
    readR2JsonFallback(env.PROGRESS_BACKUP, ['d1/latest/manifest.json', 'd1/progress/production/latest.json']),
    previewProgressBucket
      ? readR2Json(previewProgressBucket, 'd1/progress/preview/latest.json')
      : Promise.resolve({
        ok: false,
        status: 'MONITOR_BINDING_MISSING',
        key: 'd1/progress/preview/latest.json',
        error: 'MONITOR_BINDING_MISSING',
        detail: 'missing PROGRESS_BACKUP_PREVIEW binding'
      }),
    readR2Json(env.PROGRESS_DB_BACKUP, 'd1/progress/production/latest.json'),
    previewProgressSqlBucket
      ? readR2Json(previewProgressSqlBucket, 'd1/progress/preview/latest.json')
      : Promise.resolve({
        ok: false,
        status: 'MONITOR_BINDING_MISSING',
        key: 'd1/progress/preview/latest.json',
        error: 'MONITOR_BINDING_MISSING',
        detail: 'missing PROGRESS_DB_BACKUP_PREVIEW binding'
      }),
    readR2Json(env.PROGRESS_BACKUP, 'd1/nice_analytics/production/latest.json'),
    readDailyBackupHistory(env.BJT_BACKUPS, 'kv-snapshots', now),
    readDailyBackupHistory(env.PROGRESS_BACKUP, 'd1/daily', now),
    previewProgressBucket
      ? readProgressBackupHistory(previewProgressBucket, 'preview', 'progress-otp-preview', now)
      : Promise.resolve(null),
    readR2Json(env.PROGRESS_BACKUP, 'd1/nice_analytics/production/index.json')
  ]);
  const niceAnalyticsHistory = backupHistoryFromIndex(niceAnalyticsIndex, now);
  const bjtItem = attachBackupHistory(backupItem('bjt', 'BJT R2 latest manifest', bjt, ['generatedAt', 'generated_at', 'created_at', 'date'], now, {
    maxAgeHours: BJT_BACKUP_MAX_AGE_HOURS
  }), bjtHistory);
  const progressItem = attachBackupHistory(progressBackupItem('progress-production', 'Progress production D1 export', progressProduction, 'production', 'progress', now), progressHistory);
  const progressProductionSqlItem = d1BackupItem('progress-production-sql', 'Progress production SQL export', progressProductionSql, 'production', 'progress', 'd1/progress/production/', now, { expectedKind: 'progress-d1-sql-backup-manifest' });
  const previewBase = progressBackupItem('progress-preview', 'Progress preview JSON export', progressPreview, 'preview', 'progress-otp-preview', now, { warningAgeHours: 36, criticalAgeHours: 48 });
  const previewItem = !previewProgressBucket
    ? previewUnavailableItem(previewBase, 'MONITOR_BINDING_MISSING', 'missing PROGRESS_BACKUP_PREVIEW binding')
    : previewHistory?.history_unavailable
      ? previewUnavailableItem(previewBase, 'MONITOR_HISTORY_UNAVAILABLE', previewHistory.history_error || 'preview backup history unavailable')
      : attachBackupHistory(previewBase, previewHistory, now);
  const previewSqlBase = d1BackupItem('progress-preview-sql', 'Progress preview SQL export', progressPreviewSql, 'preview', 'progress-otp-preview', 'd1/progress/preview/', now, {
    expectedKind: 'progress-d1-sql-backup-manifest', warningAgeHours: 36, criticalAgeHours: 48
  });
  const previewSqlItem = !previewProgressSqlBucket
    ? previewUnavailableItem(previewSqlBase, 'MONITOR_BINDING_MISSING', 'missing PROGRESS_DB_BACKUP_PREVIEW binding')
    : previewSqlBase;
  const niceItem = attachBackupHistory(d1BackupItem('nice-analytics-production', 'nice_analytics production D1 export', niceAnalyticsProduction, 'production', 'nice_analytics', 'd1/nice_analytics/production/', now), niceAnalyticsHistory);
  return {
    generated_at: now.toISOString(),
    items: [
      bjtItem,
      progressItem,
      progressProductionSqlItem,
      previewItem,
      previewSqlItem,
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

export async function readProgressBackupHistory(bucket, expectedEnvironment, expectedDatabase, now, days = 7) {
  const today = jstDateKey(now);
  if (!bucket || !today) return unknownBackupHistory(today, days, 'preview backup history unavailable');
  let listed;
  try {
    listed = await bucket.list({ prefix: `d1/progress/${expectedEnvironment}/`, limit: 1000 });
  } catch (error) {
    const rows = unknownBackupHistory(today, days, clean(error?.message || 'preview backup history list failed', 300));
    rows.history_unavailable = true;
    rows.history_error = rows[0]?.error || 'preview backup history list failed';
    return rows;
  }
  const candidates = (listed.objects || [])
    .filter((object) => new RegExp(`^d1/progress/${expectedEnvironment}/\\d{4}-\\d{2}-\\d{2}T[^/]+\\.json$`).test(String(object.key || '')))
    .sort((a, b) => String(b.key).localeCompare(String(a.key)));
  const byDate = new Map();
  for (const object of candidates) {
    const timestamp = timestampFromProgressBackupKey(object.key);
    const date = jstDateKey(timestamp);
    if (!date || byDate.has(date)) continue;
    byDate.set(date, object);
  }
  const rows = [];
  for (let offset = 0; offset < days; offset += 1) {
    const date = shiftDateKey(today, -offset);
    const object = byDate.get(date);
    if (!object) {
      rows.push({ date, ok: false, status: 'missing', latest_at: '', error: 'no successful manifest for date' });
      continue;
    }
    const result = await readR2Json(bucket, object.key);
    const data = result.data || {};
    const valid = result.ok
      && data.kind === 'progress-d1-backup'
      && data.environment === expectedEnvironment
      && data.database === expectedDatabase
      && String(data.object_key || '').startsWith(`d1/progress/${expectedEnvironment}/`);
    rows.push({
      date,
      ok: valid,
      status: valid ? 'complete' : (result.ok ? 'invalid' : result.status),
      latest_at: firstDateValue(data, ['generated_at', 'generatedAt', 'created_at', 'date']) || result.updated_at || '',
      error: valid ? '' : (result.error || 'preview manifest validation failed')
    });
  }
  return rows;
}

function timestampFromProgressBackupKey(key) {
  const match = /^d1\/progress\/preview\/(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z\.json$/.exec(String(key || ''));
  if (!match) return '';
  const value = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.${match[7]}Z`;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  if (parsed.getUTCFullYear() !== Number(match[1])
    || parsed.getUTCMonth() + 1 !== Number(match[2])
    || parsed.getUTCDate() !== Number(match[3])
    || parsed.getUTCHours() !== Number(match[4])
    || parsed.getUTCMinutes() !== Number(match[5])
    || parsed.getUTCSeconds() !== Number(match[6])
    || parsed.getUTCMilliseconds() !== Number(match[7])) return '';
  return parsed.toISOString();
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

export function progressBackupItem(key, label, result, expectedEnvironment, expectedDatabase, now = new Date(), options = {}) {
  if (result?.ok && result.data?.kind === 'progress-d1-r2-daily-backup') {
    return dailyD1BackupItem(key, label, result, now);
  }
  return d1BackupItem(key, label, result, expectedEnvironment, expectedDatabase, `d1/progress/${expectedEnvironment}/`, now, options);
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

export function d1BackupItem(key, label, result, expectedEnvironment, expectedDatabase, expectedPrefix, now = new Date(), options = {}) {
  const data = result.data || {};
  const dateValue = firstDateValue(data, ['generated_at', 'generatedAt', 'created_at', 'date']) || result.updated_at || '';
  const warningAgeHours = Number(options.warningAgeHours || 0) || null;
  const maxAgeHours = Number(options.criticalAgeHours || DAILY_BACKUP_MAX_AGE_HOURS);
  const { ageMs, fresh: ageFresh } = backupAge(dateValue, now, maxAgeHours);
  let validationError = '';
  if (result.ok && data.environment !== expectedEnvironment) {
    validationError = `manifest environment mismatch: expected ${expectedEnvironment}, got ${data.environment || '<missing>'}`;
  } else if (result.ok && data.database !== expectedDatabase) {
    validationError = `manifest database mismatch: expected ${expectedDatabase}, got ${data.database || '<missing>'}`;
  } else if (result.ok && !String(data.object_key || '').startsWith(expectedPrefix)) {
    validationError = `manifest object key crosses environment boundary: ${data.object_key || '<missing>'}`;
  } else if (result.ok && options.expectedKind && data.kind !== options.expectedKind) {
    validationError = `manifest kind mismatch: expected ${options.expectedKind}, got ${data.kind || '<missing>'}`;
  }
  const fresh = result.ok && ageFresh;
  const ok = fresh && !validationError;
  const ageHours = Number.isFinite(ageMs) ? ageMs / 3600000 : null;
  const warning = Boolean(result.ok && !validationError && warningAgeHours && Number.isFinite(ageHours) && ageHours > warningAgeHours && ageHours <= maxAgeHours);
  return {
    key,
    label,
    environment: expectedEnvironment,
    database: expectedDatabase,
    object_key: result.key,
    backup_object_key: data.object_key || '',
    status: ok ? (warning ? 'warning' : 'ok') : (validationError ? 'environment_mismatch' : (result.ok ? 'stale' : result.status)),
    ok,
    latest_at: dateValue,
    max_age_hours: maxAgeHours,
    ...(warningAgeHours ? {
      warning_age_hours: warningAgeHours,
      critical_age_hours: maxAgeHours,
      freshness_level: warning ? 'warning' : (ok ? 'ok' : 'critical')
    } : {}),
    age_hours: Number.isFinite(ageMs) ? Math.round(ageMs / 36000) / 100 : null,
    error: result.error || validationError || (!fresh && result.ok ? `latest manifest is older than ${maxAgeHours}h: ${dateValue || '<missing>'}` : ''),
    source: 'R2'
  };
}

function previewUnavailableItem(item, code, detail) {
  const message = `${code}: ${detail}`;
  return {
    ...item,
    ok: false,
    status: code,
    error: message,
    detail,
    history_7d: null,
    success_days_7d: null,
    success_rate_7d: null,
    history_skipped: null,
    last_success_at: '',
    consecutive_failures: null,
    failure_date: '',
    failure_stage: 'monitor'
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
  const [backups, deployments, probes, expiries] = options.statuses || await Promise.all([
    getBackupStatus(env),
    getDeploymentStatus(env),
    getProbeSummary(env),
    getExpiryStatus()
  ]);
  const redItems = collectAlertItems(backups, deployments, probes, expiries);
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

export function collectAlertItems(backups, deployments, probes, expiries) {
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
  if (expiries?.status === 'config_error') {
    items.push({
      type: 'expiry',
      key: 'config',
      label: 'Expiry watch config',
      status: 'config_error',
      detail: expiries.error || 'expiry config error',
      latest_at: expiries.generated_at || '',
      fingerprint: `expiry:config:${expiries.error || 'unknown'}`
    });
  }
  for (const item of expiries?.items || []) {
    if (item.status === 'red' || item.status === 'expired') {
      items.push({
        type: 'expiry',
        key: item.name,
        label: item.name,
        status: item.status,
        detail: `${item.kind} expires_on=${item.expires_on}; owner=${item.owner}; ${item.renew_url_or_note}`,
        latest_at: item.expires_on,
        fingerprint: item.fingerprint || `expiry:${item.kind}:${item.name}:${item.expires_on}:${item.status}`
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
  const expiryItem = redItems.find((item) => item.type === 'expiry');
  const subject = status === 'red' && backupItem?.alert_kind === 'silent'
    ? `${prefix}[P0] Backup silent: ${backupItem.key} ${backupItem.failure_date} (no artifact by JST 12:00)`
    : status === 'red' && backupItem?.alert_kind === 'escalation'
      ? `${prefix}[P0] Backup failure: ${backupItem.key} ${backupItem.failure_date} ${backupItem.failure_stage || 'backup'} (day ${backupItem.consecutive_failures})`
      : status === 'red' && backupItem
        ? `${prefix}Backup failure: ${backupItem.key} ${backupItem.failure_date} ${backupItem.failure_stage || 'backup'}`
        : status === 'red' && expiryItem
          ? `${prefix}[Nice Dashboard] Expiry alert: ${expiryItem.key}`
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
      'Nice dashboard recovery: backups, deployments, probes, and expiries are all green.',
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
  collectConfigSnapshot,
  configuredSearchConsoleSites,
  configuredBingSites,
  checkPathContract,
  diffSnapshotJson,
  evaluateDashboardAlerts,
  auditMonthRangeJst,
  assertReadOnlySql,
  buildAuditHumanMetricRows,
  collectAuditBjtOrderAggregates,
  collectAuditProgressAggregates,
  createReadOnlyD1,
  createReadOnlyKv,
  getAuditHumanMetricsStatus,
  getExpiryStatus,
  isFastPathCheckFailure,
  normalizeSnapshot,
  normalizeBingQueryRow,
  normalizeSearchTermSource,
  parsePage,
  buildDailyBossBrief,
  runAuditHumanMetrics,
  runConfigSnapshot,
  sanitizeSecretName,
  sha256Hex,
  shouldSendPathCheckAlert,
  stableFingerprint,
  validateAuditHumanDataPlan,
  validateExpiryConfig
};
