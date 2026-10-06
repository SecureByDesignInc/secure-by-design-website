import {writeFileSync} from 'node:fs';
import {inventory} from '../public/inside-network-model/inventory.js';
import {buildArchitectureNodes} from '../public/inside-network-model/architecture.js';
import {securityDownloads} from '../public/inside-network-model/security-exports.js';
const {csv,plan}=securityDownloads(buildArchitectureNodes(inventory.nodes));
writeFileSync(new URL('../public/inside-network-model/network-traffic-matrix.csv',import.meta.url),csv);
writeFileSync(new URL('../public/inside-network-model/network-security-implementation-plan.md',import.meta.url),plan);
console.log('Generated traffic matrix and implementation plan from the model policy.');
