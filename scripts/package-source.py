from pathlib import Path
import zipfile, os
root=Path(__file__).resolve().parents[1]
excluded={'.git','node_modules','.secrets','.presentation-build','.sites-runtime','.wrangler','dist','.next','.vinext','.agents','.codex','outputs','work'}
out=root/'public/aegis-source.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,strict_timestamps=False) as z:
    for folder,dirs,files in os.walk(root):
        dirs[:]=[d for d in dirs if d not in excluded]
        for name in files:
            f=Path(folder)/name
            rel=f.relative_to(root)
            if f==out or name.startswith('.env') or name=='.dev.vars' or f.suffix in {'.pem','.p8','.gz'}: continue
            if (b'-----BEGIN '+b'PRIVATE KEY-----') in f.read_bytes(): raise RuntimeError('Private key found in source')
            z.write(f,'aegis-risk/'+rel.as_posix())
print('Source ZIP created:',out)

