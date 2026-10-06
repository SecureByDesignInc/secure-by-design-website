"""Manually refresh the public reference into ignored, private working files."""
import concurrent.futures, json, pathlib, subprocess, sys, time, urllib.parse, urllib.request
root=pathlib.Path(__file__).resolve().parents[1]
out=root/'work/career-reference';out.mkdir(parents=True,exist_ok=True)
def get(table,where=''):
    query=f'select * from s3object[*].don_cswf_{table}[*] s'+where
    url='https://0ikdu2qdaj.execute-api.us-east-1.amazonaws.com/v1/getcooldata?'+urllib.parse.urlencode({'expression':query,'datafile':f'cool/don/don_cswf_{table}.json'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url,timeout=45) as response: data=json.load(response)
            if not isinstance(data,list): raise ValueError('Expected record array')
            return data
        except Exception:
            if attempt==2:raise
            time.sleep(attempt+1)
def save(name,data):(out/name).write_text(json.dumps(data,ensure_ascii=False),encoding='utf8')
basic=get('basic_info');save('basic-info.json',basic)
save('tksa.json',get('tksa'))
def qualifications(role):return get('qualifications'," where s.moc_id = '"+role['moc_id']+"'")
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: data=[item for result in pool.map(qualifications,basic) for item in result]
save('qualifications.json',data)
subprocess.run([sys.executable,str(root/'scripts/import-career-roles.py'),str(out)],check=True)
