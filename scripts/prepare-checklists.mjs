// Writes the Markdown configuration checklists (public/training/<course>/configuration-checklist.md)
// from the same course data as the guides and printable checklist pages, so every copy agrees:
// prerequisites, each lesson's steps, commands, verification, and evidence, then the course sources.
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

let written = 0;
for (const configuration of configurations) {
  const course = library.courses.find(item => item.id === configuration.id);
  if (!course) throw new Error(`No catalog entry for configuration course ${configuration.id}`);
  const path = course.training.checklist;
  if (path !== `/training/${configuration.id}/configuration-checklist.md`) throw new Error(`Unexpected checklist path for ${configuration.id}: ${path}`);
  writeFileSync(new URL(`../public${path}`, import.meta.url), checklist(course, configuration));
  written++;
}
console.log(`Prepared ${written} configuration checklists.`);
