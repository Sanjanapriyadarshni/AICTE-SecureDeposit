with open('D:/FDR/dom.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

print("HTML Total Length:", len(html))
idx = html.find('main')
if idx != -1:
    print("Main tag found at:", idx)
    print("Main snippet:")
    print(html[idx-100:idx+600])
else:
    print("No <main> tag found!")
    root_idx = html.find('id="root"')
    print(html[root_idx:root_idx+1000])
