$snippets = @(
    ".\cbox-coldbox-sublime\snippets\testbox\*.*",
    ".\cbox-coldbox-sublime\snippets\testing\*.*",
    ".\cbox-coldbox-sublime\skeletons\test-bdd.sublime-snippet",
    ".\cbox-coldbox-sublime\skeletons\test-unit.sublime-snippet"
)

git clone https://github.com/lmajano/cbox-coldbox-sublime
npm install convert-snippets-to-vscode

mkdir .\target
foreach ($path in $snippets) {
    cp -recurse $path .\target
}

.\node_modules\.bin\snippetToVsCode -s .\target -o .\snippets\snippets.json

npm uninstall convert-snippets-to-vscode
rm -recurse -force .\node_modules
rm -force .\package-lock.json
rm -recurse -force .\cbox-coldbox-sublime
rm -recurse -force .\target

echo "DONE."