import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const checks=(await readdir(new URL('.',import.meta.url))).filter(name=>/^check-.*\.mjs$/.test(name)&&name!=='check-all.mjs').sort();
let failures=0;
for(const name of checks){const result=spawnSync(process.execPath,[fileURLToPath(new URL(name,import.meta.url))],{stdio:'inherit'});if(result.status!==0)failures++;}
console.log(`${checks.length-failures}/${checks.length} checks aprobados.`);process.exitCode=failures?1:0;
