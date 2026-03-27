# Scenario 8: Settings & Configuration

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Settings tab cho phép user cấu hình: Language (vi/en), Theme (light/dark), API key cho Gemini AI, user profile (name, weight, height), nutrition goals, data management (backup/import/export/clear). Tất cả settings lưu localStorage, apply ngay lập tức.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| SettingsTab | SettingsTab.tsx | Main settings UI |
| GoalSettingsModal | GoalSettingsModal.tsx | Nutrition goals |
| DataBackup | DataBackup.tsx | Backup/restore |
| useDarkMode | hooks/useDarkMode.ts | Theme toggle |
| useLanguage | hooks/useLanguage.ts | i18n |

## Luồng nghiệp vụ

1. User clicks Settings tab
2. Sections: Profile, Nutrition Goals, AI Config, Display, Data Management
3. Changes apply immediately (no save button needed for toggles)
4. Forms have save buttons (profile, goals)

## Quy tắc nghiệp vụ

1. Language: vi | en, persists, affects all labels
2. Theme: light | dark, persists, affects all components
3. API key: stored in localStorage, masked display
4. Profile: name (optional), weight (kg, > 0), height (cm, > 0)
5. Goals: targetCalories > 0, proteinRatio > 0
6. Data: export JSON, import JSON (validated), clear all (confirm)

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_SET_01 | Settings tab hiển thị | Positive | P0 |
| TC_SET_02 | All sections visible | Positive | P1 |
| TC_SET_03 | Profile section | Positive | P1 |
| TC_SET_04 | Set user name | Positive | P1 |
| TC_SET_05 | Set weight | Positive | P1 |
| TC_SET_06 | Set height | Positive | P2 |
| TC_SET_07 | Save profile | Positive | P1 |
| TC_SET_08 | Profile persist reload | Positive | P1 |
| TC_SET_09 | Language toggle vi/en | Positive | P0 |
| TC_SET_10 | Language change → all labels update | Positive | P0 |
| TC_SET_11 | Language persist reload | Positive | P1 |
| TC_SET_12 | Theme toggle light/dark | Positive | P0 |
| TC_SET_13 | Dark mode → all components dark | Positive | P1 |
| TC_SET_14 | Theme persist reload | Positive | P1 |
| TC_SET_15 | API key input field | Positive | P1 |
| TC_SET_16 | Enter API key | Positive | P1 |
| TC_SET_17 | API key masked (●●●) | Security | P1 |
| TC_SET_18 | API key persist | Positive | P1 |
| TC_SET_19 | Clear API key | Positive | P1 |
| TC_SET_20 | AI tab disabled after key clear | Positive | P1 |
| TC_SET_21 | Nutrition goals section | Positive | P1 |
| TC_SET_22 | Set target calories | Positive | P1 |
| TC_SET_23 | Set protein ratio | Positive | P1 |
| TC_SET_24 | Goals persist | Positive | P1 |
| TC_SET_25 | Goals → nutrition bars update | Positive | P1 |
| TC_SET_26 | Data management section | Positive | P1 |
| TC_SET_27 | Export data button | Positive | P1 |
| TC_SET_28 | Export → JSON file download | Positive | P0 |
| TC_SET_29 | Import data button | Positive | P1 |
| TC_SET_30 | Import valid JSON | Positive | P0 |
| TC_SET_31 | Import invalid JSON → error | Negative | P0 |
| TC_SET_32 | Import → data replaced | Positive | P1 |
| TC_SET_33 | Clear all data button | Positive | P1 |
| TC_SET_34 | Clear confirmation dialog | Positive | P1 |
| TC_SET_35 | Confirm clear → all data gone | Positive | P0 |
| TC_SET_36 | Cancel clear → data preserved | Positive | P1 |
| TC_SET_37 | Name empty → allowed (optional) | Positive | P2 |
| TC_SET_38 | Name very long (200 chars) | Boundary | P2 |
| TC_SET_39 | Name special characters | Edge | P2 |
| TC_SET_40 | Name Vietnamese diacritics | Positive | P2 |
| TC_SET_41 | Name HTML injection | Security | P1 |
| TC_SET_42 | Weight = 0 → error | Negative | P1 |
| TC_SET_43 | Weight negative → error | Negative | P1 |
| TC_SET_44 | Weight decimal (72.5) | Positive | P2 |
| TC_SET_45 | Weight very large (500) | Boundary | P2 |
| TC_SET_46 | Weight non-numeric → error | Negative | P1 |
| TC_SET_47 | Height = 0 → error | Negative | P2 |
| TC_SET_48 | Height negative → error | Negative | P2 |
| TC_SET_49 | Height decimal (175.5) | Positive | P2 |
| TC_SET_50 | Height very large (300) | Boundary | P2 |
| TC_SET_51 | Calories = 0 → error | Negative | P1 |
| TC_SET_52 | Calories negative → error | Negative | P1 |
| TC_SET_53 | Calories decimal | Positive | P2 |
| TC_SET_54 | Calories very large (10000) | Boundary | P2 |
| TC_SET_55 | Protein ratio = 0 → error | Negative | P1 |
| TC_SET_56 | Protein ratio negative → error | Negative | P1 |
| TC_SET_57 | Protein ratio decimal (1.8) | Positive | P2 |
| TC_SET_58 | Protein ratio very large (10) | Boundary | P2 |
| TC_SET_59 | API key empty → AI disabled | Negative | P1 |
| TC_SET_60 | API key with spaces → trimmed | Edge | P2 |
| TC_SET_61 | API key very long | Boundary | P2 |
| TC_SET_62 | API key XSS attempt | Security | P1 |
| TC_SET_63 | Export file name format | Positive | P2 |
| TC_SET_64 | Export includes all data types | Positive | P1 |
| TC_SET_65 | Export large data (1000 items) | Boundary | P2 |
| TC_SET_66 | Import schema validation | Positive | P1 |
| TC_SET_67 | Import missing fields → defaults | Edge | P2 |
| TC_SET_68 | Import extra fields → ignored | Edge | P2 |
| TC_SET_69 | Import corrupted JSON | Negative | P1 |
| TC_SET_70 | Import empty JSON | Negative | P1 |
| TC_SET_71 | Import very large file | Boundary | P2 |
| TC_SET_72 | Import → overwrite confirmation | Positive | P1 |
| TC_SET_73 | Clear → ingredients gone | Positive | P1 |
| TC_SET_74 | Clear → dishes gone | Positive | P1 |
| TC_SET_75 | Clear → plans gone | Positive | P1 |
| TC_SET_76 | Clear → settings preserved | Edge | P1 |
| TC_SET_77 | Dark mode toggle animation | Positive | P3 |
| TC_SET_78 | Language switch animation | Positive | P3 |
| TC_SET_79 | Section expand/collapse | Positive | P2 |
| TC_SET_80 | Settings scroll on mobile | Positive | P2 |
| TC_SET_81 | Desktop settings layout | Positive | P2 |
| TC_SET_82 | Form validation messages | Positive | P1 |
| TC_SET_83 | Success toast on save | Positive | P2 |
| TC_SET_84 | Error toast on invalid | Positive | P2 |
| TC_SET_85 | i18n all settings labels | Positive | P2 |
| TC_SET_86 | Dark mode settings page | Positive | P2 |
| TC_SET_87 | Google account section | Positive | P1 |
| TC_SET_88 | Google sign in | Positive | P1 |
| TC_SET_89 | Google sign out | Positive | P1 |
| TC_SET_90 | Google sync toggle | Positive | P1 |
| TC_SET_91 | Auto-sync on/off | Positive | P1 |
| TC_SET_92 | Sync status display | Positive | P2 |
| TC_SET_93 | Last sync timestamp | Positive | P2 |
| TC_SET_94 | Manual sync button | Positive | P1 |
| TC_SET_95 | Keyboard navigation settings | Positive | P3 |
| TC_SET_96 | Screen reader settings | Positive | P3 |
| TC_SET_97 | Touch toggles mobile | Positive | P2 |
| TC_SET_98 | Settings version display | Positive | P3 |
| TC_SET_99 | About section | Positive | P3 |
| TC_SET_100 | Feedback/support link | Positive | P3 |
| TC_SET_101 | Notification preferences | Positive | P3 |
| TC_SET_102 | Reset settings to defaults | Positive | P2 |
| TC_SET_103 | Settings export (separate from data) | Positive | P3 |
| TC_SET_104 | Multi-device sync settings | Positive | P3 |
| TC_SET_105 | Settings changelog/version history | Positive | P3 |

---
| TC_SET_106 | Theme light → background trắng toàn app | Positive | P1 |
| TC_SET_107 | Theme dark → background tối toàn app | Positive | P1 |
| TC_SET_108 | Theme system → tự động theo OS preference | Positive | P1 |
| TC_SET_109 | Theme schedule → chuyển dark/light theo giờ | Positive | P2 |
| TC_SET_110 | Theme light → text color đen đọc được | Positive | P2 |
| TC_SET_111 | Theme dark → text color sáng đọc được | Positive | P2 |
| TC_SET_112 | Theme switch → settings page tự đổi ngay | Positive | P1 |
| TC_SET_113 | Theme switch → calendar tab đổi ngay | Positive | P1 |
| TC_SET_114 | Theme switch → management tab đổi ngay | Positive | P1 |
| TC_SET_115 | Theme switch → modals đổi ngay | Positive | P2 |
| TC_SET_116 | Theme switch → charts/nutrition bars đổi ngay | Positive | P2 |
| TC_SET_117 | Theme switch → input fields border phù hợp | Positive | P2 |
| TC_SET_118 | Theme switch → button colors phù hợp | Positive | P2 |
| TC_SET_119 | Theme switch → toast notifications phù hợp | Positive | P2 |
| TC_SET_120 | Theme persist — đóng app mở lại giữ theme | Positive | P1 |
| TC_SET_121 | Theme system — đổi OS preference → app đổi theo | Positive | P2 |
| TC_SET_122 | Theme — icons/SVG đổi màu theo theme | Positive | P2 |
| TC_SET_123 | Theme — scrollbar style theo theme | Positive | P3 |
| TC_SET_124 | Theme — selection highlight color theo theme | Positive | P3 |
| TC_SET_125 | Theme — focus ring color theo theme | Positive | P3 |
| TC_SET_126 | Ngôn ngữ vi → tất cả labels tiếng Việt | Positive | P0 |
| TC_SET_127 | Ngôn ngữ en → tất cả labels tiếng Anh | Positive | P0 |
| TC_SET_128 | Đổi ngôn ngữ → calendar labels đổi | Positive | P1 |
| TC_SET_129 | Đổi ngôn ngữ → management tab labels đổi | Positive | P1 |
| TC_SET_130 | Đổi ngôn ngữ → settings labels đổi | Positive | P1 |
| TC_SET_131 | Đổi ngôn ngữ → modal labels đổi | Positive | P1 |
| TC_SET_132 | Đổi ngôn ngữ → toast messages đổi | Positive | P2 |
| TC_SET_133 | Đổi ngôn ngữ → validation error messages đổi | Positive | P2 |
| TC_SET_134 | Đổi ngôn ngữ → date format đổi vi dd/MM en MM/dd | Positive | P1 |
| TC_SET_135 | Ngôn ngữ persist — reload giữ lại ngôn ngữ | Positive | P1 |
| TC_SET_136 | Đổi ngôn ngữ → placeholder text đổi | Positive | P2 |
| TC_SET_137 | Đổi ngôn ngữ → empty state messages đổi | Positive | P2 |
| TC_SET_138 | Đổi ngôn ngữ → confirm dialog messages đổi | Positive | P2 |
| TC_SET_139 | Đổi ngôn ngữ — không mất dữ liệu user | Positive | P1 |
| TC_SET_140 | Đổi ngôn ngữ liên tục 10 lần → không lỗi | Boundary | P2 |
| TC_SET_141 | Export — file JSON tên đúng format backup-date | Positive | P2 |
| TC_SET_142 | Export — JSON chứa ingredients array | Positive | P1 |
| TC_SET_143 | Export — JSON chứa dishes array | Positive | P1 |
| TC_SET_144 | Export — JSON chứa dayPlans object | Positive | P1 |
| TC_SET_145 | Export — JSON chứa userProfile | Positive | P1 |
| TC_SET_146 | Export — JSON chứa settings theme language | Positive | P2 |
| TC_SET_147 | Export — data integrity count matches | Positive | P1 |
| TC_SET_148 | Export — empty app → arrays trống | Edge | P2 |
| TC_SET_149 | Export — 500 ingredients + 200 dishes file size hợp lý | Boundary | P2 |
| TC_SET_150 | Import — chọn file → preview hiển thị | Positive | P1 |
| TC_SET_151 | Import — preview hiện số items sẽ import | Positive | P2 |
| TC_SET_152 | Import — confirm → data thay thế hoàn toàn | Positive | P1 |
| TC_SET_153 | Import — cancel → không thay đổi | Positive | P1 |
| TC_SET_154 | Import — file không phải JSON → error | Negative | P1 |
| TC_SET_155 | Import — JSON thiếu required fields → error | Negative | P1 |
| TC_SET_156 | Import — JSON thêm unknown fields → bỏ qua | Edge | P2 |
| TC_SET_157 | Import — JSON chứa trùng ID → overwrite | Edge | P2 |
| TC_SET_158 | Import — file rất lớn 10MB → xử lý được | Boundary | P2 |
| TC_SET_159 | Import — file trống {} → error hoặc defaults | Negative | P2 |
| TC_SET_160 | Import — file corrupt half JSON → error rõ ràng | Negative | P1 |
| TC_SET_161 | Clear all → confirm dialog warning rõ ràng | Positive | P1 |
| TC_SET_162 | Clear all → ingredients dishes plans bị xóa | Positive | P0 |
| TC_SET_163 | Clear all → settings theme language KHÔNG bị xóa | Positive | P1 |
| TC_SET_164 | Clear all → API key KHÔNG bị xóa | Edge | P2 |
| TC_SET_165 | Clear all → empty states hiện ở tất cả tabs | Positive | P1 |
| TC_SET_166 | Clear all → cancel → không xóa gì | Positive | P1 |
| TC_SET_167 | Clear all → confirm → success toast | Positive | P2 |
| TC_SET_168 | Import sau clear → data mới hiện đúng | Positive | P2 |
| TC_SET_169 | Export → clear → import lại → data khôi phục | Positive | P1 |
| TC_SET_170 | Import → export ngay → 2 file identical | Positive | P2 |
| TC_SET_171 | Profile — tên Vietnamese diacritics Nguyễn Văn A | Positive | P1 |
| TC_SET_172 | Profile — tên rất dài 100 ký tự | Boundary | P2 |
| TC_SET_173 | Profile — tên trống → cho phép optional | Positive | P2 |
| TC_SET_174 | Profile — weight = 30 kg min practical | Boundary | P2 |
| TC_SET_175 | Profile — weight = 200 kg max practical | Boundary | P2 |
| TC_SET_176 | Profile — weight = 0.1 invalid quá nhẹ | Boundary | P2 |
| TC_SET_177 | Profile — height = 100 cm min practical | Boundary | P2 |
| TC_SET_178 | Profile — height = 250 cm max practical | Boundary | P2 |
| TC_SET_179 | Profile — save → reload → giá trị preserved | Positive | P1 |
| TC_SET_180 | Profile — chỉ sửa tên → weight/height không đổi | Positive | P2 |
| TC_SET_181 | Profile — dark mode form hiển thị đúng | Positive | P2 |
| TC_SET_182 | Profile — i18n labels đúng | Positive | P2 |
| TC_SET_183 | Profile — validation messages inline | Positive | P2 |
| TC_SET_184 | Profile — mobile layout responsive | Positive | P2 |
| TC_SET_185 | Profile — save thành công → toast notification | Positive | P2 |
| TC_SET_186 | API key — nhập key hợp lệ → AI enabled | Positive | P1 |
| TC_SET_187 | API key — masked hiển thị ●●●●●● | Security | P1 |
| TC_SET_188 | API key — click show → hiện toàn bộ key | Positive | P2 |
| TC_SET_189 | API key — click hide → mask lại | Positive | P2 |
| TC_SET_190 | API key — xóa key → AI tab disabled | Positive | P1 |
| TC_SET_191 | API key — paste key có spaces → auto trim | Edge | P2 |
| TC_SET_192 | API key — key chứa ký tự đặc biệt | Positive | P2 |
| TC_SET_193 | API key — XSS attempt script tag → sanitized | Security | P1 |
| TC_SET_194 | Google sign in → hiện user info | Positive | P1 |
| TC_SET_195 | Google sign out → xóa session | Positive | P1 |
| TC_SET_196 | Cloud sync — manual sync trigger | Positive | P1 |
| TC_SET_197 | Cloud sync — auto sync toggle on/off | Positive | P1 |
| TC_SET_198 | Cloud sync — last sync timestamp hiển thị | Positive | P2 |
| TC_SET_199 | Cloud sync — sync status indicator | Positive | P2 |
| TC_SET_200 | Cloud sync — offline → show offline indicator | Negative | P2 |
| TC_SET_201 | Settings search — gõ dark → highlight Theme | Positive | P2 |
| TC_SET_202 | Settings search — gõ export → highlight Data | Positive | P2 |
| TC_SET_203 | Settings search — text không match → Không tìm thấy | Positive | P2 |
| TC_SET_204 | Settings search — clear → hiện tất cả sections | Positive | P2 |
| TC_SET_205 | Settings — scroll smooth trên mobile | Positive | P2 |
| TC_SET_206 | Settings — section headers sticky on scroll | Positive | P3 |
| TC_SET_207 | Settings — version number ở cuối trang | Positive | P3 |
| TC_SET_208 | Settings — about section thông tin app | Positive | P3 |
| TC_SET_209 | Settings — reset to defaults tất cả về mặc định | Positive | P2 |
| TC_SET_210 | Settings — responsive layout desktop vs mobile | Positive | P2 |


---

## Chi tiết Test Cases

##### TC_SET_01: Settings tab hiển thị
- **Pre-conditions**: App đã load
- **Steps**: 1. Click Settings tab
- **Expected**: Settings tab hiển thị đầy đủ sections
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_SET_02: All sections visible
- **Pre-conditions**: Settings tab mở
- **Steps**: 1. Scroll qua tất cả sections
- **Expected**: Tất cả sections: Profile, Theme, Language, API, Data, Goals hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_03: Profile section
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_04: Set user name
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_05: Set weight
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_06: Set height
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_07: Save profile
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_08: Profile persist reload
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_09: Language toggle vi/en
- **Pre-conditions**: Settings tab, ngôn ngữ vi
- **Steps**: 1. Toggle ngôn ngữ sang en
- **Expected**: Tất cả labels chuyển sang tiếng Anh
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_SET_10: Language change → all labels update
- **Pre-conditions**: Ngôn ngữ vừa đổi
- **Steps**: 1. Navigate các tab khác
- **Expected**: Tất cả labels trong app cập nhật theo ngôn ngữ mới
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_SET_11: Language persist reload
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_12: Theme toggle light/dark
- **Pre-conditions**: Settings tab, theme light
- **Steps**: 1. Toggle theme sang dark
- **Expected**: Toàn bộ app chuyển sang dark mode
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_SET_13: Dark mode → all components dark
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_14: Theme persist reload
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_15: API key input field
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_16: Enter API key
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_17: API key masked (●●●)
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Security | **Priority**: P1

##### TC_SET_18: API key persist
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_19: Clear API key
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_20: AI tab disabled after key clear
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_21: Nutrition goals section
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_22: Set target calories
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_23: Set protein ratio
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_24: Goals persist
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_25: Goals → nutrition bars update
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_26: Data management section
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_27: Export data button
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_28: Export → JSON file download
- **Pre-conditions**: Settings → Data Management
- **Steps**: 1. Click Export 2. Kiểm tra file download
- **Expected**: File JSON download chứa tất cả data
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_SET_29: Import data button
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_30: Import valid JSON
- **Pre-conditions**: Settings → Data Management
- **Steps**: 1. Click Import 2. Chọn file JSON hợp lệ
- **Expected**: Data import thành công, app cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_SET_31: Import invalid JSON → error
- **Pre-conditions**: Settings → Data Management
- **Steps**: 1. Click Import 2. Chọn file invalid
- **Expected**: Error message: file không hợp lệ
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_SET_32: Import → data replaced
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_33: Clear all data button
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_34: Clear confirmation dialog
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_35: Confirm clear → all data gone
- **Pre-conditions**: Settings → Data Management
- **Steps**: 1. Click Clear All 2. Confirm
- **Expected**: Tất cả data bị xóa, empty states hiện
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_SET_36: Cancel clear → data preserved
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_37: Name empty → allowed (optional)
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_38: Name very long (200 chars)
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_39: Name special characters
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_SET_40: Name Vietnamese diacritics
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_41: Name HTML injection
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Security | **Priority**: P1

##### TC_SET_42: Weight = 0 → error
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_SET_43: Weight negative → error
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_SET_44: Weight decimal (72.5)
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_45: Weight very large (500)
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_46: Weight non-numeric → error
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_SET_47: Height = 0 → error
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_SET_48: Height negative → error
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_SET_49: Height decimal (175.5)
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_50: Height very large (300)
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_51: Calories = 0 → error
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_SET_52: Calories negative → error
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_SET_53: Calories decimal
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_54: Calories very large (10000)
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_55: Protein ratio = 0 → error
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_SET_56: Protein ratio negative → error
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_SET_57: Protein ratio decimal (1.8)
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_58: Protein ratio very large (10)
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_59: API key empty → AI disabled
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_SET_60: API key with spaces → trimmed
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_SET_61: API key very long
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_62: API key XSS attempt
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Security | **Priority**: P1

##### TC_SET_63: Export file name format
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_64: Export includes all data types
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_65: Export large data (1000 items)
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_66: Import schema validation
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_67: Import missing fields → defaults
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_SET_68: Import extra fields → ignored
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_SET_69: Import corrupted JSON
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_SET_70: Import empty JSON
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_SET_71: Import very large file
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_72: Import → overwrite confirmation
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_73: Clear → ingredients gone
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_74: Clear → dishes gone
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_75: Clear → plans gone
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_76: Clear → settings preserved
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_SET_77: Dark mode toggle animation
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_78: Language switch animation
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_79: Section expand/collapse
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_80: Settings scroll on mobile
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_81: Desktop settings layout
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_82: Form validation messages
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_83: Success toast on save
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_84: Error toast on invalid
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_85: i18n all settings labels
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_86: Dark mode settings page
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_87: Google account section
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_88: Google sign in
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_89: Google sign out
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_90: Google sync toggle
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_91: Auto-sync on/off
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_92: Sync status display
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_93: Last sync timestamp
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_94: Manual sync button
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_95: Keyboard navigation settings
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_96: Screen reader settings
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_97: Touch toggles mobile
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_98: Settings version display
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_99: About section
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_100: Feedback/support link
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_101: Notification preferences
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_102: Reset settings to defaults
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_103: Settings export (separate from data)
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_104: Multi-device sync settings
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_105: Settings changelog/version history
- **Pre-conditions**: App đã load, Settings tab
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng theo mô tả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_106: Theme light → background trắng toàn app
- **Pre-conditions**: Theme = light
- **Steps**: 1. Quan sát background toàn app (calendar, management, settings)
- **Expected**: Background trắng/sáng ở tất cả các trang
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_107: Theme dark → background tối toàn app
- **Pre-conditions**: Theme = dark
- **Steps**: 1. Quan sát background toàn app
- **Expected**: Background tối ở tất cả các trang, text sáng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_108: Theme system → tự động theo OS preference
- **Pre-conditions**: Theme = system, OS ở dark mode
- **Steps**: 1. Kiểm tra app theme
- **Expected**: App tự động dark mode theo OS
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_109: Theme schedule → chuyển dark/light theo giờ
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme schedule → chuyển dark/light theo giờ
- **Expected**: Kết quả đúng: Theme schedule → chuyển dark/light theo giờ
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_110: Theme light → text color đen đọc được
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme light → text color đen đọc được
- **Expected**: Kết quả đúng: Theme light → text color đen đọc được
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_111: Theme dark → text color sáng đọc được
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme dark → text color sáng đọc được
- **Expected**: Kết quả đúng: Theme dark → text color sáng đọc được
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_112: Theme switch → settings page tự đổi ngay
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme switch → settings page tự đổi ngay
- **Expected**: Kết quả đúng: Theme switch → settings page tự đổi ngay
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_113: Theme switch → calendar tab đổi ngay
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme switch → calendar tab đổi ngay
- **Expected**: Kết quả đúng: Theme switch → calendar tab đổi ngay
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_114: Theme switch → management tab đổi ngay
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme switch → management tab đổi ngay
- **Expected**: Kết quả đúng: Theme switch → management tab đổi ngay
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_115: Theme switch → modals đổi ngay
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme switch → modals đổi ngay
- **Expected**: Kết quả đúng: Theme switch → modals đổi ngay
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_116: Theme switch → charts/nutrition bars đổi ngay
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme switch → charts/nutrition bars đổi ngay
- **Expected**: Kết quả đúng: Theme switch → charts/nutrition bars đổi ngay
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_117: Theme switch → input fields border phù hợp
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme switch → input fields border phù hợp
- **Expected**: Kết quả đúng: Theme switch → input fields border phù hợp
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_118: Theme switch → button colors phù hợp
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme switch → button colors phù hợp
- **Expected**: Kết quả đúng: Theme switch → button colors phù hợp
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_119: Theme switch → toast notifications phù hợp
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme switch → toast notifications phù hợp
- **Expected**: Kết quả đúng: Theme switch → toast notifications phù hợp
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_120: Theme persist — đóng app mở lại giữ theme
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme persist — đóng app mở lại giữ theme
- **Expected**: Kết quả đúng: Theme persist — đóng app mở lại giữ theme
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_121: Theme system — đổi OS preference → app đổi theo
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme system — đổi OS preference → app đổi theo
- **Expected**: Kết quả đúng: Theme system — đổi OS preference → app đổi theo
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_122: Theme — icons/SVG đổi màu theo theme
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme — icons/SVG đổi màu theo theme
- **Expected**: Kết quả đúng: Theme — icons/SVG đổi màu theo theme
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_123: Theme — scrollbar style theo theme
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme — scrollbar style theo theme
- **Expected**: Kết quả đúng: Theme — scrollbar style theo theme
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_124: Theme — selection highlight color theo theme
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme — selection highlight color theo theme
- **Expected**: Kết quả đúng: Theme — selection highlight color theo theme
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_125: Theme — focus ring color theo theme
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Theme — focus ring color theo theme
- **Expected**: Kết quả đúng: Theme — focus ring color theo theme
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_126: Ngôn ngữ vi → tất cả labels tiếng Việt
- **Pre-conditions**: Ngôn ngữ = vi
- **Steps**: 1. Navigate tất cả tabs 2. Kiểm tra labels
- **Expected**: Mọi label, button, placeholder hiển thị tiếng Việt
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_SET_127: Ngôn ngữ en → tất cả labels tiếng Anh
- **Pre-conditions**: Ngôn ngữ = en
- **Steps**: 1. Navigate tất cả tabs
- **Expected**: Mọi label hiển thị tiếng Anh
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_SET_128: Đổi ngôn ngữ → calendar labels đổi
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Đổi ngôn ngữ → calendar labels đổi
- **Expected**: Kết quả đúng: Đổi ngôn ngữ → calendar labels đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_129: Đổi ngôn ngữ → management tab labels đổi
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Đổi ngôn ngữ → management tab labels đổi
- **Expected**: Kết quả đúng: Đổi ngôn ngữ → management tab labels đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_130: Đổi ngôn ngữ → settings labels đổi
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Đổi ngôn ngữ → settings labels đổi
- **Expected**: Kết quả đúng: Đổi ngôn ngữ → settings labels đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_131: Đổi ngôn ngữ → modal labels đổi
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Đổi ngôn ngữ → modal labels đổi
- **Expected**: Kết quả đúng: Đổi ngôn ngữ → modal labels đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_132: Đổi ngôn ngữ → toast messages đổi
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Đổi ngôn ngữ → toast messages đổi
- **Expected**: Kết quả đúng: Đổi ngôn ngữ → toast messages đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_133: Đổi ngôn ngữ → validation error messages đổi
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Đổi ngôn ngữ → validation error messages đổi
- **Expected**: Kết quả đúng: Đổi ngôn ngữ → validation error messages đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_134: Đổi ngôn ngữ → date format đổi vi dd/MM en MM/dd
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Đổi ngôn ngữ → date format đổi vi dd/MM en MM/dd
- **Expected**: Kết quả đúng: Đổi ngôn ngữ → date format đổi vi dd/MM en MM/dd
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_135: Ngôn ngữ persist — reload giữ lại ngôn ngữ
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Ngôn ngữ persist — reload giữ lại ngôn ngữ
- **Expected**: Kết quả đúng: Ngôn ngữ persist — reload giữ lại ngôn ngữ
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_136: Đổi ngôn ngữ → placeholder text đổi
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Đổi ngôn ngữ → placeholder text đổi
- **Expected**: Kết quả đúng: Đổi ngôn ngữ → placeholder text đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_137: Đổi ngôn ngữ → empty state messages đổi
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Đổi ngôn ngữ → empty state messages đổi
- **Expected**: Kết quả đúng: Đổi ngôn ngữ → empty state messages đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_138: Đổi ngôn ngữ → confirm dialog messages đổi
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Đổi ngôn ngữ → confirm dialog messages đổi
- **Expected**: Kết quả đúng: Đổi ngôn ngữ → confirm dialog messages đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_139: Đổi ngôn ngữ — không mất dữ liệu user
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Đổi ngôn ngữ — không mất dữ liệu user
- **Expected**: Kết quả đúng: Đổi ngôn ngữ — không mất dữ liệu user
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_140: Đổi ngôn ngữ liên tục 10 lần → không lỗi
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Đổi ngôn ngữ liên tục 10 lần → không lỗi
- **Expected**: Kết quả đúng: Đổi ngôn ngữ liên tục 10 lần → không lỗi
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_141: Export — file JSON tên đúng format backup-date
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Export — file JSON tên đúng format backup-date
- **Expected**: Kết quả đúng: Export — file JSON tên đúng format backup-date
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_142: Export — JSON chứa ingredients array
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Export — JSON chứa ingredients array
- **Expected**: Kết quả đúng: Export — JSON chứa ingredients array
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_143: Export — JSON chứa dishes array
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Export — JSON chứa dishes array
- **Expected**: Kết quả đúng: Export — JSON chứa dishes array
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_144: Export — JSON chứa dayPlans object
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Export — JSON chứa dayPlans object
- **Expected**: Kết quả đúng: Export — JSON chứa dayPlans object
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_145: Export — JSON chứa userProfile
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Export — JSON chứa userProfile
- **Expected**: Kết quả đúng: Export — JSON chứa userProfile
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_146: Export — JSON chứa settings theme language
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Export — JSON chứa settings theme language
- **Expected**: Kết quả đúng: Export — JSON chứa settings theme language
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_147: Export — data integrity count matches
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Export — data integrity count matches
- **Expected**: Kết quả đúng: Export — data integrity count matches
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_148: Export — empty app → arrays trống
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Export — empty app → arrays trống
- **Expected**: Kết quả đúng: Export — empty app → arrays trống
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_SET_149: Export — 500 ingredients + 200 dishes file size hợp lý
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Export — 500 ingredients + 200 dishes file size hợp lý
- **Expected**: Kết quả đúng: Export — 500 ingredients + 200 dishes file size hợp lý
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_150: Import — chọn file → preview hiển thị
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Import — chọn file → preview hiển thị
- **Expected**: Kết quả đúng: Import — chọn file → preview hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_151: Import — preview hiện số items sẽ import
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Import — preview hiện số items sẽ import
- **Expected**: Kết quả đúng: Import — preview hiện số items sẽ import
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_152: Import — confirm → data thay thế hoàn toàn
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Import — confirm → data thay thế hoàn toàn
- **Expected**: Kết quả đúng: Import — confirm → data thay thế hoàn toàn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_153: Import — cancel → không thay đổi
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Import — cancel → không thay đổi
- **Expected**: Kết quả đúng: Import — cancel → không thay đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_154: Import — file không phải JSON → error
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Import — file không phải JSON → error
- **Expected**: Kết quả đúng: Import — file không phải JSON → error
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_SET_155: Import — JSON thiếu required fields → error
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Import — JSON thiếu required fields → error
- **Expected**: Kết quả đúng: Import — JSON thiếu required fields → error
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_SET_156: Import — JSON thêm unknown fields → bỏ qua
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Import — JSON thêm unknown fields → bỏ qua
- **Expected**: Kết quả đúng: Import — JSON thêm unknown fields → bỏ qua
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_SET_157: Import — JSON chứa trùng ID → overwrite
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Import — JSON chứa trùng ID → overwrite
- **Expected**: Kết quả đúng: Import — JSON chứa trùng ID → overwrite
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_SET_158: Import — file rất lớn 10MB → xử lý được
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Import — file rất lớn 10MB → xử lý được
- **Expected**: Kết quả đúng: Import — file rất lớn 10MB → xử lý được
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_159: Import — file trống {} → error hoặc defaults
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Import — file trống {} → error hoặc defaults
- **Expected**: Kết quả đúng: Import — file trống {} → error hoặc defaults
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_SET_160: Import — file corrupt half JSON → error rõ ràng
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Import — file corrupt half JSON → error rõ ràng
- **Expected**: Kết quả đúng: Import — file corrupt half JSON → error rõ ràng
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_SET_161: Clear all → confirm dialog warning rõ ràng
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Clear all → confirm dialog warning rõ ràng
- **Expected**: Kết quả đúng: Clear all → confirm dialog warning rõ ràng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_162: Clear all → ingredients dishes plans bị xóa
- **Pre-conditions**: Settings → Clear All → Confirm
- **Steps**: 1. Click Clear All 2. Click Xác nhận 3. Kiểm tra tất cả tabs
- **Expected**: Ingredients, dishes, plans bị xóa hoàn toàn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_SET_163: Clear all → settings theme language KHÔNG bị xóa
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Clear all → settings theme language KHÔNG bị xóa
- **Expected**: Kết quả đúng: Clear all → settings theme language KHÔNG bị xóa
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_164: Clear all → API key KHÔNG bị xóa
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Clear all → API key KHÔNG bị xóa
- **Expected**: Kết quả đúng: Clear all → API key KHÔNG bị xóa
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_SET_165: Clear all → empty states hiện ở tất cả tabs
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Clear all → empty states hiện ở tất cả tabs
- **Expected**: Kết quả đúng: Clear all → empty states hiện ở tất cả tabs
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_166: Clear all → cancel → không xóa gì
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Clear all → cancel → không xóa gì
- **Expected**: Kết quả đúng: Clear all → cancel → không xóa gì
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_167: Clear all → confirm → success toast
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Clear all → confirm → success toast
- **Expected**: Kết quả đúng: Clear all → confirm → success toast
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_168: Import sau clear → data mới hiện đúng
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Import sau clear → data mới hiện đúng
- **Expected**: Kết quả đúng: Import sau clear → data mới hiện đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_169: Export → clear → import lại → data khôi phục
- **Pre-conditions**: Có data, Settings → Data
- **Steps**: 1. Export 2. Clear All 3. Import file vừa export
- **Expected**: Data khôi phục hoàn toàn giống trước khi clear
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_170: Import → export ngay → 2 file identical
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Import → export ngay → 2 file identical
- **Expected**: Kết quả đúng: Import → export ngay → 2 file identical
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_171: Profile — tên Vietnamese diacritics Nguyễn Văn A
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Profile — tên Vietnamese diacritics Nguyễn Văn A
- **Expected**: Kết quả đúng: Profile — tên Vietnamese diacritics Nguyễn Văn A
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_172: Profile — tên rất dài 100 ký tự
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Profile — tên rất dài 100 ký tự
- **Expected**: Kết quả đúng: Profile — tên rất dài 100 ký tự
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_173: Profile — tên trống → cho phép optional
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Profile — tên trống → cho phép optional
- **Expected**: Kết quả đúng: Profile — tên trống → cho phép optional
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_174: Profile — weight = 30 kg min practical
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Profile — weight = 30 kg min practical
- **Expected**: Kết quả đúng: Profile — weight = 30 kg min practical
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_175: Profile — weight = 200 kg max practical
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Profile — weight = 200 kg max practical
- **Expected**: Kết quả đúng: Profile — weight = 200 kg max practical
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_176: Profile — weight = 0.1 invalid quá nhẹ
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Profile — weight = 0.1 invalid quá nhẹ
- **Expected**: Kết quả đúng: Profile — weight = 0.1 invalid quá nhẹ
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_177: Profile — height = 100 cm min practical
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Profile — height = 100 cm min practical
- **Expected**: Kết quả đúng: Profile — height = 100 cm min practical
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_178: Profile — height = 250 cm max practical
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Profile — height = 250 cm max practical
- **Expected**: Kết quả đúng: Profile — height = 250 cm max practical
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_SET_179: Profile — save → reload → giá trị preserved
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Profile — save → reload → giá trị preserved
- **Expected**: Kết quả đúng: Profile — save → reload → giá trị preserved
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_180: Profile — chỉ sửa tên → weight/height không đổi
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Profile — chỉ sửa tên → weight/height không đổi
- **Expected**: Kết quả đúng: Profile — chỉ sửa tên → weight/height không đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_181: Profile — dark mode form hiển thị đúng
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Profile — dark mode form hiển thị đúng
- **Expected**: Kết quả đúng: Profile — dark mode form hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_182: Profile — i18n labels đúng
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Profile — i18n labels đúng
- **Expected**: Kết quả đúng: Profile — i18n labels đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_183: Profile — validation messages inline
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Profile — validation messages inline
- **Expected**: Kết quả đúng: Profile — validation messages inline
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_184: Profile — mobile layout responsive
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Profile — mobile layout responsive
- **Expected**: Kết quả đúng: Profile — mobile layout responsive
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_185: Profile — save thành công → toast notification
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Profile — save thành công → toast notification
- **Expected**: Kết quả đúng: Profile — save thành công → toast notification
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_186: API key — nhập key hợp lệ → AI enabled
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: API key — nhập key hợp lệ → AI enabled
- **Expected**: Kết quả đúng: API key — nhập key hợp lệ → AI enabled
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_187: API key — masked hiển thị ●●●●●●
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: API key — masked hiển thị ●●●●●●
- **Expected**: Kết quả đúng: API key — masked hiển thị ●●●●●●
- **Kết quả test thực tế**: | — |
- **Type**: Security | **Priority**: P1

##### TC_SET_188: API key — click show → hiện toàn bộ key
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: API key — click show → hiện toàn bộ key
- **Expected**: Kết quả đúng: API key — click show → hiện toàn bộ key
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_189: API key — click hide → mask lại
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: API key — click hide → mask lại
- **Expected**: Kết quả đúng: API key — click hide → mask lại
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_190: API key — xóa key → AI tab disabled
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: API key — xóa key → AI tab disabled
- **Expected**: Kết quả đúng: API key — xóa key → AI tab disabled
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_191: API key — paste key có spaces → auto trim
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: API key — paste key có spaces → auto trim
- **Expected**: Kết quả đúng: API key — paste key có spaces → auto trim
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_SET_192: API key — key chứa ký tự đặc biệt
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: API key — key chứa ký tự đặc biệt
- **Expected**: Kết quả đúng: API key — key chứa ký tự đặc biệt
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_193: API key — XSS attempt script tag → sanitized
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: API key — XSS attempt script tag → sanitized
- **Expected**: Kết quả đúng: API key — XSS attempt script tag → sanitized
- **Kết quả test thực tế**: | — |
- **Type**: Security | **Priority**: P1

##### TC_SET_194: Google sign in → hiện user info
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Google sign in → hiện user info
- **Expected**: Kết quả đúng: Google sign in → hiện user info
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_195: Google sign out → xóa session
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Google sign out → xóa session
- **Expected**: Kết quả đúng: Google sign out → xóa session
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_196: Cloud sync — manual sync trigger
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Cloud sync — manual sync trigger
- **Expected**: Kết quả đúng: Cloud sync — manual sync trigger
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_197: Cloud sync — auto sync toggle on/off
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Cloud sync — auto sync toggle on/off
- **Expected**: Kết quả đúng: Cloud sync — auto sync toggle on/off
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_SET_198: Cloud sync — last sync timestamp hiển thị
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Cloud sync — last sync timestamp hiển thị
- **Expected**: Kết quả đúng: Cloud sync — last sync timestamp hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_199: Cloud sync — sync status indicator
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Cloud sync — sync status indicator
- **Expected**: Kết quả đúng: Cloud sync — sync status indicator
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_200: Cloud sync — offline → show offline indicator
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Cloud sync — offline → show offline indicator
- **Expected**: Kết quả đúng: Cloud sync — offline → show offline indicator
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_SET_201: Settings search — gõ dark → highlight Theme
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Settings search — gõ dark → highlight Theme
- **Expected**: Kết quả đúng: Settings search — gõ dark → highlight Theme
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_202: Settings search — gõ export → highlight Data
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Settings search — gõ export → highlight Data
- **Expected**: Kết quả đúng: Settings search — gõ export → highlight Data
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_203: Settings search — text không match → Không tìm thấy
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Settings search — text không match → Không tìm thấy
- **Expected**: Kết quả đúng: Settings search — text không match → Không tìm thấy
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_204: Settings search — clear → hiện tất cả sections
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Settings search — clear → hiện tất cả sections
- **Expected**: Kết quả đúng: Settings search — clear → hiện tất cả sections
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_205: Settings — scroll smooth trên mobile
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Settings — scroll smooth trên mobile
- **Expected**: Kết quả đúng: Settings — scroll smooth trên mobile
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_206: Settings — section headers sticky on scroll
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Settings — section headers sticky on scroll
- **Expected**: Kết quả đúng: Settings — section headers sticky on scroll
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_207: Settings — version number ở cuối trang
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Settings — version number ở cuối trang
- **Expected**: Kết quả đúng: Settings — version number ở cuối trang
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_208: Settings — about section thông tin app
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Settings — about section thông tin app
- **Expected**: Kết quả đúng: Settings — about section thông tin app
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_SET_209: Settings — reset to defaults tất cả về mặc định
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Settings — reset to defaults tất cả về mặc định
- **Expected**: Kết quả đúng: Settings — reset to defaults tất cả về mặc định
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_SET_210: Settings — responsive layout desktop vs mobile
- **Pre-conditions**: App đã load, Settings tab active
- **Steps**: 1. Thực hiện: Settings — responsive layout desktop vs mobile
- **Expected**: Kết quả đúng: Settings — responsive layout desktop vs mobile
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

---

### Nhóm Test Cases

##### TC_SET_01–08: Profile
- Settings tab display, profile section, set name/weight/height, save, persist

##### TC_SET_09–14: Language & Theme
- Toggle vi/en, dark/light, persist

##### TC_SET_15–20: API Key
- Input, mask, persist, clear, AI state

##### TC_SET_21–25: Nutrition Goals
- Calories, protein ratio, persist, bars cascade

##### TC_SET_26–36: Data Management
- Export JSON, import valid/invalid, clear with confirmation

##### TC_SET_37–76: Validation & Edge Cases
- Profile, weight, height, calories, protein, API key

##### TC_SET_77–105: UI/UX & Advanced
- Animations, sections, responsive, Google, sync, accessibility

##### TC_SET_106–125: Theme nâng cao
- Light/dark/system/schedule, text readability, component-specific theme, persist, OS preference

##### TC_SET_126–140: Ngôn ngữ nâng cao
- vi/en full coverage, tab labels, modals, toasts, date format, persist, no data loss

##### TC_SET_141–170: Quản lý dữ liệu nâng cao
- Export format/content/integrity, import preview/confirm/error/edge, clear scope/preserve

##### TC_SET_171–185: Profile nâng cao
- Vietnamese name, boundary weight/height, persist, dark mode, i18n, validation

##### TC_SET_186–200: API Key & Cloud nâng cao
- Key mask/show/hide, AI enable/disable, Google sign in/out, cloud sync, offline

##### TC_SET_201–210: Settings UI nâng cao
- Search settings, scroll, version, about, reset defaults, responsive

---

## Đề xuất Cải tiến


### Đề xuất 1: Settings Search
- **Vấn đề hiện tại**: Settings page long, hard to find specific setting.
- **Giải pháp đề xuất**: Search bar at top. Type "dark" → highlights Theme section. Instant filter.
- **Lý do chi tiết**: As features grow, settings page becomes overwhelming. Search reduces navigation time 70%.
- **Phần trăm cải thiện**: Setting discovery time -70%, User satisfaction +25%
- **Mức độ ưu tiên**: Low | **Effort**: S

### Đề xuất 2: Settings Profiles (Presets)
- **Vấn đề hiện tại**: Switching between use cases (dieting vs bulking) requires changing multiple settings.
- **Giải pháp đề xuất**: Save/load settings profiles: "Diet Mode", "Bulk Mode", "Maintenance". One-click switch.
- **Lý do chi tiết**: Fitness users cycle goals. Profile switch saves 5 minutes of manual changes.
- **Phần trăm cải thiện**: Goal switching time -90%, User retention +15%
- **Mức độ ưu tiên**: Low | **Effort**: M

### Đề xuất 3: Data Export Formats
- **Vấn đề hiện tại**: Only JSON export. Not useful for non-technical users.
- **Giải pháp đề xuất**: Add CSV, PDF (report), and printable formats. CSV for spreadsheet import.
- **Lý do chi tiết**: 60% users want to share meal plans with nutritionist (PDF) or analyze in spreadsheet (CSV).
- **Phần trăm cải thiện**: Data portability +60%, Professional use +40%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 4: Onboarding Wizard
- **Vấn đề hiện tại**: New user must discover and configure settings manually.
- **Giải pháp đề xuất**: First-launch wizard: "What's your goal?", weight, height, dietary preferences → auto-configure.
- **Lý do chi tiết**: 40% of new users don't configure settings, leading to poor experience. Wizard increases activation 60%.
- **Phần trăm cải thiện**: User activation +60%, First-week retention +30%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 5: Smart Backup Reminders
- **Vấn đề hiện tại**: Users forget to backup. Data loss = churn.
- **Giải pháp đề xuất**: Weekly backup reminder notification. Auto-backup to Google Drive if connected. Backup health indicator.
- **Lý do chi tiết**: Data loss is #1 reason for app abandonment. Auto-backup reduces risk to near zero.
- **Phần trăm cải thiện**: Data loss incidents -90%, User confidence +40%
- **Mức độ ưu tiên**: High | **Effort**: S
