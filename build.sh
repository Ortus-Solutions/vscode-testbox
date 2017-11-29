#!/bin/sh

Target[1]="./cbox-coldbox-sublime/snippets/testbox/*.*"
Target[2]="./cbox-coldbox-sublime/snippets/testing/*.*"
Target[3]="./cbox-coldbox-sublime/skeletons/test-bdd.sublime-snippet"
Target[4]="./cbox-coldbox-sublime/skeletons/test-unit.sublime-snippet"

git clone https://github.com/lmajano/cbox-coldbox-sublime
npm install convert-snippets-to-vscode

mkdir ./target
for i in {1..4}
do
    cp ${Target[i]} ./target
done

./node_modules/.bin/snippetToVsCode -s ./target -o ./snippets/snippets.json

npm uninstall convert-snippets-to-vscode
rm -fr ./node_modules
rm ./package-lock.json
rm -fr ./cbox-coldbox-sublime
rm -fr ./target

echo "DONE."