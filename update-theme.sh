#!/bin/bash

# Set the URL of your central repository
THEME_REPO_URL="https://github.com/piratesocial/pirate"

# Set the branch or tag you want to pull updates from
BRANCH_OR_TAG="main"

# Function to log changes
log_change() {
    echo "Updated: $1"
}

# Save line 7 from keystatic.config.ts before any changes
LINE_7=$(sed -n '7p' keystatic.config.ts)

# Backup user content
cp -r src/content user_content_backup
log_change "Backed up user content"

# Clone the central repository
git clone --branch $BRANCH_OR_TAG --depth 1 $THEME_REPO_URL tmp_theme
log_change "Cloned theme repository"

# Replace the src folder
rm -rf src
mv tmp_theme/src .
log_change "Replaced src folder"

# Restore user content, excluding config.ts
rsync -av --exclude='config.ts' user_content_backup/ src/content/
log_change "Restored user content"

# Copy the new config.ts from the theme update if it exists
[ -f tmp_theme/src/content/config.ts ] && cp tmp_theme/src/content/config.ts src/content/

# Replace root configuration files if they exist
for file in astro.config.mjs keystatic.config.ts netlify.toml package.json README.md tsconfig.json tailwind.config.cjs postcss.config.cjs; do
    [ -f tmp_theme/$file ] && cp tmp_theme/$file . && log_change "$file"
done

# Preserve line 7 in keystatic.config.ts
awk -v line="$LINE_7" 'NR==7 {print line; next} {print}' keystatic.config.ts > keystatic.config.ts.tmp && mv keystatic.config.ts.tmp keystatic.config.ts
log_change "Updated keystatic.config.ts (Project settings)"

# Clean up
rm -rf tmp_theme
rm -rf user_content_backup
log_change "Cleaned up temporary files"

echo "Theme updated successfully!"
