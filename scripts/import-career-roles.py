"""Import an offline, private reference snapshot; never fetch during site builds."""
import json, pathlib, html, re, sys, hashlib, datetime
from collections import Counter
root=pathlib.Path(__file__).resolve().parents[1]
source=pathlib.Path(sys.argv[1]).resolve()
checked=datetime.date.today().isoformat()
def read(name): return json.loads((source/name).read_text(encoding='utf-8-sig'))
def clean(value):
    text=re.sub(r'<(?:br\s*/?|/p|/li|/div)>','\n',str(value or ''),flags=re.I)
    text=html.unescape(re.sub(r'<[^>]*>','',text)).replace('\xa0',' ')
    text=re.sub(r'\b(?:DON|Navy|USMC)\s+COOL\b','the qualification program',text,flags=re.I)
    text=re.sub(r'\s*\((?:DCWF Role Code \d+|CSWF-PM)\)','',text,flags=re.I)
    text=re.sub(r'\bDCWF\s*(?:\d{3}\s*)?','',text,flags=re.I)
    text=re.sub(r'\b(?:CSWF|CWF) PM\b','workforce program manager',text,flags=re.I)
    text=re.sub(r'\b(?:CSWF|CWF)\b','workforce',text,flags=re.I)
    text=re.sub(r'(?:DoD )?Cyber Workforce Framework','workforce program',text,flags=re.I)
    text=re.sub(r'https?://\S+','',text)
    return re.sub(r'[ \t]+',' ',text).strip()
def unique(items): return list(dict.fromkeys(x for x in items if x))
def nested(value):
    try:
        v=json.loads(value or '[]');return v if isinstance(v,list) else [v]
    except (ValueError,TypeError):return []
basic=read('basic-info.json');quals=read('qualifications.json');skills=read('tksa.json')
summaries=json.loads((root/'content/career-role-summaries.json').read_text(encoding='utf8'))
categories={'IT (Cyberspace)':('it','IT & systems'),'Cybersecurity':('security','Cybersecurity'),'Cyberspace Enablers':('support','Leadership & support'),'Cyberspace Effects':('operations','Cyber operations'),'Intelligence (Cyberspace)':('intelligence','Cyber intelligence')}
levels={'40':'Basic','41':'Intermediate','42':'Advanced'}
assets=root/'public/career-roles';assets.mkdir(exist_ok=True)
(assets/'roles').mkdir(exist_ok=True)
catalog=[];provenance=[]
for b in basic:
    if b['categorytype'] not in categories:continue
    code=b['moc_three_digit_code'];cat,label=categories[b['categorytype']]
    description=clean(b['moc_description'])
    pending=bool(re.search(r'\bPending\b',description,re.I))
    description=re.split(r'\bPending\b',description,flags=re.I)[0].strip()
    role={'code':code,'title':clean(b['moc_title']),'category':cat,'categoryLabel':label,'description':description,'updated':checked,'pending':pending,'titles':unique(clean(t.get('bill_title','')) for t in nested(b.get('billets'))),'competencies':[],'qualifications':{},'militaryOccupations':[]}
    role['roleDefinition']=description
    role['description']=summaries[code]
    seen=set()
    for item in skills:
        if item['moc_key']!=b['moc_key']:continue
        key=(item['tksa_id'],item['tksa_type'],item['indicator'])
        if key in seen:continue
        seen.add(key)
        role['competencies'].append({'id':item['tksa_id'],'type':item['tksa_type'],'designation':item['indicator'],'text':clean(item['tksa_description'])})
    for item in nested(b.get('mocs_related')):
        role['militaryOccupations'].append({'title':clean(item.get('moc_full_title')),'service':item.get('service','')})
    if not pending:
        for service in ['N','M']:
            scope={}
            for prof,level in levels.items():
                rows=[x for x in quals if x['moc_id']==b['moc_id'] and x['service']==service and x['moc_qual_proficiency']==prof]
                data={'certifications':[],'education':[],'training':[],'workplace':[],'environment':[]}
                cert_seen=set()
                for row in rows:
                    text=clean(row['qual_text_one']);area=row['qual_area_code']
                    if area=='CERT' and row.get('ce_key'):
                        retired=row.get('moc_qual_servicetype')=='0'
                        k=(row['ce_key'],retired)
                        if k in cert_seen:continue
                        cert_seen.add(k)
                        # The source's "solid" acronym is sometimes a legacy internal key
                        # (CAP, SECURITYP, C), not the current public credential name.
                        display_acronyms=re.findall(r'\(([A-Za-z0-9+/-]{2,12})\)',text)
                        acronym=display_acronyms[0] if display_acronyms else ''
                        data['certifications'].append({'name':text,'acronym':acronym,'retired':retired})
                    elif area=='CERT' and text:data['certificationStatus']=text
                    elif area in ['EDU','TRN','OJT','ESR']:
                        field={'EDU':'education','TRN':'training','OJT':'workplace','ESR':'environment'}[area]
                        if text and text not in data[field]:data[field].append(text)
                if rows:scope[level]=data
            if scope:role['qualifications'][service]=scope
    cert_names=unique(c['name'] for s in role['qualifications'].values() for p in s.values() for c in p['certifications'] if not c['retired'])
    role['competencies'].sort(key=lambda x:(x['designation']!='Core',x['type'],x['id']))
    (assets/'roles'/f'{code}.json').write_text(json.dumps(role,ensure_ascii=False,separators=(',',':')),encoding='utf8')
    catalog.append({k:role[k] for k in ['code','title','category','categoryLabel','description','updated','pending','titles']}|{'certifications':cert_names,'skillTerms':' '.join(x['text'] for x in role['competencies'] if x['type']=='Skill')})
    provenance.append({'code':code,'url':'https://www.cool.osd.mil/don/cswf/matrix.html?moc='+b['moc_key'],'referenceId':b['moc_id'],'qualificationRecords':sum(x['moc_id']==b['moc_id'] for x in quals),'pending':pending})
catalog.sort(key=lambda x:x['title'].lower())
# Remove previously generated records for categories that are no longer published.
published_codes={r['code'] for r in catalog}
for path in (assets/'roles').glob('*.json'):
    if path.stem not in published_codes:path.unlink()
(assets/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':')),encoding='utf8')
# Server uses only public catalog fields; provenance is outside all public/build assets.
(root/'content/career-roles-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':')),encoding='utf8')
private=root/'docs/career-reference';private.mkdir(parents=True,exist_ok=True)
manifest={'checked':checked,'reference':'DON COOL / DoD Cyber Workforce Framework','private':True,'sources':provenance,'snapshots':{name:hashlib.sha256((source/name).read_bytes()).hexdigest() for name in ['basic-info.json','qualifications.json','tksa.json']}}
(private/'provenance.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
print(json.dumps({'roles':len(catalog),'categories':dict(Counter(r['category'] for r in catalog)),'pending':sum(r['pending'] for r in catalog),'competencies':len(skills),'publicBytes':sum(f.stat().st_size for f in assets.rglob('*.json'))}))
