# Ice Shooter Garden (MVP)

一个基于 **React + HTML Canvas** 的 2D 横版小游戏 MVP。

## 功能
- 开始界面
- 角色选择（2 个寒冰射手）
- 玩家移动 / 跳跃 / 射击冰弹
- 5 个不同体型僵尸
- 冰弹碰撞伤害与减速
- 玩家血量与暂停按钮
- 全部击败后进入胜利结算页

## 本地运行
```bash
npm install
npm run dev
```

默认地址：`http://localhost:5173`

## 生产构建
```bash
npm install
npm run build
```

构建产物目录：`dist/`

## GitHub Pages 线上访问
部署后访问：`https://<你的GitHub用户名>.github.io/ice-shooter-game/`

> 注意：仓库 Settings -> Pages 需设置为 **GitHub Actions** 作为部署来源。

## 操作
- `A / D`：左右移动
- `W / Space`：跳跃
- `J`：发射冰弹
