const path = require('path');
const fs = require('fs');

const webpack = require('../webpack');

const {createGraph, bundle} = webpack;

// 从入口开始构建依赖树
const graph = createGraph(path.join(__dirname, './entry.js'));
const res = bundle(graph);
fs.writeFileSync('dist/bundle.js', res);