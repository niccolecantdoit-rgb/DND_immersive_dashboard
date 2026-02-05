const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const { Server } = require('socket.io');

let io;

/**
 * TavernHelperPlugin - 酒馆助手热更新插件
 * 在 watch 模式下启动 Socket.IO 服务器 (端口 6621)
 * 每次编译完成后通知酒馆助手刷新脚本
 */
class TavernHelperPlugin {
  apply(compiler) {
    // 只在 watch 模式下启动 Socket.IO 服务器
    compiler.hooks.watchRun.tap('TavernHelper', () => {
      if (!io) {
        try {
          io = new Server(6621, { cors: { origin: '*' } });
          console.log('\x1b[36m[酒馆助手]\x1b[0m Socket.IO 服务已启动在端口 6621');
          
          io.on('connect', socket => {
            console.log(`\x1b[36m[酒馆助手]\x1b[0m 酒馆已连接: ${socket.id}`);
            // 连接时立即发送一次更新事件,确保酒馆加载最新版本
            io.emit('script_iframe_updated');
            
            socket.on('disconnect', reason => {
              console.log(`\x1b[36m[酒馆助手]\x1b[0m 酒馆断开连接: ${reason}`);
            });
          });
        } catch (error) {
          console.error('\x1b[31m[酒馆助手]\x1b[0m 启动 Socket.IO 服务失败:', error.message);
        }
      }
    });

    // 编译完成后通知酒馆助手
    compiler.hooks.done.tap('TavernHelper', (stats) => {
      if (io) {
        if (stats.hasErrors()) {
          console.log('\x1b[31m[酒馆助手]\x1b[0m 编译出错,不推送更新');
        } else {
          console.log('\x1b[36m[酒馆助手]\x1b[0m 推送脚本更新事件...');
          io.emit('script_iframe_updated');
        }
      }
    });

    // 监听关闭时清理
    compiler.hooks.watchClose.tap('TavernHelper', () => {
      if (io) {
        console.log('\x1b[36m[酒馆助手]\x1b[0m 关闭 Socket.IO 服务...');
        io.close();
        io = null;
      }
    });

    // 进程退出时清理
    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal, () => {
        if (io) {
          io.close();
          io = null;
        }
        process.exit();
      });
    });
  }
}

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'DND_Dashboard_Immersive.user.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'none', // 由命令行参数控制 (--mode development/production)
  plugins: [
    new webpack.BannerPlugin({
      banner: fs.readFileSync('./src/header.js', 'utf-8'),
      raw: true,
      entryOnly: true
    }),
    new TavernHelperPlugin()
  ],
  optimization: {
    minimize: false // UserScripts 通常保持可读性,minify 由单独的脚本处理
  }
};
