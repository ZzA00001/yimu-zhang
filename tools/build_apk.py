import os
import shutil
import subprocess
import sys
import zipfile

ROOT = r"C:\Users\zhoucm1\yimu-zhang"
TOOLS = r"C:\Users\zhoucm1\tianji-fortune\.tools"
JDK = os.path.join(TOOLS, "jdk", "jdk-17.0.21+9")
BT = os.path.join(TOOLS, "build-tools", "android-14")
AJ = os.path.join(TOOLS, "platform", "android-34", "android.jar")
BUILD = os.path.join(ROOT, "build")
PKG = "com.yimu.zhang"
APP = os.path.join(ROOT, "app")

env = dict(os.environ)
env["JAVA_HOME"] = JDK
env["PATH"] = os.path.join(JDK, "bin") + os.pathsep + BT + os.pathsep + env.get("PATH", "")


def run(cmd, **kw):
    print(">>", " ".join(cmd) if isinstance(cmd, list) else cmd)
    result = subprocess.run(cmd, env=env, **kw)
    if result.returncode != 0:
        sys.exit("FAILED: %s" % (cmd,))


for sub in ("gen", "classes", "dex"):
    shutil.rmtree(os.path.join(BUILD, sub), ignore_errors=True)
    os.makedirs(os.path.join(BUILD, sub), exist_ok=True)

res_zip = os.path.join(BUILD, "res.zip")
for name in ("base-unsigned.apk", "with-dex.apk", "aligned.apk", "yimu-zhang.apk"):
    path = os.path.join(BUILD, name)
    if os.path.exists(path):
        os.remove(path)

run([os.path.join(BT, "aapt2.exe"), "compile", "--dir", os.path.join(APP, "res"), "-o", res_zip])
run([os.path.join(BT, "aapt2.exe"), "link", "-o", os.path.join(BUILD, "base-unsigned.apk"),
     "-I", AJ, "--manifest", os.path.join(APP, "AndroidManifest.xml"),
     "-A", os.path.join(APP, "assets"), "--java", os.path.join(BUILD, "gen"),
     "--min-sdk-version", "23", "--target-sdk-version", "34", res_zip])

sources = [os.path.join(BUILD, "gen", "com", "yimu", "zhang", "R.java")]
for base, _dirs, files in os.walk(os.path.join(APP, "src")):
    for f in files:
        if f.endswith(".java"):
            sources.append(os.path.join(base, f))

run([os.path.join(JDK, "bin", "javac.exe"), "-encoding", "UTF-8", "-source", "8", "-target", "8",
     "-bootclasspath", AJ, "-d", os.path.join(BUILD, "classes")] + sources)

classes = []
for base, _dirs, files in os.walk(os.path.join(BUILD, "classes")):
    for f in files:
        if f.endswith(".class"):
            classes.append(os.path.join(base, f))

run([os.path.join(BT, "d8.bat"), "--lib", AJ, "--min-api", "23",
     "--output", os.path.join(BUILD, "dex")] + classes)

shutil.copyfile(os.path.join(BUILD, "base-unsigned.apk"), os.path.join(BUILD, "with-dex.apk"))
with zipfile.ZipFile(os.path.join(BUILD, "with-dex.apk"), "a") as z:
    z.write(os.path.join(BUILD, "dex", "classes.dex"), "classes.dex")

run([os.path.join(BT, "zipalign.exe"), "-f", "-p", "4",
     os.path.join(BUILD, "with-dex.apk"), os.path.join(BUILD, "aligned.apk")])

# 签名口令不入库：优先读环境变量 YIMU_KEYPASS，其次读本地未跟踪文件 build/yimu-keypass.txt
def _keypass():
    v = os.environ.get("YIMU_KEYPASS")
    if v:
        return v
    local = os.path.join(BUILD, "yimu-keypass.txt")
    if os.path.exists(local):
        with open(local, "r", encoding="utf-8") as f:
            return f.read().strip()
    raise SystemExit("缺少签名口令：请设置环境变量 YIMU_KEYPASS 或写入 build/yimu-keypass.txt")


KEYPASS = _keypass()

keystore = os.path.join(BUILD, "yimu-release.keystore")
if not os.path.exists(keystore):
    run([os.path.join(JDK, "bin", "keytool.exe"), "-genkeypair", "-v",
         "-keystore", keystore, "-storepass", KEYPASS, "-keypass", KEYPASS,
         "-alias", "yimu", "-keyalg", "RSA", "-keysize", "2048", "-validity", "10000",
         "-dname", "CN=Yimu Ledger, OU=Personal Finance, O=Yimu, L=Shanghai, ST=Shanghai, C=CN"])

run([os.path.join(BT, "apksigner.bat"), "sign",
     "--ks", keystore, "--ks-key-alias", "yimu",
     "--ks-pass", "pass:" + KEYPASS, "--key-pass", "pass:" + KEYPASS,
     "--out", os.path.join(BUILD, "yimu-zhang.apk"), os.path.join(BUILD, "aligned.apk")])

run([os.path.join(BT, "apksigner.bat"), "verify", "--verbose", "--print-certs",
     os.path.join(BUILD, "yimu-zhang.apk")])
run([os.path.join(BT, "zipalign.exe"), "-c", "-v", "4", os.path.join(BUILD, "yimu-zhang.apk")])
print("APK OK", os.path.getsize(os.path.join(BUILD, "yimu-zhang.apk")))