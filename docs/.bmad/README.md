# BMAD Output Folder

Đây là output folder dành riêng cho BMAD Method (`bmad-document-project`, `bmad-generate-project-context`, ...).

**Mục đích:** Giữ output BMAD tách biệt khỏi 6 docs canonical (`prd.md`, `data-model.md`, `architecture.md`, ...) để không trộn lẫn 2 nguồn truth.

**Config:** `_bmad/bmm/config.yaml` → `project_knowledge: {project-root}/docs/.bmad`

**Quy tắc:**
- File trong đây là **AI-generated**, có thể regenerate bất cứ lúc nào.
- KHÔNG sửa thủ công file ở đây — sửa source canonical ở `docs/2-requirements/`, `docs/3-design/`, `docs/4-architecture/` rồi re-run BMAD.
- File trong đây vẫn được commit vào git để teammate có context (personal repo, không lo size).

**File được sinh:**
- `index.md` — master navigation BMAD
- `project-scan-report.json` — state file (resume-able)
- `source-tree-analysis.md` — annotated directory tree
- `architecture-*.md`, `data-models-*.md`, `api-contracts-*.md` — auto-generated theo project type
