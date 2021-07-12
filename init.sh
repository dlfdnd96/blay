#!/bin/bash
if [ $(ls | grep -Eo ^dist$ | wc -l) -eq 1 ]; then
  rm -rf dist
fi
