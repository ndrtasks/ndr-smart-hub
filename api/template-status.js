import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const EXPECTED_PDF_SHA='ea6ad4f408cbd818a639b53584e59b5dc7c034839e8af06a0f1869ede915d21f';
const EXPECTED_PDF_SIZE=464761;
const EXPECTED_B64_LENGTH=619684;
const EXPECTED_V2={
  'part-00.b64':{len:80000,sha:'a71c798b246c10c6a43ab78f9fb91851e40556800e3679e93b040c56fb29cd1b'},
  'part-01.b64':{len:80000,sha:'8356cbf2d4ead4ba871abdda0376f2e5d0dbdb85afbbeaa54deb01d986e7146c'},
  'part-02.b64':{len:80000,sha:'439462b8fc87789f803d2768e557c365d3d6a224e410b9507a9ba7059eb373ad'},
  'part-03.b64':{len:80000,sha:'eeee673415e1b43bb4c6a135d2446f3d98991876e477f88b19782982dca10d52'},
  'part-04.b64':{len:80000,sha:'ff8d48ba9f2cf29c0b1ee9ed5689451d838400b643a77e835d3908451a173329'},
  'part-05.b64':{len:80000,sha:'b0dfed959b76bb7be72fc88381fe1e80d0c32446aa7bc5ed9c6e7042ab5b1450'},
  'part-06.b64':{len:80000,sha:'e34bfa27fd6f8111134f6778211d9a3ddadb89a06ba633640ece292900f199a6'},
  'part-07.b64':{len:59684,sha:'52e412149979db014f5ea76397823de83e27bd5260085146fcfd3584d479f8c9'}
};
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');

export default async function handler(req,res){
  try{
    const dir=path.join(process.cwd(),'assets','hr-f-12-v2');
    const parts=[];let combined='';
    for(const [name,expected] of Object.entries(EXPECTED_V2)){
      try{
        const raw=(await fs.readFile(path.join(dir,name),'utf8')).replace(/\s/g,'');
        const sha=hash(raw); combined+=raw;
        parts.push({name,exists:true,length:raw.length,sha256:sha,expectedLength:expected.len,expectedSha256:expected.sha,ok:raw.length===expected.len&&sha===expected.sha});
      }catch(e){parts.push({name,exists:false,ok:false,error:e.message})}
    }
    let pdf=null;
    try{
      const bytes=Buffer.from(combined,'base64');
      pdf={base64Length:combined.length,size:bytes.length,header:bytes.subarray(0,8).toString('ascii'),sha256:hash(bytes),ok:combined.length===EXPECTED_B64_LENGTH&&bytes.length===EXPECTED_PDF_SIZE&&hash(bytes)===EXPECTED_PDF_SHA};
    }catch(e){pdf={ok:false,error:e.message}}
    res.status(200).json({allPartsOk:parts.every(x=>x.ok),parts,pdf,expected:{base64Length:EXPECTED_B64_LENGTH,size:EXPECTED_PDF_SIZE,sha256:EXPECTED_PDF_SHA}});
  }catch(e){res.status(500).json({error:e.message})}
}
