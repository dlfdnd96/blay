#!/bin/bash
targets=$(ls -lR | grep "\./" | grep -v node_modules | grep -v dist | grep -Eo [0-9a-zA-Z]{1}[0-9a-zA-Z/.]+public)
for target in $targets; do
  cp -r $target ./dist/$target
done
