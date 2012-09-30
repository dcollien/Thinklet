rm -rf .build-temp
mkdir .build-temp
mkdir .build-temp/frontend
mkdir .build-temp/backend

cp -R frontend/lib/ .build-temp/frontend

coffee -cb  .build-temp/frontend
coffee -cbj .build-temp/frontend/app.js frontend/coffee
coffee -cbo .build-temp/backend backend

cp -R frontend/static/ .build-temp/frontend

rm -r build-osx/data/frontend
cp -R .build-temp/frontend/ build-osx/data/frontend
cp -R .build-temp/backend/ build-osx/data
rm -rf .build-temp
./build-osx/app.sh