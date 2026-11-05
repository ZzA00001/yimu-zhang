# 一目账

一个「打开就能记、一眼看清钱去哪」的极简记账 App。原生 WebView 外壳 + 本地页面，不登录、不联网、不推送、无广告。

- 包名：`com.yimu.zhang`
- 版本：1.0.0（versionCode 1）
- 支持：Android 6.0 及以上（minSdk 23 / targetSdk 34）
- 安装包：`build/yimu-zhang.apk`

## 为什么做它

记账 App 的通病是：打开先看广告、再让你登录、首页塞满理财入口，记一笔要点四五下；记完还看不清这个月到底花在哪。

一目账只解决三件事：

1. **快**：首页点「+」，数字键盘直接输入金额，分类一屏可选，两三次点击完成一笔。
2. **清楚**：首页第一屏就是本月支出、预算进度和分类占比条，不用点进二级页面才知道钱花在哪。
3. **安静**：没有账号、没有网络请求、没有广告位，你的账本不会被上传。

## 功能

**首页**
- 本月支出大数字、预算剩余与进度条（超支变红）
- 今日支出 / 日均 / 笔数
- 分类占比条 + 分类明细（金额、笔数、百分比）
- 最近记录，一键跳到全部明细

**快速录入**
- 底部「+」唤起录入面板：自绘数字键盘、支出/收入切换、分类网格
- 备注、日期可选填，不填就是现在
- 保存后自动切到对应月份，补记上个月也能立刻看到钱去了哪
- 记住上次使用的分类，连续记账更顺

**明细**
- 按月切换，按天分组，每天显示日小计
- 单条可编辑、可删除；删除后 4 秒内可「撤销」
- 月份汇总：支出 / 收入 / 结余

**统计**
- 本月支出、日均支出、最大一笔、记账笔数
- 每日柱状图（今天高亮）
- 分类排行，按金额降序，带占比和笔数

**我的**
- 设置每月预算，首页即时生效
- 导出 CSV（UTF-8 BOM + CRLF，Excel / WPS 直接打开不乱码），Android 10+ 存到 `下载/一目账/`
- 填入示例数据（首次体验用）、清空全部记录

## 隐私

- 账目只写入 WebView 的 `localStorage`（键 `yimu.v1`），不落外部存储、不上传
- Manifest 只声明 `VIBRATE`（按键震动），**没有 `INTERNET` 权限**，物理上无法联网
- `android:allowBackup="false"`，系统云备份不会带走账本
- 无第三方 SDK、无统计埋点、无广告

代价也说清楚：卸载 App 或清除应用数据会丢账，请定期用「导出 CSV」备份。目前没有导入功能和云同步。

## 构建

需要 JDK 17、Android build-tools（aapt2 / d8 / zipalign / apksigner）和 `android.jar`（API 34）。脚本里已写死本机工具链路径，换机器需改 `tools/build_apk.py` 顶部的 `TOOLS` 常量。

```bat
python tools/build_apk.py
```

产物：`build/yimu-zhang.apk`（已 zipalign + v1/v2 签名）。

回归测试（需要 Node 与 `ws` 模块、本机 Edge）：

```bat
node tools/e2e.js
```

测试用 CDP 驱动无头 Edge 跑完整流程：新增/编辑/删除/撤销/翻月/预算/CSV/金额校验/补记上月，输出 61 项断言结果到 `build/e2e-report.json` 和截图。

## 签名说明

当前 APK 使用仓库内 `build/yimu-release.keystore` 的**演示签名**（口令 `yimu2026`，alias `yimu`），仅用于本地安装测试。

正式分发前请务必：

1. 重新生成一个私密 keystore，并离线保管；
2. 用新 keystore 重新签名，或直接改 `tools/build_apk.py` 里的签名参数；
3. 把 keystore 和口令从仓库/聊天记录里移除。

演示签名一旦泄露，任何人都能伪造同名升级包，**不要用它上架应用商店**。

## 安装

1. 把 `build/yimu-zhang.apk` 传到手机（数据线、微信文件传输、网盘均可）；
2. 点击安装，允许「安装未知来源应用」；
3. 首次打开即是空账本，可在「我的 → 填入示例数据」看看有数据时的样子。

## 目录

```
app/
  AndroidManifest.xml
  src/com/yimu/zhang/MainActivity.java   WebView 外壳、CSV 落盘、震动桥
  assets/index.html / styles.css / app.js  全部界面与逻辑
  res/                                  图标与主题
tools/
  build_apk.py    编译、对齐、签名、校验
  make_icon.py    生成自适应图标
  e2e.js          端到端回归测试
  shot.js / diag.js  截图与诊断
build/            产物、截图、测试报告
```