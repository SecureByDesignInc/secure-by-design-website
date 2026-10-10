// Writes the text files in each configuration course's download (public/training/<course>/) from the
// same course data as the guides and printable checklist pages, so every copy agrees:
//   configuration-checklist.md  prerequisites, each lesson's steps, commands, verification, and evidence, then sources
//   Verification-Commands.txt   each lesson's commands and what success looks like
//   START-HERE.txt              what the download holds and how to use it
// scripts/prepare-training-packages.py then zips them with the workbook (PDF and Word): one download per tile.
import { readFileSync, writeFileSync } from 'node:fs';

const content = new URL('../content/', import.meta.url);
const configurations = JSON.parse(readFileSync(new URL('configuration-courses.json', content), 'utf8'));
const library = JSON.parse(readFileSync(new URL('videos.json', content), 'utf8'));
const copyright = '© 2026 Secure By Design Team LLC';

function checklist(course, configuration) {
  const lines = [
    `# ${course.title} — configuration checklist`, '',
    `Secure By Design · Edition ${course.training.materialsEdition} · ${course.training.updated}`, '',
    configuration.labNote, '',
    '## Before you start', '',
    ...configuration.prerequisites.map(item => `- [ ] ${item}`), '',
  ];
  for (const lesson of configuration.lessons) {
    if (lesson.command.includes('```')) throw new Error(`${configuration.id}/${lesson.id}: command cannot contain a code fence`);
    lines.push(
      `## ${lesson.title}`, '',
      ...lesson.steps.map(step => `- [ ] ${step}`), '',
      '**Commands:**', '', '```', lesson.command, '```', '',
      `**Verify:** ${lesson.check}`, '',
      `**Evidence:** ${lesson.evidence}`, '',
      'Notes / result / date: __________________________', '',
    );
  }
  lines.push('## Sources', '', ...configuration.sources.map(source => `- [${source.title}](${source.url})`), '', copyright);
  return lines.join('\n') + '\n';
}

function commands(course, configuration) {
  const lines = [
    `SECURE BY DESIGN - ${course.title.toUpperCase()}`,
    `Course ${course.number} | Materials edition ${course.training.materialsEdition} | Updated ${course.training.updated}`, '',
    'Run each check in an elevated PowerShell session, or a shell on the Linux servers, on the host the lesson names.',
    'Some lessons include the configuration commands they verify: read each command before you run it, and adapt',
    'the example names, addresses, and paths to your own plan. Nothing in this file runs by itself.', '',
  ];
  configuration.lessons.forEach((lesson, index) => {
    lines.push(`${index + 1}. ${lesson.title}`, lesson.command, '', `What success looks like: ${lesson.check}`, '');
  });
  lines.push(copyright);
  return lines.join('\n') + '\n';
}

function startHere(course, configuration) {
  const id = configuration.id;
  const files = [
    [`SecureByDesign-${id}-Workbook.pdf`, `Companion workbook, ${course.training.pages} pages`],
    [`SecureByDesign-${id}-Workbook.docx`, 'Editable copy of the workbook'],
    ['configuration-checklist.md', 'Configuration and evidence checklist'],
    ['Verification-Commands.txt', "Each lesson's commands, ready to copy"],
  ];
  const width = Math.max(...files.map(([name]) => name.length)) + 3;
  return [
    'SECURE BY DESIGN', course.title.toUpperCase(),
    `${course.platform ?? 'Windows Server'} - ${course.subtitle}`,
    `Course ${course.number} | Materials edition ${course.training.materialsEdition} | Updated ${course.training.updated}`,
    `${copyright}.`, '',
    'IN THIS DOWNLOAD',
    ...files.map(([name, detail]) => name.padEnd(width) + detail), '',
    'HOW TO USE IT',
    `1. Open the interactive guide at https://securebydesigninc.com${course.training.guide}`,
    '   for the lessons, knowledge checks, and saved progress.',
    '2. Keep the workbook beside you as you build. Record results, dates, and',
    '   evidence in the checklist or in the editable workbook.',
    '3. Run commands only in your own practice environment, after reading them.', '',
    'The names and addresses continue the training example; match them to your own',
    'plan. The steps follow vendor documentation and have not been run on your',
    'systems, so confirm each result in your own environment.', '',
    'Secure By Design | https://securebydesigninc.com/', '',
  ].join('\n');
}

let written = 0;
for (const configuration of configurations) {
  const course = library.courses.find(item => item.id === configuration.id);
  if (!course) throw new Error(`No catalog entry for configuration course ${configuration.id}`);
  const path = course.training.checklist;
  if (path !== `/training/${configuration.id}/configuration-checklist.md`) throw new Error(`Unexpected checklist path for ${configuration.id}: ${path}`);
  if (course.training.package !== `/training/${configuration.id}/SecureByDesign-${configuration.id}-Learning-Package.zip`) throw new Error(`Unexpected package path for ${configuration.id}: ${course.training.package}`);
  const folder = new URL(`../public/training/${configuration.id}/`, import.meta.url);
  writeFileSync(new URL('configuration-checklist.md', folder), checklist(course, configuration));
  writeFileSync(new URL('Verification-Commands.txt', folder), commands(course, configuration));
  writeFileSync(new URL('START-HERE.txt', folder), startHere(course, configuration));
  written++;
}
console.log(`Prepared the checklists, command sheets, and START-HERE notes for ${written} configuration courses.`);
