#!/usr/bin/env bash
# Downloads opus-mt VI<->EN ONNX models from Hugging Face into public/models/
# Run: bash scripts/download-opus-models.sh
set -euo pipefail

MODELS_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/models"

download_model() {
  local REPO="$1"        # e.g. Xenova/opus-mt-vi-en
  local LOCAL="$2"       # e.g. opus-mt-vi-en
  local BASE_URL="https://huggingface.co/${REPO}/resolve/main"
  local DEST="${MODELS_DIR}/${LOCAL}"

  echo "==> Downloading ${REPO} → public/models/${LOCAL}"
  mkdir -p "${DEST}"

  FILES=(
    "config.json"
    "tokenizer.json"
    "tokenizer_config.json"
    "source.spm"
    "target.spm"
    "onnx/decoder_model_merged_quantized.onnx"
    "onnx/encoder_model_quantized.onnx"
  )

  mkdir -p "${DEST}/onnx"
  for FILE in "${FILES[@]}"; do
    DEST_FILE="${DEST}/${FILE}"
    if [[ -f "${DEST_FILE}" ]]; then
      echo "  [skip] ${FILE} already exists"
      continue
    fi
    echo "  [download] ${FILE}"
    curl -L --silent --show-error --fail \
      "${BASE_URL}/${FILE}" \
      -o "${DEST_FILE}" || { echo "  [WARN] Failed to download ${FILE}" ; }
  done
}

download_model "Xenova/opus-mt-vi-en" "opus-mt-vi-en"
download_model "Xenova/opus-mt-en-vi" "opus-mt-en-vi"

echo ""
echo "Done! Models saved to public/models/"
du -sh "${MODELS_DIR}"
