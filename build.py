

import subprocess
import sys
import os
import shutil
import zipfile


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>独角大亨 Dealer</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      overflow: hidden;
    }
  </style>
</head>

<body>
  <canvas id="game"></canvas>
  <script>
__JS__
  </script>
</body>

</html>"""


DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_JS = os.path.join(DIR, 'source.js')
MAIN_JS = os.path.join(DIR, 'main.js')
OUTPUT = os.path.join(DIR, 'index.html')
ZIP_OUTPUT = os.path.join(DIR, 'index.zip')


TERSER_CMD = 'terser source.js -o main.js -c passes=2,drop_console=true -m toplevel=true'


def main():
    
    if not shutil.which('terser'):
        print('错误: 未找到 terser，请先安装 (npm install -g terser)')
        sys.exit(1)

    
    if not os.path.exists(SOURCE_JS):
        print('错误: 找不到 source.js')
        sys.exit(1)

    
    print('正在压缩 source.js ...')
    result = subprocess.run(
        TERSER_CMD,
        cwd=DIR,
        capture_output=True,
        text=True,
        shell=True
    )
    if result.returncode != 0:
        print('terser 错误:\n' + result.stderr)
        sys.exit(1)

    
    with open(MAIN_JS, 'r', encoding='utf-8') as f:
        js = f.read()
    os.remove(MAIN_JS)

    
    html = HTML_TEMPLATE.replace('__JS__', js)
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write(html)

    size_kb = len(html.encode('utf-8')) / 1024
    print('构建完成 -> index.html ({:.1f} KB)'.format(size_kb))

    
    print('正在打包 index.html ...')
    with zipfile.ZipFile(ZIP_OUTPUT, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.write(OUTPUT, os.path.basename(OUTPUT))
    zip_size_kb = os.path.getsize(ZIP_OUTPUT) / 1024
    print('打包完成 -> index.zip ({:.1f} KB)'.format(zip_size_kb))


if __name__ == '__main__':
    main()
    input('\n按回车键退出...')
