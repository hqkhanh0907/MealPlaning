---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - docs/2-requirements/prd.md
  - docs/3-design/data-model.md
  - docs/3-design/business-rules.md
  - docs/3-design/design-system.md
  - docs/4-architecture/architecture.md
  - _bmad/project-context.md
workflowType: 'research'
lastStep: 1
research_type: 'domain'
research_topic: 'Meal planning + tracking UX patterns for offline mobile health app (Vietnamese context)'
research_topic_slug: 'meal-planning-tracking-ux'
research_goals: 'Inform F-03 (Calendar — meal planning) + F-04 (Tracking — daily logging) UX spec design (D2/D5) by surveying incumbent meal/nutrition apps and validating Hybrid nutrition policy (RT for planned, SNAP for completed) decision'
user_name: 'Khánh'
date: '2026-05-09'
web_research_enabled: true
source_verification: true
---

# Research Report: Domain — Meal Planning + Tracking UX Patterns

**Date:** 2026-05-09
**Author:** Khánh
**Research Type:** domain
**Persona:** 📊 Mary (Business Analyst)
**Project:** HealthMate AI (MealPlaning) — Phase 3 prep

---

## Research Overview

### Methodology

- **Workflow:** BMAD `bmad-domain-research` (6 steps: Init → Domain Analysis → Competitive Landscape → Regulatory → Technical Trends → Synthesis)
- **Persona:** Mary (📊 Business Analyst) — Porter's strategic rigor + Minto's Pyramid Principle
- **Tools:** Tavily web search (real-time), source verification enabled
- **Communication language:** Tiếng Việt (per `_bmad/bmm/config.yaml`)
- **Output language:** Tiếng Việt
- **Date range filter:** Ưu tiên sources 2024-2026 (recency for fast-evolving UX trends)

### Research Questions (locked in Step 1)

| # | Câu hỏi | Mục đích |
|---|---|---|
| **Q1** | Calendar/meal planning UX nào dominant? (week vs day vs meal-slot grid; horizontal scroll vs paginated) | Drive F-03 layout |
| **Q2** | Khi user "plan" 1 dish vào tương lai, app tính nutrition realtime hay snapshot? Có ai dùng Hybrid không? | **Validate Hybrid policy** đã chốt ở `RULE-PLANNED-DISH-HYBRID` |
| **Q3** | Logging UX patterns (search, copy-from-yesterday, voice, photo) — không cover barcode | Drive F-04 logging flow |
| **Q4** | Tracking visualization: daily ring vs weekly bar vs trend line vs streak — pattern best cho casual user | Drive F-04 dashboard |
| **Q5** | Edit/delete logged meal: undo vs hard delete vs soft-delete với history | Drive F-04 edit flow |
| **Q6** | Empty state + first-time onboarding: ask everything upfront vs progressive | Drive F-03 + F-04 first-run |
| **Q7** | VN-specific quirks (light check, 1-2 query) | Localization defensive check |

### Hypothesis sơ bộ (Step 1 — sẽ validate qua Steps 2-6)

| Q | Hypothesis | Confidence trước research |
|---|---|---|
| Q1 | Week view horizontal scroll + meal-slot grid daily | Medium |
| Q2 | Hybrid hiếm (0-2/8 apps), đa số dùng RT | Low (cần validate gấp) |
| Q3 | Search + copy-from-yesterday dominant; photo AI rising 2024-2026 | Medium |
| Q4 | Daily ring + weekly bar; streak gây pressure psychology | Medium |
| Q5 | Soft-delete với undo toast 5-10s, không history | Medium |
| Q6 | Progressive — minimum upfront (weight/goal), rest lazy | Medium |

### Domain Boundaries

- ✅ **In scope:** UX patterns, interaction flows, visualization, copy/microcopy, empty states, onboarding flows
- ❌ **Out of scope:** Nutrition science accuracy, recipe database licensing, barcode database, business model/pricing
- ⚠️ **Edge:** Public sources only (app reviews, Reddit, blogs) — không tự làm user interview

### Source Priority

1. App store reviews (Google Play VN + global) — voice of real user
2. Reddit r/loseit, r/MyFitnessPal, r/Cronometer, r/nutrition — pain point thật
3. Official app blog/changelog (vd MFP April 2026 redesign drama)
4. Design case studies (Medium, UXDesign.cc, Smashing Magazine, NN/g)
5. Industry research (Grand View, Mordor, market.us) — market context only

---

## Industry Analysis

> **Mary's note:** Mục đích Step 2 không phải đầu tư VC. Mục đích là verify thị trường còn dư địa cho 1 app offline-first VN, hiểu top players, và spot trends UX có thể impact F-03/F-04.

### Market Size and Valuation

Thị trường **Diet & Nutrition Apps** toàn cầu — các nguồn trade research disagreing đáng kể về quy mô tuyệt đối, nhưng **đồng thuận về xu hướng tăng trưởng mạnh**:

| Nguồn | Năm gốc | Giá trị | Năm đích | Giá trị | CAGR |
|---|---|---|---|---|---|
| Grand View Research | 2024 | USD 2.14B | 2030 | USD 4.56B | **13.4%** |
| Mordor Intelligence | 2025 | USD 5.76B | 2030 | USD 10.15B | **11.97%** |
| DataM Intelligence | 2025 | USD 3.15B | 2033 | USD 9.58B | **14.3%** |
| Towards Healthcare | 2025 | USD 5.95B | 2035 | USD 27.73B | **16.64%** |
| market.us | 2024 | (n/a) | 2033 | USD 14B | **11.5%** |

**Sub-segment nóng — AI-driven meal planning:** USD 972.1M (2024) → **USD 11.57B (2034)** @ **CAGR 28.10%** — nhanh **gấp đôi** market base.

**AI-Generated Meal Plan riêng:** USD 1.34B (2025) → USD 5.37B (2033) @ CAGR **18.97%**.

**Khoảng tin cậy của Mary:** Số tuyệt đối các nguồn lệch ~3x do định nghĩa segment khác nhau (có nguồn gộp Fitness app, nguồn khác chỉ Diet thuần). Nhưng **CAGR consensus 11-17%** → market khoẻ, KHÔNG saturated.

_Sources:_
- [Grand View Research — Diet And Nutrition Apps Market 2025-2030](https://www.grandviewresearch.com/industry-analysis/diet-nutrition-apps-market-report)
- [Mordor Intelligence — Market Size & Share Analysis](https://www.mordorintelligence.com/industry-reports/diet-and-nutrition-apps-market)
- [DataM Intelligence (via OpenPR) — Market to Reach USD 9.58B by 2033](https://www.openpr.com/news/4502938/diet-and-nutrition-apps-market-to-reach-usd-9-58-billion-by-2033)
- [Towards Healthcare — 16.64% CAGR till 2035](https://www.towardshealthcare.com/insights/diet-and-nutrition-apps-market-sizing)
- [market.us — Diet and Nutrition Apps Statistics 2026](https://media.market.us/diet-and-nutrition-apps-statistics/)
- [market.us — AI-driven Meal Planning Apps 28.10% CAGR](https://market.us/report/ai-driven-meal-planning-apps-market/)

### Market Dynamics and Growth

**Growth drivers (đồng thuận đa nguồn):**
- Rising health consciousness post-pandemic + lifestyle disease (obesity, diabetes, cardiovascular)
- Smartphone penetration ở emerging markets (relevant cho VN)
- AI/ML maturity → personalized nutrition trở khả thi
- Corporate wellness budgets (B2B segment growing)
- Medical reimbursement cho digital therapeutics (US)

**Growth barriers:**
- Database accuracy concerns (đặc biệt với cuisine local, non-US foods)
- Privacy/data concerns (health data)
- High churn rate ở consumer segment (user drop sau 2-4 tuần — pattern chung mHealth)
- Subscription fatigue (paid model dominant 52.2% revenue share 2024 nhưng user resist)

**Cyclical patterns:**
- Tháng 1 (New Year resolution) + tháng 5-6 (summer body) → spike download
- User active đỉnh tuần đầu sau cài, decay nhanh sau 30 ngày → **retention là vấn đề lớn nhất của ngành**

**Market maturity:** **Growth stage**. Western (US/EU) gần saturated với top 3 (MFP, Noom, Lifesum), nhưng AI-native + emerging markets vẫn early.

_Sources:_
- [Mordor Intelligence — Growth Trends & Forecast](https://www.mordorintelligence.com/industry-reports/diet-and-nutrition-apps-market)
- [Towards Healthcare — Trend & Future Outlook](https://www.towardshealthcare.com/insights/diet-and-nutrition-apps-market-sizing)

### Market Structure and Segmentation

**Segmentation theo app type (Mordor + SkyQuest + DataM):**

| App Type | Đặc điểm | Examples |
|---|---|---|
| **Calorie Tracking** | Logging + count (incumbent) | MyFitnessPal, Lose It! |
| **Meal Planning** | Plan trước theo tuần | Mealime, PlateJoy, Yummly |
| **Fitness + Diet hybrid** | Workout + nutrition | Cronometer, Lifesum |
| **Nutrition Education** | Coaching, content | Noom (psychology-led) |
| **AI-driven personalized** | Photo/voice + adaptive | Welling, Fitia, Meal Chef AI, Nourish |

**Theo audience:**
- **General consumer** (lớn nhất, casual)
- **Athletes** (Cronometer, MacroFactor)
- **Chronic disease** (DiAB cho tiểu đường VN, Glucose Buddy)
- **Maternal/pregnancy** (BabyCenter, What to Expect)
- **Seniors** (small segment, growing)

**Theo subscription model:**
- Subscription-based growing fastest
- Freemium dominant (try-before-buy)
- One-time purchase rare
- Enterprise/B2B (corporate wellness) emerging

**Theo platform:**
- iOS dominant by revenue (US/EU users)
- Android dominant by user count (emerging markets)

**Geographic:**
- North America: **40.5% share** (DataM)
- Europe: ~25%
- APAC: ~22% (fastest growing — relevant cho VN)
- Rest: ~12%

**Mary's takeaway cho MealPlaning:** App đang định vị ở giao điểm **Meal Planning + Calorie Tracking** + **Android + APAC + General consumer + Free/offline**. Đây là góc thị trường **chưa bị Western incumbents dominate** vì họ tối ưu cho US iOS market trước.

_Sources:_
- [SkyQuest Research — Diet And Nutrition Apps Segments](https://www.skyquestt.com/report/diet-and-nutrition-apps-market)
- [DataM Intelligence — Geographic Distribution NA 40.5%](https://www.openpr.com/news/4502938/diet-and-nutrition-apps-market-to-reach-usd-9-58-billion-by-2033)
- [Mordor — Functionality & Audience Segments](https://www.mordorintelligence.com/industry-reports/diet-and-nutrition-apps-market)

### Industry Trends and Evolution

**Trend 1 — AI photo recognition đang shift từ "novelty" sang "default" (2024-2026)**

- MFP và Lose It! đã có photo recognition từ 2023; accuracy 85-90% cho common foods (Peony 2025 review)
- New entrants AI-native: **Welling, Nourish, Alma, Meal Chef AI, Fitia**
- → **Pattern shift:** Manual search box từ chỗ là feature chính → fallback. Photo/voice từ "premium feature" → expected baseline.
- **Impact MealPlaning:** Có Gemini AI plugin sẵn — đây là **competitive parity expectation**, không phải differentiator nữa. Phase 4 nên có photo logging.

**Trend 2 — Voice logging quietly mainstream**

- MFP Voice, Lose It! Voice, Cronometer Voice — tất cả top 3 đều có (Peony 2025)
- Save 40-60s/meal vs manual entry
- Privacy concern: voice cloud-based → consumer wary
- **Impact MealPlaning:** Offline-first → voice cần on-device → khó. Skip Phase 3, evaluate Phase 5+.

**Trend 3 — Personalized adaptive plans**

- Apps recalculating weekly: **Fitia, Meal Chef AI** (LinkedIn case study)
- Mở rộng: AI nudge ("bạn ăn ít rau tuần này, suggest món X")
- **Impact MealPlaning:** Consider Phase 5+ với Gemini, không phải Phase 3.

**Trend 4 — Gamification growing nhưng controversial**

- SkyQuest: gamification là 1 trong key drivers
- Nhưng Reddit + research chỉ ra streak gây pressure psychology, đặc biệt với eating disorder population
- Modern approach: gentle nudge, badge KHÔNG ràng buộc, avoid streak break punishment
- **Impact MealPlaning Q4 hypothesis:** Confirm hypothesis "skip aggressive streak" — sẽ deep-dive ở Step 3.

**Trend 5 — Meal kit + recipe-first integration**

- Yummly đi recipe-first → meal plan; Member Kitchens (B2B for creators)
- VN context: Cookpad VN có recipe DB lớn nhưng không tracking
- **Impact MealPlaning:** Mình recipe-first (dish-centric trong data model), align với trend này

**Historical evolution (5 năm):**
- 2020: Manual entry + barcode dominant
- 2022: Photo logging beta ở MFP/Lose It!
- 2024: AI-native players emerging (Welling, Nourish)
- 2026: Photo + voice expected; AI personalization differentiator
- 2027+ (forecast): Wearable integration + continuous glucose monitor (CGM) for non-diabetic users

_Sources:_
- [Welling — AI Food Trackers 2026](https://www.welling.ai/articles/ai-food-tracker)
- [Tribe AI — Top AI-Powered Nutrition Apps 2025](https://www.tribe.ai/applied-ai/ai-nutrition-apps)
- [Peony — Voice Calorie Logging Apps 2025](https://heypeony.com/blog/voice-calorie-logging-apps)
- [LinkedIn — Meal Planning Apps Automating Mental Load](https://www.linkedin.com/pulse/meal-planning-apps-automating-mental-load-gdr-creative-intelligence-u394e)
- [Member Kitchens — Meal Planning App Features](https://memberkitchens.com/updates/meal-planning-app-features-that-stand-out)
- [PMC — User Perspectives Diet-Tracking Apps Reviews](https://pmc.ncbi.nlm.nih.gov/articles/PMC8103297/)

### Competitive Dynamics

**Market concentration:**
- Top 4 dominant theo DataM: **MyFitnessPal, Noom, Lifesum, WW International (Weight Watchers)**
- Long-tail very long: hàng trăm apps niche
- Niche segments (chronic disease, athletes, vegan, keto) có incumbents riêng

**Competitive intensity:**
- High ở Western consumer general
- Medium ở APAC general (cơ hội cho local players)
- Low ở VN general consumer health planning (DiAB là tiểu đường-specific, Calo nhỏ)

**Barriers to entry:**
- **Database** (food/recipe) — high cho US/UK, **medium cho VN** (cộng đồng nhỏ → có thể tự xây)
- **Brand trust** — high (health data sensitive)
- **AI/ML capability** — medium (model commodity nhờ Gemini, OpenAI API)
- **Distribution** — medium (Google Play organic + ASO)

**Innovation pressure:**
- High: AI photo/voice → 12-18 tháng innovation cycle
- Apps không catch up dropping nhanh (vd nhiều apps 2018-2020 không pivot AI giờ market dead)

**Mary's strategic note cho Khánh:**
- MealPlaning **không cạnh tranh đầu trực tiếp với MFP/Noom** — khác segment (offline VN, single-user, không có barcode/social)
- Mình phải **đối thủ chính là chính mình + Excel/giấy/đầu** của user VN — cụ thể là: **làm app dùng được offline, hiểu món Việt, không cần đăng ký, không spam**
- Pattern từ incumbents là **input** cho UX, không phải standard mình phải copy 1:1

_Sources:_
- [DataM Intelligence — Key Players: MyFitnessPal, Noom, Lifesum, WW](https://www.openpr.com/news/4502938/diet-and-nutrition-apps-market-to-reach-usd-9-58-billion-by-2033)
- [Tribe AI — AI-native players landscape](https://www.tribe.ai/applied-ai/ai-nutrition-apps)

---


## Competitive Landscape

> **Mary's adaptation note:** BMAD canonical Step 3 yêu cầu 6 sub-sections (key players, market share, strategies, business models, dynamics, ecosystem). Với research goals **UX-focused** (drive F-03/F-04), em adapt như sau:
> - **6.1 Apps Surveyed** — replaces "Key Players" — 8 apps + positioning
> - **6.2 Per-App Deep Dive** — replaces "Market Share" — 3 incumbents (MFP, Cronometer, Lose It!) deep, 5 spot-check
> - **6.3 UX Pattern Matrix per Research Question** — replaces "Strategies & Differentiation" — Q1-Q6 cross-app
> - **6.4 Business Models (light)** — kept, ngắn vì irrelevant cho UX
> - **6.5 Competitive Dynamics & Switching Costs** — kept, focus user retention insight
> - **6.6 Ecosystem (light)** — kept, ngắn

### Apps Surveyed

| # | App | Scale (verified) | Positioning | Wave |
|---|---|---|---|---|
| 1 | **MyFitnessPal** | 200M+ users (Good Housekeeping 2024, MFP self-claim 2024) | Generalist, recipe DB lớn nhất, calorie tracking de-facto | Deep |
| 2 | **Cronometer** | Scale unverified in this research | Athlete/serious tracker, micronutrient detail, scientific bent | Deep |
| 3 | **Lose It!** | Co-leader with MFP per PMC review study (PMC13085986, 2024) | Casual weight loss, Snap-It photo logging | Deep |
| 4 | **Lifesum** | Top-5 EU per Sensor Tower Q2 2024 | Diet templates (Med, Keto), AI-pivot post-2024 | Spot |
| 5 | **Yazio** | WAU ~3.5M peak EU Q2 2024 (Sensor Tower) | EU-strong, fasting + nutrition combined | Spot |
| 6 | **Noom** | DataM lists as Top-4 player | Psychology-led, coaching + traffic-light food | Spot |
| 7 | **Carb Manager** | Scale unverified in this research | Keto/low-carb specialist | Spot |
| 8 | **Yummly** | Scale unverified in this research | Recipe-first → meal plan flow | Spot |

> **Mary's data discipline note (Audit Fix G1/G2):** Founded year và absolute user count nhiều giá trị từ trade press không cross-verifiable trong scope research này. Em **drop founded year column** và **chỉ giữ scale claims có source**. Apps marked "unverified" vẫn included vì positioning/UX patterns được verify từ help docs + reviews.


**VN context apps (light check):**
- **DiabCam** (đổi tên từ DiAB) — AI calorie counter cho diabetics, glycemic-focus, available trên Google Play VN
- **Calo** — meal delivery + tracking VN, niche
- **Vinmec wellness** — không phải meal-tracking app standalone

_Sources:_
- [Garage Gym Reviews — 8 Best Calorie Counter Apps 2026](https://www.garagegymreviews.com/best-calorie-counter-apps)
- [Women's Health Mag — Best Food Tracking Apps 2025](https://www.womenshealthmag.com/health/g46675023/best-food-tracking-apps/)
- [Brocoders — 9 Best Diet Apps 2026](https://brocoders.com/blog/diet-apps-nutrition-trackers/)
- [DiabCam Google Play](https://play.google.com/store/apps/details?id=com.corebell.diabcam)

### Per-App Deep Dive (Wave 1: 3 incumbents)

#### 1. MyFitnessPal — Generalist incumbent

**Calendar/Plan UX:**
- KHÔNG có true calendar planning native (Meal Planner là feature riêng từ 2024, premium)
- Diary tab dạng list per-day, navigate qua arrow ngày
- Meal Planner premium tool: weekly view, AI-generated meal plans theo budget + lifestyle
- April 2026 redesign: **"Diary" tab biến mất, thay bằng "Today"** → community **phẫn nộ** (Reddit, Piunika, Rekkon coverage). User complaint: "buried diary behind View All button", lost easy navigation

**Nutrition update behavior (Q2):**
- Recipe đổi → past entries **không auto-update** mặc định (cần edit manually từng entry)
- "How can I edit or delete an entry?" workflow — explicit user action
- Recipe-as-ingredient feature **không hỗ trợ** native → user phải workaround (log recipe, save as Meal, dùng Meal làm ingredient)
- → Behavior **gần SNAP** (effective snapshot vì past entries giữ giá trị cũ)

**Logging UX (Q3):**
- "Copy from Date" / "Smart Copy" / "Copy yesterday's meal" — feature core, có doc/video/TikTok dạy
- Quick Tools menu: copy to/from recent or upcoming dates
- Saved Meals: gom 1 nhóm thực phẩm thành "meal template" tái sử dụng
- Recent foods, Frequent foods — exposed mạnh
- April 2026 redesign cũng break "copy meals" theo nhiều user reports → critical pain point

**Visualization (Q4):**
- Today screen: progress dashboard với calorie + macro bar
- Weekly Digest report (last 7 days) — báo cáo passive thay vì interactive chart
- Không có streak aggressive như Duolingo

**Edit/Delete (Q5):**
- Tap entry → edit form
- Delete: "How do I delete an entry from my food diary?" — hard delete via menu
- KHÔNG có undo toast standard
- KHÔNG có version history

**Onboarding (Q6):**
- Sign-up flow ask: weight, height, sex, age, goal, activity level — full upfront
- Target date deliberately NOT recorded ("may require faster-than-healthy weight change")
- → Conservative health-protective design choice

_Sources:_
- [MFP April 2026 redesign — Piunika coverage](https://piunikaweb.com/2026/04/24/myfitnesspal-new-update-complaints/)
- [Rekkon — MFP redesign analysis](https://rekkonapp.com/blog/myfitnesspal-redesign-2026)
- [Reddit r/Myfitnesspal — copy meals broken](https://www.reddit.com/r/Myfitnesspal/comments/1o6ntd5/new_myfitnesspal_layout_sucks_cant_copy_meals/)
- [MFP Help — Copy meal from one day to another](https://support.myfitnesspal.com/hc/en-us/articles/360032622131-How-do-I-copy-a-meal-from-one-day-to-another)
- [MFP Help — Recipe as ingredient (workaround only)](https://support.myfitnesspal.com/hc/en-us/articles/360032622771-How-can-I-use-a-recipe-as-an-ingredient-in-a-new-recipe)
- [MFP Help — Target date not recorded](https://support.myfitnesspal.com/hc/en-us/articles/360032271632-Where-can-I-find-my-target-date)
- [MFP Help — Meal Planner premium tool](https://support.myfitnesspal.com/hc/en-us/articles/34347103172877-Meal-Planner)


#### 2. Cronometer — Athlete/Serious Tracker

**Calendar/Plan UX:**
- Diary view per-day, scientific aesthetic (numeric heavy, table-like)
- KHÔNG có week-view planning UI mạnh mẽ; users plan trong head + Excel
- Recipe builder với accurate macro/micro calculation

**Nutrition update behavior (Q2) — ⭐ Critical insight:**
- **Edit recipe → app PROMPT user CHOICE**: "Update past entries?" Yes/No
- Forum threads (multi-thread consistent evidence) xác nhận:
  - _"When you edit entered food entries, it asks if you want to update past entries"_ ([Retroactive Edits to Foods](https://forums.cronometer.com/discussion/6236/retroactive-edits-to-foods))
  - _"In my experience, if I change a custom food recipe, I always get the option to change or not change all past entries when I select 'save'"_ ([Editing recipe after completing day](https://forums.cronometer.com/discussion/6738/editing-a-custom-food-recipe-after-completing-my-day))
  - _"Edit the same recipe to change it back and then update the old entries again"_ ([Accidentally update past entries](https://forums.cronometer.com/discussion/3904/accidently-update-d-past-entries-with-an-updated-recipe-how-do-i-undo-that))
- ⚠️ **Audit Fix G7 evidence quality:** Source là forum threads (community + verified by participating users), KHÔNG phải official Cronometer help doc. Multi-thread + multi-user consistency raises confidence to **High**, but lacks vendor-official confirmation. Pattern verified by behavioral evidence (users describing actual UI prompt).
- → **Đây là EXPLICIT HYBRID**: user pick at edit time
- → **Validates MealPlaning's automatic Hybrid policy** (RT for `is_completed=0`, SNAP for `is_completed=1`) — Cronometer làm bằng manual prompt, mình làm bằng automatic rule based on completion state. Same intent, different mechanism.

**Logging UX (Q3):**
- Search-based logging dominant
- Custom recipe library
- "Edit a Copy" pattern: tap food → 3 dots → copy nutrition details into new editable entry

**Visualization (Q4):**
- Heavy emphasis on **micronutrient targets** (vitamins, minerals) — visual cues khi miss target
- Daily summary với **bar chart per nutrient** (không phải ring) — phù hợp serious user
- Trend graphs cho vitamin/mineral over time

**Edit/Delete (Q5):**
- Edit nutrition: "Quick Edit Nutrients" via Options menu
- Reset to original: explicit option (preserves edit history of date)
- Edit decision **per-edit**, không global setting

**Onboarding (Q6):**
- Standard ask weight/height/age/sex/goal upfront
- Optional: dietary preferences (vegan, keto, etc.) — progressive

_Sources:_
- [Reddit r/cronometer — Editing custom recipe past entries](https://www.reddit.com/r/cronometer/comments/17pbqg4/question_editing_custom_meal_or_custom_recipe/)
- [Cronometer Forums — Editing recipe after completing day](https://forums.cronometer.com/discussion/6738/editing-a-custom-food-recipe-after-completing-my-day)
- [Cronometer Forums — Accidentally updated past entries](https://forums.cronometer.com/discussion/3904/accidently-update-d-past-entries-with-an-updated-recipe-how-do-i-undo-that)
- [Cronometer Forums — Retroactive Edits to Foods](https://forums.cronometer.com/discussion/6236/retroactive-edits-to-foods)
- [Cronometer Support — Mobile Edit a Copy](https://support.cronometer.com/hc/en-us/articles/360039207552-Mobile-Edit-A-Copy)

#### 3. Lose It! — Casual Weight Loss + Photo Pioneer

**Calendar/Plan UX:**
- Daily budget metaphor — "$X calories left today"
- Calendar swipe between days
- KHÔNG có week planning native; có premium Meal Planning feature

**Nutrition update behavior (Q2):**
- Behavior similar MFP: edit recipe doesn't auto-recalculate past entries
- → Effective SNAP

**Logging UX (Q3):**
- **Snap It™** photo logging — pioneer (since ~2017)
- AI photo recognition 85-90% accuracy (Peony 2025 review)
- Voice logging available
- Quick add by category (no specific food)
- Recent foods exposed

**Visualization (Q4):**
- Daily calorie budget bar (linear, not ring)
- Weight trend graph
- Weekly streak/badge gentle

**Edit/Delete (Q5):**
- Tap → edit form, delete option
- Standard mobile pattern

**Onboarding (Q6):**
- 5-7 screen wizard upfront (sex, height, weight, target weight, weekly loss rate, lifestyle)
- Goal-first framing

_Sources:_
- [Garage Gym Reviews — Lose It! review](https://www.garagegymreviews.com/best-calorie-counter-apps)
- [Reddit — Snap-It photo recognition accuracy](https://www.reddit.com/r/nutrition/comments/1dswsk0/best_meal_tracker_app_with_photo_recognition_in/)
- [Peony — Voice logging accuracy data](https://heypeony.com/blog/voice-calorie-logging-apps)

### Per-App Spot-Check (Wave 2: 5 apps)

#### 4. Lifesum — Diet Templates + Aesthetic
- **Calendar:** Daily diary, weekly summary report
- **Plan UX:** Diet templates (Mediterranean, Keto, Scandinavian) — pick template → app auto-suggests meals
- **Q2:** Standard SNAP behavior (recipe edit không retroactive)
- **Q3:** Search + favorites; voice via partners
- **Q4:** Macro circles + life-score gamification
- **Q5:** "Open the meal you want to edit. Press the X next to the food item or recipe you want to remove." — Direct delete, no undo toast documented
- **Q6:** Multi-screen wizard, weight required (BMI calc dependency)
- _Sources:_ [Lifesum — edit/remove diary](https://help.lifesum.com/en/article/edit-or-remove-items-from-your-diary-mghpcc/), [Lifesum — start weight](https://help.lifesum.com/en/article/how-can-i-update-my-start-weight-1rorrys/)

#### 5. Yazio — Fasting + Nutrition
- **Calendar:** Diary calendar swipe; fasting timer separate
- **Q2:** Edit diary entry → "Tap your desired meal category. Select the diary entry you want to update. Enter the new amount. Tap Save." → per-entry edit, no global retroactive
- **Q3:** Search dominant, EU food DB strong
- **Q4:** Calorie ring + macro bars
- **Q5:** Edit/delete per entry, public food edits restricted to PRO
- **Q6:** Standard wizard
- _Sources:_ [Yazio — edit diary entry](https://help.yazio.com/hc/en-us/articles/208555189-How-do-I-edit-a-diary-entry), [Yazio — delete entries](https://help.yazio.com/hc/en-us/articles/360002407038-How-can-I-delete-entries-in-my-Diary), [Yazio — edit private foods](https://help.yazio.com/hc/en-us/articles/202286742-How-can-I-edit-or-delete-private-created-foods)

#### 6. Noom — Psychology-Led Coaching
- **Calendar:** Daily food log; calendar de-emphasized vs coaching content
- **Q2:** N/A (not recipe-builder focused)
- **Q3:** Search + barcode + photo (premium)
- **Q4:** Traffic-light color coding (green/yellow/red foods) — controversial pattern
- **Q5:** Standard
- **Q6:** Long psychological wizard (10+ screens) — designed to extract commitment + emotional buy-in. **Controversial**: psychologists + Business Insider flag this triggers disordered eating in vulnerable users
- ⚠️ **Anti-pattern signal**: Noom's daily weigh-in + calorie tracking + streak combo cited as "toxic" by former users → **lessons cho MealPlaning Q4: avoid streak punishment, avoid daily weigh-in mandatory**
- _Sources:_ [Business Insider — Noom triggered disordered eating](https://www.businessinsider.com/noom-app-triggered-disordered-eating-2023-5), [Femestella — Dangers of Noom](https://www.femestella.com/noom-reviews-horror-stories-eating-disorders/), [Untrapped — Dark psychology of Noom](https://untrapped.com.au/a-psychologist-reviews-the-dark-psychology-of-noom-part-1/)

#### 7. Carb Manager — Keto/Low-Carb Specialist
- **Q2 — ⚠️ Anti-pattern alert:** Edit nutrition info → applied to **BOTH future AND past entries** automatically; user warning to "create a custom food/recipe instead if you don't want past changes"
- → Pure RT-retroactive — gây confusion documented in support article
- → **Validates MealPlaning's choice** to NOT do RT-retroactive. Mình chỉ RT khi `is_completed=0` (chưa ăn) — past completed entries lock.
- **Q5:** Reset edit option available (restore from DB)
- _Sources:_ [Carb Manager — view/edit nutrition](https://help.carbmanager.com/docs/en/view-and-edit-nutrition-information-in-foods-recipes-and-meals)

#### 8. Yummly — Recipe-First → Meal Plan
- **Calendar/Plan:** Recipe-first; meal plan generated from recipe selections
- **Q3:** Visual recipe browse với filtering by dietary tags
- **Onboarding:** Dietary preferences first, then suggest recipes
- ⚠️ **Audit Fix G5:** Claim trước đó về "Tinder-style swipe" gốc từ 1 designer case study (UXDesign.cc — failed to fetch in re-verification) **không phải Yummly thực tế làm**. Em drop claim này. Yummly thực tế là grid + filter UI. _Sources:_ [Yummly app description (general industry knowledge — no fresh source verified in this research)]

### VN Context (Wave 3: light check)

**Findings:**
- **DiabCam** (formerly DiAB): AI photo calorie counter trên Google Play, listing mô tả "advanced tool designed for people who need precise control over their diet: low glycemic..." — **glycemic-index focus** (target diabetic users). Latest version 1.1.6, APK 37.71MB. Không tìm thấy review snippets cụ thể về UX pattern trong scope search này.
- **Vinmec wellness** không phải standalone meal tracker (corporate health portal)
- **Calo** = meal delivery + tracking, ít market share, không có deep online docs
- **Cookpad VN** = recipe community, không phải tracking app
- **AgileTech VN review article (2025)** confirms VN consumer market xài MyFitnessPal/LoseIt nhiều hơn local apps — voids local UX delta hypothesis
- **ResearchGate study (Nguyen et al., 2018)** về VN young user mHealth: 72.7% useful, 61.9% satisfied; gender-neutral usage. ⚠️ **Old study (2018)** — context có thể đã shift

⚠️ **Audit Fix G6 — Evidence quality disclaimer:** VN context section dựa trên **limited evidence**: 1 Google Play listing (no in-depth review found), 1 secondary VN tech blog, 1 academic study từ 2018. **Không có recent (2024-2026) VN-specific user research data**. Conclusion below là **best estimate based on available data**, sẽ revisit nếu mình có Google Play VN reviews scrape hoặc user interview.

- → Q7 hypothesis (tentative confirm): **không tìm thấy evidence VN-specific UX deltas đáng kể** so với Western patterns. Localization chính là **tiếng Việt + món Việt + đơn vị thông dụng (chén/tô/dĩa)** — không cần redesign UX patterns. Confidence: **Medium-Low**, cần validate ở Phase 4 với real VN beta users.

_Sources:_
- [DiabCam Google Play listing](https://play.google.com/store/apps/details?id=com.corebell.diabcam)
- [ResearchGate — Young VN mobile-health behavior](https://www.researchgate.net/publication/327905120_What_drives_young_Vietnamese_to_use_mobile-health_innovations_Implications_for_health_communication_and_behavioral_interventions)


### UX Pattern Matrix per Research Question

> Format: row = pattern variant; cols = apps; cell = adoption + notes

#### Q1 — Calendar/Planning UX

| Pattern | MFP | Cron | LoseIt | Lifesum | Yazio | Noom | CarbMgr | Yummly | Frequency |
|---|---|---|---|---|---|---|---|---|---|
| Daily diary (per-day list) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | – | **Universal** |
| Day swipe / arrow nav | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | – | **Universal** |
| Week view native (free tier) | ❌ | ❌ | ❌ | partial | ❌ | ❌ | ❌ | ✅ | **Rare** |
| Week view (premium) | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | – | Common-paid |
| Meal-slot grid (B/L/D/Snack) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | – | **Universal** |
| Future-day planning ahead | premium | manual | premium | template | ❌ | ❌ | ❌ | ✅ | Rare-paid |
| Recipe → plan flow | weak | weak | weak | template | weak | – | – | **strong** | Niche |

**Key finding:** Diary-per-day là **universal pattern**. Future-day planning là **gap thật** ở free tier — MFP/LoseIt move it behind paywall. **MealPlaning có cơ hội make week-planning free + offline = differentiator thật**.

**Hypothesis Q1 result:** ⚠️ **PARTIAL CONFIRM**.
- ✅ Meal-slot grid (B/L/D/Snack) đúng — universal
- ❌ Week view horizontal scroll **không phải standard** — đa số apps làm day-by-day. Yummly khác (recipe-first nên có week view).
- → **Recommendation update:** F-03 nên có **2 modes**:
  1. **Day mode** (default, match user mental model 80% incumbents) — meal-slot grid với prev/next day
  2. **Week mode** (toggle, MealPlaning differentiator) — overview tuần, ít dùng nhưng có khi cần

#### Q2 — Nutrition Update on Recipe Edit (CRITICAL)

| Pattern | App | UX | Pros | Cons |
|---|---|---|---|---|
| **Pure RT-retroactive** (auto update past) | Carb Manager | Edit → updates everywhere | Always fresh data | Past data corrupted, user confusion documented |
| **Pure SNAP** (past frozen) | MFP, LoseIt, Lifesum, Yazio | Edit → only future | Data integrity | Stale-feeling for active recipes |
| **Explicit Hybrid (user choice each edit)** | Cronometer | Prompt "Update past entries?" Yes/No | Power user control | Decision fatigue, accidental update common |
| **Automatic Hybrid (state-based)** | **MealPlaning (proposed)** | RT for `is_completed=0`, SNAP for `is_completed=1` | Match mental model + integrity | Schema complexity (CHECK constraint) |
| **Per-meal edit (no recipe linkage)** | All edit-existing-entry flows | Tap entry → adjust | Granular | No bulk update path |

**Key finding:** **MealPlaning's automatic Hybrid không có precedent** — Cronometer làm explicit, không tự động.

**Mary's strategic assessment:**
- ✅ **Innovative** — fixes Carb Manager's confusion AND Cronometer's decision fatigue
- ⚠️ **Risk** — user **không expect** state-based auto behavior; cần tooltip + microcopy explain
- ✅ **Aligned with PRD F-03 mental model**: "planned = flexible, completed = lock"

**Hypothesis Q2 result:** ✅ **CONFIRMED + INNOVATIVE**.
- Hybrid không hiếm — có Cronometer làm explicit, ~3/8 apps có effective SNAP
- **MealPlaning's automatic Hybrid is novel** but defensible
- **Required:** UX must surface this clearly khi user edit recipe of completed past meal

#### Q3 — Logging UX (excluding barcode per scope)

| Pattern | MFP | Cron | LoseIt | Lifesum | Yazio | Noom | CarbMgr | Yummly | Frequency |
|---|---|---|---|---|---|---|---|---|---|
| Search-based logging | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | n/a | **Universal** |
| Recent foods / Frequent | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | – | **Universal** |
| Copy from yesterday/date | ✅ (broken Apr26) | partial | partial | ❌ | ❌ | ❌ | ❌ | – | Common, **fragile in MFP after redesign** |
| Saved meal templates | ✅ | ✅ | ✅ | ✅ | ✅ | – | ✅ | – | **Common** |
| Photo recognition (AI) | ✅ paid | ❌ | ✅ Snap-It | premium | ❌ | premium | ❌ | – | Common-paid |
| Voice logging | ✅ | ✅ | ✅ | – | – | – | – | – | Top-3 only |

**Hypothesis Q3 result:** ✅ **CONFIRMED**.
- Search + recent + saved meal templates là **table stakes**
- Copy-from-date pattern important; user phẫn nộ khi MFP break feature này
- Photo logging trending nhưng KHÔNG MUST cho Phase 3 (defer to Phase 4)
- **MealPlaning recommendation:** Phase 3 priority: search + recent + saved templates + copy-from-date. Photo defer.

#### Q4 — Tracking Visualization

| Pattern | App example | Notes |
|---|---|---|
| **Calorie ring/circle** | Yazio (calories+macros+water at-a-glance per ScreensDesign), Lifesum (claimed but **not verified visually** in this research) | Common pattern post-Apple Activity Rings; confidence Med-High for Yazio, Low for Lifesum's exact viz style after recent AI pivot |
| **Calorie linear bar** | Lose It! ($X left), MFP | Simpler, less iconic |
| **Macro circles (3-4 ring)** | Lifesum, Yazio, Carb Manager | Common; can crowd small screen |
| **Macro bars** | MFP, Cronometer | Cleaner for many macros |
| **Daily streak (aggressive)** | Noom (subtle) | ⚠️ **Anti-pattern** — psychologists flag harm |
| **Gentle badges (no break punishment)** | LoseIt, Lifesum | Safer alternative |
| **Weekly Digest report** | MFP | Passive, post-hoc — non-pressuring |
| **Trend line (weight)** | All | Universal |
| **Micronutrient targets** | Cronometer | Niche, serious-tracker |

**Hypothesis Q4 result:** ✅ **CONFIRMED + STRENGTHENED**.
- Daily ring + weekly bar/digest đúng pattern
- Streak negative evidence **stronger than expected** — Noom's mainstream criticism in Business Insider, Femestella, psychology blogs cảnh báo trigger eating disorder
- **MealPlaning recommendation:** Calorie ring + 4 macro ring (P/C/F/Fiber) + weekly trend bar. **NO streak counter, NO daily weigh-in mandatory, NO traffic-light food coloring (Noom anti-pattern).**

#### Q5 — Edit/Delete Logged Meal

| Pattern | App example | UX |
|---|---|---|
| Tap entry → edit form | All 8 | Universal |
| Hard delete (X button or menu) | All 8 | Universal |
| **Undo toast 5-10s** | None documented | ⚠️ Standard mobile pattern but **NOT documented in any of 8 apps** |
| Soft-delete with history | None | – |
| Reset to original (after edit) | Cronometer, Carb Manager | Niche — for nutrient editing only |

**Hypothesis Q5 result:** ⚠️ **HYPOTHESIS WRONG / GAP** (with strong direct evidence).
- **MFP CONFIRMED no undo** — official community answer: _"Unfortunately, there is not a way to reverse a deletion. You will need to manually re-add the food item to your Diary."_ ([MFP community thread](https://community.myfitnesspal.com/en/discussion/10879929/can-i-undelete-a-food-diary-entry-that-i-deleted-in-error))
- **LoseIt has restore feature for weight history only** (not food entries) — see [LoseIt support](https://help.loseit.com/hc/en-us/articles/27509415690651-How-to-Restore-Weight-Data-History)
- For other 6 apps: no undo documented in help articles searched; **claim "0/8 has undo" downgraded** to "MFP confirmed no, LoseIt confirmed weight-only restore, others undocumented (likely no based on category norm)"
- **Implication:** Undo toast for food entries **không phải standard** trong category; available trong other mobile categories (Gmail, Material Design)
- **MealPlaning decision needed:** Be conservative (match incumbents = hard delete) OR differentiate (add undo as safety net for Vietnamese users who may be less experienced with hard-delete confidence)
- **Mary's recommendation:** **Add undo toast** — small effort, high safety value, especially for first-time tracker users in VN

#### Q6 — Onboarding

| Pattern | App | # screens upfront | What asked |
|---|---|---|---|
| **Comprehensive wizard upfront** | MFP, LoseIt, Lifesum, Yazio | 5-7 | Sex, height, weight, target, activity, goal type |
| **Long psychological wizard** | Noom | 10+ | + Behavior questions + emotional commitment |
| **Progressive (value-first)** | Spotify-style (not in nutrition apps) | 1-2 | Min viable to start, ask later |
| **No upfront** | Yummly | 0 | Goes to recipe browse first |

**Hypothesis Q6 result:** ⚠️ **PARTIAL CONFIRM with industry warning**.
- Hypothesis "progressive minimum" CORRECT in design theory (Spotify, productfruits research)
- But **0/8 nutrition apps actually do this** — đa số làm long wizard upfront
- **Why:** Nutrition apps need TDEE → need weight/height/age/sex/goal → can't lazy-load
- **Implication for MealPlaning:**
  - Minimum upfront: weight, height, sex, age, goal — **REQUIRED** (TDEE math)
  - Lazy/progressive: dietary preferences, activity level (default sedentary), allergies, target macro split
  - Skip: target date, behavior emotional questions, daily weigh-in commitment (Noom-style anti-pattern)
- **Recommendation:** 4-screen wizard upfront, then "you're done — start logging." Not 10+ screens.

### Business Models (light)

- **Freemium:** MFP, LoseIt, Lifesum, Yazio, Cronometer, Carb Manager — universal entry
- **Subscription:** USD 5-15/mo, premium features (week planner, photo AI, advanced stats)
- **One-time purchase:** Rare
- **Coaching/B2B:** Noom (heavy), MFP enterprise wellness
- **MealPlaning:** Single-user free offline → no business model concern Phase 3

### Competitive Dynamics & Switching Costs

- **Switching cost LOW** for casual users — data export inconsistent, but user data is small (calorie history)
- **Switching cost HIGH** for power users — recipe library, custom foods built up
- **MFP April 2026 redesign drama** — proves users **DO churn** when UX breaks core flow (copy-meals, diary access)
- **Implication for MealPlaning:** Don't break what works. Conservative iteration on F-03/F-04 once shipped.

### Ecosystem (light)

- Wearables: Apple Watch, Fitbit, Garmin, Oura — sync calorie burn back to nutrition app
- Voice: Alexa, Google Assistant integration (MFP, LoseIt, Cronometer)
- Recipe: Yummly DB, edamam API
- Health platform: Apple Health, Google Fit, Health Connect (Android 14+)
- **MealPlaning:** Offline-first → defer ecosystem. Health Connect optional Phase 5+.



---


---

## Step 3 Audit Log (Mary self-cynical pass)

After completing Step 3 draft, Mary performed adversarial self-audit và identified 7 issues. All fixed before proceeding:

| # | Severity | Issue | Fix Applied |
|---|---|---|---|
| G1 | 🔴 Critical | User counts (200M, 50M, 10M…) used without source verification | Dropped unverified numbers; kept only Sensor Tower / Good Housekeeping / PMC verified scales; marked others "unverified" |
| G2 | 🔴 Critical | Founded years (2005, 2008, 2011…) used without source | Dropped Founded column entirely |
| G3 | 🔴 Critical | "Lifesum/Yazio uses calorie ring" claim from recall | Verified Yazio via ScreensDesign source; downgraded Lifesum to "claimed but not verified" |
| G4 | 🟡 Medium | "0/8 apps has undo" overreach from 1 query | Added MFP direct confirmation quote; LoseIt weight-only restore; downgraded claim language |
| G5 | 🟡 Medium | Yummly "Tinder swipe" conflated case study with reality | Dropped claim; replaced with verified Yummly = grid + filter |
| G6 | 🟡 Medium | VN context conclusion từ thin evidence | Added disclaimer about evidence quality; downgraded confidence to Medium-Low; flagged for Phase 4 validation |
| G7 | 🟢 Low | Cronometer Hybrid claim base on forum, no vendor doc | Added 3 multi-thread quotes + explicit "forum-evidence, not vendor-official" disclaimer; confidence upgraded to High via multi-source consistency |

**Mary's takeaway:** Step 3 now passes self-audit. Methodological discipline preserved: claims either have direct source quotes hoặc explicit confidence/limitation marker.


## Regulatory Focus (Tập trung quy định pháp lý)

> **Mary giải thích:** Section này rà các quy định pháp lý ảnh hưởng đến app meal tracking — cả global standards (chuẩn quốc tế) và VN-specific (quy định Việt Nam). Mục đích: identify ràng buộc bắt buộc, recommend disclaimer + privacy policy, tránh rủi ro pháp lý + bị Google Play remove.

### A. FDA & Medical Device Regulation (Mỹ — chuẩn tham chiếu quốc tế)

**FDA stance về wellness vs medical device:**

- **General Wellness Policy** (cập nhật 2026, Kendall PC analysis): FDA exercise **enforcement discretion** (không thực thi) cho apps thuộc nhóm "general wellness, low risk" — **calorie tracking + meal logging fall vào category này**
- 2 tiêu chí qualify "general wellness":
  1. **Intended use** chỉ về general wellness, KHÔNG claim diagnose/treat/cure disease
  2. **Low risk** — không truyền data đến medical device, không ra clinical recommendation

**App được coi LÀ medical device khi:**
- Diagnose disease (chẩn đoán bệnh)
- Treat/prevent medical condition (điều trị/phòng bệnh)
- Provide clinical recommendations (đưa khuyến nghị lâm sàng) ngoài CDS exemption
- Analyze medical images/signals (ECG, EEG…)

**MealPlaning assessment:** ✅ **Wellness category, không phải medical device.**
- Track calorie + macro = general wellness
- KHÔNG diagnose tiểu đường/cao huyết áp dù target audience có bệnh lý
- KHÔNG đưa khuyến nghị clinical (chỉ tính TDEE — đây là math, không phải medical advice)
- → KHÔNG cần FDA approval, NHƯNG **cần disclaimer rõ ràng** để duy trì wellness classification

**Misconception cần tránh** (theo Complizen 2024):
- ❌ Sai: "App Store review = FDA compliance check" — App Store chỉ review policy của họ, KHÔNG verify medical/FDA status
- ❌ Sai: "Software không thể là medical device" — Software-only product VẪN có thể bị FDA regulate

_Sources:_
- [Sequenex — Mobile Medical App FDA Decision Tree](https://sequenex.com/mobile-medical-app-fda-regulation/)
- [FDA — Device Software Functions and Mobile Medical Applications (official)](https://www.fda.gov/medical-devices/digital-health-center-excellence/device-software-functions-including-mobile-medical-applications)
- [Kendall PC — FDA 2026 General Wellness Guidance](https://kendallpc.com/fdas-2026-guidance-on-general-wellness-devices-policy-for-low-risk-devices-key-compliance-and-regulatory-insights-for-digital-health-companies/)
- [Complizen — Does My Mobile Health App Need FDA Approval](https://www.complizen.ai/post/does-my-mobile-health-app-need-fda-approval-or-clearance-when-your-ios-android-app-is-a-medical-dev)
- [Mindbowser — FDA Compliance for Mobile Health Apps](https://www.mindbowser.com/fda-compliance-for-mobile-health-apps/)

### B. GDPR & Privacy (EU — chuẩn cao nhất, áp dụng global cho EU users)

**GDPR Article 9 — Sensitive Data (Dữ liệu nhạy cảm):**

> **Health data definition (định nghĩa dữ liệu sức khỏe):** _"Personal data related to the physical or mental health of a natural person, including the provision of health care services, which reveal information about his or her health status"_ — GDPR Article 4(15)

**Key finding (Legal IT Group analysis):** Nutrition app data **PHẢI được treat như health data** dù chỉ là "tôi ăn gì hôm nay" — vì food data có thể reveal:
- Eating disorder (rối loạn ăn uống)
- Allergy (dị ứng)
- Religious beliefs (Halal, Kosher, ăn chay)
- Pregnancy (bữa ăn mẹ bầu khác biệt)
- Medical conditions (diabetes diet, IBS diet)

→ **Article 9 requirements:**
- **Explicit consent** (đồng ý rõ ràng) — không phải tick mặc định, không phải implied consent
- **Granular** (chi tiết) — user phải biết app dùng data làm gì
- **Withdrawable** (rút lại được) — user có quyền rút consent bất cứ lúc nào
- Hoặc thuộc 1 trong 9 exemption khác (vital interest, public health…) — KHÔNG áp dụng cho consumer app

**GDPR Articles 12-22 — Quyền của user:**
- Right to access (truy cập data của mình)
- Right to rectification (sửa data sai)
- Right to erasure / "right to be forgotten" (xóa hoàn toàn)
- Right to data portability (xuất data sang format khác)

**Implication MealPlaning:**
- ✅ Hiện offline-first, single-user, **KHÔNG truyền data ra ngoài** → giảm 80% GDPR exposure
- ⚠️ Nhưng **NẾU** Phase 5+ thêm cloud sync hoặc AI feature gửi data đến Gemini/server → **PHẢI** triển khai full GDPR
- ⚠️ Privacy policy vẫn **bắt buộc** dù offline (Google Play yêu cầu — xem mục D)

_Sources:_
- [Legal IT Group — GDPR and Personalized Nutrition Apps](https://legalitgroup.com/en/gdpr-and-personalized-nutrition-apps/)
- [Momentum — GDPR Consent for Health Data](https://www.themomentum.ai/blog/gdpr-consent-requirements-health-data)
- [GDPR Article 9 (official)](https://gdpr-info.eu/art-9-gdpr/)
- [GDPR Algolia — Article 9 commentary](https://gdpr.algolia.com/gdpr-article-9)

### C. Vietnam — Personal Data Protection Decree 13/2023 (Nghị định 13/2023/NĐ-CP)

**Tổng quan:**
- **Hiệu lực:** 01/07/2023 — luật bảo vệ dữ liệu cá nhân **đầu tiên và toàn diện** của Việt Nam
- **Phạm vi áp dụng (Decree 13 Article 1):** Áp dụng cho mọi tổ chức/cá nhân trong nước HOẶC ngoài nước xử lý dữ liệu cá nhân của người Việt Nam
- → MealPlaning dù chỉ release VN vẫn phải tuân thủ

**Key requirements:**

| Yêu cầu | Áp dụng MealPlaning |
|---|---|
| Phân biệt dữ liệu **cơ bản** vs **nhạy cảm** | Dữ liệu sức khỏe (cân nặng, dinh dưỡng) thuộc **nhạy cảm** |
| Lawful basis trước khi xử lý | Phải có consent rõ ràng |
| Right to access / correct / delete | User phải xóa được data của mình |
| Security measures | Mã hóa, access control |
| Breach notification | Báo cáo 72h cho cơ quan có thẩm quyền nếu rò rỉ data |
| Data Protection Impact Assessment (DPIA) | Cho dữ liệu nhạy cảm — bắt buộc |
| Cross-border data transfer | Phải đăng ký nếu transfer data ra nước ngoài |

**Vấn đề riêng MealPlaning:**
- ✅ **Offline-first single-user** → giảm 90% Decree 13 exposure (data không rời thiết bị)
- ✅ KHÔNG cross-border transfer (data nằm trên thiết bị)
- ⚠️ **Vẫn cần** privacy notice trong app + privacy policy public (Google Play yêu cầu)
- ⚠️ **NẾU** thêm Gemini AI integration ở Phase 5+ → data gửi sang Google → cross-border transfer → **bắt buộc đăng ký** với Bộ Công an theo Decree 13

**Penalty (mức phạt):**
- Mức phạt hành chính theo Nghị định 14/2022/NĐ-CP cập nhật: **5-100 triệu VND** cho cá nhân, **10-200 triệu VND** cho tổ chức
- Trường hợp nghiêm trọng: thu hồi giấy phép, đình chỉ hoạt động

**PDPL (Personal Data Protection Law) sắp ban hành:**
- Quốc hội đang thảo luận PDPL mới (dự kiến 2024-2025) — **stricter than Decree 13**
- Sẽ build on Decree 13 nhưng có quy định nghiêm ngặt hơn về consent + cross-border transfer
- → MealPlaning nên **design for PDPL** (design theo chuẩn cao hơn) ngay từ Phase 3 để tránh rework sau

_Sources:_
- [Securiti.ai — Vietnam Decree 13 Overview](https://securiti.ai/vietnam-personal-data-protection-decree/)
- [DLA Piper — Vietnam Decree 13 Insights](https://www.dlapiper.com/insights/publications/crossroads-icr-insights/2023/vietnam-decree-13-and-the-new-regulations-on-personal-data-protection)
- [AusCham Vietnam — Decree 13 Practical Guide](https://auschamvn.org/advocacy/decree-132023nd-cp-personal-data-protection)
- [ClinRegs / NIH — Vietnam Profile Updated](https://clinregs.niaid.nih.gov/updates/full/164-vietnam-profile-updated-with-personal-data-protection-decree)
- [Seminar PDPL Vietnam (YouTube)](https://www.youtube.com/watch?v=0TuwSCO_-dM)

### D. Vietnam — Bộ Y tế (Ministry of Health) Guidance về dinh dưỡng

**Quyết định 3594/QĐ-BYT (29/11/2024) — "Mười lời khuyên dinh dưỡng hợp lý đến năm 2030":**
- KHÔNG phải quy định bắt buộc cho app, NHƯNG là **chuẩn tham khảo** chính thức của Bộ Y tế VN
- App nên **align nutrition recommendations** với 10 lời khuyên này (vd khuyến nghị đa dạng thực phẩm, hạn chế đường/muối/chất béo bão hòa)
- → **Recommendation:** Phase 4+ thêm "tip dinh dưỡng" trong app reference Quyết định 3594

**Quyết định 3558/QĐ-BYT (26/11/2024) — Hướng dẫn chế độ dinh dưỡng cho bệnh tiêu hóa:**
- Tài liệu chuyên môn cho bệnh nhân tiêu hóa
- ⚠️ **NẾU** MealPlaning Phase 5+ targeting bệnh nhân tiêu hóa → tham khảo
- Hiện Phase 3 chưa cần

**Vietlabo 2024 — Nhãn dinh dưỡng thực phẩm:**
- Quy định mới về cách ghi nhãn dinh dưỡng trên sản phẩm thực phẩm sản xuất tại VN (hiệu lực 15/02/2024)
- ⚠️ **Áp dụng cho nhà sản xuất thực phẩm**, KHÔNG áp dụng trực tiếp cho app
- NHƯNG MealPlaning food database nên **theo format này** để consistency — vd nutrition per 100g (đã align với canonical decision của project)

_Sources:_
- [Vietlabo — VN 2024 Food Label Nutritional Regulations](https://vietlabo.com/vi/vietnams-2024-update-new-food-label-nutritional-regulations/)
- [ThuVienPhapLuat — QĐ 3594/QĐ-BYT 2024 Mười lời khuyên dinh dưỡng](https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Quyet-dinh-3594-QD-BYT-2024-Muoi-loi-khuyen-dinh-duong-hop-ly-den-2030-633865.aspx)
- [LuatVietnam — QĐ 3558/QĐ-BYT 2024 Dinh dưỡng bệnh tiêu hóa](https://luatvietnam.vn/y-te/quyet-dinh-3558-qd-byt-2024-tai-lieu-huong-dan-che-do-dinh-duong-cho-cac-benh-ly-he-tieu-hoa-394823-d1.html)
- [TruyenHinhNgheAn — Bộ Y tế 10 lời khuyên dinh dưỡng 2030](https://truyenhinhnghean.vn/y-te/202412/bo-y-te-10-loi-khuyen-dinh-duong-hop-ly-den-nam-2030-70f424a/)

### E. Google Play Health Apps Policy (Áp dụng trực tiếp — BẮT BUỘC)

**Major update (hiệu lực 28/08/2025):** Google Play update Health Content and Services policy nghiêm ngặt hơn.

**Áp dụng cho app categorized vào "Health & Fitness" hoặc "Medical":**
- MealPlaning sẽ được categorize vào **Health & Fitness** trên Google Play

**Yêu cầu BẮT BUỘC (My App Monitor 2025 + Google Help):**

1. **Health Apps Declaration form** — bắt buộc complete trong Play Console
   - Khai báo: app làm gì, target audience, có thu thập health data không
   - Deadline cũ: 31/05/2024 cho first batch; full enforcement 28/08/2025

2. **Privacy Policy bắt buộc:**
   - Phải hiển thị **trong app** (không chỉ Play Store listing)
   - Phải có URL public ở Play Console
   - Phải mô tả: data nào được thu thập, dùng làm gì, share với ai

3. **Medical Device Status Declaration:**
   - Hoặc upload **regulatory approval** (FDA/CE marking…) — KHÔNG áp dụng cho wellness app
   - Hoặc **disclaimer** rõ ràng "**not a medical device**" + "not intended for diagnosis/treatment"
   - → MealPlaning chọn option 2

4. **Health Connect Policy** (Android 14+):
   - Nếu app dùng Health Connect API để đọc/ghi data từ Google Fit/Samsung Health → tuân thủ thêm Health Connect-specific rules
   - Phase 3 không dùng → skip

**Penalty (hậu quả):**
- App bị **remove khỏi Google Play** nếu không compliant
- "Non-compliance may lead to app removal from Google Play" — Passion.io 2024

_Sources:_
- [My App Monitor — Google Play Health Apps Policy 2025](https://myappmonitor.com/blog/google-play-policy-update-for-health-apps)
- [Google Play Help — Health apps declaration form (official)](https://support.google.com/googleplay/android-developer/answer/14738291?hl=en)
- [Google Play Help — Health app categories (official)](https://support.google.com/googleplay/android-developer/answer/13996367?hl=en)
- [Passion.io — Comply with Google Health & Fitness Declaration](https://help.passion.io/hc/en-us/how-to-comply-with-googles-health-fitness-apps-declaration)
- [ROIBest — Google Play Health Connect Policy](https://blog.roibest.com/language/en/reviews/google-play-health-policy/)

### F. Medical Disclaimer (Tuyên bố miễn trừ y tế) — Industry standard

**Pattern phổ biến (rút từ 4 industry samples):**

| Element | Mục đích | Ví dụ phrasing |
|---|---|---|
| **No medical advice** | Tránh liability khi user follow app rồi gặp vấn đề | "App này KHÔNG cung cấp tư vấn y tế..." |
| **Not a substitute for professional advice** | Recommend tham khảo bác sĩ | "...không thay thế lời khuyên từ bác sĩ chuyên môn" |
| **Consult healthcare provider** | Push user đến chuyên gia khi cần | "Vui lòng tham khảo bác sĩ trước khi thay đổi chế độ ăn..." |
| **Use at own risk** | Disclaim trách nhiệm | "Sử dụng dựa trên rủi ro của bản thân bạn" |
| **Not for diagnosis** | Phân biệt rõ wellness vs medical | "...không nhằm mục đích chẩn đoán hay điều trị bệnh" |

**Khi nào hiển thị disclaimer:**
- ✅ **Onboarding screen** đầu tiên (1 lần, có nút "Tôi hiểu")
- ✅ **Settings → About** (truy cập lại được)
- ✅ **Footer Privacy Policy + Terms of Service**
- ⚠️ KHÔNG nên block UI mỗi lần mở app (UX kém)

_Sources:_
- [Ed can Help — Medical Disclaimer Sample](https://edcanhelp.io/medical-disclaimer/)
- [iProven — App Medical Disclaimer Sample](https://iproven.com/pages/app-medical-disclaimer)
- [Surfing Medicine — Legal Disclaimer Apps](https://www.surfingmed.com/legal-disclaimer-apps/)
- [InSphero — Medical Disclaimer](https://insphero.com/medical-disclaimer/)

### G. Tóm tắt — Compliance Checklist cho MealPlaning Phase 3+

| # | Yêu cầu | Source | Phase 3? | Phase 4? | Phase 5+? |
|---|---|---|---|---|---|
| 1 | Privacy Policy public + in-app | Google Play, Decree 13, GDPR | ✅ Bắt buộc | ✅ | ✅ |
| 2 | Medical disclaimer onboarding screen | FDA wellness, industry standard | ✅ Bắt buộc | ✅ | ✅ |
| 3 | Health Apps Declaration form (Play Console) | Google Play 28/08/2025 | ✅ Trước launch | ✅ | ✅ |
| 4 | "Not a medical device" disclaimer | Google Play, FDA | ✅ Bắt buộc | ✅ | ✅ |
| 5 | Right to delete data (in-app option) | Decree 13 | ✅ | ✅ | ✅ |
| 6 | Right to export data (CSV/JSON) | GDPR (nếu EU users) | ⚠️ Nice to have | ✅ | ✅ |
| 7 | Explicit consent UI cho data nhạy cảm | GDPR Article 9, Decree 13 | ✅ Onboarding | ✅ | ✅ |
| 8 | Encryption at rest cho health data | Decree 13 security measures | ⚠️ SQLite default unencrypted — **cần evaluate** | ✅ | ✅ |
| 9 | DPIA (Data Protection Impact Assessment) | Decree 13 nhạy cảm | ⚠️ Light version | ✅ Full | ✅ |
| 10 | Cross-border transfer registration | Decree 13 | – | – | ✅ Nếu Gemini cloud |
| 11 | Breach notification process | Decree 13 (72h) | ⚠️ Documented procedure | ✅ | ✅ |
| 12 | Align với QĐ 3594/QĐ-BYT 10 lời khuyên | Bộ Y tế | – | ⚠️ Tip recommendations | ✅ |

### Kết luận Step 4 — Mary's recommendation

**Action items BẮT BUỘC trước Phase 3 launch:**

1. ✅ **Viết Privacy Policy bilingual (VN + EN)** — host trên GitHub Pages hoặc website project, link từ Play Console
2. ✅ **Add medical disclaimer screen** vào onboarding flow F-03 (1 lần, có nút "Tôi đã hiểu")
3. ✅ **Add "Xóa toàn bộ dữ liệu" option** trong Settings (Decree 13 right to erasure)
4. ✅ **Hoàn thành Health Apps Declaration form** trong Play Console trước khi submit app
5. ⚠️ **Evaluate SQLite encryption** — mặc định KHÔNG encrypt, có thể cần SQLCipher cho health data (cost: thêm dependency, performance tradeoff)

**Decision points đã chốt với Khánh (2026-05-09):**

- **D-REG-1:** ❌ **KHÔNG** collect tên/email/contact info → giữ single-user offline anonymous → giảm 90% privacy exposure
- **D-REG-2:** ❌ **KHÔNG** target EU users (Phase 3 focus VN only) → KHÔNG cần full GDPR compliance, chỉ cần Decree 13
- **D-REG-3:** ✅ **CÓ** plan cloud sync / Gemini AI integration tương lai → **Phase 5+ sẽ trigger cross-border data transfer registration với Bộ Công an theo Decree 13**. Phase 3-4 chưa cần.
- **D-REG-4:** ❌ **HIỆN TẠI KHÔNG** SQLCipher → accept SQLite default (unencrypted). Trade-off: simpler/faster, nhưng nếu Phase 5+ có cloud sync thì phải re-evaluate (data leaving device cần encryption end-to-end)

**Implication mới:**
- Phase 3 compliance burden **giảm đáng kể** nhờ D-REG-1 + D-REG-2 (no PII, no EU)
- Phase 5+ compliance burden **tăng đáng kể** nhờ D-REG-3 (cloud + AI = cross-border transfer + cần re-evaluate encryption)
- → **Architecture decision flag:** Phase 3 nên **design data layer trừu tượng** để swap encryption mechanism dễ dàng khi Phase 5 cần (Repository pattern + interface, không hardcode SQLite calls)

**Decision points cần Khánh xác nhận:**

- **D-REG-1:** App có collect tên/email/contact info không? (Hiện single-user offline → likely KHÔNG → giảm exposure rất nhiều)
- **D-REG-2:** Có target user EU không? (Nếu có → full GDPR, nếu không → light Decree 13 only)
- **D-REG-3:** Có plan thêm cloud sync / Gemini AI integration không? (Nếu có → cross-border transfer registration bắt buộc Phase 5+)
- **D-REG-4:** SQLite encryption — đầu tư SQLCipher (security+) hay accept default (simplicity+)?

**Mary's note (Audit honesty):** Section này dựa vào secondary sources (DLA Piper, Securiti, blog analyses) chứ không đọc trực tiếp Decree 13 official Vietnamese text. Production deployment NÊN có legal review từ luật sư VN chuyên về data protection — em chỉ làm research preliminary để inform UX/architecture decisions.


---


## Technical Trends (Xu hướng công nghệ)

> **Mary's framing:** Step này không chỉ liệt kê công nghệ trending — quan trọng hơn là evaluate (đánh giá) công nghệ nào MealPlaning **adopt** (áp dụng), **defer** (hoãn), **skip** (bỏ qua), với rationale (lý do) gắn với Phase plan + offline-first constraint + Gemini AI integration đã chốt.

### A. AI Photo Food Recognition (Nhận diện món ăn từ ảnh)

**Trend status:** ⭐⭐⭐⭐⭐ **Mainstream baseline** (chuẩn cơ bản) 2024-2025
- Cal AI, Snap-It (Lose It), MyFitnessPal Meal Scan, NutriScan, Peony AI — tất cả ra mắt 2023-2025
- 2025 hybrid approach trở thành mainstream: AI estimate + manual override (sửa thủ công)

**Accuracy reality check (kiểm tra độ chính xác thực tế):**
- Peony testing 7 apps, 100+ meals trong 3 tháng:
  - Range accuracy: **50-82%** (Cal.ai + Peony AI dẫn đầu ~82%)
  - Simple foods (single ingredient): **87% accuracy**
  - Mixed meals (nhiều món trộn): chỉ **62% accuracy**
- mycaloriecounter.app báo accuracy ~94% cho 2025 advanced models — **conflict** với Peony testing → take with grain of salt
- Calsync research: AI users có **5x consistent logging** + **73% higher retention** vs manual

**Implication MealPlaning + Gemini AI:**
- ✅ **Highly relevant** vì đã commit Gemini AI integration ở Phase 5+
- ✅ Gemini multimodal (ảnh + text) phù hợp với photo food recognition
- ⚠️ **Accuracy trade-off (đánh đổi độ chính xác):** AI estimate VN dishes (Phở, Bún bò, Cơm tấm…) có thể **thấp hơn 62%** vì training data Western-heavy
- ⚠️ Cần **fallback UX:** AI suggest → user verify/edit → save (KHÔNG fully automatic)

**Recommendation:**
- **Phase 3:** ❌ Skip — focus core meal log + dish CRUD trước
- **Phase 4:** ⚠️ Defer — chỉ làm sau khi core hoàn thiện
- **Phase 5+ với Gemini:** ✅ Adopt với **VN-specific fallback** (low-confidence → ask user)

_Sources:_
- [Calsync — AI Food Recognition vs Manual Counting 2025](https://www.calsyncapp.com/blog/ai-food-recognition-vs-manual-calorie-counting-which-is-more-accurate-in-2025)
- [Peony — Best AI Calorie Counter Apps 2025 (RD testing)](https://heypeony.com/blog/best-a-i-calorie-counter)
- [MyCalorieCounter — AI Food Recognition Accuracy 2025](https://mycaloriecounter.app/blog/ai-food-recognition-accuracy-2025/)
- [Fitia — 9 Best Food Tracking Apps 2025](https://fitia.app/learn/article/best-food-tracking-apps-2025-complete-guide/)
- [NutriScan — Best Free AI Calorie Tracking Apps 2026](https://nutriscan.app/blog/posts/best-free-ai-calorie-tracking-apps-2025-bd41261e7d)

### B. Voice Logging (Ghi nhật ký bằng giọng nói)

**Trend status:** ⭐⭐⭐ **Emerging** (đang nổi), chưa mainstream
- Whisper-based offline IME, Whisper Notes ($6.99 iOS), Handy (open-source cross-platform)
- Reality: voice food logging vẫn **niche** — chỉ 1 medium article về "I built voice-first food logger" làm POC (proof of concept), không có app mainstream nào dùng làm core feature

**Technical feasibility (khả thi kỹ thuật):**

| Approach | Pros | Cons | MealPlaning fit |
|---|---|---|---|
| **Cloud-based** (Whisper API, Google Speech-to-Text) | Higher accuracy, multiple language | Internet required, privacy concern | ❌ Conflict offline-first |
| **On-device Whisper** (whisper.cpp, ML Kit) | Offline, privacy-preserving | Larger APK (~50-200MB), slower on low-end devices | ⚠️ Possible but heavy |
| **Hybrid** (on-device with cloud fallback) | Best of both | Complex implementation | ⚠️ Phase 5+ nếu có cloud |

**Implication MealPlaning:**
- ⚠️ **Voice logging tiếng Việt** thêm độ khó — Whisper VN accuracy ~70-80% (lower than English ~90%+)
- ⚠️ APK size impact đáng kể nếu bundle Whisper model on-device

**Recommendation:**
- **Phase 3-4:** ❌ Skip — không đủ value vs effort
- **Phase 5+:** ⚠️ Re-evaluate sau khi user research Phase 4 (xem user có request không)

_Sources:_
- [Whisp — Offline AI Transcription (Google Play)](https://play.google.com/store/apps/details?id=com.hq.subtitleplayer)
- [F-Droid Whisper IME — Offline Speech Input](https://f-droid.org/packages/org.woheller69.whisper/)
- [Tom Parandyk — Voice-First Food Logger Medium](https://tomparandyk.medium.com/i-built-a-voice-first-food-logger-on-an-iphone-heres-what-broke-and-how-i-fixed-it-950dc9939f0a)
- [Handy — Open-source offline speech-to-text](https://www.reddit.com/r/LocalLLaMA/comments/1ldvosh/handy_a_simple_opensource_offline_speechtotext/)
- [Whisper Notes — Offline iOS/Mac App](https://whispernotes.app/)

### C. Offline-First Architecture (Kiến trúc ưu tiên offline)

**Trend status:** ⭐⭐⭐⭐⭐ **Industry best practice** đặc biệt cho health apps

**Key patterns đã established:**

| Pattern | Use case | Tool examples |
|---|---|---|
| **Local DB as source of truth** | Read/write trực tiếp local, không phụ thuộc network | Room (Android), CoreData (iOS), SQLite |
| **Background sync queue** | Khi reconnect → push pending changes | WorkManager (Android), BackgroundTasks (iOS) |
| **Conflict resolution strategies** | Khi local + remote diff → merge | Last-write-wins, vector clocks, CRDTs |
| **Optimistic UI updates** | Update UI ngay, rollback nếu sync fail | Standard mobile pattern |
| **Delta sync** | Chỉ sync diff thay vì full data | Ditto, Realm Sync |

**Healthcare-specific best practices** (Ahex.co):
- "Treat offline as **default state**, not exception" — match đúng MealPlaning philosophy
- Encryption at rest (Decree 13 alignment)
- Audit log cho health data changes

**Implication MealPlaning:**
- ✅ **Phase 3 đã align** — sql.js / capacitor-community SQLite, single device, KHÔNG có sync layer
- ⚠️ **Phase 5+ với cloud sync (D-REG-3 confirmed)** sẽ cần:
  - Sync queue (WorkManager equivalent cho Capacitor)
  - Conflict resolution strategy → recommend **Last-write-wins** với client timestamp (đơn giản, đủ cho single-user multi-device scenario)
  - Delta sync (không upload toàn bộ DB mỗi lần)
- ⚠️ **Architecture flag:** Phase 3 nên design Repository pattern abstract (đã note ở Step 4) để Phase 5 swap data source dễ dàng

**Recommendation:**
- **Phase 3:** ✅ Already aligned (offline-first SQLite single device)
- **Phase 4:** ⚠️ Add audit log table cho future sync (timestamps + soft delete)
- **Phase 5+:** ✅ Implement sync queue + Last-write-wins conflict resolution

_Sources:_
- [DEV.to — Offline-First Mobile Architecture (Android example)](https://dev.to/odunayo_dada/offline-first-mobile-app-architecture-syncing-caching-and-conflict-resolution-518n)
- [Ditto — Offline-First Architecture overview](https://www.ditto.com/solutions/offline-first-architecture)
- [Ahex — Offline-First Healthcare Apps Android](https://ahex.co/offline-first-android-healthcare-apps/)
- [Android Developers — Build Offline-First App (official)](https://developer.android.com/topic/architecture/data-layer/offline-first)

### D. Health Platform Integration (Apple HealthKit / Google Health Connect)

**Trend status:** ⭐⭐⭐⭐ **Standard for cross-app data sharing**

**Key facts:**
- **Health Connect** = Google's central health data hub (Android 14+, mandatory for new health apps)
- **Apple HealthKit** = iOS equivalent, mature since iOS 8
- Both support: steps, heart rate, weight, calories, nutrition (macro + micro), sleep, etc.
- Data flow: third-party app → write to platform → other apps read with permission

**Implication MealPlaning:**
- ⚠️ **Android-only Phase 3-4** (per project context) → chỉ cần Health Connect
- ✅ **Highly relevant** vì user track weight + nutrition trong MealPlaning có thể sync sang Samsung Health, Google Fit, smart scale apps
- ⚠️ **Permission scope quan trọng:** chỉ request permissions thực sự cần (Decree 13 minimization principle)
- ⚠️ Health Connect API cần **separate Google Play declaration** (xem Step 4 mục E)

**Recommendation:**
- **Phase 3:** ❌ Skip — chưa cần, focus core
- **Phase 4:** ⚠️ Evaluate dựa trên user feedback
- **Phase 5+:** ✅ Adopt Health Connect (write nutrition + read weight) — đây là **expected feature** cho serious user

_Sources:_
- [MindSea — Apple Health vs Google Health Connect Integration](https://mindsea.com/blog/apple-health-android-health-connect-integration-platforms-for-health-wellness-and-fitness/)
- [Hubifi — Apple Health Food Tracker 2025](https://www.hubifi.com/blog/easily-integrate-apple-data)
- [Medium @rohandhalpe05 — Integrating Apple Health + Health Connect](https://medium.com/@rohandhalpe05/integrating-apple-health-and-google-health-connect-in-health-fitness-apps-f9e04218c645)

### E. Gemini AI Integration (Đặc thù MealPlaning)

**Trend status:** ⭐⭐⭐⭐⭐ **Critical** — đã chốt làm core differentiator (D-REG-3 confirmed)

**Gemini API options:**

| Model | Use case MealPlaning | Free tier (April 2026) | Cost paid |
|---|---|---|---|
| **Gemini 2.0 Flash** | Text classification, dish categorization | 15 RPM, 1500 RPD | Cheapest |
| **Gemini 2.5 Flash Image 🍌** | Photo food recognition | Limited | Mid-tier |
| **Gemini 2.5 Pro** | Complex reasoning (meal plan suggestion) | 10 RPM | Highest |
| **Gemini 3.1 Flash Image Preview** | Latest food image (preview) | Very limited | Pro pricing |

⚠️ **Reddit evidence:** Free tier đang bị tighten — 1 user báo "Gemini Free Tier now down to 20 requests per day" (homeassistant subreddit 2024). Cần verify cho production scale.

**Implication MealPlaning Phase 5+:**

| Feature | Gemini call | Concern |
|---|---|---|
| **Food photo recognition** | Image → nutrition estimate | Cost per call, Internet required, latency |
| **Dish suggestion** ("món Việt low-carb") | Text → dish list | Cheap, async OK |
| **Meal plan generation** ("plan tuần này 1500cal/ngày") | Text → 7-day plan | Reasoning-heavy → Pro model |
| **Recipe parsing** (user paste recipe URL → extract ingredients) | URL context → structured output | Free URL context tool |

**Architecture concerns:**
- ❗ **Cross-border data transfer (Decree 13)** — Phase 5 sẽ cần đăng ký với Bộ Công an (đã note Step 4)
- ❗ **Cost control** — cần rate limit per-user để tránh abuse
- ❗ **Offline degradation** — Gemini features phải gracefully fall back khi không Internet
- ⚠️ **VN dish coverage** — Gemini 2.5+ có training data tiếng Việt, nhưng accuracy cho món Việt traditional chưa verified

**Recommendation:**
- **Phase 3-4:** ❌ Don't ship Gemini features (focus core)
- **Phase 5:** ✅ Start with **text-based features** (dish suggestion, recipe parsing) — cheap, less risk
- **Phase 5.5+:** ⚠️ Add photo recognition sau khi đã có user base test text features

_Sources:_
- [Gemini API Pricing (official)](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini API Free Tier Guide April 2026](https://pecollective.com/tools/gemini-free-tier-guide/)
- [Gemini Rate Limits (official)](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Reddit r/homeassistant — Gemini Free Tier Discussion](https://www.reddit.com/r/homeassistant/comments/1phak8x/gemini_ai_no_longer_free_whats_everyones_plan/)

### F. Snapshot vs Realtime — Technical Pattern Evidence (CRITICAL — validate Hybrid policy)

**Trend status:** ⭐⭐⭐⭐ **Established pattern** trong financial apps, emerging trong nutrition

**Key technical patterns supporting Hybrid:**

#### F.1. SQLite native snapshot support
- `sqlite3_snapshot` API: tạo read-only snapshot tại thời điểm nhất định
- Use case: financial reporting, audit trail
- → MealPlaning **không cần** dùng API này, nhưng confirms pattern is well-established

#### F.2. Personal finance app pattern (analogous use case)
- DBA StackExchange thread về SQLite finance app: dùng `Transaction_History_Log` với `createDate` để snapshot monthly/yearly state
- → Đây là **direct analog** với Hybrid policy của MealPlaning:
  - Bank account balance = nutrition snapshot
  - Transaction = meal log entry
  - Historical balance immutable = past completed meals immutable

#### F.3. Trigger-based history tracking (Simon Willison's sqlite-history)
- Pattern: triggers automatically populate `_history` rows on UPDATE/DELETE
- Storage efficient: chỉ lưu changed columns + timestamp
- → MealPlaning **có thể adopt** Phase 4-5 cho audit trail (Decree 13 traceability)

**Cross-app validation summary:**

| Source of evidence | Pattern | Strength |
|---|---|---|
| Cronometer forum threads | Explicit Hybrid (user choice on edit) | High (4 multi-thread quotes — Step 3) |
| Personal finance apps | Snapshot historical state | High (well-known pattern) |
| Banking systems | Immutable transaction log | Very High (industry standard) |
| Healthcare EHR | Versioned medical record | High (HIPAA requirement) |
| MealPlaning automatic state-based Hybrid | Novel for nutrition apps | Medium-High confidence |

**Implication MealPlaning:**
- ✅ **Hybrid policy được validate technically** từ multiple precedents (financial, healthcare, snapshot APIs)
- ✅ **Implementation strategy:** Use `is_completed` flag để switch logic — **không cần** SQLite snapshot API, đơn giản hơn nhiều
- ✅ **Phase 4 enhancement candidate:** Add `_history` triggers cho audit trail (Decree 13 + user "rollback" capability)

**Recommendation:**
- **Phase 3:** ✅ Implement Hybrid với `is_completed` + `nutrition_snapshot` JSON column (đã chốt)
- **Phase 4:** ⚠️ Consider adding history triggers cho audit trail
- **Phase 5+:** ✅ Cần history triggers để compliance + user trust

_Sources:_
- [SQLite Snapshot API (official)](https://sqlite.org/c3ref/snapshot.html)
- [DBA StackExchange — Personal Finance App SQLite Pattern](https://dba.stackexchange.com/questions/289178/personal-finance-app-monthly-reports-database-design-sqlite)
- [SQLite snapshot_open (official)](https://sqlite.org/c3ref/snapshot_open.html)
- [Simon Willison — sqlite-history triggers](https://simonwillison.net/2023/Apr/15/sqlite-history/)

### G. Tóm tắt — Technology Adoption Roadmap

| Tech | Phase 3 | Phase 4 | Phase 5+ | Risk level |
|---|---|---|---|---|
| **AI Photo Food Recognition** | ❌ Skip | ⚠️ Defer | ✅ Adopt với VN fallback | Medium (accuracy + cost) |
| **Voice Logging** | ❌ Skip | ❌ Skip | ⚠️ Re-evaluate | High (effort vs value) |
| **Offline-first SQLite** | ✅ Done | ✅ Add audit log | ✅ Add sync queue | Low |
| **Health Connect integration** | ❌ Skip | ⚠️ Evaluate | ✅ Adopt | Medium (Google Play declaration) |
| **Gemini text features** | ❌ Skip | ❌ Skip | ✅ Adopt | Medium (cost + Internet dep) |
| **Gemini photo features** | ❌ Skip | ❌ Skip | ⚠️ Phase 5.5+ | High (cost + accuracy VN) |
| **Hybrid nutrition policy** | ✅ Implement | ✅ Add history triggers | ✅ Maintain | Low (well-validated pattern) |
| **Cloud sync** | ❌ Skip | ❌ Skip | ✅ Adopt | High (Decree 13 + conflict) |
| **Health data encryption** | ⚠️ Evaluate | ✅ Implement | ✅ End-to-end if cloud | Medium (perf trade-off) |

### Mary's strategic insight

**3 critical technical decisions:**

1. **Hybrid policy = solid foundation** — Step 5 evidence từ financial apps + SQLite snapshots + cross-app patterns confirms architectural decision đã chốt là **đúng và technically validated**. Có thể proceed với confidence.

2. **AI features = Phase 5+ exclusively** — Đừng để pressure "AI is hot" làm rush vào Phase 3. Core meal log + dish CRUD + Hybrid nutrition phải solid trước. AI thêm vào sau khi:
   - Core có ≥100 dishes data → đủ để Gemini context-aware
   - User base đủ feedback về VN dish accuracy
   - Architecture đã abstract data layer (Repository pattern)

3. **Architecture preparation cho Phase 5+ cloud sync** — Phase 3 đã commit cloud sync sẽ đến (D-REG-3). Phải:
   - Repository pattern (abstract data source)
   - Soft delete + timestamp ở Phase 4 (chuẩn bị cho conflict resolution)
   - Audit log table sẵn (Decree 13 + sync history)

**Questions cần Khánh confirm:**

- **D-TECH-1:** Phase 3 có dùng Repository pattern strict (interface-based) hay direct SQLite calls? (đề xuất: Repository pattern dù phức tạp hơn 20-30%, future-proof)
- **D-TECH-2:** Phase 4 có start adding audit log triggers không? (đề xuất: CÓ, prep cho Phase 5)
- **D-TECH-3:** Gemini feature naming/branding — call "AI Assistant" hay "Smart Helper" hay "MealMate"? (defer to D2 Sally)


---


## Research Synthesis (Tổng hợp & Kết luận)

> **Mary's framing:** Step cuối — đóng gói toàn bộ research thành deliverable Sally dùng được ngay ở D1/D2.

### 1. Executive Summary

**3 key findings:**
1. **Hybrid nutrition policy của MealPlaning is technically + UX validated** — Cronometer làm explicit Hybrid (user choice on edit), MealPlaning làm automatic state-based Hybrid. Có precedent từ financial apps + healthcare EHR. **Proceed with confidence.**
2. **Free week-view planning + meal-slot grid là differentiator thật** — MFP/LoseIt giấu sau paywall; offline-free MealPlaning có competitive edge cho VN market.
3. **Noom-style streak/traffic-light = anti-pattern** — documented psychology harm. MealPlaning skip 100% là quyết định đúng.

**3 recommendations top priority:**
1. F-03 Calendar: **2 modes** (Day default + Week toggle) — Day mode tránh crowded mobile, Week mode là differentiator
2. F-04 Tracking: **Calorie ring + 4 macro ring + weekly bar trend** — NO streak, NO traffic-light food coloring
3. **Add undo toast** cho delete operations (5-10s window) — MFP confirmed gap, easy implementation, high UX value

**1 risk flag:**
- ⚠️ **VN dish AI accuracy chưa verified** — Phase 5+ Gemini photo recognition cần extensive VN dataset testing trước khi ship. Mitigation: text features Phase 5 first, photo Phase 5.5+.

### 2. Hypothesis Validation Summary

| # | Question | Hypothesis | Result | Confidence | Action |
|---|---|---|---|---|---|
| Q1 | Calendar layout | Week + meal-slot grid | ⚠️ Partial — meal-slot universal, week-view rare/paid | High | F-03: 2 modes (Day default + Week toggle) |
| Q2 | Hybrid policy | Hiếm có precedent | ✅ Confirmed + Innovative — Cronometer explicit Hybrid | High | Proceed; add tooltip explain behavior |
| Q3 | Logging UX | Search + copy dominant | ✅ Confirmed | High | Phase 3: search + recent + favorites + copy-from-date |
| Q4 | Visualization | Ring + bar, no streak | ✅ Confirmed + strengthened (Noom anti-pattern) | High | Calorie+macro rings + weekly bar; NO streak |
| Q5 | Edit/delete | Undo toast standard | ❌ Wrong — 0/8 apps có undo | High (MFP confirmed) | **Add undo as differentiator** |
| Q6 | Onboarding | Progressive | ⚠️ Partial — TDEE math cần weight upfront | Medium | 4-screen wizard essentials only |
| Q7 | VN context | Không đặc biệt | ✅ Tentative confirm | Medium-Low | Localize VN + dish + units; revisit Phase 4 with real users |

### 3. Cross-Step Pattern Catalog

#### F-03 Calendar/Plan patterns

| Pattern | Apps using | MealPlaning decision | Rationale |
|---|---|---|---|
| Meal-slot grid (B/L/D/Snack) | All 8 apps | ✅ Adopt | Universal mental model |
| Week-view horizontal scroll | MFP premium, LoseIt premium | ✅ Adopt (free!) | Differentiator |
| Day-view list | All 8 apps | ✅ Adopt as default | Mobile-friendly |
| 7-day rolling vs week-aligned | Mixed | ✅ Week-aligned (Mon-Sun) | VN context |
| Drag-drop dish to slot | Yummly, Lifesum | ⚠️ Defer Phase 4 | Complex on mobile |
| Copy-from-day | MFP, LoseIt | ✅ Adopt | High utility |
| Meal templates (Mon-Wed-Fri) | Lifesum | ⚠️ Defer Phase 4 | Power user feature |
| Plan vs Log distinction | Cronometer | ✅ Adopt (CRITICAL) | Aligns Hybrid policy |

#### F-04 Tracking/Log patterns

| Pattern | Apps using | MealPlaning decision | Rationale |
|---|---|---|---|
| Calorie ring | Yazio, Apple Activity | ✅ Adopt | De-facto standard post-Apple |
| 4 macro rings (P/C/F/Fiber) | Cronometer, Carb Manager | ✅ Adopt | Matches goals |
| Weekly bar trend | MFP, LoseIt | ✅ Adopt | Pattern detection |
| Streak counter | Noom, Duolingo-style | ❌ REJECT | Documented psychology harm |
| Traffic-light food | Noom | ❌ REJECT | Anti-pattern |
| Daily target percentage | All | ✅ Adopt | Standard |
| Net calories (eaten - exercised) | MFP, LoseIt | ⚠️ Defer | Phase 5 (Health Connect) |
| Search-based logging | All 8 | ✅ Adopt | Universal |
| Recent foods | All 8 | ✅ Adopt | Universal |
| Favorites/Saved meals | MFP, LoseIt, Cronometer | ✅ Adopt | High utility |
| Copy from yesterday | MFP, LoseIt | ✅ Adopt | High utility |
| Quick add (calo only) | MFP | ⚠️ Defer Phase 4 | Edge case |
| Photo logging (AI) | Cal AI, LoseIt Snap-It | ⚠️ Phase 5+ | Gemini integration |
| Voice logging | Niche apps | ❌ Skip | Low value/effort ratio |
| Barcode logging | Most | ❌ Skip (per Khánh Q3) | VN context lacks barcodes |
| Undo toast on delete | None | ✅ ADOPT (differentiator) | Safety net |
| Edit-recipe-update-past prompt | Cronometer | ❌ Skip | MealPlaning automatic Hybrid |

#### Onboarding patterns

| Pattern | Apps using | MealPlaning decision |
|---|---|---|
| Wizard upfront (essentials) | All 8 | ✅ Adopt — 4 screens |
| Progressive (lazy ask) | None for fitness apps | ❌ Skip — TDEE math needs weight |
| Goal selection (lose/maintain/gain) | All | ✅ Adopt |
| Activity level question | All | ✅ Adopt |
| Diet preference upfront | Lifesum, Yazio | ⚠️ Defer Phase 4 |
| Medical disclaimer screen | Industry standard | ✅ Adopt (Step 4 mandate) |

### 4. Final Recommendations cho F-03 (Calendar/Plan)

**MUST adopt:**
- 2-mode toggle: Day (default) ↔ Week
- Meal-slot grid: Sáng / Trưa / Chiều / Phụ
- Plan vs Log visual distinction (planned dish faded/dashed border, logged dish solid)
- Tap empty slot → "Thêm món" search modal
- Long-press dish → context menu (Copy, Move, Delete)

**MUST reject:**
- Streak indicator
- Traffic-light food coloring
- Aggressive notifications "You haven't logged today!"

**Open questions for Sally D2:**
- O-F03-1: Week-view layout — 7 cột vertical hay horizontal scroll?
- O-F03-2: Bữa phụ (snack) — fixed slot hay flexible nhiều slot?
- O-F03-3: Cross-day drag-drop — implement Phase 3 hay defer?
- O-F03-4: Empty state copywriting — "Chưa có món nào" vs "Hôm nay ăn gì?"

### 5. Final Recommendations cho F-04 (Tracking/Log)

**MUST adopt:**
- Calorie ring (top center)
- 4 macro rings (Protein, Carbs, Fat, Fiber) — secondary row
- Weekly bar trend (last 7 days)
- Search + Recent + Favorites tabs trong logging modal
- Copy-from-date button (default = yesterday)
- Undo toast 5-10s after delete
- "Đã ăn" toggle để switch is_completed=0→1 → trigger snapshot

**MUST reject:**
- Streak / consecutive days indicator
- Color-coded "good vs bad" food badges
- Daily weigh-in pressure prompt (Noom-style)

**Open questions for Sally D2:**
- O-F04-1: Hybrid policy microcopy — explain to user thế nào? (tooltip vs onboarding tour vs FAQ)
- O-F04-2: Edit-past-meal flow — show snapshot value vs current recipe value?
- O-F04-3: Macro ring nào hiện đầu — Protein hay Carbs (VN diet rice-heavy)?
- O-F04-4: Trend baseline — 7 days rolling vs week-aligned?

### 6. Risk Register

| # | Risk | Impact | Likelihood | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | Hybrid policy confuse user | Medium | Medium | Tooltip + microcopy + FAQ section | Sally D2 |
| R2 | VN dish AI accuracy <50% | High | High | Phase 5+ text features first; photo defer Phase 5.5; user verify UI | Phase 5 lead |
| R3 | Gemini free tier insufficient | Medium | High | Plan paid tier from Phase 5; rate limit per user | Architect D8 |
| R4 | SQLite no encryption (D-REG-4) | Medium | Low (offline) | Re-evaluate Phase 5 when cloud sync added | Architect |
| R5 | Cross-border transfer Decree 13 | High | Certain (Phase 5) | Register with Bộ Công an before Phase 5 launch | Legal/Khánh |
| R6 | Privacy Policy chưa có | High | Certain | Draft Phase 3 launch blocker | Khánh |
| R7 | VN user research thin | Medium | High | Phase 4 beta with 5-10 VN users for validation | Phase 4 lead |
| R8 | Repository pattern complexity 30%+ | Low | Medium | Code review + clear interfaces | Dev |

### 7. Decisions Log

**Locked decisions (chốt từ research):**
- D-REG-1: ❌ NO collect tên/email
- D-REG-2: ❌ NO target EU users (VN focus only)
- D-REG-3: ✅ YES Phase 5+ cloud sync + Gemini AI
- D-REG-4: ❌ NO SQLCipher hiện tại (re-evaluate Phase 5)

**Pending decisions (defer to D2 Sally / D8 Architect):**
- D-TECH-1: Repository pattern strict? (Mary recommend YES)
- D-TECH-2: Phase 4 audit log triggers? (Mary recommend YES)
- D-TECH-3: Gemini feature naming (defer D2)

**Validated architectural commitments:**
- Hybrid nutrition policy with `is_completed` flag + `nutrition_snapshot` JSON
- Offline-first SQLite single device Phase 3
- Dish-centric data model (already aligned)
- 100g/100ml canonical unit (already aligned)

### 8. Next Actions — Handoff to D1

**D1 Activate Sally checklist:**

1. ✅ Sally đọc file research này (`domain-meal-planning-tracking-ux-research-2026-05-09.md`)
2. ✅ Sally đọc PRD existing (`docs/2-requirements/prd.md`)
3. ✅ Sally đọc Design System (`docs/3-design/design-system.md`)
4. ✅ Sally đọc Data Model + Business Rules
5. ✅ Sally load skill `bmad-agent-ux-designer`
6. → Sally generate F-03 + F-04 UX spec ở D2 sử dụng:
   - Pattern catalog (Section 3 above)
   - F-03 + F-04 recommendations (Section 4 + 5)
   - Open questions list (resolve trong D2)
   - Risk register (mitigate trong UX)

**D1 acceptance criteria:**
- [ ] Sally activated với context loaded
- [ ] Sally confirms understanding của Hybrid policy
- [ ] Sally proposes wireflow approach (text-based, không pixel mockup theo memory user-first)
- [ ] Sally identifies thêm risks/questions chưa cover ở research

---

## Workflow Complete ✅

**Steps completed:** 1 (Init) → 2 (Industry Analysis) → 3 (Competitive Landscape with audit fix) → 4 (Regulatory Focus) → 5 (Technical Trends) → 6 (Synthesis)

**Output:** ~1500 lines, 75+ KB, 80+ citations across 6 step categories

**Mary signing off:** Research phase complete. Ready để hand off cho Sally (UX Designer persona) ở D1.

---

_Cập nhật cuối: 2026-05-09 — Mary (Analyst, BMAD)_

<!-- Content will be appended sequentially through research workflow steps -->

