#!/bin/bash

# Chrome Extension Packaging Script
# This script creates a clean zip file with only the necessary extension files

OUTPUT_FILE="ucsd-podcast-extension.zip"

# Remove old zip if it exists
if [ -f "$OUTPUT_FILE" ]; then
    echo "Removing old $OUTPUT_FILE..."
    rm "$OUTPUT_FILE"
fi

# Create zip with only the necessary files
echo "Creating $OUTPUT_FILE..."
zip -r "$OUTPUT_FILE" \
    manifest.json \
    config.js \
    content.js \
    styles.css \
    podcast_icon_16.jpg \
    podcast_icon_32.jpg \
    podcast_icon_48.jpg \
    podcast_icon_128.jpg \
    -x "*.DS_Store" \
    -x "__MACOSX/*"

echo ""
echo "✓ Extension packaged successfully!"
echo "✓ Output file: $OUTPUT_FILE"
echo ""
echo "Files included:"
unzip -l "$OUTPUT_FILE"
