#!/bin/sh

# Cleanup just in case
rm -fr ./coldbox-sublime
rm -fr ./target

# Clone sublime central data
git clone https://github.com/ColdBox/coldbox-sublime

#npm install
#npm install convert-snippets-to-vscode

mkdir ./target

# Copy Snippets
cp -v ./coldbox-sublime/snippets/testbox/*.* ./target

# Copy Skeletons
cp -v ./coldbox-sublime/skeletons/test-bdd.sublime-snippet ./target
cp -v ./coldbox-sublime/skeletons/test-unit.sublime-snippet ./target

# Convert Sublime Snippets to VS Code
./node_modules/.bin/snippetToVsCode -s ./target -o ./snippets/snippets.json

#npm uninstall convert-snippets-to-vscode

## Cleanup
#npm uninstall convert-snippets-to-vscode
rm -fr ./coldbox-sublime
rm -fr ./target

echo "DONE."
