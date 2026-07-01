#!/bin/bash
find src -name "*.tsx" -type f -exec sed -i '' -e 's/\[#0B192C\]/agriya-navy/g' {} +
find src -name "*.tsx" -type f -exec sed -i '' -e 's/\[#D4AF37\]/agriya-gold/g' {} +
find src -name "*.tsx" -type f -exec sed -i '' -e 's/\[#FAFAFA\]/agriya-warm/g' {} +
find src -name "*.tsx" -type f -exec sed -i '' -e 's/\[#1D3557\]/agriya-teal/g' {} +
find src -name "*.tsx" -type f -exec sed -i '' -e 's/\[var(--color-agriya-warm)\]/agriya-bg/g' {} +
