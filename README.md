## webpack打包原理

- ![webpack打包图示](http://ww1.sinaimg.cn/large/825ca771ly1g5y1wlwc2qj20wq0e8t9f.jpg)

- 前置知识:
    - ast(抽象语法树): 
        + [AST直观印象](https://astexplorer.net/).
    -  commonjs模块规范
        ```
        每个模块内部，module变量代表当前模块。这个变量是一个对象，它的exports属性（即module.exports）是对外的接口。加载某个模块，其实是加载该模块的module.exports属性。require方法用于加载模块。
        ```
    - babel
        ```
        npm install @babel/core @babel/parser @babel/traverse @babel/preset-env --save-dev
        ```
        -  @babel/parser 将文件解析为AST (babylon)
        -  @babel/traverse 遍历递归树 可以实现节点的增删改查操作
        -  @babel/preset-env

- webpack原理感性认识
    + 1. 初始化：启动构建，读取与合并配置参数，加载plugin,实例化Compiler
    + 2. 编译：从Entry出发，针对每个Module串行调用对应的Loader去翻译文件中的内容，再找到该Module依赖的Module，递归
    进行编译处理
    + 3. 输出：将编译后的Module组合成Chunk,将Chunk转换成文件，输出到文件系统中

- webpack原理简单实现
    + 具体实现见代码

- ?? 循环加载


