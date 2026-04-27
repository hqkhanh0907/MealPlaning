# Citation source: Wikipedia Vietnamese (and other open sources)

## Anchors used by `vi-ingredients.ts`

- `#nuoc-mam` — Nước mắm (fish sauce, ~35°N grade), macro avg.
- `#muoi` — Muối (table salt).
- `#duong` — Đường trắng (granulated sugar).
- `#dau-an` — Dầu ăn thực vật (generic blended cooking oil).
- `#hanh-tim` — Hành tím (shallot, raw).
- `#hanh-la` — Hành lá (scallion / green onion, raw).
- `#toi` — Tỏi (garlic, raw).
- `#gung` — Gừng (ginger root, raw).
- `#sa` — Sả (lemongrass, raw stalk).
- `#ot` — Ớt tươi (fresh chili pepper, mixed cultivars).
- `#tieu` — Tiêu đen xay (ground black pepper).
- `#bot-ngot` — Bột ngọt (MSG, monosodium glutamate).
- `#uc-ga` — Ức gà sống (raw chicken breast).
- `#banh-pho` — Bánh phở tươi (fresh phở rice noodles).
- `#thit-bo-nac` — Thịt bò nạc sống (raw lean beef).
- `#thit-heo-nac-vai` — Thịt heo nạc vai sống (raw lean pork shoulder).
- `#suon-heo` — Sườn heo sống (raw pork ribs).
- `#tom-su` — Tôm sú sống (raw tiger prawn).
- `#muc-ong` — Mực ống tươi (raw squid).
- `#ca-loc` — Cá lóc sống (raw snakehead fish).
- `#ca-basa` — Cá basa sống (raw basa fish).
- `#trung-ga` — Trứng gà nguyên quả (whole chicken egg).
- `#cha-lua` — Chả lụa (Vietnamese pork roll).
- `#cua-dong` — Cua đồng xay (field crab paste, used in bún riêu).
- `#com-trang` — Cơm trắng nấu chín (cooked white rice).
- `#bun-tuoi` — Bún tươi (fresh rice vermicelli).
- `#mi-trung-tuoi` — Mì trứng tươi (fresh egg noodles).
- `#mi-quang` — Sợi mì Quảng tươi (fresh mì Quảng noodles).
- `#banh-mi` — Bánh mì Việt (Vietnamese baguette crumb).
- `#xoi` — Xôi nấu chín (cooked sticky rice).
- `#banh-trang` — Bánh tráng khô (dry rice paper).
- `#bot-gao` — Bột gạo tẻ (rice flour).
- `#ca-chua` — Cà chua tươi (raw tomato).
- `#dua-chua` — Dưa cải muối chua (pickled mustard greens).
- `#rau-song` — Rau sống (mixed fresh herbs platter — avg of common leaves).
- `#nam-rom` — Nấm rơm tươi (raw straw mushroom).
- `#dua` — Dứa / thơm tươi (raw pineapple).
- `#gia-do` — Giá đỗ xanh (mung bean sprouts).
- `#me-chua` — Me chua / cốt me (tamarind paste / pulp).
- `#dau-phu` — Đậu phụ chắc (firm tofu).

## Composite recipe anchors (§5.2.3 — `vi-composites.ts`)

- `#nuoc-cham-chua-ngot` — Standard sweet-sour fish sauce dipping base.
- `#nuoc-dung-pho` — Phở bò broth.
- `#nuoc-dung-bun-bo-hue` — Bún bò Huế broth.
- `#nuoc-dung-mi-quang` — Mì Quảng reduced gravy.
- `#nuoc-canh-chua` — Canh chua sour broth (tamarind + pineapple + tomato).
- `#nuoc-lau-thai` — Lẩu Thái hotpot base.
- `#nuoc-rieu-cua` — Bún riêu crab+tomato broth.

Each anchor must reference the relevant Wikipedia VI page or, where Wikipedia
lacks per-100 data, fall back to USDA FoodData Central / standard reference
values. Refine entries marked `is_approximate: true` whenever a primary VN
source becomes available.
does not list per-100 g/ml macro for an ingredient, or for items not in the
Vietnamese food composition table (e.g. internationally common ingredients).

Each citation includes the URL + page revision id (Wikipedia "permanent link")
so values are reproducible.

## Format

    ### <slug-id>  (matches `source_citation: 'sources/wikipedia-vi.md#slug-id'`)
    - **URL:** ...
    - **Permalink revision:** ...
    - **Accessed:** YYYY-MM-DD
    - **Macro extraction notes:** ...

## Entries (§5.2.1 placeholders — real citations added in §5.2.2)

### chicken-breast
- **URL:** https://en.wikipedia.org/wiki/Chicken_as_food
- **Macro extraction notes:** Skinless raw chicken breast, USDA-aligned values widely cited (165 kcal / 31 g protein per 100 g).

### nuoc-mam
- **URL:** https://en.wikipedia.org/wiki/Fish_sauce
- **Macro extraction notes:** Approximate average across Vietnamese fish sauces (35°N grade). Marked is_approximate=true.

### banh-pho
- **URL:** https://en.wikipedia.org/wiki/B%C3%A1nh_ph%E1%BB%9F
- **Macro extraction notes:** Fresh rice noodle (~75% water), commonly cited 109 kcal / 100 g for cooked weight.

### nuoc-dung-pho
- **URL:** https://en.wikipedia.org/wiki/Ph%E1%BB%9F#Broth
- **Macro extraction notes:** Composite — actual macro derived at build time from sub-recipe ingredients (see vi-composites.ts).
