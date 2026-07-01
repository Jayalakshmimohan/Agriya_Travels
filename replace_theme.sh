#!/bin/bash
find src -name "*.tsx" -type f -exec sed -i \
  -e 's/bg-agriya-navy/bg-theme-navy/g' \
  -e 's/text-agriya-navy/text-theme-heading/g' \
  -e 's/border-agriya-navy/border-theme-heading/g' \
  -e 's/bg-white/bg-theme-card/g' \
  -e 's/bg-agriya-bg/bg-theme-bg/g' \
  -e 's/text-slate-500/text-theme-muted/g' \
  -e 's/text-slate-600/text-theme-muted/g' \
  -e 's/text-slate-700/text-theme-heading/g' \
  -e 's/border-slate-100/border-theme-border/g' \
  -e 's/border-slate-200/border-theme-border/g' \
  -e 's/border-gray-200/border-theme-border/g' \
  -e 's/bg-slate-50/bg-theme-card/g' \
  -e 's/agriya-gold/theme-gold/g' \
  -e 's/agriya-teal/theme-teal/g' \
  {} +
