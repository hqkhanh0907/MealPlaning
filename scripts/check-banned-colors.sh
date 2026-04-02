#!/usr/bin/env bash
# Check for banned color families in source files
BANNED_PATTERN='(bg|text|border|ring|from|to|via)-(gray|zinc|green|violet|teal)-'
MATCHES=$(grep -rE "$BANNED_PATTERN" --include="*.tsx" --include="*.ts" src/ --exclude-dir="__tests__" --exclude-dir="node_modules" 2>/dev/null)
if [ -n "$MATCHES" ]; then
  echo "❌ Banned color families found:"
  echo "$MATCHES"
  exit 1
fi
echo "✅ No banned colors found"
exit 0
