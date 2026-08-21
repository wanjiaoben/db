<!--WAN-CONSTITUTION-START version=v1.16-->
# WAN Constitution v1.16

更新日期:2026-08-22
Changelog:v1.16 补“自动邮件与测试发信附则”,划清 CC 代理发信禁令与系统自动邮件验收边界。

唯一源头:wan-rules 仓库。各 repo CLAUDE.md 中的宪法区间由脚本同步生成,禁止手改。修改仅限 Wan 本人确认,每次修改版本号 +1 并同步全部 repo。
设计背景参考:docs/REVIEW_2026-0707_SYSTEM_DESIGN.md;CC 开工前必读 rules/ANTI_PATTERNS.md。该引用为 v1.8 设计背景与执法清单,非新增宪法条文。

一、运转条款

任务编号与留痕:每条任务指令编号采用 `M{MMDD}-{序号}`(如 `M0717-01`);本日 `0717J-{序号}` 变体(如 `0717J-01`)同样有效。回报以编号开头,结论同步写入 PROGRESS.md(编号+一行结论)。无回报 = 未完成。
指令闭环:每条指令以回报要求结尾;每日收工执行一次收尾确认,清空悬空任务。
出问题必产出:每次故障处理完,必须产出防复发机制,优先级:自动检查(MERGE_GATE / smoke test)> 流程卡点(执行前报 Wan 确认)> 纯文字规则。纯文字规则每季度盘点,一季度未触发即删除或降级。
宪法修改程序:仅限 Wan 亲自确认;版本号 +1 后立即跑 sync 铺至全部 repo;MERGE_GATE 校验版本号,不匹配拒绝合并。
任务三分类:任务指令首行必须标注 A功能 / B内容 / C包装。A功能按全流程严管;B内容按产题、产词、加词工場规则推进,不得被无关技术流程阻塞;C包装仅允许在限定文件范围内试错。
Platform First:新增任何能力(Prompt/Schema/Workflow/工具/规则)前必答:产品能力还是平台能力?可做成平台能力的,禁止做成产品专属。平台能力入 shared 层,随 sync.sh 分发;产品层仅允许配置与扩展字段,禁止 fork 平台逻辑。
Evidence before Abstraction:任何抽象(共享模块/schema/generator/框架)必须来自 ≥2 个真实案例。禁止为预测中的需求做抽象;重复出现之后再抽象。流程升级为自动化/Agent/Generator:手动跑满20次且 SOP 稳定两周无修订。product-template 产品级变量以 {{PRODUCT_XXX}} 占位符登记于 product.config.md;generator 待第3个产品复制完成后立项。
Needs pool 门禁:新条目必填 reuse/auto/compound 三布尔 + platform|product 标注。三否且未标 [一次性但必要] 者,默认不排期。

二、红线条款

### 支付与付费客人红线

总红线:任何改动——无论大小、无论哪个仓——不得影响①已付费客人的学习使用、②支付系统收钱、③预授权系统。任一项受影响即 P0。每车发车回报必须显式写明“对三项零影响”,并附证据:付费账号回归、建单/下单探针、授权页铁律四项。

海外客人支付红线:客人支付/授权页不得以只对部分国家开放的嵌入式组件(如 PayPal Advanced Card Fields)作为唯一卡付路径;卡付必须有一条不挑买家国家的通道。支付容器必须 `notranslate`。任何支付组件加载必须有超时兜底文案,不许静默转圈。发车前 CC 必须在日本实际点通页面上每一个支付按钮(改样式也算碰支付)。上线后第一位海外客人走通前由克劳德盯住,出问题当天修。

支付页零回归铁律:凡触碰客人支付/授权页(文案、样式、版式、后台、路由、配置,不论多小)的车,发车前必做四项:①diff 限定在声明的文件,不碰未声明的 Worker 逻辑/路由/配置;②CC 用真实浏览器开生产或 preview 短链截图,PayPal 钮、卡付表单、引导文同屏可见;③无卡 POST 探测支付接口返业务 400(非 404/405),证明路由在;④发布后 10 分钟内复核生产一次。四项缺一不得宣布完成。

### 自动邮件与测试发信附则

1. “CC 不得代理发送邮件/消息”指:CC 不得以 Wan、公司或任何品牌名义,向真实客人、学员、合作方或任何真人发送任何消息(邮件/LINE/WhatsApp/SNS 私信/评论均含)。
2. 下列情形不在禁令内,属于验收被测系统,CC 应当执行而非推回 Wan:
   - 系统在 Sandbox / preview / 测试环境触发的自动交易邮件(授权确认、告警、摘要等),收件人为 CC 自己控制的测试邮箱或 Resend 测试域地址;
   - 发往 info@nice.okinawa 的系统告警/失败通知/测试通知(主题前缀 [TEST]);
   - 生产环境的定时巡检邮件、备份告警、空队列预警等无真实客人收件人的系统邮件。
3. 任何情况下,收件人字段出现真实客人地址即属禁令范围;测试时不得借用真实订单的 guest_email。
4. 生产环境发往真实客人的邮件,只能由客人自身行为触发(如完成预授权),CC 不得手动补发、重发、代发;需要补发的由 Wan 亲自操作或明确逐条授权。
5. 引用本禁令推回验收前,先对照第 2 条;误用禁令导致验收未完成,视同未交车。

附则:Worker 自有路径必须由单一常量表生成全部域名的路由,并有“每条路径 × 每个域”的测试断言(0821 四次漏路由的教训)。

付费状态机:任何产生费用的操作必须且只能处于以下三态之一:①禁止:无有效授权,不得执行;②单次授权:Wan 明确授权一个具体付费动作,授权仅对该次动作有效,动作完成、取消或条件变化后立即回到禁止态;③额度预授权:Wan 明确指定服务、用途、额度上限和有效期,仅可在全部边界内执行,额度耗尽、到期或条件变化后立即回到禁止态。ElevenLabs 不超过 5000 credits 的授权归入额度预授权态。状态不明确时按禁止态处理。发信、联络客人不进入本状态机,一律禁止由 agent 执行。
部署五步:分支 → 预览 → Wan 隐身验收 → merge → tag。永不直碰 main。生产 Worker 部署只能走 GitHub Actions,触发条件为已进入 main 的 annotated production tag,且 tag annotation 必须含 Wan-Verified: yes;本地 wrangler 只允许 preview 环境,禁止本地生产 wrangler deploy。
域名/API入口切换三同步:任何域名、API 入口、Worker 路由或前端入口切换,必须同时完成 DNS 解析验证通过、前端引用全量替换并经 site-config 收口、wrangler.toml 路由固化;三者未齐禁止合并 main。
冻结区改动红线:触碰 FREEZE.md 定义的冻结区即为高风险任务,必须单独任务、单独分支;指令必须列明允许修改的文件清单,清单外禁止改动。
密钥零明文:密钥只进 wrangler secret / 环境变量,禁止出现在代码、配置文件、仓库、聊天记录明文中。
生产数据默认只读:生产 KV / D1 / R2 默认只读;写入仅限 cctest 范围(fixture:cctest@nice.okinawa,OTP 135790,entitlement source "cctest",排除于营收统计)。
声明式生产 KV 导入通道:经 Wan 逐次明确授权的内容导入,必须将数据包、导入脚本、源 sha256、旧包备份路径一并入仓 PR;导入动作只能由已进入 main 的 Wan-Verified annotated tag 触发的 GitHub Actions job 执行,禁止本地或账外 kv put;必须先完成 preview 验证再执行 production;每次导入的 PR body 与 records 均须留痕。该通道只允许声明的 KV 内容导入,不改变 D1/R2 默认只读与 cctest 约束。
证据归档窄豁免:经 Wan 逐次明确授权的证据归档工作流,可对生产 R2 执行一次性、纯加法写入,且仅限授权中指名的固定新对象;前置存在性检查,目标对象已存在即拒绝执行;禁止删除、覆盖、修改任何既有对象;每次执行必须回报行数与哈希守恒证据。
手动操作权益留痕:任何开通、延期、调整、补偿、撤销权益的手动操作,必须走脚本写入 entitlement_log;禁止只改 KV 或后台状态而不留痕。
测试邮件红线:禁止向真实用户地址发测试邮件;邮件链路测试只允许使用 cctest 范围或 Wan 明确指定的测试地址,不得把真实客户邮箱用于 smoke test / webhook replay / resend retry。
对 Wan 的沟通:全程简体中文;结论先行、短句、少专业术语,术语首次出现须一句话解释;需要 Wan 操作的步骤逐步可点;给 CC 的指令用代码块,内不嵌解释。凡增加 Wan 阅读负担的输出视为违反本条。方案一次给全、给最优解,禁止发出后追加补丁式选项。任务指令固定格式:代码块首行为任务编号+仓库名+一句话任务;回报首行为同一编号。
CC 交付固定六栏:所有 CC 交付必须包含且仅清晰呈现六栏:改了什么 / 修改文件 / 明确未改 / 自测结果 / 风险点 / 回滚方式。
Preview 交付双链接:CC 交付任何 preview 审核页时,必须同时提供①本地 file:// 绝对路径 ②Cloudflare Pages 公网 URL 两个链接,Wan 在电脑用本地、手机用公网。禁止只给 file:// 本地路径(Wan 手机无法访问)。
Preview 链接铁律:主链接必须是 Cloudflare Pages 真实 deployment URL(hash 子域),从部署记录复制,禁止手拼分支子域。必须是手机浏览器可直接点开的公网 https;给出前 CC 必须 curl 一次并贴 HTTP 状态码,证明非 404 且 success。file:// 仅作附加,不得作唯一或主验证链接。多页面改动时每页各给一条完整可点链接。违反即交付不合格,Wan 可直接打回,不进入 Wan-Verified。
核心链路保护:核心用户链路(登录、取题/取词、作答、判分、复盘、支付)的改动必须独立分支、独立验收,禁止与新功能混合合并;每类内容(题目/单词/音频)入库必须通过对应校验脚本,无校验脚本的内容类型不得批量入库;大规模推广前,监控+备份+核心链路探测必须全部在位。
【铁律·SINKOLABO UI 语言判定】
所有 SINKOLABO 站点 UI 语言必须经全站唯一的共享 resolver 判定,统一优先级为:`localStorage.bjt_ui_lang` > URL 参数 `?lang=` / `?ui=` > `navigator.languages`。`navigator` 是默认值而不是例外;客人手动选过的语言永远压过 URL 与浏览器语言。
`navigator.languages` 按顺序匹配:`zh-TW` / `zh-Hant` / `zh-HK` / `zh-MO` → `zh-tw`;`zh` / `zh-CN` / `zh-Hans` / `zh-SG` → `zh`;其它一切语言 → `en`。语言标签匹配必须大小写不敏感,并允许后续地区子标签。
禁止任何页面自带默认语言硬编码;禁止任何页面直接读取 `navigator.language` 或 `navigator.languages`,只能调用共享 resolver;新页面接入 i18n 时默认继承本规则,不得另立默认值。
本条必须配 CI 硬门禁:至少包含优先级与完整映射表单测、全站唯一实现点断言、禁止页面直读 navigator 的静态扫描;无门禁视为未实现。决策缘由与验收口径见 `docs/ADR_M0716-10_SINKOLABO_UI_LANGUAGE_RESOLUTION.md`。
【铁律·安全承诺验收】
任何安全承诺必须配套 CI 机器门禁方视为存在;无门禁的安全规则视同未执行。先例:study/mogi 四联 disjoint 门禁、59 条匿名泄漏探针、内容级付费特征扫描、计数防陈旧 `--check`。
“堵漏洞/关闭访问”类任务,验收必须包含反向证据(匿名/无权限访问失败的实测输出);施工方回报“已完成”不构成验收,只认机器门禁绿+反向证据。
对话/排查中诊断出的任何漏洞缺陷,必须当场编号并落档 `BACKLOG.md`/`PROGRESS.md`,禁止只存在于对话。案底:2026-07-02 Study 白用漏洞未落档,5 日后集体误记为已修,酿成 2026-07-12 裸奔事故的一部分。
【铁律·定期安全巡检】
每两周执行一次全量安全巡检,以 launchd 定时任务部署于 Mac mini(24h 无人值守机)自动执行,禁止依赖任何人的记忆。巡检内容:匿名探针全量打生产+本期新增静态资产/路由的泄漏扫描+FREEZE 冻结项门禁在位复核。异常即通知 Wan;无异常仅落 `reports/`。发现的漏洞按【铁律·安全承诺验收】第三款落档,修复后将路径纳入探针。
【铁律·施工与验收分离】
凡触及 FREEZE、安全/权益/支付、或“堵漏洞”类任务,施工与验收必须为两个独立 CC 会话;验收方不继承施工方上下文,仅获任务目标原文+PR 号,从零核验并交反向证据;施工方自测仅供参考。Wan 只依据机器门禁绿+独立验收报告合并。低风险任务(文案/report-only/纯样式)豁免。案底:2026-07-12 独立验收两轮抓出施工方遗漏——`question_difficulty.js`、PATTO 整目录裸词库——证明此机制必要。
【铁律·study/mogi 池不相交】
study 与 mogi（含模拟题预备池）题库内容必须永久不相交(disjoint)。
判定口径=四联：归一化题干(text，无则script，去全部空白) ＋ 选项集合(去空白、不计序) ＋ correct ＋ 音频文件名basename。任一题不得同时存在于 study 与 mogi/预备池。
出题铁律：所有新题只出到 study；经遴选升级为模拟题者，"移动"进模拟题预备池并同时从 study 删除（不是复制），一题只居其一。mogi 套题只从预备池组装，禁止从 study 现抽。
目的：刷 study 的用户在模拟考中绝不遇到已练过的题。
案底（为何有此门禁，勿删）：2026-06-02 已决策两池内容独立、模拟题"不从练习题里抽"；2026-06-06 立 mg/ps 前缀命名护栏；但无自动强制，2026-07-03 组装 mogi set04 时直接从 study bank 抽取组装，累计 208 道重叠，2026-07-12 事故修复(PR#59)并建本门禁。规则无门禁=形同虚设，此条为证。
电子书权益命名 SOP:电子书权益 ID 格式为 book_<书名英文>-<语言>。语言段小写且必带:简体=zh,英文=en,繁中=tradition。书名英文固定为 script(台本),lipstick(润唇膏),480(480+ 去 + 号)。权益 ID 一经上线不可改名,改名即已购用户权限失效。
Exit Rule:资产默认可删。每季度清点 shared 层资产:90天零引用移入 /deprecated/,保留一个版本周期后物理删除。Repo/Product 级退出由 Wan 单独裁决。FREEZE.md 覆盖区不适用。禁止以"历史兼容"为由无限期保留;确需兼容者写明截止日。
(空位):留给盘点后确认的真全局项。
<!--WAN-CONSTITUTION-END-->

# progress · nice.okinawa

> 每次开工前必须读完。本文件是 progress 项目的工作规则和目标结构说明。

部署强制入口：任何部署动作前必须先读 `rules/DEPLOY_GATE.md`。
部署后必须运行 `scripts/post_deploy_verify.sh <上一版 Worker version ID>`。

---

## 项目定位

Progress 是 nice.okinawa 的 **Language Memory Engine**。

Progress 不是课程网站。

Progress 不是考试网站。

Progress 的目标是帮助用户把语言知识长期记住。

当前核心 Learning Deck 是 `GDP TOP3`。

`GDP TOP3` 的目标不是考试，也不是单纯背单词，而是维护：

```text
English ⇄ Japanese ⇄ Chinese
```

三语长期能力。

核心链路：

```text
Course
  ↓
Learning Deck
  ↓
Mode
  ↓
FSRS
```

Progress 应逐渐变成由 `Content + Mode + FSRS` 驱动的学习平台，而不是页面驱动的平台。

当前产品方向：

- 移动优先的学习 App
- `index.html` 是唯一入口
- 学习逻辑可以继续保持 inline，保证静态部署简单
- 内容数据、课程树、测评题库、音频和资源应逐步从 HTML 中拆出
- Course、Learning Deck、Assessment、Mode 必须分层管理
- 用户学习记录使用浏览器 `localStorage`
- 所有 Learning Deck 共用同一个 FSRS 记忆引擎
- 所有 Mode 的学习结果最终统一进入 FSRS

---

## 四层结构

### 1. Course（课程）

Course 用于系统学习。

Course 包含：

- 视频
- 课程树
- 学习路径
- 解锁关系

当前 Course：

- KISO

未来 Course：

- KISO
- Business Japanese Fundamentals
- Travel Japanese Fundamentals

Course 的目标是让用户理解内容。

### 2. Learning Deck（记忆内容）

Learning Deck 用于长期记忆。

所有 Learning Deck 都可以进入 FSRS。

当前和未来 Learning Deck：

- GDP TOP3
- Business Japanese
- Travel Japanese
- Golf Japanese
- JLPT Vocabulary
- BJT Vocabulary

Learning Deck 是内容。

Learning Deck 不是页面。

Learning Deck 不是功能。

未来新增内容时，优先新增 Learning Deck。

不要新增系统。

#### GDP TOP3 结构

GDP TOP3 当前采用：

```text
CEFR
  ↓
Category
  ↓
Catalog
  ↓
Word
```

CEFR：

- A1
- A2
- B1
- B2
- C1
- C2

Progress 选词和页面展示使用 5 档产品等级。

产品等级与 CEFR 的关系固定为：

| Progress level | CEFR | 含义 |
| --- | --- | --- |
| Basic | A1-A2 | 基础生存和日常高频词 |
| Medium | B1 | 日常工作和生活可用词 |
| Advanced | B2 | 职业沟通和阅读核心词 |
| Excellent | C1 | 高级阅读、表达和专业理解词 |
| Super | C2 | 接近母语级别的高阶词 |

选词时必须同时标注：

- `cefr`
- `level`

其中 `level` 必须按上表从 `cefr` 自动或人工一致映射，不允许出现矛盾。

Progress 不是推翻最初企画。

最初企画的方向仍然成立：

- 多语言学习法
- 分类词库
- 重复记忆

Progress 是把原来想写成书的内容系统化。

- 书：解释为什么这样学
- Progress：负责每天这样学

两者未来可以互相导流。

#### GDP TOP3 Category V1

当前 GDP TOP3 分类体系固定为：

- Core
- Professional
- Finance & Market
- Tech & Digital
- Academic
- Personal
- Growth & Psychology

Category 说明：

##### Core

- Daily & Utility
- 内容：
  - 高频词
  - 连接词
  - 时间
  - 数量
  - 基础动词
  - 职场通用表达

##### Professional

- Business & Trade
- 内容：
  - 邮件
  - 会议
  - 提案
  - 合同
  - 法务
  - 人事
  - 会计
  - 物流
  - 国际贸易
  - 汽车出口

##### Finance & Market

- 内容：
  - 宏观经济
  - 汇率
  - 财务报表
  - 投资
  - 金融市场

##### Tech & Digital

- 内容：
  - IT
  - AI
  - SaaS
  - Cloud
  - Automation
  - Internet
  - Programming

##### Academic

- 内容：
  - 文学
  - 艺术
  - 社会
  - 政治
  - 科学
  - 环保

##### Personal

- Lifestyle & Leisure
- 内容：
  - 旅游
  - 酒店
  - 高尔夫
  - 钓鱼
  - 潜水
  - 滑雪
  - BBQ
  - 户外

##### Growth & Psychology

- 内容：
  - 心理学
  - 情绪管理
  - 学习方法
  - 认知提升
  - 健身
  - 自我成长

Catalog 应继续细分到可学习单元，例如：

- Professional
  - Email
  - Meeting
  - Contract
  - Sales
  - Logistics
  - HR
- Tech & Digital
  - AI
  - Programming
  - Cloud
  - Automation
- Personal
  - Travel
  - Golf
  - Fishing
  - Diving

GDP TOP3 每个词条必须同时具备：

- English
- IPA
- Japanese
- Chinese
- CEFR
- Category
- Catalog
- Audio EN
- Audio JP

目标规模：

- A1 ~ C2
- 10000 ~ 15000 词

当前阶段：

- 先用 10 个测试词验证系统
- 然后扩展到 A1 / A2 / B1
- 再扩展到 B2 / C1 / C2

### 3. Assessment（测评）

Assessment 用于检验学习结果。

Assessment 不属于 Learning Deck。

Assessment 不属于 Course。

Assessment 是独立层。

未来 Assessment：

- BJT Practice
- BJT Mock Exam
- JLPT Practice
- JLPT Mock Exam

Assessment 的目标是测验学习成果。

Assessment 不负责记忆。

Assessment 负责发现弱点。

发现的弱点应自动回流到 Learning Deck 与 FSRS。

示例闭环：

```text
BJT Mock
  ↓
发现「稟議」不会
  ↓
自动加入 Weak Words
  ↓
进入 FSRS
  ↓
重新复习
```

### 4. Mode（学习模式）

Mode 是学习方式。

所有 Learning Deck 应尽量复用同一套 Mode。

目标 Mode：

- Card
- MCQ
- Listening
- PATTO
- Typing
- Sentence

#### Card

翻卡模式。

示例：

```text
Approval
  ↓
承認
```

#### MCQ

mikan 风格四选一。

示例：

```text
Approval

1. 承認
2. 契約
3. 会議
4. 交渉
```

#### Listening

听音选答案。

示例：

```text
播放音频：Approval
  ↓
选择正确日语
```

#### PATTO

PATTO 是 Progress 的特色模式。

流程：

```text
听
  ↓
翻
  ↓
评
```

评分：

- 秒懂
- 模糊
- 没印象

#### Typing

输入答案。

适合高级用户。

#### Sentence

句子记忆。

示例：

```text
Please confirm.
  ↓
ご確認お願いいたします。
```

---

## FSRS

所有 Mode 最终统一进入 FSRS。

FSRS 保存：

- stability
- difficulty
- due
- review history

所有 Learning Deck 共用同一个记忆引擎。

---

## View

### Weak Words

Weak Words 不是 Learning Deck。

Weak Words 是视图（View）。

来源：

- 所有 Learning Deck

自动筛选：

- 低记忆率
- 高频 Again
- 高频 Hard

### Bookmark Review

Bookmark 不是 Learning Deck。

Bookmark 是视图（View）。

来源：

- 所有 Learning Deck

用户收藏的内容统一管理。

---

## 产品原则

未来新增内容：

- 优先新增 Learning Deck

未来新增学习方式：

- 优先新增 Mode

避免：

- 一个课程对应一套新页面
- 一个内容对应一套新系统

这版架构的关键变化：

```text
KISO / KEY / BJT
```

不再被视为同一层级的“产品”，而是被重新拆分为：

```text
Course / Learning Deck / Assessment
```

这样未来扩展到 10 个、20 个内容包时，系统不会变乱。

---

## 最终架构图

```text
Progress
├─ Course
│  └─ KISO
├─ Learning Deck
│  ├─ KEY
│  ├─ Business Japanese
│  ├─ Travel Japanese
│  ├─ Golf Japanese
│  ├─ JLPT Vocabulary
│  ├─ BJT Vocabulary
│  ├─ Sentence Deck
│  └─ Audio Deck
├─ Mode
│  ├─ Card
│  ├─ MCQ
│  ├─ Listening
│  ├─ PATTO
│  ├─ Typing
│  └─ Sentence
├─ FSRS Engine
│  └─ Shared Memory Engine
├─ Assessment
│  ├─ BJT Practice
│  ├─ BJT Mock Exam
│  ├─ JLPT Practice
│  └─ JLPT Mock Exam
└─ Views
   ├─ Weak Words
   ├─ Bookmark Review
   ├─ New Cards
   └─ Due Today
```

---

## 完整学习循环

```text
Course
  ↓
Learning Deck
  ↓
Mode
  ↓
FSRS
  ↓
Assessment
  ↓
Weak Words
  ↓
FSRS
```

---

## 目标目录结构

```text
learn/
  index.html                   # 唯一入口，所有逻辑 inline
  CLAUDE.md                    # 本文件
  data/
    ui_strings.json            # 6语言UI文字包
    courses/
      kiso.json                # KISO课程树
    decks/
      learning_deck_manifest.json       # Learning Deck 元数据与可用 Mode 声明（目标）
      gdp_top3.json            # GDP TOP3 Learning Deck 词汇
      business_japanese.json   # Business Japanese Learning Deck（目标）
      travel_japanese.json     # Travel Japanese Learning Deck（目标）
      golf_japanese.json       # Golf Japanese Learning Deck（目标）
      jlpt_vocabulary.json     # JLPT Vocabulary Learning Deck（目标）
      bjt_vocabulary.json      # BJT Vocabulary Learning Deck（目标）
    assessments/
      bjt_practice.json        # BJT Practice（目标）
      bjt_mock_exam.json       # BJT Mock Exam（目标）
      jlpt_practice.json       # JLPT Practice（目标）
      jlpt_mock_exam.json      # JLPT Mock Exam（目标）
  audio/
    en/
      gdp_00001_en.mp3 ...
    jp/
      gdp_00001_jp.mp3 ...
  assets/
    icons/
    images/
```


---

## 核心文件规则

### `index.html`

- 是唯一用户入口
- 可以继续包含主要 UI、路由、学习状态、FSRS、交互逻辑
- 不要拆成复杂前端框架，除非明确要求
- 保持静态站可直接部署
- 页面必须移动端可用
- 修改后必须验证：
  - 首页加载
  - 底部导航可切换
  - Learn / Stats / Profile 基本渲染
  - KEY 学习入口可打开
  - 控制台没有明显 error

### `data/ui_strings.json`

- 存放 6 语言 UI 文案
- 目标语言：
  - 简体中文
  - 繁體中文
  - English
  - 日本語
  - 한국어
  - ภาษาไทย
- 新增 UI 文案时，必须同步补齐 6 语言，不能只写一种语言

### `data/courses/*.json`

- 存放 Course 数据
- Course 用于系统学习和理解
- Course 可包含视频、课程树、学习路径、解锁关系
- KISO 属于 Course

### `data/decks/*.json`

- 存放 Learning Deck 数据
- Learning Deck 用于长期记忆
- Learning Deck 必须能进入 FSRS
- Learning Deck 应声明可用 Mode
- Learning Deck 内容可以是词汇、句子、表达、场景卡片
- 当前核心 deck 文件是 `data/decks/gdp_top3.json`
- GDP TOP3 的 Word 字段至少包含：
  - `id`
  - `en`
  - `ipa`
  - `jp`
  - `reading`
  - `cn`
  - `cefr`
  - `category`
  - `catalog`
  - `audio_en`
  - `audio_jp`
- GDP TOP3 编号规则：
  - ID 不由人工维护
  - 新增词条时必须由系统自动生成
  - 自动检查：
    - 重复 ID
    - 重复英文词
    - 重复日文词
  - 推荐格式：
    - `gdp_{catalog}_{number}`
  - 示例：
    - `gdp_contract_00001`
    - `gdp_travel_00001`
    - `gdp_learning_00001`
  - 音频命名必须与词条 ID 保持一致：
    - `audio/en/gdp_contract_00001.mp3`
    - `audio/jp/gdp_contract_00001.mp3`
  - 英文音频生成规则：
    - 英文词条必须优先补齐英文音频
    - 同一批英文音频必须统一音量标准
    - 不允许出现单词之间忽大忽小的播放体验
    - 如果使用不同 voice profile，仍要做统一响度处理或播放器增益校正
    - 男声与女声必须做统一响度校正，不能默认认为同一家 TTS 服务输出就天然一致
    - 至少要同时满足两条：
      - 音频文件侧做批量 loudness normalize，或
      - 播放器侧按 `profile + language` 做固定增益校正
    - 最终标准不是技术参数本身，而是用户主观听感接近；男/女切换后不能出现一方明显更小声
    - 新增 voice、替换 voice、或补录新批次后，必须复查旧批次与新批次之间的响度一致性

### `data/assessments/*.json`

- 存放 Assessment 数据
- Assessment 用于检验学习结果
- Assessment 不属于 Learning Deck，也不属于 Course
- BJT Practice / Mock Exam、JLPT Practice / Mock Exam 属于 Assessment
- 题目至少包含：
  - `question_id`
  - `module`
  - `category`
  - `difficulty`
  - `stem`
  - `choices`
  - `answer`
  - `explanation`
  - `point`

### `audio/`

- 音频按语言拆目录
- 英文音频：`audio/en/gdp_00001_en.mp3`
- 日文音频：`audio/jp/gdp_00001_jp.mp3`
- 代码中的音频字段必须和目录结构一致
- 英文音频默认要求统一音量；新增批次时要检查新旧文件之间的响度差异
- 男女声、英语、日语都必须纳入统一响度规则，不允许只校正英文女声或只校正单一 voice

---

## 架构层执行规则

### Home

- 显示今日队列
- 显示 streak
- 显示总卡片数、记忆率、连续学习天数
- 队列应该基于 Learning Deck + Mode + FSRS due + new cards 计算
- Home 不是课程页；Home 是记忆引擎的今日入口

### Learn

- Learn 应同时支持 Course 入口和 Learning Deck 入口
- Course 用于理解内容
- Learning Deck 用于长期记忆
- Learn 不应该成为“每个课程一套新页面”的入口
- 新内容包优先进入 Learning Deck 数据或 Course 数据，而不是新增系统

### Course

- Course 用于系统学习和理解
- Course 可以有视频、课程树、学习路径、解锁关系
- 当前 Course 是 KISO
- 未来 Course 可以包括 Business Japanese Fundamentals、Travel Japanese Fundamentals
- Course 完成后，可以把相关记忆内容送入 Learning Deck / FSRS

### Learning Deck

- Learning Deck 是长期记忆内容
- Learning Deck 不是页面、不是功能
- 所有 Learning Deck 应能进入 FSRS
- 当前和未来 Learning Deck：
  - GDP TOP3
  - Business Japanese
  - Travel Japanese
  - Golf Japanese
  - JLPT Vocabulary
  - BJT Vocabulary
- Learning Deck 应声明可用 Mode
- 新增内容时优先新增 Learning Deck，不新增系统

### Assessment

- Assessment 是独立测评层
- Assessment 不属于 Learning Deck
- Assessment 不属于 Course
- Assessment 用于检验学习结果
- Assessment 不负责记忆
- Assessment 负责发现弱点
- Assessment 发现的弱点应自动回流到 Weak Words、Learning Deck 与 FSRS
- 未来 Assessment：
  - BJT Practice
  - BJT Mock Exam
  - JLPT Practice
  - JLPT Mock Exam
- Assessment 结果可以进入统计，但不要和 Learning Deck 记忆内容混为一层

### Mode

- Mode 是学习方式
- Mode 应尽量复用到所有 Learning Deck
- GDP TOP3 第一阶段实际开放：
  - 英→日
  - PATTO
- 当前采用英文优先：日→英暂不在学习前选择器中开放，等英文流程稳定后再加入。
- 英→日四选一：正面使用英文，答案为4个日文选项且只有1个正确；答题后解说语言可在学习前选择日文、中文或日文+中文。
- PATTO：答题前不显示英文、IPA 或答案，只播放一次英文音频并直接显示秒懂、模糊、没印象三个评分按钮；选择评分后才按学习前设置显示日文、中文或日文+中文，再进入下一张。评分写回统一 FSRS。
- 英→日四选一使用独立正面设置。英文单词、IPA、英文音频是3个独立开关，允许显示其中1项、2项或全部，但不得3项全部关闭；PATTO 不共用这组显示开关，固定为纯音频正面。
- 不再把 Reading / Listening 或 Voice + Word / Voice Only / Text Only 作为互斥模式；统一由英文、IPA、英文音频三个独立开关组合。
- 右上角 `🔊 ON / 🔇 OFF` 仍可作为全局静音开关
- Typing 暂不开放
- 新增学习方式时优先新增 Mode，不绑定单一 Learning Deck

### Weak Words

- Weak Words 不是 Learning Deck
- Weak Words 是 View
- 来源是所有 Learning Deck
- 筛选依据：
  - 低记忆率
  - 高频 Again
  - 高频 Hard
  - 低 stability
  - 复习失败记录

### Bookmark Review

- Bookmark Review 不是 Learning Deck
- Bookmark Review 是 View
- 来源是所有 Learning Deck
- 用户收藏内容必须统一管理

### Stats

- 显示热力图
- 显示总记忆项、streak、记忆率、Assessment 正确率
- 显示 FSRS 状态
- 显示 Learning Deck 进度、Mode 练习记录、Weak Words 和 Bookmark Review 入口

### Profile

- 显示等级、XP、徽章、设置
- 支持语言切换
- 支持重置本地学习数据

---

## 实现规则

- 不要引入复杂构建系统，除非明确要求
- 优先保持 GitHub Pages / 静态部署友好
- 数据从 inline 拆出时，使用 JSON 文件
- 如果因为本地 `file://` 限制导致 fetch 不可用，应通过静态服务器验证
- 当前第一阶段以 GDP TOP3 为唯一主验证 deck
- 新内容优先作为 Learning Deck 数据接入，不优先新增页面
- 新学习方式优先作为 Mode 接入，不写死到某个 Learning Deck
- Learning Deck 必须声明可用 Mode
- Mode 必须能写回统一 FSRS 记忆状态
- Weak Words 必须来自 lapse、低正确率、低稳定度或复习失败记录
- Bookmark Review 必须跨 Learning Deck 工作，而不是只服务 KEY
- 不要让页面依赖不存在的音频文件而报错；音频缺失时应静默失败
- localStorage key 变更必须谨慎，避免用户进度丢失
- 修改数据结构时必须考虑旧 localStorage 兼容
- 交互修改后必须做浏览器验证

---

## 下一阶段优先级

下一阶段优先开发学习引擎能力和内容生产，优先级高于新增页面和视觉效果。

1. GDP TOP3 英→日 / 日→英
2. PATTO
3. Weak Words
4. Bookmark Review
5. 音频接入

这些能力完成前，不优先扩展大量新页面。

---

## 内容生产优先级

系统架子已经足够支撑下一阶段，后续产品价值主要取决于高质量内容。

### GDP TOP3 第一阶段词库建设方向

- 可以参考 `English Vocabulary in Use` 的组织思路
- 不要照搬它的 101 个章节
- 当前目标不是一次做 10000 词
- 当前先建立：
  - `GDP TOP3 Core 1000`

这一阶段先验证：

- 词库结构
- 英→日
- 日→英
- PATTO
- FSRS

如果这 5 个环节成立，再从 `100`、`300`、`1000`、`3000` 逐步扩张。

第一阶段优先提词主题：

- Work
- Business
- Travel
- Computers
- Internet
- Social Media
- Media
- Money
- Communication
- Education

原因：

- 与 BJT 重叠度高
- 与租车、旅游、高尔夫业务重叠度高
- 与内容创业、日常工作重叠度高

以下主题暂缓：

- Theatre
- Music
- Clothes
- Weather
- Physical Geography

这些主题以后再扩展。

第一阶段词条字段只保留：

- English
- Japanese
- Reading
- Chinese
- CEFR
- Category
- Catalog

第二阶段再考虑增强字段：

- Word Family
- Synonym
- Opposite
- Collocation
- Phrase

例如：

- `produce / producer / production / productive`
- `approval / approval process / obtain approval`

当前推荐词库生产流程：

用户提供：

- 英文词表
- 或标准 JSON

原始来词收集规则：

- 所有原始来词统一追加到：
  - `data/decks/inbox/gdp_top3_word_log.md`
- 只使用同一个 `md`
- 一行一个词
- 不需要编号
- 第二批、第三批继续直接往下追加
- 每次追加新批次前，先写一行：
  - 日期
  - 本批词数

格式示例：

```md
## 2026-06-09 · 25 words
approval
contract
meeting
```

然后由 GPT 整理：

- JP
- Reading
- CN
- CEFR
- Category
- Catalog

输出标准 JSON 后：

- Codex 入库
- Progress 自动生成：
  - 英→日
  - 日→英
  - PATTO
  - FSRS

导入时必须遵守：

- 不信任人工提供的 `id`
- 由系统根据 `catalog` 自动生成正式 ID
- 先做脏数据检查，再入主库
- 原始批次 JSON 应保留在：
  - `data/decks/batches/`
- 正式主词库写入：
  - `data/decks/gdp_top3.json`

#### GDP TOP3 新词确认闸门

新增 GDP TOP3 词条时，必须先经过用户确认。

不要直接把未确认词写入正式主词库。

不要直接把未确认词发布到线上 GDP TOP3。

简称：

- 用户说 `v`，表示候选词已经确认，可以进入 ElevenLabs 音频生成步骤。
- `v` 包含：生成音频、制作一次性音频确认页、等待用户最终确认。
- `v` 不等于正式入库，不等于 push。
- 用户说 `p`，表示当前已审核版本确认无误，可以正式入库（如适用）、commit 并 push；`p` 不得扩展到尚未审核或与当前任务无关的文件。

确认方式选择：

- 每次生成候选词审核页或音频审核页前，Codex 必须先问用户当前位置。
- 如果用户说“我在电脑前”，使用本机 local 文件或 local 网页确认。
- 如果用户说“我在家 / 同一 Wi-Fi”，使用本地局域网网页确认。
- 如果用户在外面 / 不在同一 Wi-Fi，使用 Obsidian 文件或其他可远程查看的确认方式。
- 不要默认用户一定能打开局域网地址。
- 用户说 `OK` 并且内容正式入库后，必须删除所有一次性审核文件、临时审核网页、临时预览页。

外出流程：

1. 用户在外出时，用 Obsidian 查看候选词。
2. Codex 先把候选词整理到 Obsidian：
   - `wan/05_business/gdp_top3_word_log.md`
   - 或同目录下临时候选文件
3. 用户在 Obsidian 里确认 `OK` 后，Codex 才能去 ElevenLabs 生成音频。
4. 音频生成后，Codex 必须提供一次性确认方式。
5. 用户确认网页效果没问题后，才允许正式写入：
   - `data/decks/gdp_top3.json`
   - `audio/male/en/`
   - `audio/female/en/`
   - 需要时再写入日文音频目录
6. 最后再提交并 push。

在家流程：

1. 用户在电脑前或在家同一 Wi-Fi 时，Codex 先用本机 local 文件、local 网页或局域网网页展示候选词。
2. 本地网页必须让用户能直接确认：
   - 英文
   - IPA
   - 日文
   - Reading
   - 中文
   - CEFR
   - Progress level
   - Category
   - Catalog
3. 用户说 `OK` 后，Codex 才能去 ElevenLabs 生成音频。
4. 音频生成后，Codex 必须在本地网页上提供一次性确认。
5. 用户确认本地网页效果没问题后，才允许正式写入 GDP TOP3 主库。
6. 最后再提交并 push。

共同规则：

- 候选词阶段只进入 review / preview 文件，不进入正式 deck。
- 临时审核文件只用于用户确认，确认完成并正式入库后必须删除。
- 用户说 `OK` 后，若已完成正式入库和 push，必须立即清理本次生成的审核文件，不要让临时文件长期堆积。
- 不要把临时审核网页、临时预览页、临时草稿文件提交到 GitHub。
- 只保留有长期审计价值的批次记录，例如 `data/decks/batches/` 下的正式候选 / 翻译 / 音频预览 JSON。
- ElevenLabs 音频生成必须在用户确认候选词后进行。
- 音频生成后必须让用户一次性确认，不要让用户一个个文件找。
- 用户明确说没问题后，才允许进入正式 GDP TOP3。
- 正式入库前仍必须做：
  - 重复英文检查
  - 重复日文检查
  - 自动 ID 生成
  - 音频文件命名检查
  - 英文男声 / 女声音频存在性检查
- 用户没有确认时，不要 push 新词到线上。

原则：

- 先做词库
- 先做内容
- 不继续扩展系统功能
- 系统已经足够
- 当前最重要的是持续积累高质量 GDP TOP3 词库

优先生产：

- KISO 课程内容
- GDP TOP3 A1-A2-B1
- GDP TOP3 3000 词
- Business Learning Deck
- BJT Vocabulary Learning Deck
- PATTO 音频

---

## Git 规则

- 提交前先看 `git status --short`
- 不要覆盖用户未提交的改动
- 如果已有暂存内容，提交前必须确认暂存内容属于本次任务
- 不要随意 reset 或 checkout
- 每次完成有意义变更后，建议提交

### 稳定回退点

- `ok1`：2026-06-21 经 Wan 确认的 GDP 英文优先学习版。
- 该版本包含 EN→JP 四选一、PATTO 翻牌、英文/IPA/音频独立选择、解说/背面语言选择、四个顶部控制按钮，以及 Safari 第一题自动播放解锁。
- 后续版本出现问题时，先比较 `ok1`，不要覆盖或移动该标签。

---

## Access / Admin 规则

Progress 可以静态运行，但完整版权限、邮箱登录、账号统计必须由后台负责。

当前目标：

- 已登录且邮箱在后台 allowlist 的用户：可刷完整版 deck
- 未登录或邮箱不在 allowlist 的用户：每个 deck 只能刷固定 10 个最初级词
- 后台能统计：
  - 每个账号在线时长
  - 最近活跃时间
  - 哪个 deck 更受欢迎
  - 哪个 mode 更受欢迎

实现原则：

- 前端只能做显示和安全降级，不要把“完整版判断”写死在本地。
- 真实身份以 Cloudflare Access / Worker 后端确认的邮箱为准。
- 后端用 D1 保存：
  - `users`：邮箱 allowlist、role、active
  - `sessions`：在线时长、last_seen
  - `events`：app_open、deck_open、study_start、answer、session_end、heartbeat
- admin 数据只能由 `role = admin` 的邮箱查看。
- 后台未部署或 API 不可用时，前端必须自动降级为 guest/free：
  - `fullAccess = false`
  - `freeLimit = 10`
- 游客固定 10 个词应来自每个 deck 的 Basic / A1-A2 词，且顺序稳定。
- 以后新增 deck 时，不要重新开发权限系统；统一走：
  - `getRawDeckWords(deckKey)`
  - `getVisibleDeckWords(deckKey)`
  - 后端 `/api/session`

---

## 当前注意点

- 如果 repo 当前只有根目录 `index.html`，说明还没有迁移到目标 `learn/` 结构
- 迁移目录结构前，应先确认部署路径是否依赖根目录 `index.html`
- 若 GitHub Pages 当前从 repo root 发布，直接移动到 `learn/index.html` 可能导致线上首页失效
- 结构迁移应单独作为一次任务处理
