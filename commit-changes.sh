#!/bin/bash
cd /Users/tcruz/Desarrollo/05_Personal/imposter

echo "Agregando cambios..."
git add .

echo "Creando commit..."
git commit -m "Remove Premium branding - rename to Imposter"

echo "Pushing a GitHub..."
git push

echo "✅ Cambios subidos a GitHub"
echo ""
echo "Repositorio: https://github.com/tjaoc/imposter"
