const fs = require('fs');
const path = require('path');
const babylon = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const babel = require('@babel/core');

// 记录模块的id值
let ID = 0;

// 缓存已载入的文件
let cache = {};

// 读取文件信息，并获得当前js文件的依赖关系
function createAsset(filename) {
    if(cache[filename]) {
        return cache[filename];
    }

    const content = fs.readFileSync(filename, 'utf-8');
    // 通过babylon将字符串转ast
    const ast = babylon.parse(content, {
        sourceType: 'module'
    });
    
    // 用来存储所属依赖的模块
    const depedencies = [];
    traverse(ast, {
        // 对应import依赖
        ImportDeclaration: ({node}) => {
            // 存储依赖 =>  eg: import message from 'message.js' ==> value === 'message.js',多个就会进入多次
            depedencies.push(node.source.value);
        }
    })
    
    // 模块依赖叠加
    const id = ID++;

    // 通过预置的插件将ast转换为浏览器可识别代码 
    const { code } = babel.transformFromAstSync(ast, null, {
        //babel-preset-env 可以根据配置的运行环境来自动将ES2015+的代码转换为es5
        presets: ['@babel/preset-env']
    })

    const exportedModule =  {
        id,
        filename,
        depedencies,
        code
    }
    cache[filename] = exportedModule;
    return exportedModule;
}

// 从入口开始分析所有依赖项，形成依赖图
function createGraph(entry) {
    const mainAsset = createAsset(entry);
    
    // 广度遍历
    const queue = [mainAsset];
    for(const asset of queue) {
        const dirname = path.dirname(asset.filename);
        // 保存子依赖的数据
        asset.mapping = {};
        asset.depedencies.forEach((relativePath) => {
            // 找到文件的绝对路径
            const absolutePath = path.join(dirname, relativePath);
            // 获取子依赖的相关信息
            const child = createAsset(absolutePath);
            asset.mapping[relativePath] = child.id;
            queue.push(child);
        })
    }
    return queue;
}

// 缓存已加载的模块id,防止生成重复的代码块
let cacheModuleIds = {};

// 根据生成的依赖关系图,生成浏览器可执行的文件
function bundle(graph) {
    let modules = '';
    graph.forEach((mod) => {
        if(!cacheModuleIds[mod.id]) {
            cacheModuleIds[mod.id] = true;
            modules += `${mod.id}:[
                function(require, module, exports) {
                    ${mod.code}
                },
                ${JSON.stringify(mod.mapping)}
            ],`;
        }
    })
    
    // 简单模拟一个可以在浏览器执行的模块加载器
    const result = `
        (function(modules) {
            
            // 缓存模块
            var installedModules = {};
            
            function __webpack_require__(id) {
                if(installedModules[id]) {
                    console.log('已加载过的模块id:',id);
                    return installedModules[id].exports;
                }
                var [fn, mapping] = modules[id];
                function localRequire(relativePath) {
                    var mappingId = mapping[relativePath];
                    return __webpack_require__(mappingId);
                }
                // 缓存已加载的模块
                var module = installedModules[id] = {
                    exports: {},
                    id
                };
                // 依次执行依赖中的代码
                fn.call(module.exports, localRequire, module, module.exports)
                return module.exports;
            }
            // 程序加载入口
            return __webpack_require__(0);
        })({${modules}});
    `;
    return result;
}

module.exports = {
    createGraph,
    bundle
}
