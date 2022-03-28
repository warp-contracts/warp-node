#!/bin/bash
for i in {3001..3004};
do
  kill $(lsof -ti:$i)
  { npx cross-env PORT=$i yarn start:node --port=$i & };
done
